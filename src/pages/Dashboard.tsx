import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, setDoc, deleteDoc, getDocs, writeBatch, where } from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { useSettings } from "../settingsObject";
import { LiveMap } from "../components/LiveMap";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "../components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import { format } from "date-fns";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MapPin, Settings, Users, Activity, CheckCircle2, LogOut, Briefcase, CalendarDays, Printer, UserPlus, Trash2, ShieldAlert, Ban, AlertCircle, Download, ChevronDown, ClipboardList } from "lucide-react";

import { QRCodeCanvas } from 'qrcode.react';
import { WaveBackground } from "../components/WaveBackground";
import { SHIFTS } from "../constants";
import { PerformanceAnalytics } from "../components/Analytics";
import { RekapAbsensi } from "../components/RekapAbsensi";
import { MapPicker } from "../components/MapPicker";
import { BankingStyleDashboardCards } from "../components/BankingStyleDashboardCards";
import { uploadFileToStorage, deleteFileFromStorage } from "../lib/storage";

export default function Dashboard() {
  const { user } = useAuth();
  const settings = useSettings();
  const navigate = useNavigate();

  const [attendances, setAttendances] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(false);

  // Print context
  const [selectedUserForCard, setSelectedUserForCard] = useState<any | null>(null);

  // Filter based on area 
  const filteredUsersList = user?.role === 'superadmin' 
    ? usersList 
    : usersList.filter(u => u.areaId === user?.areaId || (!u.areaId && !user?.areaId));
  
  const filteredUsersRecordIds = new Set(filteredUsersList.map(u => u.uid || u.id));
  const filteredAttendances = user?.role === 'superadmin'
    ? attendances
    : attendances.filter(a => filteredUsersRecordIds.has(a.userId));

  const pendingApprovalsCount = filteredAttendances.filter(log => log.status === 'pending_approval').length;

  useEffect(() => {
    if (pendingApprovalsCount > 0) {
      toast.info(`Terdapat ${pendingApprovalsCount} absensi yang menunggu persetujuan.`, { 
        id: 'pending-approvals',
        duration: 20000,
      });
    } else {
      toast.dismiss('pending-approvals');
    }
  }, [pendingApprovalsCount]);

  const [activeTab, setActiveTab] = useState("overview");

  // Settings forms
  const [appNameInput, setAppNameInput] = useState("ABSENKU");
  const [appLogoUrlInput, setAppLogoUrlInput] = useState("");
  const [fcmVapidKeyInput, setFcmVapidKeyInput] = useState("");
  const [googleMapsApiKeyInput, setGoogleMapsApiKeyInput] = useState("");
  const [shiftsInput, setShiftsInput] = useState<any>({});
  const [holidaysInput, setHolidaysInput] = useState<string[]>([]);
  const [areasInput, setAreasInput] = useState<any>({});
  const [newAreaLatInput, setNewAreaLatInput] = useState("-6.2088");
  const [newAreaLngInput, setNewAreaLngInput] = useState("106.8456");
  const [newArea, setNewArea] = useState({ name: "", radius: 100 });
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [newHoliday, setNewHoliday] = useState("");
  const [idRefsList, setIdRefsList] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    if (user?.role === "superadmin" || user?.role === "admin" || user?.role === "demo") {
      const q = query(collection(db, "idRefs"), orderBy("createdAt", "desc"));
      const unsub = onSnapshot(q, (snapshot) => {
        setIdRefsList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      const q2 = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
      const unsub2 = onSnapshot(q2, (snapshot) => {
        setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      return () => {
         unsub();
         unsub2();
      }
    }
  }, [user]);

  useEffect(() => {
    if (settings) {
      setAppNameInput(settings.appName || "ABSENKU");
      setAppLogoUrlInput(settings.appLogoUrl || "");
      setFcmVapidKeyInput(settings.fcmVapidKey || "");
      setGoogleMapsApiKeyInput(settings.googleMapsApiKey || "");
      setShiftsInput(settings.shifts && Object.keys(settings.shifts).length > 0 ? settings.shifts : SHIFTS);
      setHolidaysInput(settings.holidays || []);
      setAreasInput(settings.areas || {});
    }
  }, [settings]);

  const initialLoadRef = useRef(false);

  useEffect(() => {
    const q = query(collection(db, "attendance"), orderBy("timestamp", "desc"), limit(50));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAttendances(data);

      if (initialLoadRef.current) {
         snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
               const att = change.doc.data();
               // Check if it's a cross-device QR scan
               if (att.method === "qr" && att.deviceOwnerUid && att.deviceOwnerUid !== att.userId) {
                  const scannnerName = att.deviceOwnerName || 'User Lain';
                  // Show persistent explicit toast
                  toast.error(`Perhatian: Barcode dipindai oleh device milik ${scannnerName}!`, {
                    duration: 10000,
                    description: `Sistem mendeteksi transaksi scan beda-perangkat pada jam ${format(new Date(att.timestamp), "HH:mm")}.`,
                  });
               }
            }
         });
      } else {
         initialLoadRef.current = true;
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "attendance");
    });
    
    // Admin list user roles
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const uData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsersList(uData);
    }, (error) => {
       console.log('Cant list users', error);
    });

    return () => { unsub(); unsubUsers(); };
  }, []);

  const toggleGeofence = async (checked: boolean) => {
    if (user?.role === "demo") {
      toast.error("Akun demo tidak diizinkan untuk mengubah geofence.");
      return;
    }
    try {
      setLoadingConfig(true);
      await setDoc(doc(db, "settings", "global"), {
        ...settings,
        geofenceEnabled: checked
      }, { merge: true });
      toast.success(`Geofence ${checked ? 'Diaktifkan' : 'Dimatikan'}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "settings/global");
    } finally {
      setLoadingConfig(false);
    }
  };

  const saveSettings = async () => {
    if (user?.role === "demo") {
      toast.error("Akun demo tidak diizinkan untuk menyimpan pengaturan.");
      return;
    }
    try {
      setLoadingConfig(true);
      await setDoc(doc(db, "settings", "global"), {
        ...settings,
        appName: appNameInput,
        appLogoUrl: appLogoUrlInput,
        fcmVapidKey: fcmVapidKeyInput,
        googleMapsApiKey: googleMapsApiKeyInput,
        shifts: shiftsInput,
        areas: areasInput,
        holidays: holidaysInput,
      }, { merge: true });
      toast.success("Pengaturan berhasil disimpan");
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, "settings/global");
    } finally {
      setLoadingConfig(false);
    }
  };

  const [confirmDeleteGlobal, setConfirmDeleteGlobal] = useState(false);
  const [deleteUserTarget, setDeleteUserTarget] = useState<{id: string, name: string} | null>(null);

  const [selectedUserForEdit, setSelectedUserForEdit] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editShift, setEditShift] = useState("");
  const [editUniqueId, setEditUniqueId] = useState("");
  const [editArea, setEditArea] = useState("");
  const [editIsBanned, setEditIsBanned] = useState(false);
  const [editWorkStartDate, setEditWorkStartDate] = useState("");
  const [editWorkEndDate, setEditWorkEndDate] = useState("");
  const [editMonthlyShifts, setEditMonthlyShifts] = useState<Record<string, string>>({});
  const [editWeeklyShiftPattern, setEditWeeklyShiftPattern] = useState<string[]>([]);
  const [editShiftMode, setEditShiftMode] = useState<"default" | "weekly" | "monthly">("default");

  const handleEditUser = (user: any) => {
    setSelectedUserForEdit(user);
    setEditName(user.name || "");
    setEditRole(user.role || "");
    setEditShift(user.shiftId || "shift1");
    setEditUniqueId(user.uniqueId || "");
    setEditArea(user.areaId || "global");
    setEditIsBanned(user.isBanned || false);
    setEditWorkStartDate(user.workStartDate ? format(new Date(user.workStartDate), "yyyy-MM-dd") : "");
    setEditWorkEndDate(user.workEndDate ? format(new Date(user.workEndDate), "yyyy-MM-dd") : "");
    setEditMonthlyShifts(user.monthlyShifts || {});
    setEditWeeklyShiftPattern(user.weeklyShiftPattern || []);
    setEditShiftMode(user.weeklyShiftPattern?.length > 0 ? "weekly" : (Object.keys(user.monthlyShifts || {}).length > 0 ? "monthly" : "default"));
  };
   
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementType, setAnnouncementType] = useState("info"); // info, danger, success

  const publishAnnouncement = async () => {
    if (!announcementTitle || !announcementContent) return toast.error("Semua field harus diisi");
    if (user?.role === "demo") return toast.error("Demo role tidak bisa mempublikasikan pengumuman");
    try {
       setLoadingConfig(true);
       await setDoc(doc(db, "announcements", `ann_${Date.now()}`), {
          title: announcementTitle,
          content: announcementContent,
          type: announcementType,
          createdAt: Date.now(),
          createdBy: user?.name,
       });

       await setDoc(doc(db, "notifications", `notif_${Date.now()}_all`), {
          userId: "all",
          title: `Pengumuman: ${announcementTitle}`,
          body: announcementContent.length > 50 ? announcementContent.substring(0, 50) + "..." : announcementContent,
          createdAt: Date.now(),
          read: false,
          type: announcementType
       });

       toast.success("Pengumuman berhasil dipublikasikan");
       setAnnouncementTitle("");
       setAnnouncementContent("");
    } catch (e) {
       toast.error("Gagal mempublikasikan pengumuman");
    } finally {
       setLoadingConfig(false);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (user?.role === "demo") return toast.error("Demo role tidak bisa menghapus pengumuman");
    try {
       await deleteDoc(doc(db, "announcements", id));
       toast.success("Pengumuman berhasil dihapus");
    } catch (e) {
       toast.error("Gagal menghapus pengumuman");
    }
  };

  const deleteUser = async () => {
    if (!selectedUserForEdit) return;
    if (user?.role !== "superadmin") {
      toast.error("Hanya Superadmin yang bisa menghapus user.");
      return;
    }
    if (!window.confirm("Apakah Anda yakin ingin menghapus user ini secara permanen? Seluruh data absensi akan tetap ada namun identitas user akan hilang.")) return;
    try {
      if (selectedUserForEdit.avatarUrl) {
        await deleteFileFromStorage(selectedUserForEdit.avatarUrl);
      }
      await deleteDoc(doc(db, "users", selectedUserForEdit.id));
      toast.success("User berhasil dihapus.");
      setSelectedUserForEdit(null);
    } catch (e) {
      console.error("Error deleting user:", e);
      toast.error(`Gagal menghapus user: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  const saveUserChanges = async () => {
    if (!selectedUserForEdit) return;
    if (user?.role === "demo") {
      toast.error("Akun demo tidak diizinkan untuk mengubah data karyawan.");
      return;
    }
    try {
      await updateDoc(doc(db, "users", selectedUserForEdit.id), {
        name: editName,
        role: editRole,
        shiftId: editShift,
        uniqueId: editUniqueId,
        areaId: editArea === "global" ? null : editArea,
        isBanned: editIsBanned,
        workStartDate: editWorkStartDate ? new Date(editWorkStartDate).getTime() : null,
        workEndDate: editWorkEndDate ? new Date(editWorkEndDate).getTime() : null,
        monthlyShifts: editMonthlyShifts,
        weeklyShiftPattern: editWeeklyShiftPattern
      });
      toast.success("Data user diperbarui successfully");
      setSelectedUserForEdit(null);
    } catch (err) {
      toast.error("Gagal memperbarui data user");
      console.error(err);
    }
  };

  const [showOvertimeModal, setShowOvertimeModal] = useState(false);
  const [overtimeUser, setOvertimeUser] = useState<any>(null);
  const [overtimeDate, setOvertimeDate] = useState("");
  const [overtimeStartTime, setOvertimeStartTime] = useState("");
  const [overtimeEndTime, setOvertimeEndTime] = useState("");
  const [overtimeNotes, setOvertimeNotes] = useState("");

  const [showKoreksiModal, setShowKoreksiModal] = useState(false);
  const [koreksiUser, setKoreksiUser] = useState<any>(null);
  const [koreksiDate, setKoreksiDate] = useState("");
  const [koreksiNotes, setKoreksiNotes] = useState("Dispensasi sistem/database error");

  const handleKoreksiAlpa = (user: any) => {
    setKoreksiUser(user);
    setKoreksiDate(format(new Date(), "yyyy-MM-dd"));
    setShowKoreksiModal(true);
  };

  const submitKoreksiAlpa = async () => {
    if (!koreksiDate || !koreksiUser) {
      toast.error("Tanggal harus dipilih");
      return;
    }
    try {
      const parts = koreksiDate.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const dateObj = new Date(year, month, day, 8, 0, 0); // insert at 8:00 AM

      await setDoc(doc(collection(db, "attendance")), {
        userId: koreksiUser.uid || koreksiUser.id,
        timestamp: dateObj.getTime(),
        type: "dispensasi",
        method: "admin",
        photoBase64: null,
        location: { latitude: 0, longitude: 0, address: "Manual Entry by Admin" },
        withinRadius: true,
        status: "approved",
        extraData: koreksiNotes
      });
      toast.success("Dispensasi alpa berhasil ditambahkan!");
      setShowKoreksiModal(false);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, "attendance");
      toast.error(`Gagal menambahkan dispensasi alpa: ${err.message}`);
    }
  };

  const handleAddManualOvertime = (user: any) => {
    setOvertimeUser(user);
    setOvertimeDate(format(new Date(), "yyyy-MM-dd"));
    setOvertimeStartTime("17:00");
    setOvertimeEndTime("19:00");
    setOvertimeNotes("Lembur tambahan dari admin");
    setShowOvertimeModal(true);
  };

  const saveManualOvertime = async () => {
    if (user?.role === "demo") {
      toast.error("Akun demo tidak diizinkan untuk menambah data lembur.");
      return;
    }
    if (!overtimeUser || !overtimeDate || !overtimeStartTime || !overtimeEndTime) {
      toast.error("Mohon lengkapi semua data lembur");
      return;
    }

    try {
      const [startHour, startMin] = overtimeStartTime.split(":").map(Number);
      const [endHour, endMin] = overtimeEndTime.split(":").map(Number);
      
      const startDate = new Date(overtimeDate);
      startDate.setHours(startHour, startMin, 0, 0);

      const endDate = new Date(overtimeDate);
      endDate.setHours(endHour, endMin, 0, 0);

      if (endDate < startDate) {
         endDate.setDate(endDate.getDate() + 1);
      }

      const uId = overtimeUser.uid || overtimeUser.id;
      const inId = `att_${Date.now()}_in_${uId}`;
      const outId = `att_${Date.now() + 100}_out_${uId}`;

      const basePayload = {
        userId: uId,
        method: "admin",
        photoBase64: "", 
        location: { latitude: 0, longitude: 0, address: "Manual Entry by Admin" },
        status: "approved",
        extraData: overtimeNotes,
        withinRadius: true
      };

      await setDoc(doc(db, "attendance", inId), {
         ...basePayload,
         timestamp: startDate.getTime(),
         type: "overtime_in",
      });

      await setDoc(doc(db, "attendance", outId), {
         ...basePayload,
         timestamp: endDate.getTime(),
         type: "overtime_out",
      });

      toast.success("Lembur ditambahkan dan tersimpan di riwayat user");
      setShowOvertimeModal(false);
    } catch (err: any) {
      console.error(err);
      toast.error("Gagal menambahkan lembur");
    }
  };

  const handleDeleteAllHistory = async () => {
    if (user?.role !== "superadmin") return;
    setConfirmDeleteGlobal(false);

    try {
      toast.info("Sedang menghapus riwayat absensi masal...");
      const snapshot = await getDocs(collection(db, "attendance"));
      let b = writeBatch(db);
      let count = 0;
      for (const d of snapshot.docs) {
        b.delete(d.ref);
        count++;
        if (count % 500 === 0) {
          await b.commit();
          b = writeBatch(db);
        }
      }
      if (count % 500 !== 0) {
        await b.commit();
      }
      toast.success(`Berhasil menghapus ${count} riwayat absensi.`);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, "attendance");
      toast.error("Gagal menghapus riwayat masal");
    }
  };

  const handleDeleteUserHistory = async () => {
    if (user?.role !== "superadmin" || !deleteUserTarget) return;
    const targetUserId = deleteUserTarget.id;
    const userName = deleteUserTarget.name;
    setDeleteUserTarget(null);

    try {
      toast.info(`Sedang menghapus riwayat absensi ${userName}...`);
      const q = query(collection(db, "attendance"), where("userId", "==", targetUserId));
      const snapshot = await getDocs(q);
      let b = writeBatch(db);
      let count = 0;
      for (const d of snapshot.docs) {
        b.delete(d.ref);
        count++;
        if (count % 500 === 0) {
          await b.commit();
          b = writeBatch(db);
        }
      }
      if (count % 500 !== 0) {
        await b.commit();
      }
      toast.success(`Berhasil menghapus ${count} riwayat absensi untuk ${userName}.`);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, "attendance");
      toast.error(`Gagal menghapus riwayat user ${userName}`);
    }
  };

  return (
    <WaveBackground>
      <div className="py-4 sm:py-8 px-4 max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <header className="relative h-auto sm:h-40 bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 dark:from-teal-900 dark:via-emerald-900 dark:to-teal-950 overflow-hidden shrink-0 rounded-3xl shadow-2xl mb-8 pb-6 sm:pb-0 border border-white/10">
          <div className="absolute inset-0 z-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -top-16 -right-16 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl"></div>
          
          <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none transform translate-y-[2px] opacity-20">
            <svg viewBox="0 0 1440 320" className="w-full h-16 md:h-24" preserveAspectRatio="none">
              <path fill="currentColor" className="text-teal-900 dark:text-black" d="M0,160L48,176C96,192,192,224,288,208C384,192,480,128,576,133.3C672,139,768,213,864,224C960,235,1056,181,1152,165.3C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
          </div>
          <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start text-white gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner border border-white/30">
                {settings?.appLogoUrl ? (
                    <img src={settings.appLogoUrl} alt="Logo" className="w-10 h-10 object-contain brightness-0 invert" />
                  ) : (
                    <Activity className="w-10 h-10 text-white" />
                  )}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-lg">
                  {settings?.appName || "ABSENKU"} 
                  <span className="text-emerald-200 block text-sm font-semibold tracking-widest uppercase">Admin Management</span>
                </h1>
              </div>
            </div>
            <div className="flex gap-4 text-right items-center">
               <div className="hidden sm:flex flex-col justify-center text-right mr-2">
                <span className="font-bold text-sm tracking-tight">{user?.name}</span>
                <span className="text-[10px] text-teal-100 uppercase tracking-widest font-black bg-white/20 px-2 py-0.5 rounded-full">{user?.role}</span>
               </div>
               
               <div className="flex gap-2">
                 <Button variant="outline" size="sm" className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-bold h-10 rounded-xl backdrop-blur-md transition-all px-4" onClick={() => navigate('/app')}>
                    App
                 </Button>

                 <Button variant="outline" size="sm" className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-bold h-10 w-10 p-0 rounded-full backdrop-blur-md transition-all" onClick={() => auth.signOut()} title="Keluar">
                    <LogOut className="w-5 h-5" />
                 </Button>
               </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-4 sm:grid-cols-7 gap-4 mb-8">
          {[
            { value: "overview", label: "Overview", icon: Activity },
            { value: "users", label: "User", icon: Users },
            { value: "announcements", label: "Portal", icon: Briefcase },
            { value: "analytics", label: "Performance", icon: Activity },
            { value: "live-map", label: "Peta Live", icon: MapPin },
            { value: "rekap", label: "Rekap", icon: ClipboardList },
            { value: "settings", label: "Pengaturan", icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.value}
                onClick={() => setActiveTab(item.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-3xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all ${activeTab === item.value ? 'ring-2 ring-teal-500' : ''}`}
              >
                <div className={`p-4 rounded-2xl ${item.value === 'overview' ? 'bg-teal-500 text-white' : item.value === 'users' ? 'bg-sky-500 text-white' : item.value === 'announcements' ? 'bg-teal-600 text-white' : item.value === 'analytics' ? 'bg-purple-500 text-white' : item.value === 'live-map' ? 'bg-amber-500 text-white' : item.value === 'rekap' ? 'bg-rose-500 text-white' : 'bg-slate-700 text-white'}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-gray-200 text-center">{item.label}</span>
              </button>
            );
          })}
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="hidden">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">User</TabsTrigger>
            <TabsTrigger value="announcements">Portal</TabsTrigger>
            <TabsTrigger value="analytics">Performance</TabsTrigger>
            <TabsTrigger value="live-map">Peta Live</TabsTrigger>
            <TabsTrigger value="rekap">Rekap</TabsTrigger>
            <TabsTrigger value="settings">Pengaturan</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
            <BankingStyleDashboardCards attendances={filteredAttendances} usersList={filteredUsersList} />
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border-0 shadow-xl overflow-hidden p-0">
              <CardHeader className="border-b border-teal-50 dark:border-teal-900 p-6 m-0 bg-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
                <div>
                  <CardTitle className="text-teal-900 dark:text-teal-50 font-black text-xl tracking-tight">Real-Time Live Logs</CardTitle>
                  <CardDescription className="text-xs font-medium text-slate-500 dark:text-gray-400">Daftar absensi terbaru dari seluruh user</CardDescription>
                </div>
                <div className="flex sm:justify-end gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                  {user?.role === 'superadmin' && (
                    <Button variant="outline" size="sm" onClick={() => setConfirmDeleteGlobal(true)} className="h-10 text-xs font-bold border-rose-100 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900 hover:text-rose-700 dark:hover:text-rose-300 bg-white dark:bg-gray-800 transition-all rounded-xl">
                      <Trash2 className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Hapus Riwayat Massal</span>
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex items-center justify-center bg-white dark:bg-gray-700 border border-teal-100 dark:border-teal-900 rounded-xl text-xs font-bold text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900 h-10 px-4 w-full sm:w-auto transition-all shadow-sm cursor-pointer outline-none">
                    <Download className="w-4 h-4 mr-2" /> Export Laporan <ChevronDown className="w-3 h-3 ml-2" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px] rounded-xl">
                    <DropdownMenuItem className="text-xs font-semibold cursor-pointer" onClick={() => {
                      const header = ["Nama Karyawan", "Role", "Shift", "ID Karyawan", "Tanggal Transaksi", "Jam Transaksi", "Tipe", "Metode", "Status Radius", "Catatan", "Status Approval", "Pemindai (Scanner)"];
                      let allRecords: any[][] = [header];
                      
                      filteredUsersList.forEach(usr => {
                        const userAttendances = filteredAttendances.filter(a => a.userId === usr.uid || a.userId === usr.id);
                        if (userAttendances.length === 0) {
                          allRecords.push([usr.name || "-", usr.role || "-", usr.shiftId || "-", usr.uniqueId || "-", "-", "-", "-", "-", "-", "-", "-", "-"]);
                        } else {
                          userAttendances.forEach(log => {
                            let scanner = "-";
                            if (log.method === "qr" && log.deviceOwnerUid && log.deviceOwnerUid !== log.userId) {
                              scanner = log.deviceOwnerName || log.deviceOwnerUid;
                            } else if (log.method === "qr") {
                              scanner = "Diri Sendiri";
                            }
                            
                            allRecords.push([
                              usr.name || "-", usr.role || "-", usr.shiftId || "-", usr.uniqueId || "-",
                              format(new Date(log.timestamp), "yyyy-MM-dd"),
                              format(new Date(log.timestamp), "HH:mm:ss"),
                              log.type, log.method, log.withinRadius ? "Ya" : "Tidak",
                              log.extraData ? log.extraData.replace(/,/g, ' ') : "-",
                              log.status || "APPROVED",
                              scanner
                            ]);
                          });
                        }
                      });

                      const ws = XLSX.utils.aoa_to_sheet(allRecords);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, "Laporan Absensi");
                      XLSX.writeFile(wb, `Laporan_Absensi_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);
                      toast.success("Laporan Excel berhasil diunduh.");
                    }}>
                      Export Excel (.xlsx)
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem className="text-xs font-semibold cursor-pointer" onClick={() => {
                      const doc = new jsPDF('landscape');
                      const header = [["Nama", "Role", "Shift", "Tanggal", "Jam", "Tipe", "Metode", "Radius", "Status", "Scanner"]];
                      let rows: any[][] = [];
                      
                      filteredUsersList.forEach(usr => {
                        const userAttendances = filteredAttendances.filter(a => a.userId === usr.uid || a.userId === usr.id);
                        if (userAttendances.length === 0) {
                          rows.push([usr.name || "-", usr.role || "-", usr.shiftId || "-", "-", "-", "-", "-", "-", "-", "-"]);
                        } else {
                          userAttendances.forEach(log => {
                            let scanner = "-";
                            if (log.method === "qr" && log.deviceOwnerUid && log.deviceOwnerUid !== log.userId) {
                              scanner = log.deviceOwnerName || "Other";
                            } else if (log.method === "qr") {
                              scanner = "Self";
                            }

                            rows.push([
                              usr.name || "-", usr.role || "-", usr.shiftId || "-",
                              format(new Date(log.timestamp), "yyyy-MM-dd"),
                              format(new Date(log.timestamp), "HH:mm:ss"),
                              log.type, log.method, log.withinRadius ? "Ya" : "Tidak",
                              log.status || "APPROVED",
                              scanner
                            ]);
                          });
                        }
                      });

                      doc.text("Laporan Absensi Lengkap", 14, 15);
                      autoTable(doc, {
                        head: header,
                        body: rows,
                        startY: 20,
                        styles: { fontSize: 8 },
                        headStyles: { fillColor: [13, 148, 136] }
                      });
                      doc.save(`Laporan_Absensi_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`);
                      toast.success("Laporan PDF berhasil diunduh.");
                    }}>
                      Export PDF (.pdf)
                    </DropdownMenuItem>

                    <DropdownMenuItem className="text-xs font-semibold cursor-pointer" onClick={() => {
                      const header = ["Nama Karyawan", "Role", "Shift", "ID Karyawan", "Tanggal Transaksi", "Jam Transaksi", "Tipe Transaksi", "Metode", "Status Validasi Radius", "Catatan Laporan Tambahan", "Status Approval", "Pemindai (Scanner)"].map(h => `"${h}"`).join(',');
                      let allRecords: string[] = [];
                      filteredUsersList.forEach(usr => {
                        const userAttendances = filteredAttendances.filter(a => a.userId === usr.uid || a.userId === usr.id);
                        if (userAttendances.length === 0) {
                          allRecords.push([usr.name || "N/A", usr.role || "N/A", usr.shiftId || "N/A", usr.uniqueId || "N/A", "-", "-", "-", "-", "-", "-", "-", "-"].map(v => `"${v}"`).join(','));
                        } else {
                          userAttendances.forEach(log => {
                            let scanner = "-";
                            if (log.method === "qr" && log.deviceOwnerUid && log.deviceOwnerUid !== log.userId) {
                              scanner = log.deviceOwnerName || log.deviceOwnerUid;
                            } else if (log.method === "qr") {
                              scanner = "Diri Sendiri";
                            }
                            allRecords.push([usr.name || "N/A", usr.role || "N/A", usr.shiftId || "N/A", usr.uniqueId || "N/A", format(new Date(log.timestamp), "yyyy-MM-dd"), format(new Date(log.timestamp), "HH:mm:ss"), log.type, log.method, log.withinRadius ? "Ya" : "Tidak/Manual", log.extraData ? log.extraData.replace(/,/g, ' ') : "-", log.status || "APPROVED", scanner].map(v => `"${v}"`).join(','));
                          });
                        }
                      });
                      const blob = new Blob([`${header}\n${allRecords.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `Laporan_Absensi_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
                      a.click();
                      toast.success("Laporan CSV berhasil diunduh.");
                    }}>
                      Export CSV (.csv)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="w-full text-left">
                    <TableHeader className="bg-teal-50/50 dark:bg-teal-900/20 text-teal-900 dark:text-teal-100">
                      <TableRow className="border-b border-teal-100 dark:border-teal-900 hover:bg-transparent">
                        <TableHead className="px-6 py-4 h-auto text-[11px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300 w-[200px]">Waktu</TableHead>
                        <TableHead className="px-6 py-4 h-auto text-[11px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300">User</TableHead>
                        <TableHead className="px-6 py-4 h-auto text-[11px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300">Jadwal</TableHead>
                        <TableHead className="px-6 py-4 h-auto text-[11px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300">Tipe & Status</TableHead>
                        <TableHead className="px-6 py-4 h-auto text-[11px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300">Metode</TableHead>
                        <TableHead className="px-6 py-4 h-auto text-[11px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300">Status Geofence</TableHead>
                        <TableHead className="px-6 py-4 h-auto text-[11px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300 text-center">Foto</TableHead>
                        <TableHead className="px-6 py-4 h-auto text-[11px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300 text-center">Tindakan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-xs divide-y divide-teal-50 dark:divide-teal-900/50">
                      {filteredAttendances.map((log: any) => (
                        <TableRow key={log.id} className="hover:bg-teal-50/50 dark:hover:bg-teal-900/10 border-0 transition-colors">
                          <TableCell className="px-6 py-4 font-bold text-slate-600 dark:text-gray-300">
                            {format(new Date(log.timestamp), "dd MMM, HH:mm:ss")}
                          </TableCell>
                          <TableCell className="px-6 py-4 font-black text-teal-800 dark:text-teal-200">
                            {filteredUsersList.find(u => u.uid === log.userId || u.id === log.userId)?.name || log.userId}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                             <div className="text-[10px] font-bold text-slate-500">Jadwal:</div>
                             <div className="text-[10px] font-mono font-bold text-teal-700">
                                {(() => {
                                  const userLog = filteredUsersList.find(u => u.uid === log.userId || u.id === log.userId);
                                  const shiftId = userLog?.shiftId || "shift1";
                                  const shift = SHIFTS[shiftId as keyof typeof SHIFTS] || SHIFTS.shift1;
                                  const dayOfWeek = new Date(log.timestamp).getDay();
                                  const shiftDay = shift.workDays[dayOfWeek as keyof typeof shift.workDays];
                                  return shiftDay ? `${shiftDay.start} - ${shiftDay.end}` : "-";
                                })()}
                             </div>
                           </TableCell>
                           <TableCell className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${log.type === 'in' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300' : log.type === 'out' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : log.type === 'overtime_in' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' : log.type === 'overtime_out' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300' : log.type === 'sick' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : ['permit', 'cuti', 'melahirkan', 'meninggal'].includes(log.type) ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                              {log.type === 'in' ? 'MASUK' : log.type === 'out' ? 'PULANG' : log.type === 'overtime_in' ? 'LEMBUR MSK' : log.type === 'overtime_out' ? 'LEMBUR PLG' : log.type === 'sick' ? 'SAKIT' : log.type === 'permit' ? 'IZIN' : log.type === 'cuti' ? 'CUTI' : log.type === 'melahirkan' ? 'HAMIL' : log.type === 'meninggal' ? 'BERDUKA' : log.type}
                            </span>
                            <div className="mt-1">
                               <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${log.status === 'approved' ? 'bg-green-100 text-green-700' : log.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                 {log.status === 'approved' ? 'Disetujui' : log.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                               </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 uppercase text-[10px] font-black text-slate-600 dark:text-gray-400 tracking-widest">
                            <span className="bg-slate-100 text-slate-600 dark:bg-gray-700 dark:text-gray-300 border-slate-200 dark:border-gray-600 px-2.5 py-1 rounded-lg border inline-block">{log.method}</span>
                            {log.deviceOwnerUid && log.deviceOwnerUid !== log.userId && log.method === "qr" && (
                              <div className="mt-1 text-[8.5px] text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/40 p-1.5 rounded-md border border-rose-100 dark:border-rose-900 leading-tight">
                                ⚠ BEDA DEVICE<br/>
                                <span className="text-rose-500 dark:text-rose-300 font-medium">Scanned by: {log.deviceOwnerName || 'Unknown'}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            {log.withinRadius ? (
                              <span className="text-teal-600 dark:text-teal-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Di Lokasi</span>
                            ) : (
                              <span className="text-rose-500 font-bold flex items-center gap-1 underline underline-offset-4 decoration-rose-500/30 font-mono">LUAR RADIUS</span>
                            )}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-center">
                            {log.photoBase64 ? (
                              <div className="flex justify-center relative group">
                                <a href={log.photoBase64} target="_blank" rel="noreferrer" className="block hover:opacity-80 transition-opacity">
                                  <img src={log.photoBase64} alt="Foto Bukti" className="w-12 h-12 object-cover rounded-md border border-slate-200 shadow-sm" />
                                </a>
                                {(user?.role === "superadmin" || user?.role === "admin") && (
                                  <button 
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      if (!window.confirm("Hapus foto saja dari record ini?")) return;
                                      try {
                                        const photoToDelete = log.photoBase64;
                                        await updateDoc(doc(db, "attendance", log.id), { photoBase64: "" });
                                        if (photoToDelete) {
                                          await deleteFileFromStorage(photoToDelete);
                                        }
                                        toast.success("Foto dihapus");
                                      } catch (err) {
                                        toast.error("Gagal hapus foto");
                                      }
                                    }}
                                    className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:scale-110 active:scale-95"
                                    title="Hapus Foto"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[10px]">-</span>
                            )}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-center">
                            <div className="flex justify-center items-center gap-2">
                              {log.status === "pending_approval" || user?.role === "superadmin" ? (
                                <div className="flex justify-center gap-2">
                                  {log.status !== "approved" && (
                                    <Button size="sm" variant="outline" className="h-8 text-[10px] font-black uppercase tracking-widest px-3 bg-teal-50 text-teal-600 border-teal-200 hover:bg-teal-600 hover:text-white transition-all rounded-xl shadow-sm" onClick={async () => {
                                      if (user?.role === "demo") { toast.error("Akun demo."); return; }
                                      try {
                                        await updateDoc(doc(db, "attendance", log.id), { status: "approved" });
                                        await setDoc(doc(db, "notifications", `notif_${Date.now()}_${log.userId}`), {
                                          userId: log.userId,
                                          title: "Absensi Disetujui",
                                          body: `Absensi ${log.type === 'in' ? 'Masuk' : 'Keluar'} Anda tanggal ${format(new Date(log.timestamp), "dd MMM")} telah disetujui.`,
                                          createdAt: Date.now(),
                                          read: false,
                                          type: "success"
                                        });
                                        toast.success("Absensi disetujui");
                                      } catch (e) {
                                        console.error("Approve error:", e);
                                        toast.error("Gagal menyetujui");
                                      }
                                    }}>OK</Button>
                                  )}
                                  {log.status !== "rejected" && (
                                    <Button size="sm" variant="outline" className="h-8 text-[10px] font-black uppercase tracking-widest px-3 bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-600 hover:text-white transition-all rounded-xl shadow-sm" onClick={async () => {
                                      if (user?.role === "demo") { toast.error("Akun demo."); return; }
                                      try {
                                        await updateDoc(doc(db, "attendance", log.id), { status: "rejected" });
                                        await setDoc(doc(db, "notifications", `notif_${Date.now()}_${log.userId}`), {
                                          userId: log.userId,
                                          title: "Absensi Ditolak",
                                          body: `Absensi ${log.type === 'in' ? 'Masuk' : 'Keluar'} Anda tanggal ${format(new Date(log.timestamp), "dd MMM")} ditolak oleh Admin.`,
                                          createdAt: Date.now(),
                                          read: false,
                                          type: "danger"
                                        });
                                        toast.success("Absensi ditolak");
                                      } catch (e) {
                                        console.error("Reject error:", e);
                                        toast.error("Gagal menolak");
                                      }
                                    }}>NO</Button>
                                  )}
                                </div>
                              ) : (
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${log.status === 'rejected' ? 'bg-rose-500 text-white' : log.status === 'approved' ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-500 dark:bg-gray-700 dark:text-gray-300'}`}>
                                  {log.status || 'APPROVED'}
                                </span>
                              )}
                              {(user?.role === "superadmin" || user?.role === "admin") && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg ml-2" 
                                  onClick={async () => {
                                    if (user?.role === "demo") { toast.error("Akun demo."); return; }
                                    if (!window.confirm("Hapus log absensi ini permanen?")) return;
                                    try {
                                      const photoToDelete = log.photoBase64;
                                      await deleteDoc(doc(db, "attendance", log.id));
                                      if (photoToDelete) {
                                        await deleteFileFromStorage(photoToDelete);
                                      }
                                      toast.success("Log absensi dihapus");
                                    } catch (e) {
                                      console.error("Error deleting log:", e);
                                      toast.error("Gagal menghapus log");
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 ml-1" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {attendances.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12 text-slate-400 italic">
                            Belum ada riwayat aktivitas absensi hari ini.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border-0 shadow-xl overflow-hidden p-0">
              <CardHeader className="border-b border-teal-50 dark:border-teal-900 p-6 m-0 bg-transparent flex flex-col space-y-1">
                <CardTitle className="text-teal-900 dark:text-teal-50 font-black text-xl tracking-tight">User Directory</CardTitle>
                <CardDescription className="text-xs font-medium text-slate-500 dark:text-gray-400">Manajemen data akun, peran, dan kartu akses digital user.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="w-full text-left">
                    <TableHeader className="bg-teal-50/50 dark:bg-teal-900/20 text-teal-900 dark:text-teal-100">
                      <TableRow className="border-b border-teal-100 dark:border-teal-900 hover:bg-transparent">
                        <TableHead className="px-6 py-4 h-auto text-[11px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300">Nama User</TableHead>
                        <TableHead className="px-6 py-4 h-auto text-[11px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300">Kontak Email</TableHead>
                        <TableHead className="px-6 py-4 h-auto text-[11px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300">Jabatan</TableHead>
                        <TableHead className="px-6 py-4 h-auto text-[11px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300 px-6">Bergabung</TableHead>
                        <TableHead className="px-6 py-4 h-auto text-[11px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300">Shift</TableHead>
                        <TableHead className="px-6 py-4 h-auto text-[11px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300">Unique ID</TableHead>
                        <TableHead className="px-6 py-4 h-auto text-[11px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300 text-right px-6">Navigasi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-xs divide-y divide-teal-50 dark:divide-teal-900/50">
                      {filteredUsersList.map((usr) => (
                        <TableRow key={usr.id} className="hover:bg-teal-50/50 dark:hover:bg-teal-900/10 border-0 transition-colors">
                          <TableCell className="px-6 py-4 font-bold text-teal-900 dark:text-teal-50 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900 border-2 border-white dark:border-teal-800 flex items-center justify-center font-black text-teal-700 dark:text-teal-300 overflow-hidden shrink-0 shadow-sm">
                              {usr.avatarUrl ? <img src={usr.avatarUrl} className="w-full h-full object-cover" /> : usr.name?.[0]}
                            </div>
                            <span className="tracking-tight">{usr.name}</span>
                            {usr.isBanned && (
                              <Badge variant="destructive" className="ml-2 h-5 text-[8px] font-black uppercase tracking-widest px-2 bg-rose-600">BANNED</Badge>
                            )}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-500 dark:text-gray-400 font-medium">{usr.email}</TableCell>
                          <TableCell className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${usr.role === 'superadmin' ? 'bg-rose-500/20 text-rose-600' : usr.role === 'admin' ? 'bg-teal-500/20 text-teal-600' : 'bg-slate-100 text-slate-600 dark:bg-gray-700 dark:text-gray-300'}`}>{usr.role}</span>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            {(() => {
                              const isWeekly = usr.weeklyShiftPattern && usr.weeklyShiftPattern.length > 0;
                              const isMonthly = usr.monthlyShifts && Object.keys(usr.monthlyShifts).length > 0;
                              
                              const strategyBadge = isWeekly ? (
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase bg-teal-600 text-white shadow-sm">ROTASI</span>
                              ) : isMonthly ? (
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase bg-purple-600 text-white shadow-sm">BULANAN</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase bg-slate-500 text-white shadow-sm">DEFAULT</span>
                              );

                              const shiftName = isWeekly ? "ROTASI AKTIF" : isMonthly ? "BULANAN AKTIF" : (shiftsInput[usr.shiftId]?.name || usr.shiftId || "NO SHIFT");
                              
                              return (
                                <div className="flex flex-col gap-1 items-start">
                                  <span 
                                    className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase text-white shadow-sm"
                                    style={{ backgroundColor: isWeekly ? '#0d9488' : isMonthly ? '#9333ea' : (shiftsInput[usr.shiftId]?.color || '#64748b') }}
                                  >
                                    {shiftName}
                                  </span>
                                  {strategyBadge}
                                </div>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-500 dark:text-gray-400 font-medium">
                            {areasInput[usr.areaId]?.name || 'Global'}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-500 dark:text-gray-400 font-medium">{usr.createdAt ? format(new Date(usr.createdAt), "dd MMM yyyy") : "-"}</TableCell>
                          <TableCell className="px-6 py-4 text-slate-500 dark:text-gray-400 font-black font-mono">{usr.uniqueId || "-"}</TableCell>
                          <TableCell className="px-6 py-4 text-right px-6 flex items-center justify-end gap-2">
                             {user?.role === 'superadmin' && (
                               <Button variant="outline" size="sm" className="h-9 px-2 text-[10px] font-black tracking-widest uppercase rounded-xl border-rose-100 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 shadow-sm" onClick={() => setDeleteUserTarget({id: usr.uid || usr.id, name: usr.name || 'User'})} title="Hapus Riwayat Absensi">
                                 <Trash2 className="w-3.5 h-3.5" />
                               </Button>
                             )}
                             <Button variant="outline" size="sm" className="h-9 px-3 text-[10px] font-black tracking-widest uppercase rounded-xl border-amber-100 dark:border-amber-900 text-amber-600 dark:text-amber-400 hover:bg-amber-50 shadow-sm" onClick={() => handleKoreksiAlpa(usr)}>Koreksi Alpa</Button>
                             <Button variant="outline" size="sm" className="h-9 px-3 text-[10px] font-black tracking-widest uppercase rounded-xl border-amber-100 dark:border-amber-900 text-amber-600 dark:text-amber-400 hover:bg-amber-50 shadow-sm" onClick={() => handleAddManualOvertime(usr)}>Lembur</Button>
                             <Button variant="outline" size="sm" className="h-9 px-3 text-[10px] font-black tracking-widest uppercase rounded-xl border-teal-100 dark:border-teal-900 text-teal-600 dark:text-teal-400 hover:bg-teal-50 shadow-sm" onClick={() => handleEditUser(usr)}>Edit</Button>
                             <Button 
                               variant="outline" 
                               size="sm" 
                               className="h-9 px-3 text-[10px] font-black tracking-widest uppercase rounded-xl border-teal-100 dark:border-teal-900 text-teal-600 dark:text-teal-400 hover:bg-teal-600 hover:text-white transition-all shadow-sm flex items-center gap-2" 
                               onClick={() => setSelectedUserForCard(usr)}
                             >
                                <Printer className="w-3.5 h-3.5" /> ID Card
                             </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredUsersList.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                            Sedang sinkronisasi data user...
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="announcements" className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border-0 shadow-xl overflow-hidden p-0">
               <CardHeader className="border-b border-teal-50 dark:border-teal-900 p-6 m-0 bg-transparent">
                  <CardTitle className="text-teal-900 dark:text-teal-50 font-black text-xl tracking-tight">Portal Pengumuman</CardTitle>
                  <CardDescription className="text-xs font-medium text-slate-500 dark:text-gray-400">Buat dan kelola pengumuman untuk ditampilkan kepada seluruh pengguna aplikasi.</CardDescription>
               </CardHeader>
               <CardContent className="p-6">
                 <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-900 border border-teal-100 dark:border-teal-900/50 p-6 rounded-2xl shadow-sm space-y-4">
                       <h3 className="text-xs font-black uppercase tracking-widest text-teal-700 dark:text-teal-300">Buat Pengumuman Baru</h3>
                       <div className="space-y-4">
                         <div className="space-y-1.5">
                            <Label className="text-[10px] font-black tracking-widest uppercase text-slate-500">Judul Pengumuman</Label>
                            <Input placeholder="Contoh: Jadwal Libur Lebaran" value={announcementTitle} onChange={e => setAnnouncementTitle(e.target.value)} className="border-teal-100 dark:border-teal-900 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl" />
                         </div>
                         <div className="space-y-1.5">
                            <Label className="text-[10px] font-black tracking-widest uppercase text-slate-500">Tipe Pengumuman</Label>
                            <select value={announcementType} onChange={e => setAnnouncementType(e.target.value)} className="w-full h-10 items-center justify-between rounded-xl border border-teal-100 dark:border-teal-900 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-slate-500 dark:text-gray-300 font-bold outline-none">
                              <option value="info">Info / Umum</option>
                              <option value="danger">Penting / Darurat</option>
                              <option value="success">Prestasi / Meriah</option>
                            </select>
                         </div>
                         <div className="space-y-1.5">
                            <Label className="text-[10px] font-black tracking-widest uppercase text-slate-500">Konten Pengumuman</Label>
                            <textarea 
                              className="w-full min-h-[120px] rounded-xl border border-teal-100 dark:border-teal-900 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-600" 
                              placeholder="Tulis pesan lengkap..."
                              value={announcementContent}
                              onChange={e => setAnnouncementContent(e.target.value)}
                            />
                         </div>
                         <Button onClick={publishAnnouncement} disabled={loadingConfig} className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl uppercase font-black tracking-widest text-xs h-12 w-full">Publikasi Pengumuman</Button>
                       </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-teal-700 dark:text-teal-300">Riwayat Pengumuman ({announcements.length})</h3>
                      <div className="grid gap-4">
                         {announcements.map((ann) => (
                            <div key={ann.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-teal-50 dark:border-teal-900/50 flex flex-col sm:flex-row justify-between items-start gap-4">
                               <div>
                                 <div className="flex items-center gap-2 mb-2">
                                   <Badge variant="outline" className={`text-[9px] uppercase font-black uppercase px-2 py-0.5 border-0 ${ann.type === 'danger' ? 'bg-rose-100 text-rose-700' : ann.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                      {ann.type === 'danger' ? 'PENTING' : ann.type === 'success' ? 'BERITA BAIK' : 'INFO'}
                                   </Badge>
                                   <span className="text-[10px] text-slate-400 font-bold">{format(new Date(ann.createdAt), 'dd MMM yyyy, HH:mm')}</span>
                                 </div>
                                 <h4 className="font-bold text-teal-900 dark:text-white capitalize">{ann.title}</h4>
                                 <p className="text-xs text-slate-500 mt-1 whitespace-pre-wrap">{ann.content}</p>
                                 <p className="text-[10px] text-slate-400 mt-2 italic flex items-center">- Ditulis oleh {ann.createdBy || 'Admin'}</p>
                               </div>
                               <Button variant="ghost" onClick={() => deleteAnnouncement(ann.id)} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl h-8 text-[10px] uppercase font-black tracking-widest px-3 shrink-0">Hapus</Button>
                            </div>
                         ))}
                         {announcements.length === 0 && (
                            <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                               <Briefcase className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                               <p className="text-sm font-bold text-slate-500">Belum ada pengumuman</p>
                               <p className="text-xs text-slate-400 mt-1">Pengumuman Anda akan muncul di layar utama aplikasi user.</p>
                            </div>
                         )}
                      </div>
                    </div>
                 </div>
               </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics" className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
             <PerformanceAnalytics attendances={filteredAttendances} usersList={filteredUsersList} />
          </TabsContent>

          <TabsContent value="live-map" className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out h-[700px]">
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border-0 shadow-xl overflow-hidden h-full flex flex-col">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 shrink-0">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xl font-black tracking-tight">Peta Pantauan Langsung</CardTitle>
                      <CardDescription className="text-blue-100 font-medium">Lokasi absen karyawan hari ini secara real-time</CardDescription>
                    </div>
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                       <MapPin className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 relative">
                     {(!settings?.googleMapsApiKey) ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-slate-50 dark:bg-gray-900 border-2 border-indigo-50 dark:border-indigo-900/50">
                          <AlertCircle className="w-12 h-12 text-slate-400 mb-3" />
                          <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300">API Key Belum Diatur</h3>
                          <p className="text-sm text-slate-500 max-w-md mt-2">Silahkan lengkapi Google Maps API Key di menu Pengaturan untuk menggunakan fitur Peta Pantauan Langsung.</p>
                        </div>
                     ) : (
                        (() => {
                          let defaultLat = -6.2088;
                          let defaultLng = 106.8456;
                          if (settings?.areas && Object.values(settings.areas).length > 0) {
                            const firstArea = Object.values(settings.areas)[0];
                            defaultLat = firstArea.lat;
                            defaultLng = firstArea.lng;
                          }
                          return (
                            <LiveMap 
                              attendances={attendances} 
                              users={usersList} 
                              apiKey={settings.googleMapsApiKey}
                              center={{ lat: defaultLat, lng: defaultLng }}
                            />
                          );
                        })()
                     )}
                </CardContent>
              </Card>
          </TabsContent>

          <TabsContent value="rekap" className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
             <RekapAbsensi usersList={filteredUsersList} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border-0 shadow-xl p-6">
                <div className="text-teal-700 dark:text-teal-300 text-[10px] font-black mb-6 uppercase tracking-widest flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Geofence Configuration
                </div>
                <div className="space-y-8">
                  <div className="flex items-center justify-between p-5 bg-teal-50/50 dark:bg-teal-900/20 rounded-2xl border border-teal-100 dark:border-teal-900/50 shadow-inner">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-black text-teal-900 dark:text-teal-50 tracking-tight uppercase">GEOFENCE RADIUS: {settings?.geofenceEnabled ? <span className="text-teal-600">AKTIF</span> : <span className="text-rose-500">NON-AKTIF</span>}</Label>
                      <p className="text-[10px] text-teal-600/70 dark:text-teal-400 font-bold tracking-wider">Aktifkan untuk membatasi lokasi absensi user berdasarkan area/cabang</p>
                    </div>
                    <Switch 
                      checked={settings?.geofenceEnabled || false} 
                      onCheckedChange={toggleGeofence} 
                      disabled={loadingConfig}
                      className="data-[state=checked]:bg-teal-600"
                    />
                  </div>
                </div>
              </Card>

              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border-0 shadow-xl p-6">
                <div className="text-teal-700 dark:text-teal-300 text-[10px] font-black mb-6 uppercase tracking-widest flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Manajemen Area / Cabang
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5 md:col-span-4">
                       <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nama Area</Label>
                       <Input value={newArea.name} onChange={e => setNewArea({...newArea, name: e.target.value})} className="border-teal-100 rounded-xl bg-white" placeholder="Contoh: Cabang Jakarta" />
                    </div>
                    <div className="space-y-1.5 md:col-span-4 mt-2">
                       <MapPicker 
                         center={{ lat: isNaN(parseFloat(newAreaLatInput)) ? -6.2088 : parseFloat(newAreaLatInput), lng: isNaN(parseFloat(newAreaLngInput)) ? 106.8456 : parseFloat(newAreaLngInput) }} 
                         radius={newArea.radius}
                         onLocationSelect={(lat, lng) => {
                           setNewAreaLatInput(lat.toString());
                           setNewAreaLngInput(lng.toString());
                         }} 
                       />
                       <p className="text-[10px] text-slate-400 font-medium italic mt-1 text-center w-full block">Ketuk pada peta untuk memilih lokasi cabang/area baru</p>
                    </div>
                    <div className="space-y-1.5">
                       <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Latitude</Label>
                       <Input type="text" value={newAreaLatInput} onChange={e => setNewAreaLatInput(e.target.value.replace(/,/g, '.'))} className="border-teal-100 rounded-xl bg-white font-mono text-sm" />
                    </div>
                    <div className="space-y-1.5">
                       <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Longitude</Label>
                       <Input type="text" value={newAreaLngInput} onChange={e => setNewAreaLngInput(e.target.value.replace(/,/g, '.'))} className="border-teal-100 rounded-xl bg-white font-mono text-sm" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2 flex items-end">
                       <div className="space-y-1.5 flex-1 pr-2">
                         <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Radius (Meter)</Label>
                         <Input type="number" value={newArea.radius} onChange={e => setNewArea({...newArea, radius: Number(e.target.value)})} className="border-teal-100 rounded-xl bg-white" />
                       </div>
                       <Button onClick={() => {
                          if (newArea.name) {
                            const areaId = editingAreaId || ("area_" + Date.now());
                            const parsedLat = parseFloat(newAreaLatInput);
                            const parsedLng = parseFloat(newAreaLngInput);
                            setAreasInput({ ...areasInput, [areaId]: { ...newArea, lat: isNaN(parsedLat) ? 0 : parsedLat, lng: isNaN(parsedLng) ? 0 : parsedLng } });
                            setNewArea({ name: "", radius: 100 });
                            setNewAreaLatInput("-6.2088");
                            setNewAreaLngInput("106.8456");
                            setEditingAreaId(null);
                          }
                       }} className="bg-teal-500 hover:bg-teal-600 h-10 px-6 rounded-xl font-bold uppercase text-[10px] text-white whitespace-nowrap">
                         {editingAreaId ? "SIMPAN" : "TAMBAH"}
                       </Button>
                       {editingAreaId && (
                         <Button onClick={() => {
                           setNewArea({ name: "", radius: 100 });
                           setNewAreaLatInput("-6.2088");
                           setNewAreaLngInput("106.8456");
                           setEditingAreaId(null);
                         }} variant="outline" className="h-10 px-4 rounded-xl font-bold uppercase text-[10px] text-slate-500">
                           BATAL
                         </Button>
                       )}
                    </div>
                  </div>

                  <div className="space-y-3 mt-4">
                    {Object.entries(areasInput || {}).map(([id, a]: [string, any]) => (
                      <div key={id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 dark:bg-gray-800/50 dark:border-gray-700/50 rounded-2xl">
                         <div>
                            <div className="font-bold text-sm text-teal-900 dark:text-teal-50">{a.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5 font-medium">
                               Lat: {a.lat}, Lng: {a.lng} | Radius: <span className="font-bold text-teal-600">{a.radius}m</span>
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                           <Button variant="ghost" className="text-teal-600 hover:text-teal-800 hover:bg-teal-50 dark:hover:bg-teal-900/40 rounded-xl text-xs font-bold" onClick={() => {
                              setEditingAreaId(id);
                              setNewArea({ name: a.name, radius: a.radius || 100 });
                              setNewAreaLatInput(a.lat?.toString() || "-6.2088");
                              setNewAreaLngInput(a.lng?.toString() || "106.8456");
                           }}>Edit</Button>
                           <Button variant="ghost" className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/40 rounded-xl text-xs font-bold" onClick={() => {
                              const newObj = {...areasInput};
                              delete newObj[id];
                              setAreasInput(newObj);
                              if (editingAreaId === id) {
                                setEditingAreaId(null);
                                setNewArea({ name: "", radius: 100 });
                              }
                           }}>Hapus</Button>
                         </div>
                      </div>
                    ))}
                    {Object.keys(areasInput || {}).length === 0 && <p className="text-xs text-slate-400 italic text-center py-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200">Belum ada area yang ditambahkan.</p>}
                  </div>
                  
                  <Button onClick={saveSettings} disabled={loadingConfig} className="w-full bg-teal-600 hover:bg-teal-700 h-12 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-lg mt-8 transition-all active:scale-95">
                    SIMPAN MANAJEMEN AREA
                  </Button>
                </div>
              </Card>

              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border-0 shadow-xl p-6 flex flex-col md:col-span-2">
                <div className="text-teal-700 dark:text-teal-300 text-[10px] font-black mb-6 uppercase tracking-widest flex items-center gap-2">
                   <Briefcase className="w-4 h-4" /> Shift & Working Days Management
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(shiftsInput).map(([id, shift]: [string, any]) => (
                    <div key={id} className="bg-teal-50/50 dark:bg-teal-900/20 p-4 rounded-2xl border border-teal-100 dark:border-teal-900/50 space-y-4">
                      <div className="flex justify-between items-center text-teal-700 dark:text-teal-300">
                        <Input 
                          value={shift.name} 
                          onChange={(e) => {
                            const newShifts = {...shiftsInput};
                            newShifts[id].name = e.target.value;
                            setShiftsInput(newShifts);
                          }}
                          className="bg-transparent border-0 font-black uppercase p-0 h-auto focus-visible:ring-0 text-sm w-32"
                        />
                        <div className="flex gap-2 items-center">
                          <Input 
                            type="color" 
                            value={shift.color} 
                            onChange={(e) => {
                              const newShifts = {...shiftsInput};
                              newShifts[id].color = e.target.value;
                              setShiftsInput(newShifts);
                            }}
                            className="w-8 h-8 rounded-full border-0 p-0 pointer cursor-pointer"
                          />
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                            onClick={() => {
                              const newShifts = {...shiftsInput};
                              delete newShifts[id];
                              setShiftsInput(newShifts);
                            }}
                          >
                            <LogOut className="w-4 h-4 rotate-45" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[8px] font-black uppercase text-slate-500">Jam Masuk</Label>
                          <Input 
                            type="time" 
                            value={shift.startTime || "08:00"} 
                            onChange={(e) => {
                              const newShifts = {...shiftsInput};
                              newShifts[id].startTime = e.target.value;
                              setShiftsInput(newShifts);
                            }}
                            className="h-8 py-1 text-[10px] px-2 rounded-lg"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[8px] font-black uppercase text-slate-500">Jam Pulang</Label>
                          <Input 
                            type="time" 
                            value={shift.endTime || "17:00"} 
                            onChange={(e) => {
                              const newShifts = {...shiftsInput};
                              newShifts[id].endTime = e.target.value;
                              setShiftsInput(newShifts);
                            }}
                            className="h-8 py-1 text-[10px] px-2 rounded-lg"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[8px] font-black uppercase text-slate-500">Toleransi (M)</Label>
                          <Input 
                            type="number" 
                            value={shift.gracePeriod || 0} 
                            onChange={(e) => {
                              const newShifts = {...shiftsInput};
                              newShifts[id].gracePeriod = Number(e.target.value);
                              setShiftsInput(newShifts);
                            }}
                            className="h-8 py-1 text-[10px] px-2 rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-teal-100/50">
                        {["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((dayName, idx) => {
                          const workDay = shift.workDays[idx];
                          return (
                            <div key={idx} className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-slate-500 w-16">{dayName}</span>
                              <div className="flex gap-2 items-center flex-1 justify-end">
                                {workDay ? (
                                  <>
                                    <Input 
                                      type="time" 
                                      value={workDay.start} 
                                      onChange={(e) => {
                                        const newShifts = {...shiftsInput};
                                        newShifts[id].workDays[idx].start = e.target.value;
                                        setShiftsInput(newShifts);
                                      }}
                                      className="h-7 py-1 text-[10px] w-20 px-2 rounded-lg"
                                    />
                                    <span>-</span>
                                    <Input 
                                      type="time" 
                                      value={workDay.end} 
                                      onChange={(e) => {
                                        const newShifts = {...shiftsInput};
                                        newShifts[id].workDays[idx].end = e.target.value;
                                        setShiftsInput(newShifts);
                                      }}
                                      className="h-7 py-1 text-[10px] w-20 px-2 rounded-lg"
                                    />
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-6 w-6 p-0 text-rose-500"
                                      onClick={() => {
                                        const newShifts = {...shiftsInput};
                                        newShifts[id].workDays[idx] = null;
                                        setShiftsInput(newShifts);
                                      }}
                                    ><LogOut className="w-3 h-3"/></Button>
                                  </>
                                ) : (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-7 text-[10px] uppercase font-black px-4 rounded-lg bg-white"
                                    onClick={() => {
                                      const newShifts = {...shiftsInput};
                                      newShifts[id].workDays[idx] = { start: "08:00", end: "16:00" };
                                      setShiftsInput(newShifts);
                                    }}
                                  >SET LIBUR</Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => {
                      const newId = `shift_${Date.now()}`;
                      setShiftsInput({
                        ...shiftsInput,
                        [newId]: {
                          name: "New Shift",
                          label: "Custom",
                          color: "#64748b",
                          startTime: "08:00",
                          endTime: "16:00",
                          gracePeriod: 0,
                          workDays: {
                            0: null,
                            1: { start: "08:00", end: "16:00" },
                            2: { start: "08:00", end: "16:00" },
                            3: { start: "08:00", end: "16:00" },
                            4: { start: "08:00", end: "16:00" },
                            5: { start: "08:00", end: "16:00" },
                            6: null
                          }
                        }
                      });
                    }}
                    className="border-2 border-dashed border-teal-200 dark:border-teal-900/50 rounded-2xl flex flex-col items-center justify-center p-8 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-all gap-2"
                  >
                    <Briefcase className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Tambah Shift Baru</span>
                  </button>
                </div>
                <Button onClick={saveSettings} disabled={loadingConfig} className="w-full bg-teal-600 hover:bg-teal-700 h-12 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-lg mt-8 transition-all active:scale-95">
                  SIMPAN PENGATURAN SHIFT
                </Button>
              </Card>

              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border-0 shadow-xl p-6 md:col-span-2">
                <div className="text-teal-700 dark:text-teal-300 text-[10px] font-black mb-6 uppercase tracking-widest flex items-center gap-2">
                   <CalendarDays className="w-4 h-4" /> Manual Holiday Table (Overwrites Automatic)
                </div>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input 
                      type="date" 
                      value={newHoliday} 
                      onChange={(e) => setNewHoliday(e.target.value)}
                      className="border-teal-100 dark:border-teal-900 bg-white dark:bg-gray-900 h-10 text-sm font-bold rounded-xl"
                    />
                    <Button 
                      onClick={() => {
                        if (newHoliday && !holidaysInput.includes(newHoliday)) {
                          setHolidaysInput([...holidaysInput, newHoliday].sort());
                          setNewHoliday("");
                        }
                      }}
                      className="bg-teal-500 hover:bg-teal-600 rounded-xl font-bold uppercase tracking-widest text-[10px] px-6"
                    >TAMBAH LIBUR</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {holidaysInput.map(h => (
                      <div key={h} className="bg-rose-50 border border-rose-100 text-rose-600 px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-2">
                        {format(new Date(h), "dd MMM yyyy")}
                        <button onClick={() => setHolidaysInput(holidaysInput.filter(d => d !== h))} className="hover:text-rose-800">
                          <LogOut className="w-3 h-3 rotate-45" />
                        </button>
                      </div>
                    ))}
                    {holidaysInput.length === 0 && <p className="text-xs text-slate-400 italic">Belum ada hari libur manual yang ditambahkan.</p>}
                  </div>
                  <Button onClick={saveSettings} disabled={loadingConfig} className="w-full bg-teal-600 hover:bg-teal-700 h-12 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-lg mt-4 transition-all active:scale-95">
                    SIMPAN DAFTAR LIBUR
                  </Button>
                </div>
              </Card>

              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border-0 shadow-xl p-6 md:col-span-2">
                <div className="text-teal-700 dark:text-teal-300 text-[10px] font-black mb-6 uppercase tracking-widest flex items-center gap-2">
                   <Settings className="w-4 h-4" /> Brand Identity Config
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest">Nama Platform Kerja</Label>
                      <Input 
                        className="border-teal-100 dark:border-teal-900 bg-white dark:bg-gray-900 h-10 text-sm font-bold rounded-xl focus-visible:ring-teal-600"
                        placeholder="NUSAWORK / ABSENKU"
                        value={appNameInput} 
                        onChange={(e) => setAppNameInput(e.target.value)} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest">URL Logo Branding (PNG Transparent Recommended)</Label>
                      <div className="flex gap-2">
                        <Input 
                          className="flex-1 border-teal-100 dark:border-teal-900 bg-white dark:bg-gray-900 h-10 text-sm font-bold rounded-xl focus-visible:ring-teal-600"
                          placeholder="https://yourdomain.com/logo.png"
                          value={appLogoUrlInput} 
                          onChange={(e) => setAppLogoUrlInput(e.target.value)} 
                        />
                        <div className="relative">
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={async (e) => {
                              if (e.target.files && e.target.files[0]) {
                                toast.loading("Mengunggah logo...", { id: "upload-logo" });
                                try {
                                  const url = await uploadFileToStorage(e.target.files[0], 'branding');
                                  setAppLogoUrlInput(url);
                                  toast.success("Berhasil mengunggah logo", { id: "upload-logo" });
                                } catch (error) {
                                  toast.error("Gagal mengunggah logo", { id: "upload-logo" });
                                }
                              }
                            }}
                          />
                          <Button type="button" variant="outline" className="h-10 px-4 rounded-xl font-bold">
                            Upload File
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button onClick={saveSettings} disabled={loadingConfig} className="w-full bg-teal-600 hover:bg-teal-700 h-12 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-lg mt-2 transition-all active:scale-95">
                    PERBARUI IDENTITAS APLIKASI
                  </Button>
                </div>
              </Card>

              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border-0 shadow-xl p-6 md:col-span-2">
                <div className="text-teal-700 dark:text-teal-300 text-[10px] font-black mb-6 uppercase tracking-widest flex items-center gap-2">
                   <Settings className="w-4 h-4" /> Firebase Cloud Messaging Config
                </div>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border flex flex-col gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest">Web Push VAPID Key</Label>
                      <Input 
                        className="border-teal-100 dark:border-teal-900 bg-white dark:bg-gray-900 h-10 text-sm font-bold rounded-xl focus-visible:ring-teal-600"
                        placeholder="Misal: BMTxxxxxxxxxxxx..."
                        value={user?.role === "demo" ? "************************" : fcmVapidKeyInput} 
                        onChange={(e) => setFcmVapidKeyInput(e.target.value)}
                        disabled={user?.role === "demo"}
                        type={user?.role === "demo" ? "password" : "text"}
                      />
                      <p className="text-[10px] text-gray-500 mt-1">
                        Dapatkan VAPID Key dari Firebase Console {'->'} Project Settings {'->'} Cloud Messaging {'->'} Web Push certificates. 
                        Hal ini digunakan user agar bisa login dan menerima notifikasi.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest">Google Maps API Key</Label>
                      <Input 
                        className="border-teal-100 dark:border-teal-900 bg-white dark:bg-gray-900 h-10 text-sm font-bold rounded-xl focus-visible:ring-teal-600"
                        placeholder="AIzaSy..."
                        value={user?.role === "demo" ? "************************" : googleMapsApiKeyInput} 
                        onChange={(e) => setGoogleMapsApiKeyInput(e.target.value)} 
                        disabled={user?.role === "demo"}
                        type={user?.role === "demo" ? "password" : "text"}
                      />
                      <p className="text-[10px] text-gray-500 mt-1">
                        Dapatkan dari Google Cloud Console. Pastikan Maps JavaScript API telah diaktifkan untuk key tersebut. Map tidak akan muncul sebelum diisi.
                      </p>
                    </div>
                  </div>
                  <Button onClick={saveSettings} disabled={loadingConfig} className="w-full bg-teal-600 hover:bg-teal-700 h-12 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-lg mt-2 transition-all active:scale-95">
                    SIMPAN PENGATURAN FCM
                  </Button>
                </div>
              </Card>

              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border-0 shadow-xl p-6 md:col-span-2">
                <div className="text-teal-700 dark:text-teal-300 text-[10px] font-black mb-6 uppercase tracking-widest flex items-center gap-2">
                   <UserPlus className="w-4 h-4" /> Registration ID REF Manager
                </div>
                <div className="space-y-6">
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <Button 
                      onClick={async () => {
                         if (user?.role === "demo") { toast.error("Akun demo."); return; }
                         const role = "crew";
                         const refId = `USER-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                         await setDoc(doc(db, "idRefs", refId), { role, used: false, createdAt: Date.now() });
                      }}
                      className="bg-teal-500 hover:bg-teal-600 rounded-xl font-bold uppercase tracking-widest text-[10px] px-4"
                    >Generate Crew REF</Button>
                    <Button 
                      onClick={async () => {
                         if (user?.role === "demo") { toast.error("Akun demo."); return; }
                         const role = "staff";
                         const refId = `STAFF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                         await setDoc(doc(db, "idRefs", refId), { role, used: false, createdAt: Date.now() });
                      }}
                      className="bg-teal-500 hover:bg-teal-600 rounded-xl font-bold uppercase tracking-widest text-[10px] px-4"
                    >Generate Staff REF</Button>
                    <Button 
                      onClick={async () => {
                         if (user?.role === "demo") { toast.error("Akun demo."); return; }
                         const role = "admin";
                         const refId = `ADMIN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                         await setDoc(doc(db, "idRefs", refId), { role, used: false, createdAt: Date.now() });
                      }}
                      className="bg-rose-500 hover:bg-rose-600 rounded-xl font-bold uppercase tracking-widest text-[10px] px-4"
                    >Generate Admin REF</Button>
                    <Button 
                      onClick={async () => {
                         if (user?.role === "demo") { toast.error("Akun demo."); return; }
                         const role = "demo";
                         const refId = `DEMO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                         await setDoc(doc(db, "idRefs", refId), { role, used: false, createdAt: Date.now() });
                      }}
                      className="bg-indigo-500 hover:bg-indigo-600 rounded-xl font-bold uppercase tracking-widest text-[10px] px-4"
                    >Generate Demo REF</Button>
                    <Button 
                      onClick={async () => {
                         if (user?.role === "demo") { toast.error("Akun demo."); return; }
                         const role = "demouser";
                         const refId = `DEMOUSER-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                         await setDoc(doc(db, "idRefs", refId), { role, used: false, createdAt: Date.now() });
                      }}
                      className="bg-indigo-500 hover:bg-indigo-600 rounded-xl font-bold uppercase tracking-widest text-[10px] px-4"
                    >Generate DemoUser REF</Button>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-1 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-100 dark:border-gray-800">
                          <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">ID REF</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Dibuat</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Role</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status</TableHead>
                          <TableHead className="text-right"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {idRefsList.map((refData) => (
                          <TableRow key={refData.id} className="border-gray-100 dark:border-gray-800">
                            <TableCell className="font-mono font-bold text-teal-600">{refData.id}</TableCell>
                            <TableCell className="text-xs text-slate-500">{format(new Date(refData.createdAt), "dd MMM yyyy, HH:mm")}</TableCell>
                            <TableCell>
                               <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${refData.role === 'admin' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                                 {refData.role}
                               </span>
                            </TableCell>
                            <TableCell>
                               {refData.used ? 
                                 <span className="text-[10px] font-black tracking-widest uppercase text-slate-400">Terpakai</span> : 
                                 <span className="text-[10px] font-black tracking-widest uppercase text-teal-500">Tersedia</span>
                               }
                            </TableCell>
                            <TableCell className="text-right">
                               <Button 
                                 variant="ghost" 
                                 size="sm" 
                                 className="h-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                 onClick={async () => {
                                   if (user?.role === "demo") { toast.error("Akun demo."); return; }
                                   await deleteDoc(doc(db, "idRefs", refData.id));
                                 }}
                               >
                                 <LogOut className="w-4 h-4 rotate-45" />
                               </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {idRefsList.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-xs text-slate-400 italic">Belum ada ID REF yang dibuat.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </Card>

            </TabsContent>
          
        </Tabs>

        {/* Member Card Creation Dialog */}
        <Dialog open={!!selectedUserForCard} onOpenChange={(open) => !open && setSelectedUserForCard(null)}>
          <DialogContent className="sm:max-w-2xl bg-white dark:bg-gray-900 border-0 rounded-[2.5rem] shadow-2xl p-0 overflow-hidden outline-none ring-0">
            {selectedUserForCard && (
              <div className="flex flex-col items-center p-8">
                <div 
                  id="member-card-print"
                  className="bg-white border-0 overflow-hidden relative shadow-2xl flex flex-col items-center"
                  style={{ 
                    width: '85.6mm', 
                    height: '54mm', 
                    borderRadius: '4mm',
                    fontFamily: 'system-ui, sans-serif'
                  }}
                >
                   {/* Background Elements */}
                   <div className="absolute inset-0 bg-slate-50"></div>
                   <div className="absolute top-0 right-0 w-48 h-48 bg-teal-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                   <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-600/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

                   {/* Header / Top Bar */}
                   <div className="h-[9mm] bg-teal-800 flex items-center px-4 relative z-10 w-full shrink-0 border-b-2 border-teal-600">
                      <div className="flex items-center gap-2">
                        {settings?.appLogoUrl ? (
                          <img src={settings.appLogoUrl} className="h-[22px] object-contain brightness-0 invert" alt="Logo" />
                        ) : (
                          <div className="w-[20px] h-[20px] bg-white text-teal-800 rounded flex items-center justify-center shadow-lg">
                            <Briefcase className="w-[12px] h-[12px]" />
                          </div>
                        )}
                        <h1 className="text-[12px] font-black tracking-[0.1em] text-white uppercase ml-1 opacity-95">{settings?.appName || "ABSENKU"}</h1>
                      </div>
                   </div>

                   {/* Main Content Area */}
                   <div className="flex-1 flex w-full relative z-10 items-center pl-3 pr-2 py-1 justify-between">
                      {/* Left: Info & Photo */}
                      <div className="flex gap-4 items-center w-[72%]">
                         {/* Photo */}
                         <div className="w-[22.5mm] h-[28mm] rounded-lg bg-teal-50 border-[2.5px] border-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden shrink-0 flex items-center justify-center">
                           {selectedUserForCard.avatarUrl ? (
                              <img src={selectedUserForCard.avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
                           ) : (
                              <div className="w-full h-full flex items-center justify-center font-black text-teal-300 text-4xl">
                                {selectedUserForCard.name ? selectedUserForCard.name[0] : "P"}
                              </div>
                           )}
                         </div>

                         {/* Info Text */}
                         <div className="flex flex-col justify-center pb-1">
                            <div className="mb-[2.5mm]">
                               <h2 className="text-[13px] font-black text-slate-800 uppercase tracking-tight leading-none mb-1 line-clamp-2">{selectedUserForCard.name}</h2>
                               <p className="text-[7.5px] font-black text-teal-600 uppercase tracking-widest">{selectedUserForCard.role?.replace(/_/g, ' ') || "EMPLOYEE"}</p>
                            </div>

                            <div className="grid gap-[1.5mm]">
                               <div>
                                  <p className="text-[5.5px] font-black text-slate-400 uppercase tracking-[0.1em] mb-0.5">ID KARYAWAN</p>
                                  <p className="text-[9px] font-bold text-slate-800 leading-none">{selectedUserForCard.uniqueId || "-"}</p>
                               </div>
                               <div>
                                  <p className="text-[5.5px] font-black text-slate-400 uppercase tracking-[0.1em] mb-0.5">JADWAL SHIFT</p>
                                  <p className="text-[8px] font-bold text-slate-800 leading-none">
                                      {selectedUserForCard.shiftId ? shiftsInput[selectedUserForCard.shiftId]?.name || "CUSTOM" : "TIDAK ADA SHIFT"}
                                  </p>
                               </div>
                            </div>
                         </div>
                      </div>

                      {/* Right: QR Code */}
                      <div className="w-[28%] flex flex-col items-center justify-center pr-2 border-l border-slate-200/60 pl-3 py-1">
                          <div className="bg-white p-1 rounded border border-slate-200 shadow-sm w-[21mm] h-[21mm] flex items-center justify-center">
                            <QRCodeCanvas value={selectedUserForCard.id} style={{ width: '100%', height: '100%' }} level="Q" />
                          </div>
                          <p className="text-[4px] font-black text-slate-400 uppercase mt-1 tracking-widest text-center">{selectedUserForCard.id.slice(0, 10)}</p>
                      </div>
                   </div>

                   {/* Footer Bar */}
                   <div className="h-[3.5mm] bg-teal-900 flex items-center px-4 justify-between relative z-10 w-full shrink-0">
                      <p className="text-[4.5px] font-bold text-teal-100/70 uppercase tracking-widest">KARTU TANDA PENGENAL (KTP)</p>
                      <p className="text-[4.5px] font-bold text-teal-100/70 uppercase tracking-widest">HARAP DIKEMBALIKAN JIKA DITEMUKAN</p>
                   </div>
                </div>

                <div className="flex justify-between gap-4 w-full mt-8 max-w-[85.6mm]">
                  <Button variant="ghost" className="flex-1 text-slate-400 dark:text-gray-500 font-bold tracking-widest uppercase text-xs hover:text-rose-500 transition-colors h-12 rounded-2xl" onClick={() => setSelectedUserForCard(null)}>Batal</Button>
                  <Button onClick={async () => {
                    const el = document.getElementById("member-card-print");
                    if (!el) return;
                    toast.info("Menyiapkan dokumen...", { id: 'print-id' });
                    try {
                      // Slight delay for renders
                      await new Promise(r => setTimeout(r, 250));
                      const url = await toPng(el, { cacheBust: true, pixelRatio: 3 });
                      const pdf = new jsPDF({
                        orientation: "landscape",
                        unit: "mm",
                        format: [85.6, 54]
                      });
                      pdf.addImage(url, 'PNG', 0, 0, 85.6, 54);
                      pdf.save(`IDCard_${selectedUserForCard.name?.replace(/\s+/g, '_') || 'Karyawan'}.pdf`);
                      toast.dismiss();
                      toast.success("Berhasil mengunduh dokumen", { id: 'print-id' });
                    } catch (e) {
                      toast.dismiss();
                      console.error("Print error", e);
                      toast.error("Gagal mengunduh kartu", { id: 'print-id' });
                    }
                  }} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-black tracking-widest uppercase text-xs h-12 shadow-lg shadow-teal-600/20 rounded-2xl active:scale-95 transition-all">UNDUH KARTU (PDF)</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Manual Overtime Dialog */}
        <Dialog open={showOvertimeModal} onOpenChange={(open) => !open && setShowOvertimeModal(false)}>
          <DialogContent className="sm:max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border-0 shadow-2xl rounded-[2rem] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-xl font-black text-amber-900 dark:text-amber-50 uppercase tracking-tighter">Tambah Lembur Manual</DialogTitle>
              <CardDescription className="text-xs font-bold text-slate-500 uppercase tracking-widest">Atur waktu lembur user dari sistem</CardDescription>
            </DialogHeader>
            {overtimeUser && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-[0.2em] ml-1">Nama User</Label>
                  <Input 
                    disabled
                    value={overtimeUser.name} 
                    className="bg-slate-50 dark:bg-slate-900/50 border-amber-100 dark:border-amber-900 h-12 rounded-2xl font-bold text-amber-900 dark:text-amber-50 opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-[0.2em] ml-1">Tanggal</Label>
                  <Input 
                    type="date"
                    value={overtimeDate} 
                    onChange={(e) => setOvertimeDate(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900/50 border-amber-100 dark:border-amber-900 h-12 rounded-2xl font-bold text-amber-900 dark:text-amber-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-[0.2em] ml-1">Mulai</Label>
                    <Input 
                      type="time"
                      value={overtimeStartTime} 
                      onChange={(e) => setOvertimeStartTime(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-900/50 border-amber-100 dark:border-amber-900 h-12 rounded-2xl font-bold text-amber-900 dark:text-amber-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-[0.2em] ml-1">Sampai</Label>
                    <Input 
                      type="time"
                      value={overtimeEndTime} 
                      onChange={(e) => setOvertimeEndTime(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-900/50 border-amber-100 dark:border-amber-900 h-12 rounded-2xl font-bold text-amber-900 dark:text-amber-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-[0.2em] ml-1">Keterangan</Label>
                  <Input 
                    value={overtimeNotes} 
                    onChange={(e) => setOvertimeNotes(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900/50 border-amber-100 dark:border-amber-900 h-12 rounded-2xl font-bold text-amber-900 dark:text-amber-50"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="ghost" className="flex-1 text-slate-400 font-bold uppercase text-xs h-12 rounded-2xl" onClick={() => setShowOvertimeModal(false)}>Batal</Button>
                  <Button onClick={saveManualOvertime} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-black tracking-widest uppercase text-xs h-12 shadow-lg shadow-amber-600/20 rounded-2xl active:scale-95 transition-all">SIMPAN LEMBUR</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Koreksi Alpa Dialog */}
        <Dialog open={showKoreksiModal} onOpenChange={(open) => !open && setShowKoreksiModal(false)}>
          <DialogContent className="sm:max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border-0 shadow-2xl rounded-[2rem] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-xl font-black text-amber-900 dark:text-amber-50 uppercase tracking-tighter">Koreksi Kehadiran / Dispensasi</DialogTitle>
              <CardDescription className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tambahkan riwayat untuk koreksi alpa</CardDescription>
            </DialogHeader>
            {koreksiUser && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-[0.2em] ml-1">Nama User</Label>
                  <Input 
                    disabled
                    value={koreksiUser.name} 
                    className="bg-slate-50 dark:bg-slate-900/50 border-amber-100 dark:border-amber-900 h-12 rounded-2xl font-bold text-amber-900 dark:text-amber-50 opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-[0.2em] ml-1">Tanggal Dispensasi</Label>
                  <Input 
                    type="date"
                    value={koreksiDate} 
                    onChange={(e) => setKoreksiDate(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900/50 border-amber-100 dark:border-amber-900 h-12 rounded-2xl font-bold text-amber-900 dark:text-amber-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-[0.2em] ml-1">Keterangan Tambahan</Label>
                  <Input 
                    value={koreksiNotes} 
                    onChange={(e) => setKoreksiNotes(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900/50 border-amber-100 dark:border-amber-900 h-12 rounded-2xl font-bold text-amber-900 dark:text-amber-50"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="ghost" className="flex-1 text-slate-400 font-bold uppercase text-xs h-12 rounded-2xl" onClick={() => setShowKoreksiModal(false)}>Batal</Button>
                  <Button onClick={submitKoreksiAlpa} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-black tracking-widest uppercase text-xs h-12 shadow-lg shadow-amber-600/20 rounded-2xl active:scale-95 transition-all">SIMPAN KOREKSI</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete All History Confirm Dialog */}
        <Dialog open={confirmDeleteGlobal} onOpenChange={setConfirmDeleteGlobal}>
          <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 rounded-[2rem] border-0 shadow-2xl overflow-hidden">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-black text-rose-600 uppercase tracking-tighter">Peringatan Penghapusan</DialogTitle>
              <CardDescription className="text-sm font-medium text-slate-500">
                Anda akan menghapus <strong className="text-rose-600">SEMUA</strong> riwayat absensi dari seluruh user. Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin melanjutkan?
              </CardDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end mt-4">
              <Button variant="outline" onClick={() => setConfirmDeleteGlobal(false)} className="rounded-xl border-slate-200">Batal</Button>
              <Button onClick={handleDeleteAllHistory} className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md">Ya, Hapus Semua</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete User History Confirm Dialog */}
        <Dialog open={!!deleteUserTarget} onOpenChange={(open) => !open && setDeleteUserTarget(null)}>
          <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 rounded-[2rem] border-0 shadow-2xl overflow-hidden">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-black text-rose-600 uppercase tracking-tighter">Peringatan Penghapusan</DialogTitle>
              <CardDescription className="text-sm font-medium text-slate-500">
                Hapus semua riwayat absensi untuk user <strong className="text-rose-600">{deleteUserTarget?.name}</strong>? Tindakan ini tidak bisa dibatalkan.
              </CardDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end mt-4">
              <Button variant="outline" onClick={() => setDeleteUserTarget(null)} className="rounded-xl border-slate-200">Batal</Button>
              <Button onClick={handleDeleteUserHistory} className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md">Ya, Hapus Riwayat</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={!!selectedUserForEdit} onOpenChange={(open) => !open && setSelectedUserForEdit(null)}>
          <DialogContent className="sm:max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border-0 shadow-2xl rounded-[2rem] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-xl font-black text-teal-900 dark:text-teal-50 uppercase tracking-tighter">Edit Data User</DialogTitle>
              <CardDescription className="text-xs font-bold text-slate-500 uppercase tracking-widest">Update profile & shift information</CardDescription>
            </DialogHeader>
            <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-2xl border border-teal-100 dark:border-teal-900/30 mb-6">
              <p className="text-[10px] font-bold text-teal-800 dark:text-teal-200 leading-relaxed">
                <strong>💡 Catatan Prioritas Shift:</strong> Sistem mengikuti urutan berikut: 
                <br/>1. Shift Mingguan (jika diatur &gt; 0)
                <br/>2. Shift Bulanan (jika ada untuk bulan ini)
                <br/>3. Penempatan Shift (Default)
              </p>
            </div>
            {selectedUserForEdit && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-teal-700 dark:text-teal-300 uppercase tracking-[0.2em] ml-1">Nama Lengkap</Label>
                  <Input 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900/50 border-teal-100 dark:border-teal-900 h-12 rounded-2xl font-bold text-teal-900 dark:text-teal-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-teal-700 dark:text-teal-300 uppercase tracking-[0.2em] ml-1">Jabatan / Role</Label>
                  <select 
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-teal-100 dark:border-teal-900 h-12 rounded-2xl font-bold text-teal-900 dark:text-teal-50 px-4 focus:ring-2 focus:ring-teal-500/20 transition-all outline-none"
                  >
                    <option value="superadmin">SUPERADMIN</option>
                    <option value="admin">ADMIN</option>
                    <option value="staff">STAFF</option>
                    <option value="crew">CREW</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-teal-700 dark:text-teal-300 uppercase tracking-[0.2em] ml-1">Penempatan Shift</Label>
                  <select 
                    value={editShift}
                    onChange={(e) => setEditShift(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-teal-100 dark:border-teal-900 h-12 rounded-2xl font-bold text-teal-900 dark:text-teal-50 px-4 focus:ring-2 focus:ring-teal-500/20 transition-all outline-none"
                  >
                    <option value="none">TIDAK ADA SHIFT (NONE)</option>
                    {Object.entries(shiftsInput).map(([id, s]: [string, any]) => (
                      <option key={id} value={id}>{s.name} ({s.label})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-teal-700 dark:text-teal-300 uppercase tracking-[0.2em] ml-1">Area / Cabang (Multi-Tenant)</Label>
                  <select 
                    value={editArea}
                    onChange={(e) => setEditArea(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-teal-100 dark:border-teal-900 h-12 rounded-2xl font-bold text-teal-900 dark:text-teal-50 px-4 focus:ring-2 focus:ring-teal-500/20 transition-all outline-none"
                  >
                    <option value="">-- Pilih Area --</option>
                    {Object.entries(areasInput || {}).map(([id, a]: [string, any]) => (
                      <option key={id} value={id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-teal-700 dark:text-teal-300 uppercase tracking-[0.2em] ml-1">KODE UNIK</Label>
                  <Input 
                    value={editUniqueId} 
                    onChange={(e) => setEditUniqueId(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900/50 border-teal-100 dark:border-teal-900 h-12 rounded-2xl font-bold text-teal-900 dark:text-teal-50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-teal-700 dark:text-teal-300 uppercase tracking-[0.2em] ml-1">Mulai Kontrak</Label>
                    <Input 
                      type="date"
                      value={editWorkStartDate} 
                      onChange={(e) => setEditWorkStartDate(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-900/50 border-teal-100 dark:border-teal-900 h-12 rounded-2xl font-bold text-teal-900 dark:text-teal-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-teal-700 dark:text-teal-300 uppercase tracking-[0.2em] ml-1">Selesai Kontrak</Label>
                    <Input 
                      type="date"
                      value={editWorkEndDate} 
                      onChange={(e) => setEditWorkEndDate(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-900/50 border-teal-100 dark:border-teal-900 h-12 rounded-2xl font-bold text-teal-900 dark:text-teal-50"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black text-teal-700 dark:text-teal-300 uppercase tracking-[0.2em] ml-1">SHIFT MINGGUAN (ROTASI)</Label>
                  <div className="space-y-2">
                    {editWeeklyShiftPattern.map((shiftId, index) => (
                      <div key={index} className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Minggu {index + 1}</span>
                        <span className="text-xs font-bold text-teal-700 dark:text-teal-300">{shiftsInput[shiftId]?.name || shiftId}</span>
                        <button onClick={() => setEditWeeklyShiftPattern(prev => prev.filter((_, i) => i !== index))} className="text-rose-500 hover:text-rose-700 text-xs font-bold">Hapus</button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <select className="h-10 text-xs font-bold bg-slate-50 dark:bg-slate-900 border rounded-lg px-2 flex-grow" id="newWeeklyShift">
                        {Object.entries(shiftsInput).map(([id, s]: [string, any]) => (
                          <option key={id} value={id}>{s.name || id}</option>
                        ))}
                      </select>
                      <Button size="sm" onClick={() => {
                        const s = (document.getElementById("newWeeklyShift") as HTMLSelectElement).value;
                        if(s) setEditWeeklyShiftPattern(prev => [...prev, s]);
                      }} className="h-10 px-3">+</Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black text-teal-700 dark:text-teal-300 uppercase tracking-[0.2em] ml-1">SHIFT BULANAN</Label>
                  <div className="space-y-2">
                    {Object.entries(editMonthlyShifts).map(([month, shiftId]) => (
                      <div key={month} className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{month}</span>
                        <span className="text-xs font-bold text-teal-700 dark:text-teal-300">{shiftsInput[shiftId]?.name || shiftId}</span>
                        <button onClick={() => setEditMonthlyShifts(prev => { const next = {...prev}; delete next[month]; return next; })} className="text-rose-500 hover:text-rose-700 text-xs font-bold">Hapus</button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input type="month" className="h-10 text-xs font-bold" id="newMonth" />
                      <select className="h-10 text-xs font-bold bg-slate-50 dark:bg-slate-900 border rounded-lg px-2" id="newMonthShift">
                        {Object.entries(shiftsInput).map(([id, s]: [string, any]) => (
                          <option key={id} value={id}>{s.name || id}</option>
                        ))}
                      </select>
                      <Button size="sm" onClick={() => {
                        const m = (document.getElementById("newMonth") as HTMLInputElement).value;
                        const s = (document.getElementById("newMonthShift") as HTMLSelectElement).value;
                        if(m && s) setEditMonthlyShifts(prev => ({ ...prev, [m]: s }));
                      }} className="h-10 px-3">+</Button>
                    </div>
                  </div>
                </div>

                {user?.role === "superadmin" && (
                  <div className="flex flex-col gap-4 p-4 bg-rose-50 dark:bg-rose-900/20 rounded-[1.5rem] border border-rose-100 dark:border-rose-900/30">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-widest">Banned User</Label>
                        <p className="text-[9px] text-rose-600/70 dark:text-rose-500/70">Wajibkan user untuk tidak bisa absen.</p>
                      </div>
                      <Switch 
                        checked={editIsBanned}
                        onCheckedChange={setEditIsBanned}
                      />
                    </div>
                    
                    <Button 
                      variant="destructive" 
                      onClick={deleteUser}
                      className="bg-rose-600 hover:bg-rose-700 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-600/20"
                    >
                      <Trash2 className="w-3 h-3 mr-2" /> Hapus Akun Permanen
                    </Button>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <Button variant="ghost" className="flex-1 text-slate-400 font-bold uppercase text-xs h-12 rounded-2xl" onClick={() => setSelectedUserForEdit(null)}>Batal</Button>
                  <Button onClick={saveUserChanges} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-black tracking-widest uppercase text-xs h-12 shadow-lg shadow-teal-600/20 rounded-2xl active:scale-95 transition-all">SIMPAN PERUBAHAN</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </WaveBackground>
  );
}
