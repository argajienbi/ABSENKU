
import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSettings } from "../settingsObject";
import { auth, db, handleFirestoreError, OperationType } from "../lib/firebase";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useTheme } from "next-themes";
import { SHIFTS } from "../constants";
import { doc, setDoc } from "firebase/firestore";
import { Bell, Wifi, WifiOff, ShieldAlert, ArrowLeft, Loader2 } from "lucide-react";
import { Card } from "../components/ui/card";
import { FloatingNav } from "../components/FloatingNav";
import { Button } from "../components/ui/button";
import { HrisSettings } from "../components/HrisSettings";
import { useUserLocation } from '../hooks/useUserLocation';
import { useAttendanceData } from '../hooks/useAttendanceData';
import { useQRScanner } from '../hooks/useQRScanner';
import { UserAppProvider } from './views/UserAppContext';
import { uploadBase64Image } from "../lib/storage";
import { setCustomHolidays } from "../lib/dateUtils";

// New Hooks & Components
import { useUserAppLogic } from "../hooks/useUserAppLogic";
import { ConfirmAbsenDialog } from "./views/ConfirmAbsenDialog";

// Lazy Loaded Views
const HomeView = lazy(() => import('./views/HomeView').then(m => ({ default: m.HomeView })));
const AbsenView = lazy(() => import('./views/AbsenView').then(m => ({ default: m.AbsenView })));
const HistoryView = lazy(() => import('./views/HistoryView').then(m => ({ default: m.HistoryView })));
const IzinMenuView = lazy(() => import('./views/IzinMenuView').then(m => ({ default: m.IzinMenuView })));
const ProfileView = lazy(() => import('./views/ProfileView').then(m => ({ default: m.ProfileView })));

const ViewLoading = () => (
  <div className="flex flex-col items-center justify-center p-20 animate-in fade-in duration-500">
    <Loader2 className="w-8 h-8 text-teal-600 animate-spin mb-4" />
    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Memuat...</p>
  </div>
);

export default function UserApp() {
  const { user } = useAuth();
  const settings = useSettings();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [view, setView] = useState<"home" | "absen" | "history" | "profile" | "izin_menu" | "hris">("home");
  const [profileTab, setProfileTab] = useState<"menu" | "edit-profile" | "id-card">("menu");
  const [type, setType] = useState<"in" | "out" | "overtime_in" | "overtime_out" | "sick" | "permit" | "cuti" | "melahirkan" | "meninggal">("in");
  const [activeAbsenTab, setActiveAbsenTab] = useState("selfie");
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingQRData, setPendingQRData] = useState<string | null>(null);
  const [qrUserIdentity, setQrUserIdentity] = useState<{ uid: string, name: string, shiftId: string } | null>(null);
  const [permitStartDate, setPermitStartDate] = useState<Date | undefined>(new Date());
  const [permitEndDate, setPermitEndDate] = useState<Date | undefined>(new Date());
  const [idCardSide, setIdCardSide] = useState<"front" | "back">("front");
  const [summaryModalCategory, setSummaryModalCategory] = useState<'hadir' | 'telat' | 'ijin' | 'alpa' | 'lembur' | 'lupa' | null>(null);
  const [isCardExpanded, setIsCardExpanded] = useState(false);
  const [isAbsenMapExpanded, setIsAbsenMapExpanded] = useState(false);
  const [showFaceUpdateCam, setShowFaceUpdateCam] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editFaceBase64, setEditFaceBase64] = useState<string | null>(null);
  const [isEditSaving, setIsEditSaving] = useState(false);
  const editWebcamRef = useRef<any>(null);
  const idCardRef = useRef<HTMLDivElement>(null);

  const resolvedShifts = React.useMemo(() => settings?.shifts && Object.keys(settings.shifts).length > 0 ? settings.shifts : SHIFTS, [settings]);

  useEffect(() => {
    if (settings?.holidays) setCustomHolidays(settings.holidays);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [settings?.holidays]);

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); toast.success("Anda kembali online."); };
    const handleOffline = () => { setIsOnline(false); toast.warning("Anda sedang offline."); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  const { myHistory, announcements, appNotifications, selectedDate, setSelectedDate, pendingCount, canEnableOvertime, summary } = useAttendanceData(user, settings, resolvedShifts);
  const { location, distance, targetRadius, isWithinRadius, locationError, isFakeGPS, currentAreaName } = useUserLocation(settings, user);
  useQRScanner(view, activeAbsenTab, type, user, setPendingQRData, setQrUserIdentity, setActiveAbsenTab);

  const { loading, confirmData, setConfirmData, webcamRef, checkPendingAndStartAttendance, submitAttendance, handleResetPassword } = useUserAppLogic(user, settings, myHistory, location, isWithinRadius, locationError, isFakeGPS, qrUserIdentity, type, resolvedShifts);

  const handleSaveProfile = async () => {
    if (!user || user?.role === "demo") return toast.error("Tidak diizinkan.");
    setIsEditSaving(true);
    try {
      const updateData: any = { name: editName, waNumber: editPhone };
      if (editFaceBase64?.startsWith('data:image')) {
        updateData.avatarUrl = await uploadBase64Image(editFaceBase64, `avatars/${user.uid}`);
      }
      await setDoc(doc(db, "users", user.uid), updateData, { merge: true });
      toast.success("Profil diperbarui");
      setProfileTab("menu");
    } catch (error) { handleFirestoreError(error, OperationType.UPDATE, "users"); }
    finally { setIsEditSaving(false); }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) return "Selamat Pagi";
    if (hour >= 12 && hour < 15) return "Selamat Siang";
    if (hour >= 15 && hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  };

  if (user?.isBanned) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-8 text-center space-y-6 rounded-[2.5rem]">
          <ShieldAlert className="w-12 h-12 mx-auto text-rose-600" />
          <h1 className="text-2xl font-black">AKUN DIBLOKIR</h1>
          <p>Silakan hubungi pengelola.</p>
          <Button onClick={() => auth.signOut()} className="w-full rounded-2xl h-14">Keluar Sesi</Button>
        </Card>
      </div>
    );
  }

  const contextValue = React.useMemo(() => ({
    isCardExpanded, setIsCardExpanded, currentTime, user, resolvedShifts, 
    settings, location, distance, targetRadius, locationError, currentAreaName, myHistory, 
    setType, setView, canEnableOvertime, pendingCount, announcements,
    type, activeAbsenTab, setActiveAbsenTab, setPendingQRData, setQrUserIdentity,
    isDocumentCapture: ['sick', 'permit', 'cuti', 'melahirkan', 'meninggal'].includes(type),
    permitStartDate, setPermitStartDate, permitEndDate, setPermitEndDate,
    isAbsenMapExpanded, setIsAbsenMapExpanded, isWithinRadius, webcamRef, loading, 
    checkPendingAndStartAttendance: (method: any, extraData: any) => checkPendingAndStartAttendance(method, pendingQRData, extraData),
    summary, summaryModalCategory, setSummaryModalCategory, 
    selectedDate, setSelectedDate, appNotifications, profileTab, setProfileTab, theme, setTheme, 
    idCardSide, setIdCardSide, idCardRef, showFaceUpdateCam, setShowFaceUpdateCam, editWebcamRef, 
    editFaceBase64, captureEditFace: () => { const src = editWebcamRef.current?.getScreenshot(); if(src) setEditFaceBase64(src); setShowFaceUpdateCam(false); },
    editName, setEditName, editPhone, setEditPhone, 
    handleResetPassword, handleSaveProfile, isEditSaving, view, confirmData, setConfirmData, 
    submitAttendance: (notes: string = "") => submitAttendance(permitStartDate, permitEndDate, notes).then(s => s && view === 'absen' && setView('home'))
  }), [
    isCardExpanded, currentTime, user, resolvedShifts, settings, location, distance, targetRadius, 
    locationError, currentAreaName, myHistory, canEnableOvertime, pendingCount, 
    announcements, type, activeAbsenTab, pendingQRData, qrUserIdentity, 
    permitStartDate, permitEndDate, isAbsenMapExpanded, isWithinRadius, loading, 
    summary, summaryModalCategory, selectedDate, appNotifications, profileTab, 
    theme, setTheme, idCardSide, showFaceUpdateCam, editFaceBase64, editName, 
    editPhone, isEditSaving, view, confirmData
  ]);

  return (
    <UserAppProvider value={contextValue}>
      <div className="h-screen flex flex-col text-gray-900 dark:text-gray-100 overflow-hidden font-sans relative">
        <div className="flex-1 overflow-y-auto pb-32 sm:pb-36 relative">
          <div className="sticky top-0 z-40 shrink-0 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl rounded-b-[2rem] border-b">
            <div className="relative z-10 flex justify-between items-center max-w-5xl mx-auto px-6 pb-4 pt-[50px]">
               <div className="flex items-center gap-4">
                  {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="avatar" className="w-[60px] h-[60px] rounded-full object-cover shadow-sm bg-teal-100" />
                  ) : (
                      <div className="w-[60px] h-[60px] rounded-full bg-teal-500 flex items-center justify-center font-bold text-white text-xl">{user?.name?.[0]}</div>
                  )}
                  <div>
                      <p className="text-teal-600 dark:text-teal-400 text-xs uppercase font-bold">{getGreeting()} {!isOnline && <span className="text-amber-500 underline ml-2">Offline</span>}</p>
                      <h1 className="text-2xl font-extrabold tracking-tight">{user?.name}</h1>
                  </div>
               </div>
            </div>
          </div>

          <div className="relative z-30 px-4 pt-2 space-y-6 w-full mx-auto">
             <Suspense fallback={<ViewLoading />}>
               {view === "home" && <HomeView />}
               {view === "izin_menu" && <IzinMenuView />}
               {view === "absen" && <AbsenView />}
               {view === "history" && <HistoryView />}
               {view === "profile" && <ProfileView />}
             </Suspense>
          </div>
        </div>

        <ConfirmAbsenDialog 
          confirmData={confirmData} setConfirmData={setConfirmData} 
          type={type} submitAttendance={contextValue.submitAttendance} loading={loading} 
        />

        {view === "hris" && (
           <div className="absolute inset-0 z-50 bg-gray-50 dark:bg-gray-900 overflow-y-auto pb-24">
              <div className="sticky top-0 z-50 flex items-center gap-3 px-4 py-3 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border-b mb-4">
                  <button onClick={() => setView('home')} className="p-2 rounded-xl"><ArrowLeft className="w-5 h-5" /></button>
                  <h2 className="text-xl font-extrabold tracking-tight">HRIS & Pengaturan</h2>
              </div>
              <div className="p-4 max-w-5xl mx-auto"><HrisSettings /></div>
           </div>
        )}
        <FloatingNav view={view} setView={setView} setProfileTab={setProfileTab} />
      </div>
    </UserAppProvider>
  );
}
