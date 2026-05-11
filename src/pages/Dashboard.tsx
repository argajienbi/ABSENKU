import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, setDoc, deleteDoc, getDocs, writeBatch, where } from "firebase/firestore";
import { ref, set } from "firebase/database";
import { db, rtdb, auth, handleFirestoreError, OperationType } from "../lib/firebase";
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
import { id } from "date-fns/locale";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MapPin, Settings, Users, Activity, CheckCircle2, LogOut, Briefcase, CalendarDays, Printer, UserPlus, Trash2, ShieldAlert, Ban, AlertCircle, Download, ChevronDown, ClipboardList, BookOpen } from "lucide-react";

import { QRCodeCanvas } from 'qrcode.react';
import { SHIFTS } from "../constants";
import { PerformanceAnalytics } from "../components/Analytics";
import { RekapAbsensi } from "../components/RekapAbsensi";
import { MapPicker } from "../components/MapPicker";
import { BankingStyleDashboardCards } from "../components/BankingStyleDashboardCards";
import { OverviewTab } from "./dashboard/OverviewTab";
import { UsersTab } from "./dashboard/UsersTab";
import { AnnouncementsTab } from "./dashboard/AnnouncementsTab";
import { SettingsLocationTab } from "./dashboard/SettingsLocationTab";
import { SettingsShiftTab } from "./dashboard/SettingsShiftTab";
import { SettingsSystemTab } from "./dashboard/SettingsSystemTab";
import { LogsTab } from "./dashboard/LogsTab";
import { GuideTab } from "./dashboard/GuideTab";
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
  const filteredUsersList = (user?.role === 'superadmin' || user?.role === 'demo')
    ? usersList 
    : usersList.filter(u => {
        let match = true;
        if (user?.companyId && user?.companyId !== 'global') {
          match = match && u.companyId === user.companyId;
        }
        if (user?.areaId && user?.areaId !== 'global') {
          match = match && u.areaId === user.areaId;
        }
        if (user?.branchId && user?.branchId !== 'global') {
          match = match && u.branchId === user.branchId;
        }
        return match;
      });
  
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
  
  const [newAreaLatInput, setNewAreaLatInput] = useState("-6.2088");
  const [newAreaLngInput, setNewAreaLngInput] = useState("106.8456");
  const [newArea, setNewArea] = useState({ name: "", radius: 100 });
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  
  const [newCompany, setNewCompany] = useState({ name: "" });
  const [newBranch, setNewBranch] = useState({ name: "", areaId: "" });

  const [newHoliday, setNewHoliday] = useState("");
  const [idRefsList, setIdRefsList] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);

  useEffect(() => {
    if (user?.role === "superadmin" || user?.role === "admin" || user?.role === "demo") {
      const q = query(collection(db, "idRefs"), orderBy("createdAt", "desc"));
      const unsub = onSnapshot(q, (snapshot) => {
        setIdRefsList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => console.error("idRefs snapshot error:", error));

      const q2 = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
      const unsub2 = onSnapshot(q2, (snapshot) => {
        setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => console.error("announcements snapshot error:", error));

      const q3 = query(collection(db, "notifications"), where("userId", "in", ["all", "admin_only"]), orderBy("createdAt", "desc"));
      const unsub3 = onSnapshot(q3, (snapshot) => {
        const logs = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) })) as any[];
        setSecurityLogs(logs.filter(l => l.userId === "admin_only" || l.type === "danger"));
      }, (error) => console.error("notifications snapshot error:", error));

      return () => {
         unsub();
         unsub2();
         unsub3();
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
    }
  }, [settings]);

  const initialLoadRef = useRef(false);

  useEffect(() => {
    if (!user || !['superadmin', 'admin', 'demo'].includes(user.role)) return;

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
  }, [user]);

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
  const [editCompany, setEditCompany] = useState("");
  const [editBranch, setEditBranch] = useState("");
  const [editSubArea, setEditSubArea] = useState("");
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
    setEditCompany(user.companyId || "global");
    setEditBranch(user.branchId || "global");
    setEditSubArea(user.subareaId || "global");
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

       // Also spread to RTDB so sketchware users get notified
       if (filteredUsersList) {
          const promises = filteredUsersList.map((u: any) => 
            set(ref(rtdb, `notifications/users/${u.id}/broadcast`), {
              title: `Pengumuman: ${announcementTitle}`,
              message: announcementContent.length > 50 ? announcementContent.substring(0, 50) + "..." : announcementContent,
              read: false,
              createdAt: Date.now()
            })
          );
          await Promise.all(promises);
       }

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
        companyId: editCompany === "global" ? null : editCompany,
        branchId: editBranch === "global" ? null : editBranch,
        subareaId: editSubArea === "global" ? null : editSubArea,
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
    <div className="flex bg-slate-50 dark:bg-gray-950 min-h-screen font-sans pt-[50px]">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-slate-200 dark:border-gray-800 sticky top-[50px] h-[calc(100vh-50px)] z-50 shrink-0 shadow-sm">
        <div className="p-6 border-b border-slate-200 dark:border-gray-800 flex items-center gap-3">
           <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-inner">
             {settings?.appLogoUrl ? (
                <img src={settings.appLogoUrl} alt="Logo" className="w-6 h-6 object-contain brightness-0 invert" />
              ) : (
                <Activity className="w-6 h-6 text-white" />
              )}
           </div>
           <div className="overflow-hidden">
              <h1 className="text-lg font-black tracking-tight text-teal-900 dark:text-white leading-none truncate">{settings?.appName || "ABSENKU"}</h1>
              <p className="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-widest mt-1">Admin Panel</p>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-6 space-y-1 no-scrollbar">
          {[
            { value: "overview", label: "Overview", icon: Activity },
            { value: "users", label: "User Management", icon: Users },
            { value: "live-map", label: "Peta & Lokasi", icon: MapPin },
            { value: "rekap", label: "Rekap Kehadiran", icon: ClipboardList },
            { value: "announcements", label: "Portal Informasi", icon: Briefcase },
            { value: "analytics", label: "Performance", icon: Activity },
            { value: "guide", label: "Buku Petunjuk", icon: BookOpen },
            ...(user?.role === 'superadmin' ? [
                { value: "settings-shift", label: "Pengaturan Shift", icon: Briefcase },
                { value: "settings-system", label: "Sistem & Branding", icon: Settings },
                { value: "logs", label: "Log Keamanan", icon: ShieldAlert }
            ] : []),
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.value;
            return (
              <button
                key={item.value}
                onClick={() => setActiveTab(item.value)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-bold' : 'text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800 font-medium'}`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-gray-500'}`} />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </div>
        
        <div className="p-4 border-t border-slate-200 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-900/50">
           <div className="mb-4 px-2 overflow-hidden">
             <p className="font-bold text-sm truncate text-slate-800 dark:text-gray-200">{user?.name}</p>
             <p className="text-xs text-teal-600 dark:text-teal-400 uppercase font-black tracking-widest">{user?.role}</p>
           </div>
           <div className="flex gap-2">
             <Button variant="outline" className="flex-1 rounded-xl font-bold bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700 hover:bg-teal-50 hover:text-teal-700" onClick={() => navigate('/app')}>App Absen</Button>
             <Button variant="outline" className="px-3 rounded-xl bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200" onClick={() => auth.signOut()} title="Logout"><LogOut className="w-4 h-4" /></Button>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full h-[calc(100vh-50px)] overflow-hidden">
        
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2 overflow-hidden w-[70%]">
               <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center shrink-0">
                 {settings?.appLogoUrl ? (
                    <img src={settings.appLogoUrl} alt="Logo" className="w-5 h-5 object-contain brightness-0 invert" />
                  ) : (
                    <Activity className="w-5 h-5 text-white" />
                  )}
               </div>
               <span className="font-black text-slate-800 dark:text-white uppercase tracking-tight truncate">{settings?.appName || "ABSENKU"} Admin</span>
            </div>
            <div className="flex gap-2 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => navigate('/app')} className="h-8 w-8 p-0 rounded-full bg-slate-100 dark:bg-gray-800"><Briefcase className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => auth.signOut()} className="h-8 w-8 p-0 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-900/30"><LogOut className="w-4 h-4" /></Button>
            </div>
        </div>

        {/* Mobile Nav Tabs (Horizontal Scroll) */}
        <div className="md:hidden bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-gray-800 px-2 py-2 sticky top-[57px] z-40 shadow-sm overflow-x-auto no-scrollbar">
           <div className="flex gap-2 w-max px-2">
             {[
                { value: "overview", label: "Overview", icon: Activity },
                { value: "users", label: "User", icon: Users },
                { value: "live-map", label: "Lokasi", icon: MapPin },
                { value: "rekap", label: "Rekap", icon: ClipboardList },
                { value: "announcements", label: "Portal", icon: Briefcase },
                { value: "analytics", label: "Analytics", icon: Activity },
                { value: "guide", label: "Informasi", icon: BookOpen },
                ...(user?.role === 'superadmin' ? [
                    { value: "settings-shift", label: "Shift", icon: Briefcase },
                    { value: "settings-system", label: "Sistem", icon: Settings },
                    { value: "logs", label: "Log", icon: ShieldAlert }
                ] : []),
              ].map(item => {
                 const isActive = activeTab === item.value;
                 return (
                    <button
                      key={item.value}
                      onClick={() => setActiveTab(item.value)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all ${isActive ? 'bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 font-bold shadow-sm border border-teal-200 dark:border-teal-800' : 'bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-400 border border-slate-200 dark:border-gray-700'}`}
                    >
                      <item.icon className="w-3.5 h-3.5" />
                      {item.label}
                    </button>
                 );
              })}
           </div>
        </div>

        {/* Scrollable Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full relative">
           <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 w-full max-w-6xl mx-auto pb-12">
          <TabsList className="hidden">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">User</TabsTrigger>
            <TabsTrigger value="announcements">Portal</TabsTrigger>
            <TabsTrigger value="analytics">Performance</TabsTrigger>
            <TabsTrigger value="live-map">Peta & Lokasi</TabsTrigger>
            <TabsTrigger value="rekap">Rekap</TabsTrigger>
            <TabsTrigger value="settings-shift">Pengaturan Shift</TabsTrigger>
            <TabsTrigger value="settings-system">Sistem</TabsTrigger>
            <TabsTrigger value="guide">Guide</TabsTrigger>
          </TabsList>

          
          <TabsContent value="overview">
              <OverviewTab 
                  user={user} 
                  filteredAttendances={filteredAttendances} 
                  filteredUsersList={filteredUsersList} 
                  setConfirmDeleteGlobal={setConfirmDeleteGlobal} 
              />
          </TabsContent>
          
          <TabsContent value="users">
              <UsersTab 
                  user={user} 
                  filteredUsersList={filteredUsersList} 
                  setDeleteUserTarget={setDeleteUserTarget}
                  setSelectedUserForEdit={setSelectedUserForEdit}
                  setSelectedUserForCard={setSelectedUserForCard}
                  setKoreksiUser={setKoreksiUser}
                  setShowKoreksiModal={setShowKoreksiModal}
                  setOvertimeUser={setOvertimeUser}
                  setShowOvertimeModal={setShowOvertimeModal}
                  setEditName={setEditName}
                  setEditRole={setEditRole}
                  setEditShift={setEditShift}
                  setEditUniqueId={setEditUniqueId}
                  setEditArea={setEditArea}
                  setEditIsBanned={setEditIsBanned}
                  setEditWorkStartDate={setEditWorkStartDate}
                  setEditWorkEndDate={setEditWorkEndDate}
                  setEditMonthlyShifts={setEditMonthlyShifts}
                  setEditWeeklyShiftPattern={setEditWeeklyShiftPattern}
                  setEditShiftMode={setEditShiftMode}
                  settings={settings}
                  shiftsInput={shiftsInput}
                  areasInput={settings?.areas}
                  handleEditUser={handleEditUser}
                  handleKoreksiAlpa={handleKoreksiAlpa}
                  handleAddManualOvertime={handleAddManualOvertime}
              />
          </TabsContent>
          <TabsContent value="announcements" className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
             <AnnouncementsTab
                  announcementTitle={announcementTitle}
                  setAnnouncementTitle={setAnnouncementTitle}
                  announcementContent={announcementContent}
                  setAnnouncementContent={setAnnouncementContent}
                  announcementType={announcementType}
                  setAnnouncementType={setAnnouncementType}
                  announcements={announcements}
                  publishAnnouncement={publishAnnouncement}
                  deleteAnnouncement={deleteAnnouncement}
                  loadingConfig={loadingConfig}
             />
          </TabsContent>
          
          <TabsContent value="analytics" className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
             <PerformanceAnalytics attendances={filteredAttendances} usersList={filteredUsersList} />
          </TabsContent>

          <TabsContent value="live-map" className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out space-y-6">
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border-0 shadow-xl overflow-hidden min-h-[500px] flex flex-col">
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
                <CardContent className="p-0 flex-1 relative min-h-[500px] h-[60vh]">
                     {!settings?.googleMapsApiKey ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-slate-50 dark:bg-gray-900 border-2 border-indigo-50 dark:border-indigo-900/50">
                          <AlertCircle className="w-12 h-12 text-slate-400 mb-3" />
                          <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300">API Key Belum Diatur</h3>
                          <p className="text-sm text-slate-500 max-w-md mt-2">Silahkan lengkapi Google Maps API Key di menu Pengaturan untuk menggunakan fitur Peta Pantauan Langsung.</p>
                        </div>
                     ) : (
                       <LiveMap 
                         attendances={attendances} 
                         users={usersList} 
                         apiKey={settings.googleMapsApiKey}
                         center={{ 
                           lat: (settings?.subareas && Object.values(settings.subareas).length > 0 && (Object.values(settings.subareas)[0] as any).lat !== undefined) ? (Object.values(settings.subareas)[0] as any).lat! : -6.2088, 
                           lng: (settings?.subareas && Object.values(settings.subareas).length > 0 && (Object.values(settings.subareas)[0] as any).lng !== undefined) ? (Object.values(settings.subareas)[0] as any).lng! : 106.8456 
                         }}
                       />
                     )}
                </CardContent>
              </Card>

              {user?.role === 'superadmin' && (
                  <SettingsLocationTab 
                      settings={settings} loadingConfig={loadingConfig}
                      areas={settings?.areas} companies={settings?.companies} branches={settings?.branches} subareas={settings?.subareas}
                      toggleGeofence={toggleGeofence}
                      user={user}
                  />
              )}
          </TabsContent>

          <TabsContent value="rekap" className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
             <RekapAbsensi usersList={filteredUsersList} settings={settings} />
          </TabsContent>

          <TabsContent value="settings-shift">
              <SettingsShiftTab
                  loadingConfig={loadingConfig} shiftsInput={shiftsInput}
                  setShiftsInput={setShiftsInput} holidaysInput={holidaysInput}
                  setHolidaysInput={setHolidaysInput} newHoliday={newHoliday}
                  setNewHoliday={setNewHoliday} saveSettings={saveSettings}
              />
          </TabsContent>

          <TabsContent value="settings-system">
              <SettingsSystemTab
                  loadingConfig={loadingConfig} appNameInput={appNameInput}
                  setAppNameInput={setAppNameInput} appLogoUrlInput={appLogoUrlInput}
                  setAppLogoUrlInput={setAppLogoUrlInput} fcmVapidKeyInput={fcmVapidKeyInput}
                  setFcmVapidKeyInput={setFcmVapidKeyInput} googleMapsApiKeyInput={googleMapsApiKeyInput}
                  setGoogleMapsApiKeyInput={setGoogleMapsApiKeyInput}
                  saveSettings={saveSettings} user={user} idRefsList={idRefsList}
              />
          </TabsContent>
            
            {user?.role === 'superadmin' && (
              <TabsContent value="logs">
                  <LogsTab securityLogs={securityLogs} />
              </TabsContent>
            )}

          <TabsContent value="guide" className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
            <GuideTab />
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
                    <option value="admin_pt">ADMIN PT / PERUSAHAAN</option>
                    <option value="admin_area">ADMIN AREA / REGIONAL</option>
                    <option value="admin_cabang">ADMIN CABANG</option>
                    <option value="admin">ADMIN (LEAD)</option>
                    <option value="staff">STAFF</option>
                    <option value="crew">CREW</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-teal-700 dark:text-teal-300 uppercase tracking-[0.2em] ml-1">PT / Perusahaan</Label>
                  <select 
                    value={editCompany}
                    onChange={(e) => setEditCompany(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-teal-100 dark:border-teal-900 h-12 rounded-2xl font-bold text-teal-900 dark:text-teal-50 px-4 focus:ring-2 focus:ring-teal-500/20 transition-all outline-none"
                  >
                    <option value="global">Semua / Global</option>
                    {Object.entries(settings?.companies || {}).map(([id, c]: [string, any]) => (
                      <option key={id} value={id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-teal-700 dark:text-teal-300 uppercase tracking-[0.2em] ml-1">Area / Regional</Label>
                  <select 
                    value={editArea}
                    onChange={(e) => setEditArea(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-teal-100 dark:border-teal-900 h-12 rounded-2xl font-bold text-teal-900 dark:text-teal-50 px-4 focus:ring-2 focus:ring-teal-500/20 transition-all outline-none"
                  >
                    <option value="global">Semua / Global</option>
                    {Object.entries(settings?.areas || {}).map(([id, a]: [string, any]) => (
                      <option key={id} value={id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-teal-700 dark:text-teal-300 uppercase tracking-[0.2em] ml-1">Cabang / Area</Label>
                  <select 
                    value={editBranch}
                    onChange={(e) => setEditBranch(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-teal-100 dark:border-teal-900 h-12 rounded-2xl font-bold text-teal-900 dark:text-teal-50 px-4 focus:ring-2 focus:ring-teal-500/20 transition-all outline-none"
                  >
                    <option value="global">Semua / Global</option>
                    {Object.entries(settings?.branches || {}).map(([id, b]: [string, any]) => (
                      <option key={id} value={id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-teal-700 dark:text-teal-300 uppercase tracking-[0.2em] ml-1">Sub Area (Koordinat)</Label>
                  <select 
                    value={editSubArea}
                    onChange={(e) => setEditSubArea(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-teal-100 dark:border-teal-900 h-12 rounded-2xl font-bold text-teal-900 dark:text-teal-50 px-4 focus:ring-2 focus:ring-teal-500/20 transition-all outline-none"
                  >
                    <option value="global">Semua / Global</option>
                    {Object.entries(settings?.subareas || {}).map(([id, sa]: [string, any]) => (
                      <option key={id} value={id}>{sa.name}</option>
                    ))}
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
                  <Label className="text-[10px] font-black text-teal-700 dark:text-teal-300 uppercase tracking-[0.2em] ml-1">NO NIP</Label>
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
        </main>
      </div>
    </div>
  );
}
