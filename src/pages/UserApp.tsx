import { performIntegrityCheck } from "../lib/integrity";
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSettings, calculateDistance } from "../settingsObject";
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, getDocs } from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType, requestFCMPermission } from "../lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { format, isSameDay, isWeekend, eachDayOfInterval, subDays, isSaturday, isSunday } from "date-fns";
import { id } from "date-fns/locale";
import { MapPicker } from "../components/MapPicker";
import { isHoliday, setCustomHolidays, getEffectiveShiftId } from "../lib/dateUtils";
import Webcam from "react-webcam";
import { Html5Qrcode } from "html5-qrcode";
import { useTheme } from "next-themes";
import { SHIFTS, WAVE_SVG } from "../constants";
import { verifyFace } from "../lib/faceVerification";
import { uploadBase64Image } from "../lib/storage";
import * as faceapi from "face-api.js";
import { QRCodeCanvas } from "qrcode.react";
import { toPng, toBlob } from "html-to-image";
import { jsPDF } from "jspdf";
import {
  MapPin, LogOut, Code, UserSquare2, Fingerprint, CalendarDays,
  Home, User, Settings as SettingsIcon, Sun, Moon, Briefcase, ArrowLeft,
  Share2, Download, Check, AlertCircle, Activity, ChevronRight, ChevronUp, ChevronDown, Printer, Camera, Key, Phone, Edit, IdCard,
  Wifi, WifiOff, LogIn, AlarmClock, DoorOpen, TrendingUp, TrendingDown, ShieldAlert, Bell, Info, Globe, Clock
} from "lucide-react";
import { WaveBackground } from "../components/WaveBackground";
import { Card, CardContent } from "../components/ui/card";
import { FloatingNav } from "../components/FloatingNav";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Calendar } from "../components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { HrisSettings } from "../components/HrisSettings";
import { HomeView } from './views/HomeView';
import { AbsenView } from './views/AbsenView';
import { HistoryView } from './views/HistoryView';
import { NotificationsView } from './views/NotificationsView';
import { IzinMenuView } from './views/IzinMenuView';
import { useUserLocation } from '../hooks/useUserLocation';
import { useAttendanceData } from '../hooks/useAttendanceData';
import { useQRScanner } from '../hooks/useQRScanner';
import { ProfileView } from './views/ProfileView';
import { UserAppProvider } from './views/UserAppContext';

export default function UserApp() {
  const { user } = useAuth();
  const settings = useSettings();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  if (user?.isBanned) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center p-6">
          <Card className="w-full max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border-0 shadow-2xl rounded-[2.5rem] overflow-hidden p-8 text-center space-y-6">
            <div className="w-24 h-24 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-rose-900 dark:text-rose-50 uppercase tracking-tighter">AKUN DIBLOKIR</h1>
              <p className="text-sm font-medium text-slate-500 dark:text-gray-400">Maaf, akun Anda telah dinonaktifkan oleh admin. Silakan hubungi pengelola untuk informasi lebih lanjut.</p>
            </div>
            <Button 
                variant="outline" 
                onClick={() => auth.signOut()}
                className="w-full h-14 rounded-2xl border-rose-100 dark:border-rose-900 text-rose-600 font-black uppercase tracking-widest hover:bg-rose-50 transition-all shadow-lg shadow-rose-200/20"
            >
              Keluar Sesi
            </Button>
          </Card>
        </div>
      </>
    );
  }

  const resolvedShifts = React.useMemo(() => {
    const rawShifts = settings?.shifts && Object.keys(settings.shifts).length > 0 ? settings.shifts : SHIFTS;
    return rawShifts as any;
  }, [settings]);

  useEffect(() => {
    if (settings?.holidays) {
      setCustomHolidays(settings.holidays);
    }
  }, [settings?.holidays]);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCardExpanded, setIsCardExpanded] = useState(false);
  const [isAbsenMapExpanded, setIsAbsenMapExpanded] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"home" | "absen" | "history" | "profile" | "izin_menu" | "hris" | "notifications">("home");
  const [profileTab, setProfileTab] = useState<"menu" | "edit-profile" | "id-card" | "changelog">("menu");
  const [summaryModalCategory, setSummaryModalCategory] = useState<'hadir' | 'telat' | 'ijin' | 'alpa' | 'lembur' | null>(null);
  const [idCardSide, setIdCardSide] = useState<"front" | "back">("front");
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editFaceBase64, setEditFaceBase64] = useState<string | null>(null);
  const [fcmVapidKey, setFcmVapidKey] = useState("");
  const [showFcmSetup, setShowFcmSetup] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Anda kembali online. Data akan sinkron otomatis.", {
        icon: <Wifi className="w-4 h-4 text-teal-500" />
      });
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Anda sedang offline. Absen tetap disimpan secara lokal.", {
        icon: <WifiOff className="w-4 h-4 text-orange-500" />
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  const [showFaceUpdateCam, setShowFaceUpdateCam] = useState(false);
  const editWebcamRef = useRef<Webcam>(null);
  const [isEditSaving, setIsEditSaving] = useState(false);

  const [autoCaptureActive, setAutoCaptureActive] = useState(false);
  const [confirmData, setConfirmData] = useState<{ method: "selfie" | "qr"; photoBase64: string | null; extraData?: string } | null>(null);
  const [pendingQRData, setPendingQRData] = useState<string | null>(null);
  const [qrUserIdentity, setQrUserIdentity] = useState<{ uid: string, name: string, shiftId: string } | null>(null);
  
  // Home states
  const [type, setType] = useState<"in" | "out" | "overtime_in" | "overtime_out" | "sick" | "permit" | "cuti" | "melahirkan" | "meninggal">("in");
  const isDocumentCapture = ['sick', 'permit', 'cuti', 'melahirkan', 'meninggal'].includes(type);
  const [activeAbsenTab, setActiveAbsenTab] = useState("selfie"); // selfie for document upload too
  const webcamRef = useRef<Webcam>(null);
  const idCardRef = useRef<HTMLDivElement>(null);
  const [permitProof, setPermitProof] = useState<string | null>(null);
  const [permitStartDate, setPermitStartDate] = useState<Date | undefined>(new Date());
  const [permitEndDate, setPermitEndDate] = useState<Date | undefined>(new Date());

  // History states



  


  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) return "Selamat Pagi";
    if (hour >= 12 && hour < 15) return "Selamat Siang";
    if (hour >= 15 && hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  };

  useEffect(() => {
    if (user && profileTab === 'edit-profile') {
      setEditName(user.name || "");
      setEditPhone(user.waNumber || "");
      setEditFaceBase64(null);
      setShowFaceUpdateCam(false);
    }
  }, [user, profileTab]);

  useEffect(() => {
    let timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isDocumentCapture) {
      setActiveAbsenTab("selfie");
    }
  }, [isDocumentCapture]);

  const {
    myHistory, leaveRequests, payroll, announcements, appNotifications, selectedDate, setSelectedDate,
    getStatusForDate, pendingCount, isIzinActive, hasInApproved, hasOutApproved, isTodayHolidayOrWeekend, canEnableOvertime,
    summary, todayStatusText
  } = useAttendanceData(user, settings, resolvedShifts);

  const { location, distance, isWithinRadius, locationError, isFakeGPS, currentAreaName, setIsWithinRadius } = useUserLocation(settings, user);

  useQRScanner(view, activeAbsenTab, type, user, setPendingQRData, setQrUserIdentity, setActiveAbsenTab);


  const compressImage = (base64Str: string, maxWidth = 800, quality = 0.6): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(base64Str); // Fallback
        }
      };
      img.onerror = () => resolve(base64Str); // Fallback on error
    });
  };

  const checkPendingAndStartAttendance = async (method: "selfie" | "qr", extraData?: string) => {
    if (!user) return;

    let finalMethod = method;
    let finalExtraData = extraData;

    // 2-Step QR Verification Logic
    if (method === "selfie" && pendingQRData) {
       finalMethod = "qr";
       finalExtraData = pendingQRData;
    }

    // Check for pending approval for the actual target user if we identified them
    const targetUid = qrUserIdentity?.uid || user.uid;
    
    const todayLogs = myHistory.filter(log => isSameDay(new Date(log.timestamp), new Date()));
    const hasPendingThisType = todayLogs.some(log => log.type === type && log.status === 'pending_approval' && log.userId === targetUid);
    const hasApprovedThisType = todayLogs.some(log => log.type === type && log.status === 'approved' && log.userId === targetUid);
    
    if (hasPendingThisType || hasApprovedThisType) {
      toast.error(`Anda sudah melakukan absensi ${type === 'in' ? 'masuk' : type === 'out' ? 'pulang' : type.replace('_', ' ')} hari ini.`);
      return;
    }
    
    const isDocumentCapture = ['sick', 'permit', 'cuti', 'melahirkan', 'meninggal'].includes(type);

    if (locationError && !isDocumentCapture && settings?.geofenceEnabled) {
      toast.error("Gagal mendapatkan lokasi. Pastikan izin lokasi (GPS) diaktifkan.");
      return;
    }

    if (settings?.geofenceEnabled && !isWithinRadius && !isDocumentCapture) {
      toast.error("Anda berada di luar radius kantor!");
      return;
    }

    if (isFakeGPS) {
      toast.error("Aktivitas mencurigakan terdeteksi, mohon matikan Fake GPS.");
      return;
    }

    setLoading(true);
    let photoBase64 = null;
    try {
      if (method === "selfie") {
        const rawPhoto = webcamRef.current?.getScreenshot();
        if (!rawPhoto) {
          toast.error("Gagal mengambil foto. Pastikan kamera diizinkan dan siap digunakan.");
          setLoading(false);
          return;
        }
        photoBase64 = await compressImage(rawPhoto);
        
        if (!isDocumentCapture) {
          if (user.avatarUrl) {
            try {
               if (!isOnline) {
                 toast.info("Sedang offline, verifikasi wajah dilewati. Absen disimpan secara lokal.");
               } else {
                 toast.info("Memverifikasi wajah...");
                 const result = await verifyFace(photoBase64, user.avatarUrl);
                 if (result === 'NO_MATCH') {
                    toast.error("Verifikasi Wajah Gagal. Wajah tidak cocok dengan profil Anda.");
                    setLoading(false);
                    return;
                 } else if (result === 'UNAVAILABLE') {
                    toast.info("Verifikasi wajah tidak dapat dilakukan saat ini. Melanjutkan absen...");
                 }
               }
            } catch (e) {
               console.error("Verification failed", e);
               toast.error("Gagal verifikasi wajah, melanjutkan dengan absen biasa.");
            }
          } else {
             toast.error("Profil Anda tidak memiliki foto. Tidak dapat memverifikasi wajah.");
             setLoading(false);
             return;
          }
        }
      }

      let extraDataToConfirm = extraData;
      if (isDocumentCapture && type === 'cuti') {
         extraDataToConfirm = `${permitStartDate ? format(permitStartDate, "yyyy-MM-dd") : ""}|${permitEndDate ? format(permitEndDate, "yyyy-MM-dd") : ""}`;
      }

      setConfirmData({ method: finalMethod, photoBase64, extraData: extraDataToConfirm });
    } catch (error) {
       console.error("Error preparing attendance:", error);
       toast.error("Terjadi kesalahan saat memproses absensi.");
    } finally {
       setLoading(false);
    }
  };

  const submitAttendance = async () => {
    if (!user || !confirmData) return;
    
    setLoading(true);
    try {
      const now = new Date();
      let status = "approved"; // default OK
      
      const targetUid = qrUserIdentity?.uid || user.uid;
      const shiftId = qrUserIdentity?.shiftId || user.shiftId || "shift1";
      const shift = resolvedShifts[shiftId] || resolvedShifts.shift1;
      const todayWork = shift?.workDays[now.getDay()];

      // Logic check for telat (late) / early leave based on shift
      if (type === "in" && todayWork) {
        const [startHour, startMin] = todayWork.start.split(':').map(Number);
        const isLate = (now.getHours() > startHour) || (now.getHours() === startHour && now.getMinutes() > startMin);
        if (isLate) {
          status = "pending_approval";
          toast.warning(`Anda terlambat untuk ${shift.name}. Absensi memerlukan approval.`);
        }
      } else if (type === "out" && todayWork) {
        const [endHour, endMin] = todayWork.end.split(':').map(Number);
        const isEarlyLeave = (now.getHours() < endHour) || (now.getHours() === endHour && now.getMinutes() < endMin);
        if (isEarlyLeave) {
          status = "pending_approval";
          toast.warning(`Anda pulang lebih awal dari jadwal ${shift.name}.`);
        }
      } else if (type === "overtime_in" || type === "overtime_out") {
        status = "pending_approval"; // Lembur perlu approval admin
      } else if (['sick', 'permit', 'cuti', 'melahirkan', 'meninggal'].includes(type)) {
        status = "pending_approval"; // Document captures selalu perlu approval admin
      }

      if (confirmData.method === "qr") {
        status = "pending_approval"; // QR code attendance always requires approval
      }

      const attendanceId = `att_${Date.now()}_${targetUid}`;
      
      let finalPhotoData = confirmData.photoBase64 || "";
      if (finalPhotoData.startsWith('data:image')) {
          finalPhotoData = await uploadBase64Image(finalPhotoData, `attendance/${attendanceId}`);
      }
      
      const attendancePayload: any = {
        userId: targetUid,
        timestamp: Date.now(),
        type,
        method: confirmData.method,
        photoBase64: finalPhotoData,
        location: location || { lat: 0, lng: 0 },
        withinRadius: isWithinRadius,
        extraData: confirmData.extraData || "",
        status
      };

      if (targetUid !== user.uid) {
        attendancePayload.deviceOwnerUid = user.uid;
        attendancePayload.deviceOwnerName = user.name;
      }

      await setDoc(doc(db, "attendance", attendanceId), attendancePayload);

      const formatTypeRaw = (t: string) => {
        if (t === 'in') return 'Masuk';
        if (t === 'out') return 'Pulang';
        if (t === 'overtime_in') return 'Lembur Masuk';
        if (t === 'overtime_out') return 'Lembur Pulang';
        if (t === 'sick') return 'Sakit';
        if (t === 'permit') return 'Izin Biasa';
        if (t === 'cuti') return 'Cuti';
        if (t === 'melahirkan') return 'Cuti Melahirkan';
        if (t === 'meninggal') return 'Izin Berduka';
        return 'Lainnya';
      };

      toast.success(`Berhasil Absen ${formatTypeRaw(type)}${status === "pending_approval" ? " (Menunggu Approval Admin)" : ""}${qrUserIdentity ? ` untuk ${qrUserIdentity.name}` : ""}`);
      setConfirmData(null);
      setPendingQRData(null);
      setQrUserIdentity(null);
      if (view === 'absen') setView('home');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `attendance`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadIDCard = async () => {
    if (!idCardRef.current) return;
    toast.loading("Menyiapkan dokumen...");
    try {
      const url = await toPng(idCardRef.current, { 
        cacheBust: true, 
        pixelRatio: 3,
        style: { transform: 'scale(1)', transformOrigin: 'top left', margin: '0' },
        width: 324,
        height: 516
      });
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [54, 86]
      });
      pdf.addImage(url, 'PNG', 0, 0, 54, 86);
      pdf.save(`IDCard_${user?.name?.replace(/\s+/g, '_') || 'Karyawan'}.pdf`);
      toast.dismiss();
      toast.success("Dokumen berhasil diunduh");
    } catch (e) {
      console.error("Failed to download ID Card", e);
      toast.dismiss();
      toast.error("Gagal mengunduh kartu ID");
    }
  };

  const handleShareIDCard = async () => {
    if (!idCardRef.current) return;
    try {
      const blob = await toBlob(idCardRef.current, { 
        cacheBust: true, 
        pixelRatio: 3,
        style: { transform: 'scale(1)', transformOrigin: 'top left', margin: '0' },
        width: 324,
        height: 516
      });
      if (!blob) return;
      const file = new File([blob], `IDCard_${user?.name?.replace(/\s+/g, '_') || 'Karyawan'}.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `ID Card - ${user?.name}`,
          text: "Kartu QR Code Karyawan",
          files: [file]
        });
      } else {
         handleDownloadIDCard(); // fallback
      }
    } catch (e) {
      console.error("Failed to share ID Card", e);
      toast.error("Gagal membagikan kartu ID");
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    if (!editName.trim()) {
      toast.error("Nama tidak boleh kosong");
      return;
    }
    if (user?.role === "demo" || user?.role === "demouser") {
      toast.error("Akun demo tidak diizinkan untuk mengubah data.");
      return;
    }
    
    setIsEditSaving(true);
    try {
      const updateData: any = {
        name: editName,
        waNumber: editPhone
      };
      
      if (editFaceBase64) {
         if (editFaceBase64.startsWith('data:image')) {
            const uploadedUrl = await uploadBase64Image(editFaceBase64, `avatars/${user.uid}`);
            updateData.avatarUrl = uploadedUrl;
            
            // Try to delete old avatar if it's stored in Firebase Storage
            if (user.avatarUrl && typeof user.avatarUrl === 'string' && user.avatarUrl.includes('firebasestorage.googleapis.com')) {
               try {
                  const { deleteFileFromStorage } = await import('../lib/storage');
                  await deleteFileFromStorage(user.avatarUrl);
               } catch (e) {
                  console.error("Failed to delete old avatar", e);
               }
            }
         } else {
            updateData.avatarUrl = editFaceBase64;
         }
      }
      
      await setDoc(doc(db, "users", user.uid), updateData, { merge: true });
      toast.success("Profil berhasil diperbarui");
      setProfileTab("menu");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "users");
    } finally {
      setIsEditSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user || !user.email) {
      toast.error("Email tidak ditemukan");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast.success(`Tautan reset password telah dikirim ke ${user.email}`);
    } catch (error) {
      console.error("Reset password error", error);
      toast.error("Gagal mengirim tautan reset password");
    }
  };

  const captureEditFace = async () => {
    if (editWebcamRef.current) {
      const src = editWebcamRef.current.getScreenshot();
      if (src) {
        const compressedSrc = await compressImage(src);
        setEditFaceBase64(compressedSrc);
        setShowFaceUpdateCam(false);
      } else {
        toast.error("Gagal mengambil foto");
      }
    }
  };

  const contextValue = {
    isCardExpanded, setIsCardExpanded, currentTime, user, resolvedShifts, 
    settings, location, distance, locationError, currentAreaName, myHistory, 
    setType, setView, canEnableOvertime, pendingCount, announcements,
    type, activeAbsenTab, setActiveAbsenTab, setPendingQRData, setQrUserIdentity,
    isDocumentCapture, permitStartDate, setPermitStartDate, permitEndDate, setPermitEndDate,
    isAbsenMapExpanded, setIsAbsenMapExpanded, isWithinRadius, webcamRef, loading, 
    checkPendingAndStartAttendance, summary, summaryModalCategory, setSummaryModalCategory, 
    selectedDate, setSelectedDate, appNotifications, profileTab, setProfileTab, theme, setTheme, 
    idCardSide, setIdCardSide, idCardRef, showFaceUpdateCam, setShowFaceUpdateCam, editWebcamRef, 
    editFaceBase64, captureEditFace, editName, setEditName, editPhone, setEditPhone, 
    handleResetPassword, handleSaveProfile, isEditSaving, handleShareIDCard, handleDownloadIDCard, view,
    confirmData, setConfirmData, submitAttendance
  };

  return (
    <UserAppProvider value={contextValue}>
      <div className="h-screen flex flex-col text-gray-900 dark:text-gray-100 overflow-hidden font-sans relative">
        <div className="flex-1 overflow-y-auto pb-32 sm:pb-36 xl:pb-40 relative">
             {/* Elegant Glassmorphism Header */}
        <div className="sticky top-0 z-40 shrink-0 border-b border-teal-500/10 dark:border-white/5 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl shadow-sm transition-all overflow-hidden rounded-b-[2rem]">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 via-transparent to-transparent dark:from-teal-950/20 pointer-events-none" />
          
          {/* Subtle Dynamic Wave SVG in Header */}
          <svg className="absolute inset-x-0 -top-4 w-full h-[150%] opacity-[0.05] dark:opacity-[0.03] pointer-events-none" viewBox="0 0 1440 320" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path fill="#0d9488" d="M0,256L48,229.3C96,203,192,149,288,154.7C384,160,480,224,576,218.7C672,213,768,139,864,122.7C960,107,1056,149,1152,176C1248,203,1344,213,1392,218.7L1440,224L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
          </svg>
          <svg className="absolute inset-x-0 -top-8 w-full h-[160%] opacity-[0.04] dark:opacity-[0.02] pointer-events-none" viewBox="0 0 1440 320" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path fill="#0d9488" d="M0,128L48,133.3C96,139,192,149,288,144C384,139,480,117,576,144C672,171,768,245,864,256C960,267,1056,213,1152,186.7C1248,160,1344,160,1392,160L1440,160L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
          </svg>
          
          <div className="relative z-10 flex justify-between items-center max-w-5xl mx-auto px-6 pb-4 pt-[50px] md:px-8">
             <div className="flex items-center gap-4">
                 <div className="relative group">
                   <div className="absolute inset-0 bg-teal-500 rounded-full blur-md opacity-30 group-hover:opacity-50 transition-opacity"></div>
                   {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="avatar" className="relative w-[60px] h-[60px] rounded-full ring-2 ring-white/80 dark:ring-white/10 object-cover shadow-sm bg-teal-100 dark:bg-zinc-800" />
                   ) : (
                      <div className="relative w-[60px] h-[60px] rounded-full bg-gradient-to-br from-teal-400 to-teal-600 dark:from-teal-600 dark:to-teal-800 ring-2 ring-white/80 dark:ring-white/10 flex items-center justify-center font-bold shadow-sm text-white text-xl">
                        {user?.name?.[0]}
                      </div>
                   )}
                 </div>
                 <div>
                    <div className="flex items-center gap-2 mb-0.5">
                       <p className="text-teal-600/90 dark:text-teal-400/90 text-xs uppercase tracking-widest font-bold">{getGreeting()}</p>
                       {!isOnline && (
                         <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 text-[9px] uppercase font-black text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20 backdrop-blur-md animate-pulse">
                           <WifiOff className="w-2.5 h-2.5" /> Offline
                         </div>
                       )}
                    </div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white drop-shadow-sm">{user?.name}</h1>
                 </div>
             </div>
             <button 
                onClick={() => setView('notifications')}
                className="relative p-2.5 rounded-xl bg-white/50 dark:bg-zinc-800/50 hover:bg-white/80 dark:hover:bg-zinc-700/50 ring-1 ring-zinc-900/5 dark:ring-white/10 shadow-sm transition-all active:scale-95"
             >
                <Bell className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
                {appNotifications.filter(n => !n.read).length > 0 && (
                   <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 ring-2 ring-white dark:ring-zinc-900 text-[10px] font-black text-white px-1">
                      {appNotifications.filter(n => !n.read).length > 9 ? '9+' : appNotifications.filter(n => !n.read).length}
                   </span>
                )}
             </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="relative z-30 px-4 pt-2 space-y-6 w-full mx-auto">
                      {view === "home" && <HomeView />}
           {view === "izin_menu" && <IzinMenuView />}
           {view === "absen" && <AbsenView />}
           {view === "history" && <HistoryView />}
           {view === "notifications" && <NotificationsView />}
           {view === "profile" && <ProfileView />}
        </div>
      </div>

      {confirmData && (
        <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
           <Card className="w-full max-w-sm bg-white dark:bg-gray-800 shadow-2xl rounded-3xl overflow-hidden border-0 animate-in slide-in-from-bottom-8 zoom-in-95 duration-300">
              <div className="p-6 text-center">
                 <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/40 rounded-full flex items-center justify-center mx-auto mb-4 text-teal-600 dark:text-teal-400">
                    <UserSquare2 className="w-8 h-8" />
                 </div>
                 <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Konfirmasi Absen</h3>
                 <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">Apakah Anda yakin ingin mengirim absen {type === 'in' ? 'Masuk' : type === 'out' ? 'Pulang' : type.replace('_', ' ')} ini ke server?</p>
                 
                 {confirmData.photoBase64 && (
                   <div className="mb-6 rounded-xl overflow-hidden border-2 border-gray-100 dark:border-gray-700 shadow-inner">
                      <img src={confirmData.photoBase64} alt="Captured Selfie" className="w-full h-auto" />
                   </div>
                 )}

                 <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1 rounded-xl h-12 text-sm font-bold bg-white dark:bg-gray-800"
                      onClick={() => setConfirmData(null)}
                      disabled={loading}
                    >
                      Batal
                    </Button>
                    <Button 
                      className="flex-1 rounded-xl h-12 text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white border-0 shadow-lg shadow-teal-500/30"
                      onClick={submitAttendance}
                      disabled={loading}
                    >
                      {loading ? 'Mengirim...' : 'Kirim Absen'}
                    </Button>
                 </div>
              </div>
           </Card>
        </div>
      )}

       {view === "hris" && (
         <div className="absolute inset-0 z-50 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm overflow-y-auto pb-24">
            <div className="sticky top-0 z-50 overflow-hidden flex items-center gap-3 px-4 py-3 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border-b border-teal-500/10 dark:border-white/5 shadow-sm mb-4 rounded-b-[2rem]">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 via-transparent to-transparent dark:from-teal-950/20 pointer-events-none" />
                <svg className="absolute inset-x-0 -top-4 w-full h-[150%] opacity-[0.05] dark:opacity-[0.03] pointer-events-none" viewBox="0 0 1440 320" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#0d9488" d="M0,256L48,229.3C96,203,192,149,288,154.7C384,160,480,224,576,218.7C672,213,768,139,864,122.7C960,107,1056,149,1152,176C1248,203,1344,213,1392,218.7L1440,224L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
                </svg>
                <button onClick={() => setView('home')} className="relative z-10 p-2 -ml-2 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-zinc-300 transition-colors">
                   <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="relative z-10 text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight">HRIS & Pengaturan</h2>
            </div>
            <div className="p-4 max-w-5xl mx-auto">
                <HrisSettings />
            </div>
         </div>
       )}

      <FloatingNav view={view} setView={setView} setProfileTab={setProfileTab} />
      
      {/* Background Decor */}
    </div>
    </UserAppProvider>
  );
}
