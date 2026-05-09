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
  Wifi, WifiOff, LogIn, AlarmClock, DoorOpen, TrendingUp, TrendingDown, ShieldAlert, Bell, Info, Globe
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
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isWithinRadius, setIsWithinRadius] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [isFakeGPS, setIsFakeGPS] = useState(false);
  const [isCardExpanded, setIsCardExpanded] = useState(false);
  const [isAbsenMapExpanded, setIsAbsenMapExpanded] = useState(false);
  const lastPosRef = useRef<{lat: number, lng: number, time: number} | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"home" | "absen" | "history" | "profile" | "izin_menu" | "hris" | "notifications">("home");
  const [currentAreaName, setCurrentAreaName] = useState<string | null>(null);
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
  const [myHistory, setMyHistory] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [payroll, setPayroll] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [appNotifications, setAppNotifications] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const getStatusForDate = React.useCallback((date: Date) => {
    const isToday = isSameDay(date, new Date());
    const isFuture = date > new Date() && !isToday;
    
    // User shift settings
    const shiftId = getEffectiveShiftId(user, date);
    const shiftConfig = resolvedShifts[shiftId] || resolvedShifts.shift1;
    const dayOfWeek = date.getDay();
    const dayShift = shiftConfig?.workDays[dayOfWeek];
    const isTodayHoliday = isHoliday(date);
    const isOffDay = !dayShift || isTodayHoliday;

    if (isFuture) return null;

    const userStartDate = user?.workStartDate ? new Date(user.workStartDate) : (user?.createdAt ? new Date(user.createdAt) : new Date(0));
    userStartDate.setHours(0,0,0,0);
    const checkDate = new Date(date);
    checkDate.setHours(0,0,0,0);
    
    let isWithinContract = checkDate >= userStartDate;
    if (user?.workEndDate) {
      const userEndDate = new Date(user.workEndDate);
      userEndDate.setHours(23,59,59,999);
      if (checkDate > userEndDate) {
        isWithinContract = false;
      }
    }

    const dayLogs = myHistory.filter(log => isSameDay(new Date(log.timestamp), date));
    
    const sickLog = dayLogs.find(l => l.type === 'sick');
    if (sickLog) return 'sick';
    const dispensasiLog = dayLogs.find(l => l.type === 'dispensasi');
    if (dispensasiLog) return 'dispensasi';
    const permitLog = dayLogs.find(l => ['permit', 'cuti', 'melahirkan', 'meninggal'].includes(l.type));
    if (permitLog) return 'permit'; 

    const inLogs = dayLogs.filter(l => l.type === 'in');
    const outLogs = dayLogs.filter(l => l.type === 'out');

    if (inLogs.length === 0 && outLogs.length === 0) {
        if (!isOffDay && !isToday && isWithinContract) return 'alpa'; 
        return null;
    }

    if (inLogs.length > 0) {
        const sortedIn = [...inLogs].sort((a,b) => a.timestamp - b.timestamp);
        const firstInLog = sortedIn[0];
        
        let isLate = false;
        if (firstInLog.status === 'pending_approval' || firstInLog.status === 'rejected') {
          isLate = true; 
        } else if (!firstInLog.status || firstInLog.status === 'approved') {
          const firstInDate = new Date(firstInLog.timestamp);
          const shiftStartStr = dayShift?.start || shiftConfig?.startTime || "09:00";
          const gracePeriod = shiftConfig?.gracePeriod || 0;
          
          const [startHour, startMin] = shiftStartStr.split(':').map(Number);
          const shiftStartMinutes = (startHour * 60) + startMin + gracePeriod;
          const userInMinutes = (firstInDate.getHours() * 60) + firstInDate.getMinutes();
          
          isLate = userInMinutes > shiftStartMinutes;
        }

        if (outLogs.length === 0 && !isToday && !isOffDay) {
            return 'lupa_pulang';
        }

        if (isLate) return 'telat';
        return 'hadir'; 
    }

    return null;
  }, [myHistory, settings, user]);

  const pendingCount = myHistory.filter(log => log.status === 'pending_approval').length;

  const isIzinActive = React.useMemo(() => {
    return myHistory.some(log => isSameDay(new Date(log.timestamp), new Date()) && ['sick', 'permit', 'cuti', 'melahirkan', 'meninggal'].includes(log.type));
  }, [myHistory]);
  
  const hasInApproved = React.useMemo(() => {
     return myHistory.some(log => isSameDay(new Date(log.timestamp), new Date()) && log.type === 'in' && log.status === 'approved');
  }, [myHistory]);

  const hasOutApproved = React.useMemo(() => {
     return myHistory.some(log => isSameDay(new Date(log.timestamp), new Date()) && log.type === 'out' && log.status === 'approved');
  }, [myHistory]);

  const isTodayHolidayOrWeekend = React.useMemo(() => {
     const today = new Date();
     return isWeekend(today) || isHoliday(today);
  }, []);

  const canEnableOvertime = React.useMemo(() => {
     const outLog = myHistory.find(log => isSameDay(new Date(log.timestamp), new Date()) && log.type === 'out' && log.status === 'approved');
     if (!outLog) return false;
     
     const outTime = new Date(outLog.timestamp);
     const now = new Date();
     const minutesSinceOut = (now.getTime() - outTime.getTime()) / (1000 * 60);
     
     // Check shift end time
     const shift = resolvedShifts[getEffectiveShiftId(user, new Date()) || ''];
     const dayOfWeek = new Date().getDay();
     const shiftDay = shift?.workDays?.[dayOfWeek];
     
     if (shiftDay) {
         const [endHour, endMinute] = shiftDay.end.split(':').map(Number);
         const shiftEnd = new Date();
         shiftEnd.setHours(endHour, endMinute, 0, 0);
         
         // If shift ends tomorrow morning, adjust shiftEnd
         if (endHour < 12) { // Extremely crude check for overnight shift
             shiftEnd.setDate(shiftEnd.getDate() + 1);
         }
         if (now < shiftEnd) return false;
     }
     
     return minutesSinceOut >= 0 && minutesSinceOut <= 30;
  }, [myHistory, resolvedShifts, user]);

  
  const summary = React.useMemo(() => {
     let telatCount = 0;
     let ijinCount = 0;
     let alpaCount = 0;
     let lemburHours = 0;
     let hadirCount = 0;

     const telatDates: Date[] = [];
     const ijinDates: Date[] = [];
     const alpaDates: Date[] = [];
     const hadirDates: Date[] = [];
     const lemburDetails: {date: Date, hours: number}[] = [];
     
     const now = new Date();
     for (let i = 1; i <= now.getDate(); i++) {
        const date = new Date(now.getFullYear(), now.getMonth(), i);
        const status = getStatusForDate(date);
        
        if (status === 'telat') { telatCount++; telatDates.push(date); }
        if (status === 'sick' || status === 'permit' || status === 'dispensasi') { ijinCount++; ijinDates.push(date); }
        if (status === 'alpa') { alpaCount++; alpaDates.push(date); }
        if (status === 'hadir') { hadirCount++; hadirDates.push(date); }
        
        const dayLogs = myHistory.filter(log => isSameDay(new Date(log.timestamp), date));
        const lemburIn = dayLogs.filter(l => l.type === 'overtime_in').sort((a,b) => a.timestamp - b.timestamp);
        const lemburOut = dayLogs.filter(l => l.type === 'overtime_out').sort((a,b) => b.timestamp - a.timestamp);
        
        if (lemburIn.length > 0 && lemburOut.length > 0) {
            const mSecs = lemburOut[0].timestamp - lemburIn[0].timestamp;
            if (mSecs > 0) {
               const hours = mSecs / (1000 * 60 * 60);
               lemburHours += hours;
               lemburDetails.push({ date, hours });
            }
        }
     }
     
     return { telatCount, ijinCount, alpaCount, lemburHours, hadirCount, telatDates, ijinDates, alpaDates, hadirDates, lemburDetails };
  }, [myHistory, getStatusForDate]);

  const todayStatusText = React.useMemo(() => {
    const todayLogs = myHistory.filter(log => isSameDay(new Date(log.timestamp), new Date()));
    if (todayLogs.length === 0) return "Belum Absen Hari Ini";
    
    const hasOut = todayLogs.some(log => log.type === 'out');
    if (hasOut) return "Sudah Absen Pulang";
    
    const hasLemburOut = todayLogs.some(log => log.type === 'overtime_out');
    if (hasLemburOut) return "Sudah Lembur Pulang";

    const hasLemburIn = todayLogs.some(log => log.type === 'overtime_in');
    if (hasLemburIn) return "Sedang Lembur Masuk";

    const hasIn = todayLogs.some(log => log.type === 'in');
    
    const sickOrPermit = todayLogs.find(log => ['sick', 'permit', 'cuti', 'melahirkan', 'meninggal'].includes(log.type));
    if (sickOrPermit) {
       if (sickOrPermit.type === 'sick') return "Status: Sakit";
       if (sickOrPermit.type === 'cuti') return "Status: Cuti";
       if (sickOrPermit.type === 'melahirkan') return "Status: Melahirkan";
       if (sickOrPermit.type === 'meninggal') return "Status: Berduka";
       return "Status: Izin";
    }

    if (hasIn) return "Sudah Absen Masuk";
    
    return "Sudah Absen";
  }, [myHistory]);

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

  useEffect(() => {
    if (!user) return;
    
    // Fetch notifications
    const qNotif = query(collection(db, "notifications"), where("userId", "in", [user.uid, "all"]));
    const unsubNotif = onSnapshot(qNotif, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a: any, b: any) => b.createdAt - a.createdAt);
      setAppNotifications(data);
    });

    // Fetch announcements
    const qAnnouncements = query(collection(db, "announcements"));
    const unsubAnnouncements = onSnapshot(qAnnouncements, (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch leave requests
    const qLeave = query(collection(db, "leaveRequests"), where("userId", "==", user.uid));
    const unsubLeave = onSnapshot(qLeave, (snapshot) => {
      setLeaveRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    // Fetch payroll
    const qPayroll = query(collection(db, "payroll"), where("userId", "==", user.uid));
    const unsubPayroll = onSnapshot(qPayroll, (snapshot) => {
      setPayroll(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error fetching payroll data", error);
    });
    
    // Fetch attendance
    const q = query(collection(db, "attendance"), where("userId", "==", user.uid));
    const unsubAttendance = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        isPending: doc.metadata.hasPendingWrites 
      }));
      data.sort((a: any, b: any) => b.timestamp - a.timestamp);
      setMyHistory(data);
    }, (error) => {
      console.error("Error fetching personal data", error);
    });

    return () => { unsubLeave(); unsubPayroll(); unsubAttendance(); unsubAnnouncements(); unsubNotif(); };
  }, [user]);

  useEffect(() => {
    if (!settings) return;

    if (!settings.geofenceEnabled) {
      setIsWithinRadius(true);
      // We can still try to get the location, but it's not strictly required for within radius
    }

    if (navigator.geolocation) {
      let watchId: number;
      let options = { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 };

      const startWatching = () => {
        return navigator.geolocation.watchPosition(
          (position) => {
            setLocationError(false);
            const { latitude, longitude, accuracy } = position.coords;
            const now = Date.now();
            
            // Perform integrity check here
            performIntegrityCheck(latitude, longitude, accuracy, now, lastPosRef.current ? { lat: lastPosRef.current.lat, lng: lastPosRef.current.lng, time: lastPosRef.current.time } : undefined)
              .then(result => {
                if (result.isSuspicious) {
                  setIsFakeGPS(true);
                  if (!isFakeGPS) toast.error(`Aktivitas mencurigakan terdeteksi: ${result.reason}`);
                } else {
                  setIsFakeGPS(false);
                }
              });
            
            if (lastPosRef.current) {
              const dist = calculateDistance(latitude, longitude, lastPosRef.current.lat, lastPosRef.current.lng);
              const timeDiff = (now - lastPosRef.current.time) / 1000; // seconds
              if (timeDiff > 0) {
                const speed = dist / timeDiff; // m/s
                if (speed > 100) {
                    setIsFakeGPS(true);
                    toast.error("Aktivitas mencurigakan terdeteksi (Fake GPS).");
                }
              }
            }
            lastPosRef.current = { lat: latitude, lng: longitude, time: now };
            
            setLocation({ lat: latitude, lng: longitude });
            
            let closestAreaDist = Infinity;
            let inAnyArea = false;
            let foundAreaName = "Di Luar Area Terdaftar";
            let closestTargetLat = 0;
            let closestTargetLng = 0;
            let closestTargetRadius = 100;
            
            if (settings.areas && Object.keys(settings.areas).length > 0) {
              if (user?.areaId && settings.areas[user.areaId]) {
                 const areaConfig = settings.areas[user.areaId];
                 closestTargetLat = areaConfig.lat;
                 closestTargetLng = areaConfig.lng;
                 closestTargetRadius = areaConfig.radius;
                 const dist = calculateDistance(latitude, longitude, closestTargetLat, closestTargetLng);
                 closestAreaDist = dist;
                 if (dist <= closestTargetRadius) {
                   inAnyArea = true;
                   foundAreaName = areaConfig.name;
                 }
              } else {
                 Object.values(settings.areas).forEach((area: any) => {
                   const areaDist = calculateDistance(latitude, longitude, area.lat, area.lng);
                   if (areaDist < closestAreaDist) {
                     closestAreaDist = areaDist;
                     closestTargetLat = area.lat;
                     closestTargetLng = area.lng;
                     closestTargetRadius = area.radius;
                   }
                   if (areaDist <= area.radius) {
                     inAnyArea = true;
                     foundAreaName = area.name;
                   }
                 });
              }
            } else {
              setCurrentAreaName("Belum Ada Area Terdaftar");
            }
            
            if (closestAreaDist !== Infinity) {
               setDistance(closestAreaDist);
               if (settings.geofenceEnabled) {
                  setIsWithinRadius(inAnyArea);
               }
               setCurrentAreaName(foundAreaName);
            } else {
               setDistance(null);
               if (settings.geofenceEnabled) {
                  setIsWithinRadius(false);
               }
            }
          },
          (err) => {
            let errorMessage = "Unknown error";
            switch (err.code) {
              case err.PERMISSION_DENIED:
                errorMessage = "Izin lokasi ditolak oleh pengguna.";
                break;
              case err.POSITION_UNAVAILABLE:
                errorMessage = "Informasi lokasi tidak tersedia.";
                break;
              case err.TIMEOUT:
                errorMessage = "Waktu permintaan lokasi habis.";
                break;
            }
            console.error(`Geolocation error (${err.code}): ${err.message}`, { code: err.code, message: err.message });
            setLocationError(true);
            if (settings.geofenceEnabled) {
              setIsWithinRadius(false);
            }
            
            // Auto fallback if high accuracy times out
            if (err.code === err.TIMEOUT && options.enableHighAccuracy) {
               console.log("Retrying location without high accuracy...");
               options.enableHighAccuracy = false;
               if (watchId) navigator.geolocation.clearWatch(watchId);
               watchId = startWatching();
            }
          },
          options
        );
      };
      
      watchId = startWatching();
      return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
    } else {
      setLocationError(true);
      if (settings.geofenceEnabled) {
         setIsWithinRadius(false);
      }
    }
  }, [settings]);

  useEffect(() => {
    let ht5Qrcode: Html5Qrcode | null = null;
    let isMounted = true;
    let timer: any;
    
    if (view === "absen" && activeAbsenTab === "qr") {
      const startScanner = async () => {
        try {
          ht5Qrcode = new Html5Qrcode("qr-reader");
          await ht5Qrcode.start(
            { facingMode: "environment" },
            {
               fps: 10,
               qrbox: { width: 250, height: 250 }
            },
            (decodedText) => {
               if (ht5Qrcode && ht5Qrcode.isScanning) {
                  ht5Qrcode.stop().then(async () => {
                      ht5Qrcode?.clear();
                      if (isMounted) {
                         toast.info("Barcode Terbaca. Mohon ambil foto untuk verifikasi.");
                         setPendingQRData(decodedText);
                         // QR Data strictly uses the uid value from the QR code
                         const scannedUid = decodedText;
                         setQrUserIdentity({ 
                            uid: scannedUid, 
                            name: "Pengguna (via Barcode)", 
                            shiftId: user.shiftId || "shift1" 
                         });
                         toast.success(`Identitas Terbaca. Lanjutkan verifikasi wajah.`);
                         setActiveAbsenTab("selfie"); // Switch to photo capture
                      }
                  }).catch(console.error);
               }
            },
            () => {} // ignore scan failures
          );
          
          // If component unmounted while starting camera
          if (!isMounted && ht5Qrcode && ht5Qrcode.isScanning) {
             ht5Qrcode.stop().then(() => ht5Qrcode?.clear()).catch(console.error);
          }
        } catch (e) {
          console.error("QR scanner start error: ", e);
        }
      };

      // Delay start to allow Webcam component to release the camera fully
      timer = setTimeout(() => {
        if (isMounted) {
          startScanner();
        }
      }, 500);

      return () => { 
        isMounted = false;
        clearTimeout(timer);
        if (ht5Qrcode && ht5Qrcode.isScanning) {
           ht5Qrcode.stop().then(() => {
              ht5Qrcode?.clear();
           }).catch(console.error);
        }
      };
    }
  }, [view, activeAbsenTab, type]);

  // Wajah tidak lagi dicek otomatis oleh faceapi
  useEffect(() => {
    let interval: any;
    if (view === "absen" && activeAbsenTab === "selfie" && !loading) {
       // Visual hint saja, tidak ada face-api
    }
    return () => clearInterval(interval);
  }, [view, activeAbsenTab, loading, autoCaptureActive]);

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
      const url = await toPng(idCardRef.current, { cacheBust: true, pixelRatio: 3 });
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
      const blob = await toBlob(idCardRef.current, { cacheBust: true, pixelRatio: 3 });
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

  return (
    <>
      <div className="h-screen flex flex-col text-gray-900 dark:text-gray-100 overflow-hidden font-sans relative">
        <div className="flex-1 overflow-y-auto pb-32 sm:pb-36 xl:pb-40 relative">
             {/* Elegant Glassmorphism Header */}
        <div className="sticky top-0 z-40 shrink-0 border-b border-teal-500/10 dark:border-white/5 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl shadow-sm transition-all overflow-hidden">
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
           {view === "home" && (
             <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-5xl mx-auto md:px-8">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <Card className="relative overflow-hidden border-0 shadow-xl shadow-teal-900/5 rounded-[1.5rem] bg-white dark:bg-gray-800 text-center px-4 pt-6 pb-4 w-full">
                    {/* Inner Wave Background */}
                    <div className="absolute bottom-0 left-0 right-0 top-1/2 overflow-hidden pointer-events-none rounded-b-[1.75rem]">
                      <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full h-auto min-h-[160px] max-h-[85%] object-cover object-bottom" preserveAspectRatio="none">
                        <path fill="currentColor" className="text-[#f1f2fc] dark:text-gray-900" d="M0,224L48,202.7C96,181,192,139,288,144C384,149,480,203,576,218.7C672,235,768,213,864,181.3C960,149,1056,107,1152,101.3C1248,96,1344,128,1392,144L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                      </svg>
                    </div>

                  <div className="relative z-10 flex flex-col items-center">
                    <button 
                      onClick={() => setIsCardExpanded(!isCardExpanded)}
                      className="absolute -top-2 -right-2 z-30 p-1.5 text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/40 rounded-full hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-colors"
                    >
                       {isCardExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <div className={`grid transition-all duration-300 ease-in-out w-full ${isCardExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                      <div className="overflow-hidden flex flex-col items-center w-full">
                        <div className="pt-2 pb-6 flex flex-col items-center w-full min-h-[min-content]">
                          <h2 className="text-4xl sm:text-4xl font-black text-slate-800 dark:text-gray-100 tracking-[-0.02em] leading-none mb-1 flex items-center justify-center">
                            {format(currentTime, "HH:mm:ss")}
                          </h2>
                          <p className="text-slate-500 dark:text-gray-400 font-medium text-[0.85rem] mb-5 tracking-tight">
                            {format(currentTime, "EEEE, dd MMMM yyyy", { locale: id })}
                          </p>
                          
                          {/* Shift Info */}
                          <div className="flex flex-col items-center w-full z-10">
                            {(() => {
                               const shiftId = getEffectiveShiftId(user, new Date());
                               const shift = resolvedShifts[shiftId] || resolvedShifts.shift1;
                               const todayWork = shift?.workDays[currentTime.getDay()];
                               
                               return (
                                 <>
                                   <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-1 font-sans bg-teal-50 dark:bg-teal-900/30 px-3 py-1 rounded-full border border-teal-100 dark:border-teal-800/30">INFO SHIFT</span>
                                   <p className="text-[1.4rem] leading-none font-black text-slate-800 dark:text-white mb-2 tracking-tight">
                                     {shift?.name || "Shift Standard"}
                                   </p>
                                   {shift?.gracePeriod > 0 && (
                                     <p className="text-[10px] font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-[0.1em] font-sans">
                                        TOLERANSI: {shift.gracePeriod} MENIT
                                     </p>
                                   )}
                                 </>
                               )
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Location Pill */}
                    <div className="w-full bg-white dark:bg-gray-800 rounded-[1.25rem] shadow-[0_4px_25px_-5px_rgba(0,0,0,0.06)] border border-gray-100 dark:border-gray-700/50 p-2.5 flex items-center justify-between text-left relative z-20">
                       <div className="flex items-center gap-3 w-full">
                          <div className="shrink-0 w-[52px] h-[52px] bg-blue-50/50 dark:bg-blue-900/20 rounded-full flex justify-center items-center relative overflow-hidden border border-blue-100/50 dark:border-gray-700">
                             <MapPin className="w-5 h-5 text-rose-500 absolute -top-1 right-0.5 z-10 fill-rose-500 drop-shadow-sm rotate-[15deg]" />
                             <Globe className="w-8 h-8 text-blue-500 dark:text-blue-400 stroke-2 translate-y-1" />
                          </div>
                          
                          <div className="flex flex-col flex-1 pl-1">
                             <div className="text-[13px] font-bold text-slate-800 dark:text-white tracking-widest leading-none mb-1">
                               {!settings?.geofenceEnabled 
                                 ? (location && distance !== null ? `JARAK: ${Math.round(distance)}M (Bebas)` : "GEOFENCE NONAKTIF")
                                 : (locationError ? "GAGAL LOKASI" : (location ? (distance !== null ? `JARAK: ${Math.round(distance)}M` : "MENGHITUNG...") : "MENCARI LOKASI..."))}
                             </div>
                             {location && (
                               <div className="flex flex-col">
                                 <div className="text-[11px] text-slate-700 dark:text-gray-400 font-medium tracking-tight mb-0.5 font-mono">
                                   LAT: {location.lat.toFixed(6)} <span className="opacity-50 px-0.5">|</span> LNG: {location.lng.toFixed(6)}
                                 </div>
                                 {settings?.geofenceEnabled && (
                                   <div className="text-[11px] text-slate-700 dark:text-gray-400 font-medium tracking-tight font-sans">
                                     Max Radius: {
                                      (() => {
                                        if (user?.areaId && settings?.areas && settings.areas[user.areaId]) {
                                          return `${settings.areas[user.areaId].radius}m`;
                                        } else if (settings?.areas && Object.keys(settings.areas).length > 0) {
                                          return `Tergantung Titik`;
                                        }
                                        return "Belum ada konfigurasi";
                                      })()
                                     }
                                   </div>
                                 )}
                               </div>
                             )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 px-3 justify-end text-right border-l border-gray-100 dark:border-gray-700 h-8 max-w-[120px] sm:max-w-[150px] overflow-hidden">
                            <MapPin className="w-[18px] h-[18px] text-emerald-500 fill-emerald-500 shrink-0" />
                            {((currentAreaName || "Area...").length > 7) ? (
                              <div className="marquee-container w-full">
                                <span className="text-[15px] font-black text-slate-800 dark:text-white animate-marquee pr-8">
                                  {currentAreaName || "Area..."}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[15px] font-black text-slate-800 dark:text-white truncate">
                                {currentAreaName || "Area..."}
                              </span>
                            )}
                          </div>
                       </div>
                    </div>
                  </div>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                  {(() => {
                      const todayLogs = myHistory.filter(log => isSameDay(new Date(log.timestamp), new Date()));
                      const inLog = todayLogs.find(log => log.type === 'in');
                      const outLog = todayLogs.find(log => log.type === 'out');
                      const myShiftId = getEffectiveShiftId(user, new Date());
                      const myShift = resolvedShifts[myShiftId] || resolvedShifts["shift1"];
                      const dayOfWeek = currentTime.getDay();
                      const shiftDay = myShift && myShift.workDays ? myShift.workDays[dayOfWeek as keyof typeof myShift.workDays] : null;
                      
                      return (
                        <>
                          <Button 
                            onClick={() => { setType("in"); setView("absen"); }}
                            className="relative overflow-hidden border-0 shadow-lg group rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 p-4 flex flex-col items-center justify-center font-bold text-white transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed h-[6.5rem]"
                          >
                            <div className="absolute top-0 right-0 p-2 opacity-20">
                              <AlarmClock className="w-12 h-12" />
                            </div>
                            <AlarmClock className="w-6 h-6 mb-1 opacity-80" />
                            <span className="text-xs mb-1 leading-none text-center">Absen Masuk</span>
                            {shiftDay ? (
                               <div className="flex flex-col items-center gap-0.5 mt-0.5">
                                 <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">Jadwal: {shiftDay.start}</span>
                                 <span className={`text-[9px] px-2 py-0.5 rounded-full font-black tracking-wider uppercase mt-1 shadow-sm ${inLog ? 'bg-white text-teal-600' : 'bg-red-500/80 text-white'}`}>
                                    {inLog ? 'Sudah Absen' : 'Belum Absen'}
                                 </span>
                               </div>
                            ) : (
                               <div className="flex flex-col items-center gap-0.5 mt-0.5">
                                 <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">Libur</span>
                                 <span className={`text-[9px] px-2 py-0.5 rounded-full font-black tracking-wider uppercase mt-1 shadow-sm ${inLog ? 'bg-white text-teal-600' : 'bg-red-500/80 text-white'}`}>
                                    {inLog ? 'Sudah Absen' : 'Belum Absen'}
                                 </span>
                               </div>
                            )}
                          </Button>
                          <Button 
                            onClick={() => {
                              if (!inLog) {
                                toast.error("Anda belum Absen Masuk. Tidak bisa Absen Pulang. Silakan hubungi Admin.");
                                return;
                              }
                              if (inLog.status === 'pending_approval') {
                                toast.error("Absen Masuk Anda masih menunggu Approval Admin. Tidak bisa Absen Pulang.");
                                return;
                              }
                              
                              setType("out"); 
                              setView("absen"); 
                            }}
                            className="relative overflow-hidden border-0 shadow-lg group rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 p-4 flex flex-col items-center justify-center font-bold text-white transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed h-[6.5rem]"
                          >
                            <div className="absolute top-0 right-0 p-2 opacity-20">
                              <DoorOpen className="w-12 h-12" />
                            </div>
                            <DoorOpen className="w-6 h-6 mb-1 opacity-80" />
                            <span className="text-xs mb-1 leading-none text-center">Absen Pulang</span>
                            {shiftDay ? (
                               <div className="flex flex-col items-center gap-0.5 mt-0.5">
                                 <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">Jadwal: {shiftDay.end}</span>
                                 <span className={`text-[9px] px-2 py-0.5 rounded-full font-black tracking-wider uppercase mt-1 shadow-sm ${outLog ? 'bg-white text-purple-600' : 'bg-red-500/80 text-white'}`}>
                                    {outLog ? 'Sudah Absen' : 'Belum Absen'}
                                 </span>
                               </div>
                            ) : (
                               <div className="flex flex-col items-center gap-0.5 mt-0.5">
                                 <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">Libur</span>
                                 <span className={`text-[9px] px-2 py-0.5 rounded-full font-black tracking-wider uppercase mt-1 shadow-sm ${outLog ? 'bg-white text-purple-600' : 'bg-red-500/80 text-white'}`}>
                                    {outLog ? 'Sudah Absen' : 'Belum Absen'}
                                 </span>
                               </div>
                            )}
                          </Button>
                        </>
                      );
                  })()}
                  <button 
                    disabled={!canEnableOvertime}
                    onClick={() => { setType("overtime_in"); setView("absen"); }}
                    className="p-4 bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white rounded-2xl flex flex-col items-center justify-center font-bold shadow-lg transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <TrendingUp className="w-6 h-6 mb-1.5 opacity-80" />
                    <span className="text-xs text-center">Lembur Masuk</span>
                  </button>
                  <button 
                    disabled={!canEnableOvertime}
                    onClick={() => { setType("overtime_out"); setView("absen"); }}
                    className="p-4 bg-rose-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-700 text-white rounded-2xl flex flex-col items-center justify-center font-bold shadow-lg transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <TrendingDown className="w-6 h-6 mb-1.5 opacity-80" />
                    <span className="text-xs text-center">Lembur Pulang</span>
                  </button>
                  <button 
                    onClick={() => { setView("izin_menu"); }}
                    className="p-4 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-2xl flex flex-col items-center justify-center font-bold shadow-lg transition-transform active:scale-95 col-span-2"
                  >
                    <CalendarDays className="w-6 h-6 mb-1.5 opacity-80" />
                    <span className="text-xs">Lapor Izin / Sakit / Cuti</span>
                  </button>
                </div>
                </div>
                
                {pendingCount > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700/50 text-yellow-800 dark:text-yellow-400 px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse shrink-0 drop-shadow-sm"></div>
                      <span className="text-xs font-medium">Anda memiliki <b>{pendingCount} absen menuggu approval.</b></span>
                    </div>
                  </div>
                )}
                
                {announcements.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {announcements.slice(0, 2).map((ann, idx) => (
                        <div key={ann.id || idx} className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-teal-50 dark:border-teal-900/50 flex gap-3">
                           <div className={`mt-1 w-2 h-full rounded-full shrink-0 ${ann.type === 'danger' ? 'bg-rose-500' : ann.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                           <div>
                             <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className={`text-[8px] uppercase font-black uppercase px-1.5 py-0 border-0 ${ann.type === 'danger' ? 'bg-rose-100 text-rose-700' : ann.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                  {ann.type === 'danger' ? 'PENTING' : ann.type === 'success' ? 'BERITA BAIK' : 'INFO'}
                                </Badge>
                                <span className="text-[9px] text-slate-400 font-bold">{format(new Date(ann.createdAt), 'dd MMM yyyy')}</span>
                             </div>
                             <h4 className="font-bold text-teal-900 dark:text-white text-sm capitalize leading-tight mb-1">{ann.title}</h4>
                             <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{ann.content}</p>
                           </div>
                        </div>
                     ))}
                  </div>
                )}
              </div>
           )}

           {view === "izin_menu" && (
             <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 max-w-xl mx-auto pb-10">
                 <div className="sticky top-0 z-50 overflow-hidden flex items-center mb-4 px-4 py-3 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border-b border-teal-500/10 dark:border-white/5 shadow-sm -mx-4 -mt-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 via-transparent to-transparent dark:from-teal-950/20 pointer-events-none" />
                    <svg className="absolute inset-x-0 -top-4 w-full h-[150%] opacity-[0.05] dark:opacity-[0.03] pointer-events-none" viewBox="0 0 1440 320" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                      <path fill="#0d9488" d="M0,256L48,229.3C96,203,192,149,288,154.7C384,160,480,224,576,218.7C672,213,768,139,864,122.7C960,107,1056,149,1152,176C1248,203,1344,213,1392,218.7L1440,224L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
                    </svg>
                    <button onClick={() => setView('home')} className="relative z-10 p-2 -ml-2 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-zinc-300 transition-colors">
                       <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="relative z-10 text-xl font-extrabold ml-2 text-zinc-900 dark:text-white tracking-tight">Pilih Jenis Laporan</h2>
                 </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <button 
                    onClick={() => { setType("sick"); setView("absen"); setActiveAbsenTab("selfie"); }}
                    className="p-3.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-gray-700 rounded-2xl flex items-center justify-between font-bold shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0">
                        <UserSquare2 className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-gray-900 dark:text-gray-100 font-bold text-sm">Sakit</p>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Wajib lapirkan surat dokter</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>

                  <button 
                    onClick={() => { setType("permit"); setView("absen"); setActiveAbsenTab("selfie"); }}
                    className="p-3.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-gray-700 rounded-2xl flex items-center justify-between font-bold shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 rounded-xl flex items-center justify-center shrink-0">
                        <CalendarDays className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-gray-900 dark:text-gray-100 font-bold text-sm">Izin Biasa</p>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Keperluan pribadi / mendesak</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>

                  <button 
                    onClick={() => { setType("cuti"); setView("absen"); setActiveAbsenTab("selfie"); }}
                    className="p-3.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-gray-700 rounded-2xl flex items-center justify-between font-bold shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                        <CalendarDays className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-gray-900 dark:text-gray-100 font-bold text-sm">Cuti Tahunan</p>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Libur terencana tahunan</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>

                  <button 
                    onClick={() => { setType("melahirkan"); setView("absen"); setActiveAbsenTab("selfie"); }}
                    className="p-3.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-gray-700 rounded-2xl flex items-center justify-between font-bold shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400 rounded-xl flex items-center justify-center shrink-0">
                        <UserSquare2 className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-gray-900 dark:text-gray-100 font-bold text-sm">Cuti Melahirkan</p>
                        <p className="text-[10px] sm:text-xs text-gray-500 font-medium mt-0.5">Wajib lampirkan surat RS</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                  </button>

                  <button 
                    onClick={() => { setType("meninggal"); setView("absen"); setActiveAbsenTab("selfie"); }}
                    className="p-3.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-gray-700 rounded-2xl flex items-center justify-between font-bold shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl flex items-center justify-center shrink-0">
                        <UserSquare2 className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-gray-900 dark:text-gray-100 font-bold text-sm">Izin Berduka / Meninggal</p>
                        <p className="text-[10px] sm:text-xs text-gray-500 font-medium mt-0.5">Keluarga inti meninggal</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                  </button>
                </div>
             </div>
           )}

           {view === "absen" && (
             <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 max-w-xl mx-auto pb-10">
                 <div className="sticky top-0 z-50 overflow-hidden flex items-center mb-4 px-4 py-3 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border-b border-teal-500/10 dark:border-white/5 shadow-sm -mx-4 -mt-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 via-transparent to-transparent dark:from-teal-950/20 pointer-events-none" />
                    <svg className="absolute inset-x-0 -top-4 w-full h-[150%] opacity-[0.05] dark:opacity-[0.03] pointer-events-none" viewBox="0 0 1440 320" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                      <path fill="#0d9488" d="M0,256L48,229.3C96,203,192,149,288,154.7C384,160,480,224,576,218.7C672,213,768,139,864,122.7C960,107,1056,149,1152,176C1248,203,1344,213,1392,218.7L1440,224L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
                    </svg>
                    <button onClick={() => setView('home')} className="relative z-10 p-2 -ml-2 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-zinc-300 transition-colors">
                       <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="relative z-10 text-xl font-extrabold ml-2 text-zinc-900 dark:text-white tracking-tight">
                       Proses Absen <span className="text-teal-600 dark:text-teal-400">{type === 'in' ? 'Masuk' : type === 'out' ? 'Pulang' : type === 'overtime_in' ? 'Lembur Masuk' : type === 'overtime_out' ? 'Lembur Pulang' : type === 'sick' ? 'Sakit' : 'Izin'}</span>
                    </h2>
                 </div>

                 <Card className="bg-white dark:bg-gray-800 shadow-md rounded-2xl border-0">
                   <CardContent className="p-4">
                     <Tabs value={activeAbsenTab} onValueChange={(val) => {
                        setActiveAbsenTab(val);
                        setPendingQRData(null);
                        setQrUserIdentity(null);
                     }} className="w-full">
                       {!isDocumentCapture && (
                         <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-50 dark:bg-gray-700/50 p-1 rounded-lg h-auto">
                           <TabsTrigger value="selfie" className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-[9px] sm:text-[10px] font-semibold py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600"><UserSquare2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span>Selfie</span></TabsTrigger>
                           <TabsTrigger value="qr" className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-[9px] sm:text-[10px] font-semibold py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600"><Code className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span>QR Scan</span></TabsTrigger>
                         </TabsList>
                       )}
                       
                       <TabsContent value="selfie" className="space-y-4">
                         {isDocumentCapture && type === 'cuti' && (
                           <div className="grid grid-cols-2 gap-2 mb-4">
                             <div className="space-y-1">
                               <label className="text-[10px] font-bold text-gray-500 uppercase">Mulai</label>
                               <Input type="date" value={permitStartDate ? format(permitStartDate, "yyyy-MM-dd") : ""} onChange={(e) => setPermitStartDate(new Date(e.target.value))} className="h-10 text-sm" />
                             </div>
                             <div className="space-y-1">
                               <label className="text-[10px] font-bold text-gray-500 uppercase">Akhir</label>
                               <Input type="date" value={permitEndDate ? format(permitEndDate, "yyyy-MM-dd") : ""} onChange={(e) => setPermitEndDate(new Date(e.target.value))} className="h-10 text-sm" />
                             </div>
                           </div>
                         )}

                         {!isDocumentCapture && location && (
                           <div className="mb-4 bg-gray-50 dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800 transition-all duration-300">
                              <div 
                                className="flex justify-between items-center cursor-pointer"
                                onClick={() => setIsAbsenMapExpanded(!isAbsenMapExpanded)}
                              >
                                 <div className="flex items-center gap-2">
                                   <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-600 dark:text-teal-400">
                                      <MapPin className="w-4 h-4" />
                                   </div>
                                   <div>
                                      <span className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest block leading-none mb-1">Peta Visual (GPS)</span>
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isWithinRadius ? 'bg-teal-100 text-teal-700' : 'bg-rose-100 text-rose-700'}`}>
                                        {isWithinRadius ? 'Dalam Geofence' : 'Di Luar Geofence'}
                                      </span>
                                   </div>
                                 </div>
                                 <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                    {isAbsenMapExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                 </button>
                              </div>
                              <div className={`grid transition-all duration-300 ease-in-out w-full ${isAbsenMapExpanded ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0"}`}>
                                <div className="overflow-hidden w-full">
                                   <MapPicker 
                                     center={{ 
                                       lat: user?.areaId && settings?.areas?.[user.areaId] ? settings.areas[user.areaId].lat : (location?.lat || -6.2088), 
                                       lng: user?.areaId && settings?.areas?.[user.areaId] ? settings.areas[user.areaId].lng : (location?.lng || 106.8456)
                                     }} 
                                     radius={(() => {
                                       if (user?.areaId && settings?.areas && settings.areas[user.areaId]) {
                                         return settings.areas[user.areaId].radius;
                                       }
                                       return 100;
                                     })()}
                                     readonly={true}
                                   />
                                </div>
                              </div>
                           </div>
                         )}

                        <div className="aspect-square sm:aspect-video bg-gray-900 rounded-2xl overflow-hidden relative shadow-2xl border-4 border-white dark:border-gray-800">
                          {activeAbsenTab === 'selfie' && (
                            <Webcam
                              key={isDocumentCapture ? 'env' : 'user'}
                              audio={false}
                              ref={webcamRef}
                              screenshotFormat="image/jpeg"
                              screenshotQuality={0.8}
                              className={`w-full h-full object-cover ${isDocumentCapture ? '' : 'scale-x-[-1]'}`}
                              videoConstraints={{ facingMode: isDocumentCapture ? "environment" : "user" }}
                            />
                          )}
                          
                          {/* Face Guide Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            {['sick', 'permit', 'cuti', 'melahirkan', 'meninggal'].includes(type) ? (
                              <div className="w-64 h-80 sm:w-80 sm:h-96 rounded-xl border-4 transition-colors duration-300 border-teal-400 border-dashed bg-white/5 flex items-center justify-center relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                                 <div className="absolute bottom-6 left-0 right-0 text-center mx-auto w-[90%]">
                                     <p className="text-white text-[11px] font-bold drop-shadow-md bg-black/60 py-2 px-4 rounded-full inline-block">
                                        Posisikan dokumen dalam bingkai
                                     </p>
                                 </div>
                              </div>
                            ) : (
                              <div className="w-64 h-80 sm:w-56 sm:h-72 rounded-[100px] border-4 transition-colors duration-300 border-white/50 border-dashed shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] flex items-center justify-center">
                               
                               <div className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full backdrop-blur-md transform translate-y-32 sm:translate-y-28 transition-all duration-300 bg-gray-900/60 text-white/70`}>
                                  POSISIKAN WAJAH KE AREA OVAL
                               </div>
                            </div>
                            )}
                            
                            {/* Scanning Line only when no face detected */}
                            {!isDocumentCapture && (
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-56 sm:h-56 pointer-events-none overflow-hidden rounded-full">
                                <div className="absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_15px_rgba(45,212,191,0.5)] animate-[scan_3s_linear_infinite]" style={{ top: '-10%' }}></div>
                              </div>
                            )}
                          </div>
                        </div>

                        <style>{`
                          @keyframes scan {
                            0% { top: -10%; opacity: 0; }
                            10% { opacity: 1; }
                            90% { opacity: 1; }
                            100% { top: 110%; opacity: 0; }
                          }
                        `}</style>

                        <Button 
                          className={`w-full text-xs font-black uppercase tracking-[0.2em] h-12 shadow-xl rounded-2xl text-white transform active:scale-95 transition-all ${type === 'in' ? 'bg-teal-600 hover:bg-teal-700 shadow-teal-500/20' : type === 'overtime_in' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20' : type === 'overtime_out' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20' : type === 'sick' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' : type === 'permit' ? 'bg-cyan-600 hover:bg-cyan-700 shadow-cyan-500/20' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20'}`} 
                          onClick={() => checkPendingAndStartAttendance("selfie")} 
                          disabled={loading || (settings?.geofenceEnabled && !isWithinRadius && !['sick', 'permit', 'cuti', 'melahirkan', 'meninggal'].includes(type))}
                        >
                          {loading ? (
                            <span className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              PROSES VERIFIKASI...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              {['sick', 'permit', 'cuti', 'melahirkan', 'meninggal'].includes(type) ? <Check className="w-4 h-4" /> : <UserSquare2 className="w-4 h-4" />}
                              {['sick', 'permit', 'cuti', 'melahirkan', 'meninggal'].includes(type) ? 'KIRIM DOKUMEN & LAPOR' : `ABSEN & ${type.includes('in') ? 'MASUK' : type.includes('out') ? 'PULANG' : 'LAPOR'}`}
                            </span>
                          )}
                        </Button>
                      </TabsContent>

                      <TabsContent value="qr" className="space-y-4">
                        <style>{`
                          @keyframes qr-scan {
                            0% { top: 0%; opacity: 0; }
                            10% { opacity: 1; }
                            90% { opacity: 1; }
                            100% { top: 100%; opacity: 0; }
                          }
                        `}</style>
                        <div className="relative w-full max-w-sm mx-auto rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 aspect-square flex flex-col items-center justify-center">
                          <div className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-2 text-gray-400">
                             <Code className="w-10 h-10 animate-pulse" />
                             <span className="text-xs font-medium">Menyalakan kamera...</span>
                          </div>
                          
                          <div id="qr-reader" className="w-full h-full relative z-10 [&>video]:object-cover [&>video]:w-full [&>video]:h-full border-none"></div>
                          
                          <div className="absolute inset-8 border-2 border-teal-500/50 rounded-lg pointer-events-none z-20 overflow-hidden shadow-[inset_0_0_0_999px_rgba(0,0,0,0.3)]">
                            <div className="absolute left-0 w-full h-0.5 bg-teal-400 shadow-[0_0_8px_2px_rgba(45,212,191,0.7)]" style={{ animation: 'qr-scan 2.5s ease-in-out infinite' }}></div>
                          </div>
                        </div>
                        <p className="text-center text-xs text-gray-500 dark:text-gray-400">Posisikan QR Code persis di dalam kotak pindaian.</p>
                      </TabsContent>

                      </Tabs>
                  </CardContent>
                </Card>
             </div>
           )}

           {view === "history" && (
             <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-3xl mx-auto">
                <h2 className="text-xl font-bold px-2 flex items-center gap-2 dark:text-gray-100">
                  <CalendarDays className="w-5 h-5 text-teal-600 dark:text-teal-400" /> Rekap Kehadiran
                </h2>
                
                <h2 className="text-xl font-bold px-2 flex items-center gap-2 dark:text-gray-100 mb-2 mt-4">
                  <CalendarDays className="w-5 h-5 text-teal-600 dark:text-teal-400" /> Ringkasan Bulan Ini
                </h2>
                <div className="grid grid-cols-5 gap-2 mb-4">
                   <div onClick={() => setSummaryModalCategory('hadir')} className="bg-teal-50 dark:bg-teal-900/40 p-3 rounded-2xl text-center flex flex-col items-center shadow-sm cursor-pointer hover:bg-teal-100 dark:hover:bg-teal-800/40 transition-colors active:scale-95">
                      <span className="text-lg font-bold text-teal-600 dark:text-teal-400">{summary.hadirCount}</span>
                      <span className="text-[9px] uppercase tracking-wider font-bold text-teal-700/60 dark:text-teal-500">Hadir</span>
                   </div>
                   <div onClick={() => setSummaryModalCategory('telat')} className="bg-yellow-50 dark:bg-yellow-900/40 p-3 rounded-2xl text-center flex flex-col items-center shadow-sm cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-800/40 transition-colors active:scale-95">
                      <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{summary.telatCount}</span>
                      <span className="text-[9px] uppercase tracking-wider font-bold text-yellow-700/60 dark:text-yellow-500">Telat</span>
                   </div>
                   <div onClick={() => setSummaryModalCategory('ijin')} className="bg-blue-50 dark:bg-blue-900/40 p-3 rounded-2xl text-center flex flex-col items-center shadow-sm cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors active:scale-95">
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{summary.ijinCount}</span>
                      <span className="text-[9px] uppercase tracking-wider font-bold text-blue-700/60 dark:text-blue-500">Ijin</span>
                   </div>
                   <div onClick={() => setSummaryModalCategory('alpa')} className="bg-red-50 dark:bg-red-900/40 p-3 rounded-2xl text-center flex flex-col items-center shadow-sm cursor-pointer hover:bg-red-100 dark:hover:bg-red-800/40 transition-colors active:scale-95">
                      <span className="text-lg font-bold text-red-600 dark:text-red-400">{summary.alpaCount}</span>
                      <span className="text-[9px] uppercase tracking-wider font-bold text-red-700/60 dark:text-red-500">Alpa</span>
                   </div>
                   <div onClick={() => setSummaryModalCategory('lembur')} className="bg-amber-50 dark:bg-amber-900/40 p-3 rounded-2xl text-center flex flex-col items-center shadow-sm cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-800/40 transition-colors active:scale-95">
                      <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{summary.lemburHours.toFixed(1)}</span>
                      <span className="text-[9px] uppercase tracking-wider font-bold text-amber-700/60 dark:text-amber-500">Jam Lmbr</span>
                   </div>
                </div>

                {summaryModalCategory && (
                  <Dialog open={!!summaryModalCategory} onOpenChange={(open) => !open && setSummaryModalCategory(null)}>
                    <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 rounded-[2rem] border-0 shadow-2xl p-6 w-[90%] mx-auto max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-black capitalize tracking-tight text-gray-900 dark:text-white">
                          Rincian {summaryModalCategory === 'ijin' ? 'Ijin / Sakit' : summaryModalCategory}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="mt-4 space-y-3">
                        {summaryModalCategory === 'hadir' && summary.hadirDates.length === 0 && <p className="text-sm text-gray-500 italic text-center">Belum ada riwayat</p>}
                        {summaryModalCategory === 'hadir' && summary.hadirDates.map((d, i) => (
                           <div key={i} className="flex justify-between items-center bg-teal-50 dark:bg-teal-900/20 px-4 py-3 rounded-xl border border-teal-100 dark:border-teal-800/30">
                              <span className="font-bold text-sm text-teal-800 dark:text-teal-200">{format(d, "EEEE, dd MMM yyyy", { locale: id })}</span>
                           </div>
                        ))}
                        
                        {summaryModalCategory === 'telat' && summary.telatDates.length === 0 && <p className="text-sm text-gray-500 italic text-center">Belum ada riwayat</p>}
                        {summaryModalCategory === 'telat' && summary.telatDates.map((d, i) => (
                           <div key={i} className="flex justify-between items-center bg-yellow-50 dark:bg-yellow-900/20 px-4 py-3 rounded-xl border border-yellow-100 dark:border-yellow-800/30">
                              <span className="font-bold text-sm text-yellow-800 dark:text-yellow-200">{format(d, "EEEE, dd MMM yyyy", { locale: id })}</span>
                           </div>
                        ))}

                        {summaryModalCategory === 'ijin' && summary.ijinDates.length === 0 && <p className="text-sm text-gray-500 italic text-center">Belum ada riwayat</p>}
                        {summaryModalCategory === 'ijin' && summary.ijinDates.map((d, i) => (
                           <div key={i} className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 px-4 py-3 rounded-xl border border-blue-100 dark:border-blue-800/30">
                              <span className="font-bold text-sm text-blue-800 dark:text-blue-200">{format(d, "EEEE, dd MMM yyyy", { locale: id })}</span>
                           </div>
                        ))}

                        {summaryModalCategory === 'alpa' && summary.alpaDates.length === 0 && <p className="text-sm text-gray-500 italic text-center">Belum ada riwayat</p>}
                        {summaryModalCategory === 'alpa' && summary.alpaDates.map((d, i) => (
                           <div key={i} className="flex justify-between items-center bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl border border-red-100 dark:border-red-800/30">
                              <span className="font-bold text-sm text-red-800 dark:text-red-200">{format(d, "EEEE, dd MMM yyyy", { locale: id })}</span>
                           </div>
                        ))}
                        
                        {summaryModalCategory === 'lembur' && summary.lemburDetails.length === 0 && <p className="text-sm text-gray-500 italic text-center">Belum ada riwayat</p>}
                        {summaryModalCategory === 'lembur' && summary.lemburDetails.map((item, i) => (
                           <div key={i} className="flex justify-between items-center bg-amber-50 dark:bg-amber-900/20 px-4 py-3 rounded-xl border border-amber-100 dark:border-amber-800/30">
                              <span className="font-bold text-sm text-amber-800 dark:text-amber-200">{format(item.date, "EEEE, dd MMM", { locale: id })}</span>
                              <span className="text-xs font-black bg-amber-200 dark:bg-amber-700 text-amber-900 dark:text-amber-100 px-2 py-1 rounded-md">{item.hours.toFixed(1)} Jam</span>
                           </div>
                        ))}
                      </div>
                      <div className="mt-6">
                        <Button onClick={() => setSummaryModalCategory(null)} className="w-full rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 font-bold">Tutup</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                <div className="flex overflow-x-auto gap-3 py-4 px-2 -mx-2 mb-4 scrollbar-hide snap-x">
                    {eachDayOfInterval({ start: subDays(new Date(), 14), end: new Date() }).reverse().map(date => {
                       const isSelected = isSameDay(date, selectedDate);
                       const holiday = isHoliday(date);
                       const sunday = isSunday(date);
                       const saturday = isSaturday(date);
                       
                       let baseClass = 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300';
                       if (holiday) baseClass = 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
                       else if (sunday) baseClass = 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400';
                       else if (saturday) baseClass = 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
                       
                       let selectedClass = 'bg-teal-500 text-white shadow-lg shadow-teal-500/30';
                       if (holiday) selectedClass = 'bg-purple-500 text-white shadow-lg shadow-purple-500/30';
                       else if (sunday) selectedClass = 'bg-red-500 text-white shadow-lg shadow-red-500/30';
                       else if (saturday) selectedClass = 'bg-blue-500 text-white shadow-lg shadow-blue-500/30';

                       return (
                          <button
                              key={date.toString()}
                              onClick={() => setSelectedDate(date)}
                              className={`flex flex-col items-center justify-center p-2 rounded-[2rem] min-w-[65px] transition-all duration-300 snap-center relative focus:outline-none ${isSelected ? 'min-h-[90px] scale-110 z-10 ' + selectedClass : 'min-h-[75px] scale-100 opacity-90 hover:opacity-100 ' + baseClass}`}
                          >
                              <span className={`text-[10px] font-bold uppercase mb-1 ${isSelected ? 'opacity-90' : 'opacity-70'}`}>{format(date, "EEE", { locale: id })}</span>
                              <span className={`text-xl font-black ${isSelected ? 'scale-110' : ''}`}>{format(date, "dd")}</span>
                          </button>
                       );
                    })}
                </div>

                {((): any => {
                   const filteredHistory = myHistory.filter(log => isSameDay(new Date(log.timestamp), selectedDate));
                   if (filteredHistory.length === 0) {
                      return (
                        <Card className="bg-white dark:bg-gray-800 shadow-sm border-0">
                          <CardContent className="p-8 text-center text-gray-500 dark:text-gray-400">
                             Tidak ada riwayat absensi di tanggal {format(selectedDate, "dd MMM yyyy", { locale: id })}.
                          </CardContent>
                        </Card>
                      );
                   }
                   return (
                      <div className="space-y-3 pb-8">
                        {filteredHistory.map((log) => (
                          <Card key={log.id} className="bg-white dark:bg-gray-800 border-0 shadow-sm rounded-xl overflow-hidden">
                            <div className="flex p-4 items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${log.type === 'in' ? 'bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400' : log.type === 'overtime_in' ? 'bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' : log.type === 'overtime_out' ? 'bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400' : ['sick', 'permit', 'cuti', 'melahirkan', 'meninggal', 'dispensasi'].includes(log.type) ? 'bg-cyan-50 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400' : 'bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400'}`}>
                                  {['sick', 'permit', 'cuti', 'melahirkan', 'meninggal', 'dispensasi'].includes(log.type) ? <UserSquare2 className="w-5 h-5"/> : (log.type === 'in' || log.type === 'overtime_in') ? <Briefcase className="w-5 h-5"/> : <LogOut className="w-5 h-5"/>}
                                </div>
                                <div>
                                   <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">
                                     {log.type === 'in' ? 'Masuk' : log.type === 'out' ? 'Pulang' : log.type === 'overtime_in' ? 'Lembur Msk' : log.type === 'overtime_out' ? 'Lembur Plg' : log.type === 'sick' ? 'Sakit' : log.type === 'permit' ? 'Izin Biasa' : log.type === 'cuti' ? 'Cuti' : log.type === 'melahirkan' ? 'Cuti Hamil' : log.type === 'meninggal' ? 'Berduka' : log.type === 'dispensasi' ? 'Dispensasi' : log.type}
                                   </p>
                                   <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">{format(new Date(log.timestamp), "dd MMM yyyy")}</p>
                                </div>
                              </div>
                              <div className="text-right flex flex-col items-end">
                                 <p className="text-lg font-bold text-gray-800 dark:text-gray-100 tracking-tight">{format(new Date(log.timestamp), "HH:mm")}</p>
                                 <div className="flex items-center gap-1 mt-1">
                                   {log.isPending && (
                                     <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[8px] uppercase font-bold animate-pulse">
                                       <Activity className="w-2 h-2" /> Syncing
                                     </span>
                                   )}
                                   {log.status === "pending_approval" && <span className="inline-block px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 text-[8px] uppercase font-bold">Pending</span>}
                                   {log.status === "rejected" && <span className="inline-block px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[8px] uppercase font-bold">Ditolak</span>}
                                   <span className="inline-block px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-[9px] uppercase font-bold text-gray-600 dark:text-gray-300">
                                      {log.method}
                                   </span>
                                 </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                   );
                })()}

             </div>
           )}

           {view === "notifications" && (
             <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-xl mx-auto mb-24 pb-10">
                 <div className="sticky top-0 z-50 overflow-hidden flex items-center justify-between px-4 py-3 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border-b border-teal-500/10 dark:border-white/5 shadow-sm -mx-4 -mt-4 mb-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 via-transparent to-transparent dark:from-teal-950/20 pointer-events-none" />
                    <svg className="absolute inset-x-0 -top-4 w-full h-[150%] opacity-[0.05] dark:opacity-[0.03] pointer-events-none" viewBox="0 0 1440 320" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                      <path fill="#0d9488" d="M0,256L48,229.3C96,203,192,149,288,154.7C384,160,480,224,576,218.7C672,213,768,139,864,122.7C960,107,1056,149,1152,176C1248,203,1344,213,1392,218.7L1440,224L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
                    </svg>
                    <div className="relative z-10 flex items-center gap-3">
                       <button onClick={() => setView('home')} className="p-2 -ml-2 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-zinc-300 transition-colors">
                          <ArrowLeft className="w-5 h-5" />
                       </button>
                       <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                         <Bell className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                         Notifikasi In-App & Push
                       </h2>
                    </div>
                 </div>
                
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-white/50 dark:border-gray-700 shadow-xl overflow-hidden rounded-3xl p-6 relative">
                   <div className="space-y-3">
                      <p className="text-sm font-bold text-teal-700 dark:text-teal-300 uppercase tracking-widest">Notifikasi Terbaru</p>
                      {appNotifications.length === 0 ? (
                         <div className="text-center py-10 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                           <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                           <p className="text-xs font-bold text-slate-400">Belum ada notifikasi.</p>
                         </div>
                      ) : (
                         appNotifications.map((notif: any) => (
                           <div key={notif.id} onClick={async () => {
                             if (!notif.read) {
                               try {
                                  await updateDoc(doc(db, "notifications", notif.id), { read: true });
                               } catch (e) {
                                  console.error("Gagal update notifikasi", e);
                               }
                             }
                           }} className={`p-4 rounded-2xl border transition-all cursor-pointer ${notif.read ? 'bg-gray-50/50 dark:bg-gray-800/30 border-transparent opacity-70' : 'bg-white dark:bg-gray-800 border-teal-100 dark:border-teal-900/50 shadow-sm'}`}>
                              <div className="flex justify-between items-start mb-1">
                                <h4 className={`text-sm ${notif.read ? 'font-medium' : 'font-bold'} text-gray-900 dark:text-white`}>{notif.title}</h4>
                                <span className="text-[9px] text-slate-400 font-bold ml-2 shrink-0">{format(new Date(notif.createdAt), "dd MMM HH:mm")}</span>
                              </div>
                              <p className={`text-xs ${notif.read ? 'text-slate-500' : 'text-slate-600 dark:text-slate-300'}`}>{notif.body}</p>
                           </div>
                         ))
                      )}
                   </div>
                </Card>
             </div>
           )}

           {view === "profile" && (
             <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-xl mx-auto">
                {profileTab === "menu" && (
                  <>
                    <h2 className="text-xl font-bold px-2 dark:text-gray-100 flex items-center gap-2">
                      <User className="w-5 h-5 text-teal-600 dark:text-teal-400" /> Profil Saya
                    </h2>

                    <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-700/50">
                       <button 
                         onClick={() => setProfileTab('edit-profile')}
                         className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                       >
                         <div className="flex items-center gap-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                            <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-900/40 flex items-center justify-center text-teal-600 dark:text-teal-400">
                               <Edit className="w-4 h-4" />
                            </div>
                            Edit Profil & Wajah
                         </div>
                         <ChevronRight className="w-4 h-4 text-gray-400" />
                       </button>

                       <button 
                         onClick={() => setProfileTab('id-card')}
                         className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                       >
                         <div className="flex items-center gap-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                            <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
                               <IdCard className="w-4 h-4" />
                            </div>
                            ID Card Karyawan
                         </div>
                         <ChevronRight className="w-4 h-4 text-gray-400" />
                       </button>
                    </Card>

                    <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2 py-1 mt-4">Pengaturan</div>
                    <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-700/50">
                       <button 
                         onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                         className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                       >
                         <div className="flex items-center gap-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                            <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                               {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                            </div>
                            {theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                         </div>
                       </button>

                       {(user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'demo') && (
                         <button 
                           onClick={() => navigate('/dashboard')}
                           className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                         >
                           <div className="flex items-center gap-3 text-sm font-semibold text-teal-600 dark:text-teal-400">
                              <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-900/40 flex items-center justify-center">
                                 <SettingsIcon className="w-4 h-4" />
                              </div>
                              Admin Dashboard
                           </div>
                         </button>
                       )}

                       <button 
                         onClick={() => auth.signOut()}
                         className="w-full flex items-center justify-between p-4 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                       >
                         <div className="flex items-center gap-3 text-sm font-semibold text-red-500">
                            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                               <LogOut className="w-4 h-4" />
                            </div>
                            Keluar
                         </div>
                       </button>
                    </Card>

                    <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2 py-1 mt-4">Sistem</div>
                    <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-700/50">
                        <button 
                          onClick={async () => {
                             if (!settings?.fcmVapidKey) {
                               return;
                             }
                             toast.loading("Meminta izin push notification...");
                             const token = await requestFCMPermission(settings.fcmVapidKey);
                             toast.dismiss();
                             if (token) {
                                try {
                                  await updateDoc(doc(db, "users", user.uid), { fcmToken: token });
                                  toast.success("FCM Berhasil dikonfigurasi!", { description: "Notifikasi telah aktif." });
                                } catch (e) {
                                  toast.error("Gagal menyimpan token FCM ke database.");
                                }
                             }
                          }}
                          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                             <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                                <Bell className="w-4 h-4" />
                             </div>
                             <div className="text-left leading-tight">
                               <div className="font-semibold">Aktifkan Notifikasi</div>
                               <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">Push notification (FCM)</div>
                             </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                        </button>
                        <button 
                          onClick={() => setProfileTab('changelog')}
                          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-t border-gray-100 dark:border-gray-700/50"
                        >
                          <div className="flex items-center gap-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                             <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                <Info className="w-4 h-4" />
                             </div>
                             <div className="text-left leading-tight">
                                <div className="font-semibold">Tentang Aplikasi</div>
                                <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">Versi & Info Pembaruan</div>
                             </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                        </button>
                    </Card>
                  </>
                )}

                {profileTab === "id-card" && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between mb-4 px-2">
                       <div className="flex items-center">
                          <button onClick={() => setProfileTab('menu')} className="p-2 -ml-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-300">
                             <ArrowLeft className="w-5 h-5" />
                          </button>
                          <h2 className="text-xl font-bold ml-2 dark:text-gray-100">ID Card Karyawan</h2>
                       </div>
                       <Button variant="ghost" size="sm" className="text-teal-600 font-bold" onClick={() => setIdCardSide(idCardSide === 'front' ? 'back' : 'front')}>
                          {idCardSide === 'front' ? 'Lihat Belakang' : 'Lihat Depan'}
                       </Button>
                    </div>

                    {/* Portrait Name Tag ID Card */}
                    <div 
                      className="relative mx-auto rounded-[2.5rem] overflow-hidden shadow-2xl bg-white w-full max-w-[320px] aspect-[54/86] border-2 border-slate-100 dark:border-gray-800 transition-all duration-500 transform" 
                      ref={idCardRef}
                      onClick={() => setIdCardSide(idCardSide === 'front' ? 'back' : 'front')}
                    >
                      {/* Dominant Tosca Abstract Wave Background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-teal-800"></div>
                      
                      {/* Decorative Circles */}
                      <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-teal-300/10 rounded-full blur-3xl"></div>

                      <div className="relative z-10 w-full h-full flex flex-col items-center px-6 pt-6 pb-10 text-center">
                         {idCardSide === 'front' ? (
                            <div className="flex flex-col items-center w-full h-full animate-in slide-in-from-right-2 duration-300">
                               {/* Header Logo */}
                               <div className="mb-8 flex flex-col items-center justify-center gap-3 mt-4">
                                 {settings?.appLogoUrl ? (
                                    <img src={settings.appLogoUrl} alt="Logo" className="w-14 h-14 object-contain shadow-md filter brightness-0 invert" />
                                 ) : (
                                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
                                       <Activity className="w-8 h-8 text-white drop-shadow-md" />
                                    </div>
                                 )}
                                 <span className="text-2xl font-black text-white tracking-[0.1em] uppercase drop-shadow-sm">{settings?.appName || "FMI"}</span>
                               </div>

                               {/* Photo Section */}
                               <div className="relative mb-8 group">
                                  <div className="absolute inset-0 bg-white/30 rounded-[3rem] blur-2xl opacity-60 transform scale-110"></div>
                                  <div className="relative w-44 h-44 rounded-[3rem] bg-white border-4 border-white/40 shadow-2xl overflow-hidden flex items-center justify-center">
                                     {user?.avatarUrl ? (
                                        <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                     ) : (
                                        <span className="font-black text-teal-400 text-8xl">{user?.name?.[0]}</span>
                                      )}
                                  </div>
                               </div>

                               {/* Info Section */}
                               <div className="mt-2 space-y-3 w-full">
                                  <div className="space-y-1">
                                    <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-tight drop-shadow-md">{user?.name}</h2>
                                    <div className="h-1 w-12 bg-teal-300 mx-auto rounded-full opacity-60"></div>
                                  </div>
                                  
                                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 shadow-lg">
                                    <p className="text-[14px] font-black text-teal-50 uppercase tracking-[0.3em] mb-1">{user?.role}</p>
                                    <div className="flex items-center justify-center gap-2">
                                       <span className="text-[11px] font-bold text-teal-200/80 uppercase tracking-widest">ID: {user?.uniqueId}</span>
                                       <span className="text-teal-400/50">•</span>
                                       <div className="flex items-center gap-1.5">
                                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: resolvedShifts[getEffectiveShiftId(user, new Date())]?.color || '#fff' }}></div>
                                          <p className="text-[11px] font-bold text-teal-200/80 uppercase tracking-widest">
                                            {resolvedShifts[getEffectiveShiftId(user, new Date())]?.name || "CUSTOM"}
                                          </p>
                                       </div>
                                    </div>
                                  </div>
                               </div>

                               <div className="mt-auto pb-4">
                                  <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.5em]">EMPLOYEE IDENTIFICATION</p>
                               </div>
                            </div>
                         ) : (
                            <div className="flex flex-col items-center w-full h-full py-8 animate-in slide-in-from-left-2 duration-300">
                               <div className="mb-8">
                                  <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-4"></div>
                                  <h3 className="text-xl font-black text-white uppercase tracking-widest">VERIFIKASI</h3>
                               </div>

                               {/* Large QR Code */}
                               <div className="bg-white p-6 rounded-[3rem] shadow-2xl border-8 border-teal-400/20 flex flex-col items-center mb-8 transform hover:scale-105 transition-transform duration-300">
                                  <QRCodeCanvas value={user?.uid || "unknown"} size={180} level="H" className="mb-4" includeMargin={false} />
                                  <div className="flex items-center gap-2 px-4 py-1 bg-teal-50 rounded-full">
                                    <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></div>
                                    <p className="text-[10px] font-black text-teal-700 uppercase tracking-widest">VALID IDENTITY</p>
                                  </div>
                               </div>

                               {/* Instructions */}
                               <div className="mt-4 px-4 space-y-4">
                                  <div className="p-4 bg-black/10 backdrop-blur-sm rounded-2xl border border-white/10 text-center">
                                    <p className="text-[11px] font-bold text-teal-50 leading-relaxed uppercase tracking-wider">
                                       Scan kode QR di atas menggunakan aplikasi Scanner di POS Kehadiran untuk melakukan absensi secara otomatis.
                                    </p>
                                  </div>
                                  
                                  <div className="pt-4 border-t border-white/10">
                                    <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.3em] leading-loose">
                                       KARTU INI MERUPAKAN PROPERTI PERUSAHAAN.<br/>
                                       JIKA MENEMUKAN KARTU INI, MOHON KEMBALIKAN KE HRD {settings?.appName || "FMI"}.
                                    </p>
                                  </div>
                               </div>

                               <div className="mt-auto pb-2">
                                  <div className="flex items-center gap-2 opacity-30">
                                    <Activity className="w-4 h-4 text-white" />
                                    <span className="text-[10px] font-black text-white tracking-tighter uppercase">{settings?.appName || "FMI"} SYSTEM</span>
                                  </div>
                               </div>
                            </div>
                         )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 pt-4 px-2">
                       <Button variant="outline" className="flex flex-col h-auto py-3 gap-1.5 rounded-2xl font-semibold border-teal-100 text-teal-700 bg-teal-50 hover:bg-teal-100 dark:bg-gray-800 dark:border-gray-700 dark:text-teal-400" onClick={handleShareIDCard}>
                          <Share2 className="w-5 h-5" /> <span className="text-[10px] uppercase tracking-wider">Bagikan</span>
                       </Button>
                       <Button variant="outline" className="flex flex-col h-auto py-3 gap-1.5 rounded-2xl font-semibold border-purple-100 text-purple-700 bg-purple-50 hover:bg-purple-100 dark:bg-gray-800 dark:border-gray-700 dark:text-purple-400" onClick={handleDownloadIDCard}>
                          <Download className="w-5 h-5" /> <span className="text-[10px] uppercase tracking-wider">Unduh PDF</span>
                       </Button>
                    </div>
                  </div>
                )}

                {profileTab === "changelog" && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="flex items-center mb-4 px-2">
                       <button onClick={() => setProfileTab('menu')} className="p-2 -ml-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-300">
                          <ArrowLeft className="w-5 h-5" />
                       </button>
                       <h2 className="text-xl font-bold ml-2 dark:text-gray-100">Tentang Aplikasi</h2>
                    </div>

                    <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm rounded-xl p-6">
                      <div className="flex flex-col items-center justify-center mb-6">
                        <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/50 rounded-2xl flex items-center justify-center mb-3">
                          <Activity className="w-8 h-8 text-teal-600 dark:text-teal-400" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider">{settings?.appName || "ABSENKU"}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">Versi 3.9.9 (Terbaru)</p>
                      </div>

                      <div className="space-y-6">
                         <div>
                            <h4 className="text-sm font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                               <Fingerprint className="w-4 h-4" /> Fitur Tersedia
                            </h4>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                              <li className="flex gap-2.5">
                                <Check className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                                <span>Absensi Foto Selfie Otomatis dengan Deteksi Wajah AI & Geolocation.</span>
                              </li>
                              <li className="flex gap-2.5">
                                <Check className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                                <span>Mode Offline PWA: Absen tersimpan saat internet putus.</span>
                              </li>
                              <li className="flex gap-2.5">
                                <Check className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                                <span>Pengajuan Izin, Sakit, & Cuti dengan persetujuan Admin.</span>
                              </li>
                              <li className="flex gap-2.5">
                                <Check className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                                <span>Push Notification (FCM) untuk info penting dari perusahaan.</span>
                              </li>
                              <li className="flex gap-2.5">
                                <Check className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                                <span>Tampilan Admin Dashboard lengkap & Generate Laporan Excel/PDF/CSV.</span>
                              </li>
                              <li className="flex gap-2.5">
                                <Check className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                                <span>Real-Time Live Logs untuk memantau status absensi karyawan secara langsung.</span>
                              </li>
                              <li className="flex gap-2.5">
                                <Check className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                                <span>Integrasi Peta Live (Live Map) dengan layanan Google Maps API.</span>
                              </li>
                              <li className="flex gap-2.5">
                                <Check className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                                <span>Konfigurasi Geofencing & Multi-Area dengan radius dan titik kordinat cabang.</span>
                              </li>
                              <li className="flex gap-2.5">
                                <Check className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                                <span>Manajemen Lengkap Organisasi (Pengumuman, Akun Karyawan, Shift, & Token Referral).</span>
                              </li>
                              <li className="flex gap-2.5">
                                <Check className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                                <span>Navigasi Ul dan Header Fleksibel untuk mendukung performansi mobile dan layar sempit.</span>
                              </li>
                            </ul>
                         </div>

                         <div className="pt-4 border-t border-gray-100 dark:border-gray-700/50">
                            <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                               <Code className="w-4 h-4" /> Log Perubahan (Changelog)
                            </h4>
                            <div className="space-y-5">
                                 <div className="relative pl-4 border-l-2 border-indigo-500/30">
                                 <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-indigo-500"></div>
                                 <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.9.9 <span className="text-xs font-normal text-gray-500 ml-2">Baru saja</span></h5>
                                 <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                                    <li>Penyempurnaan Visual: Menambahkan aksen background vektor gelombang (Wave Vector SVG) dengan kombinasi warna gradien transparan pada setiap header navigasi demi menghilangkan kesan kosong & menjaga fluiditas antara komponen tanpa mengurangi readability teks.</li>
                                 </ul>
                               </div>

                                 <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                 <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                 <h5 className="font-bold text-gray-900 dark:text-gray-300 text-sm">Versi 3.9.8</h5>
                                 <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                                    <li>Perbaikan Bug: Menyelesaikan masalah unduhan file Laporan Excel (XLSX) yang berubah format menjadi .bin pada environment WebView Android (seperti aplkasi hasil build Sketchware Pro) dengan menerapkan metode unduhan data URI base64.</li>
                                 </ul>
                               </div>

                                 <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                 <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                 <h5 className="font-bold text-gray-900 dark:text-gray-300 text-sm">Versi 3.9.6</h5>
                                 <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                                    <li>Peningkatan Efisiensi: Menerapkan fitur kompresi gambar otomatis (Canvas Auto-Compression) saat pengambilan foto absen untuk mengurangi drastis ukuran file penyimpanan (storage), menghemat memori Firebase (Pay-As-You-Go), dan mempercepat proses upload tanpa kehilangan kejelasan detail.</li>
                                 </ul>
                               </div>

                                 <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                 <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                 <h5 className="font-bold text-gray-900 dark:text-gray-300 text-sm">Versi 3.9.5</h5>
                                 <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                                    <li>Peningkatan Performa & Stabilitas: Menghapus dependensi Deteksi Wajah AI (FaceAPI) di sisi klien. Hal ini menyelesaikan seluruh masalah error kamera di berbagai perangkat HP, secara signifikan menghemat baterai & memori (RAM), membuat absen jauh lebih cepat & ringan diganti dengan bingkai pemindai statis yang sangat stabil.</li>
                                 </ul>
                               </div>

                                 <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                 <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                 <h5 className="font-bold text-gray-900 dark:text-gray-300 text-sm">Versi 3.9.4</h5>
                                 <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                                    <li>Penyempurnaan Tampilan: Membuat Header profil pengguna beserta greeting text dan icon notifikasi menjadi fitur "Sticky" agar selalu berada di posisi teratas di setiap menu utama (Home, Riwayat, dan Profil).</li>
                                 </ul>
                               </div>

                                 <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                 <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                 <h5 className="font-bold text-gray-900 dark:text-gray-300 text-sm">Versi 3.9.3</h5>
                                 <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                                    <li>Penyempurnaan UI: Menambahkan fitur Show/Hide Peta Visual (GPS) pada menu Kamera Absen dengan efek transisi yang mulus.</li>
                                    <li>Penyempurnaan UI: Membuat Header Menu Kamera menjadi Sticky agar tidak ikut terscroll dan tetap terlihat dengan jelas saat scroll.</li>
                                 </ul>
                               </div>

                                 <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                 <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                 <h5 className="font-bold text-gray-900 dark:text-gray-300 text-sm">Versi 3.9.2</h5>
                                 <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                                    <li>Penyempurnaan Tampilan: Menambahkan animasi Show/Hide pada detail informasi di tampilan header Utama User untuk pengalaman visual yang lebih lega dan rapi.</li>
                                    <li>Penyempurnaan Visual: Penggunaan tema gelombang (Wave Background) seragam pada halaman utama aplikasi, konsisten dengan elemen di halaman Login & Register.</li>
                                 </ul>
                               </div>

                                 <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                 <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                 <h5 className="font-bold text-gray-900 dark:text-gray-300 text-sm">Versi 3.9.1</h5>
                                 <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                                    <li>Pembaruan PWA Otomatis: Aplikasi kini dapat memperbarui versinya (PWA auto-update) di latar belakang tanpa mengganggu atau memunculkan peringatan (pop-up) untuk pengguna.</li>
                                 </ul>
                               </div>

                                 <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                 <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                 <h5 className="font-bold text-gray-900 dark:text-gray-300 text-sm">Versi 3.9.0</h5>
                                 <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                                    <li>Peningkatan UI: Menambahkan efek berjalan (running text/marquee) pada nama area di halaman utama agar mendukung layar yang lebih kecil.</li>
                                    <li>Peningkatan Keamanan: Pembatasan 1 akun 1 perangkat (Device Lock), akun akan logout otomatis jika terdeteksi login di perangkat lain.</li>
                                    <li>Log Keamanan Khusus: Menambahkan tab peringatan keamanan di Dashboard Super Admin.</li>
                                    <li>Perbaikan Bug: Menyelesaikan masalah model Face API dengan memindahkannya ke direktori proxy yang aman agar berjalan dengan performa yang mantab!.</li>
                                 </ul>
                               </div>

                                 <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                 <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                 <h5 className="font-bold text-gray-900 dark:text-gray-300 text-sm">Versi 3.8.2</h5>
                                 <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                                    <li>Fitur Peta Live Baru: Menambahkan Live Map baru di Dashboard Admin untuk melacak dan melihat lokasi absensi karyawan yang tersebar (termasuk deteksi lokasi Fake GPS) secara interaktif.</li>
                                    <li>Penyempurnaan Tampilan: Membuat Header Layar Utama (Dashboard Admin & User) menjadi "Sticky" (tetap di posisinya saat halaman di-scroll ke bawah) untuk navigasi yang lebih elegan.</li>
                                 </ul>
                               </div>

                                 <div className="relative pl-4 border-l-2 border-teal-500/30">
                                 <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-teal-500"></div>
                                 <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.8.0</h5>
                                 <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                                    <li>Fitur Penghapusan Riwayat Absensi (Global & Per User) dengan Pop-up konfirmasi berjenjang untuk mencegah salah hapus.</li>
                                    <li>Fitur Koreksi Dispensasi Alpa pada Riwayat User oleh Admin dengan input keterangan.</li>
                                    <li>Pembaruan Kalkulasi Status Alpa: Kalkulasi berdasarkan Work Start Date (Mulai Kontrak) dan Work End Date (Selesai Kontrak), guna mencegah karyawan baru dinilai Alpa pada tanggal sebelum mereka mulai bekerja.</li>
                                 </ul>
                               </div>

                                 <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                 <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                 <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.7.7</h5>
                                 <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                                    <li>Memindahkan menu notifikasi ke header kanan, menggantikan logo aplikasi.</li>
                                 </ul>
                               </div>

                                 <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                 <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                 <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.7.6</h5>
                                 <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                                    <li>Redesign Navigation Bar: Menyederhanakan navigasi menjadi 3 menu (Riwayat, Home Floating, Profil) dan menghapus menu notifikasi.</li>
                                 </ul>
                               </div>

                                <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                 <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                 <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.7.1</h5>
                                 <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                                    <li>Efisiensi Shift Global: Menghapus pengaturan jam shift global, sistem kini sepenuhnya menggunakan Manajemen Shift dan Working Days yang lebih spesifik.</li>
                                    <li>Fitur Edit Area & Radius: Admin kini dapat mengedit detail dari area dan radius yang sudah ditambahkan tanpa harus menghapus lalu membuatnya kembali.</li>
                                 </ul>
                               </div>

                                <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                 <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                 <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.6.1</h5>
                                 <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                                    <li>Perbaikan Radius Fix: Menghilangkan limit radius pada visual map dan memperbaiki sinkronisasi antara radius global dan area (kini radius asli yang disetel admin akan ditampilkan sepenuhnya).</li>
                                 </ul>
                               </div>

                                <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                 <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                 <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.6.0</h5>
                                 <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                                    <li>Perbaikan Radius Geofence: Menghadirkan input radius & kordinat global yang sempat tersembunyi di Dashboard Admin, memungkinkan fleksibilitas setting wilayah kerja yang lebih besar (di atas 140m).</li>
                                    <li>Info Lokasi Real-Time: Pengguna kini dapat melihat di area/cabang mana mereka sedang berada langsung di dashboard utama.</li>
                                    <li>Optimasi Dashboard: Optimalisasi visual dan sinkronisasi data area untuk manajemen multi-cabang.</li>
                                 </ul>
                               </div>

                                <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                 <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                 <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.5.0</h5>
                                 <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                                    <li>Peningkatan Kemananan Identitas Barcode: Memperbaiki lookup identitas scanner barcode agar dapat bekerja menggunakan Firestore langsung dari QR code secara aman.</li>
                                    <li>Notifikasi Anomali Barcode: Notifikasi beda perangkat ditampilkan pada Admin Dashboard secara Real Time.</li>
                                 </ul>
                               </div>

                                <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                 <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                 <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.4.0</h5>
                                 <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                                    <li>Sekuritas Ganda Barcode: Mengimplementasikan verifikasi 2-langkah untuk fitur QR Scan. Setelah scan barcode, sistem akan mendeteksi identitas dan mewajibkan pengambilan foto verifikasi.</li>
                                    <li>Auto-Identity Mapping: Absensi akan otomatis dicatat sesuai dengan akun user yang terdaftar dalam barcode tersebut, memungkinkan satu perangkat digunakan untuk verifikasi banyak user.</li>
                                 </ul>
                               </div>

                               <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                 <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                 <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.3.0</h5>
                                 <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                                    <li>Pembersihan Sistem: Menghapus seluruh fitur dan referensi RFID untuk menyederhanakan antarmuka absen.</li>
                                 </ul>
                               </div>

                               <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                 <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                 <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.2.6</h5>
                                 <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                                    <li>Hak Akses Superadmin: Memberikan akses penuh bagi Superadmin untuk melakukan edit dan hapus (termasuk override status absensi).</li>
                                    <li>Perbaikan Hapus Foto: Memperbaiki kendala izin Firestore saat menghapus lampiran foto pada log absensi.</li>
                                 </ul>
                               </div>

                               <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                 <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                 <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.2.5</h5>
                                 <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                                    <li>Perbaikan Tombol Hapus Log: Memperbaiki izin Firestore untuk penghapusan log absensi dan mengoptimalkan urutan penghapusan file agar tidak terjadi tautan gambar rusak.</li>
                                    <li>Fitur Hapus Foto: Menambahkan kemampuan bagi Admin/Superadmin untuk menghapus hanya foto lampiran pada log absensi tanpa menghapus seluruh record.</li>
                                 </ul>
                               </div>

                               <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                 <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                 <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.2.4</h5>
                                 <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                                    <li>Peningkatan UI: Optimasi animasi transisi antar menu di halaman Dashboard Admin menjadi lebih mulus.</li>
                                 </ul>
                               </div>

                               <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                 <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                 <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.2.2</h5>
                                 <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                                    <li>Peningkatan Keamanan: Menyembunyikan dan menonaktifkan perubahan API Key (Google Maps & VAPID Key) dari tipe akun Demo di Dashboard Pengaturan.</li>
                                    <li>Perbaikan Bug Akses Basis Data: Memperbaiki kendala "Missing or insufficient permissions" yang terjadi pada sinkronisasi data realtime Absensi, Izin, dan Penggajian untuk akun non-admin.</li>
                                 </ul>
                               </div>

                               <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                 <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                 <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.2.1</h5>
                                 <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                                    <li>Perbaikan bug tampilan pada filter dropdown menu rekap absensi yang menyebabkan Invalid Hook Error.</li>
                                 </ul>
                               </div>

                               <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                 <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                 <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.2.0</h5>
                                 <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                                    <li>Fitur Baru: Penambahan Menu Rekap Absensi Admin. Fitur untuk menampilkan dan mendownload log kehadiran karyawan secara harian, mingguan, dan bulanan.</li>
                                 </ul>
                               </div>

                               <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                 <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                 <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.1.3</h5>
                                 <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                                    <li>Perbaikan bug tampilan teks tidak terlihat saat mode gelap (Dark Mode) aktif pada form Portal Pengumuman.</li>
                                 </ul>
                               </div>

                               <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                 <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                 <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.1.2</h5>
                                 <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                                    <li>Perbaikan tata letak tombol Export Laporan di tampilan Desktop / Mobile agar rata kanan.</li>
                                 </ul>
                               </div>

                               <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                 <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                 <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.1.1</h5>
                                 <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                                    <li>Perbaikan bug tampilan pada menu Export Laporan (Hydration Error - struktur tombol bertumpuk).</li>
                                 </ul>
                               </div>

                               <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                 <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                 <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.1.0</h5>
                                 <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                                    <li>Penambahan fitur nyata Generate Laporan (Export Excel, CSV, dan PDF) di Dashboard Admin.</li>
                                 </ul>
                               </div>
                               
                               <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                 <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                 <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.0.0</h5>
                                 <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                                    <li>Dukungan PWA (Progresive Web App) & Offline Mode.</li>
                                    <li>Optimalisasi kompresi foto base64 untuk menghemat kuota.</li>
                                    <li>Perbaikan tata letak responsive & ukuran UI menyesuaikan layar (Desktop/Tablet/Android).</li>
                                    <li>Perbaikan masalah menu bawah yang bertumpuk (overlap) dengan isi layar.</li>
                                    <li>Penayangan riwayat Log Perubahan & Fitur (Tentang Aplikasi).</li>
                                 </ul>
                               </div>

                               <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                 <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                 <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 2.1.0</h5>
                                 <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                                    <li>Integrasi Web Push Notification API untuk pesan dari Admin.</li>
                                    <li>Peningkatan limit AI Face-API Detection dan Auto-capture.</li>
                                 </ul>
                               </div>

                               <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                 <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                 <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 1.0.0 <span className="text-xs font-normal text-gray-500 ml-2">Rilis Awal</span></h5>
                                 <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                                    <li>Sistem Absensi Dasar (Masuk/Pulang).</li>
                                    <li>Validasi Jarak Titik Koordinat 50m.</li>
                                    <li>Auth dengan Firebase (Google/Email).</li>
                                 </ul>
                               </div>
                               
                            </div>
                         </div>
                      </div>
                    </Card>
                  </div>
                )}

                {profileTab === "edit-profile" && (
                  <div className="space-y-6 animate-in fade-in">
                    <div className="flex items-center mb-2 px-2">
                       <button onClick={() => setProfileTab('menu')} className="p-2 -ml-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-300">
                          <ArrowLeft className="w-5 h-5" />
                       </button>
                       <h2 className="text-xl font-bold ml-2 dark:text-gray-100">Edit Profilku</h2>
                    </div>

                    <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm rounded-2xl p-5 space-y-5">
                       {/* Face / Avatar Update */}
                       <div className="flex flex-col items-center">
                          {showFaceUpdateCam ? (
                            <div className="w-full flex flex-col items-center gap-3">
                               <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-teal-500 relative">
                                  <Webcam
                                    audio={false}
                                    ref={editWebcamRef}
                                    screenshotFormat="image/jpeg"
                                    screenshotQuality={0.8}
                                    className="w-full h-full object-cover scale-x-[-1]"
                                    videoConstraints={{ facingMode: "user" }}
                                  />
                               </div>
                               <div className="flex gap-2 w-full">
                                  <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowFaceUpdateCam(false)}>Batal</Button>
                                  <Button className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white" onClick={captureEditFace}>Ambil Foto</Button>
                               </div>
                            </div>
                          ) : (
                            <div className="relative group cursor-pointer" onClick={() => setShowFaceUpdateCam(true)}>
                               <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-xl bg-teal-100 flex items-center justify-center">
                                  {editFaceBase64 ? (
                                    <img src={editFaceBase64} alt="New Avatar" className="w-full h-full object-cover" />
                                  ) : user?.avatarUrl ? (
                                    <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="font-black text-teal-400 text-3xl">{user?.name?.[0]}</span>
                                  )}
                               </div>
                               <div className="absolute bottom-0 right-0 w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white pointer-events-none">
                                  <Camera className="w-4 h-4" />
                               </div>
                            </div>
                          )}
                          {!showFaceUpdateCam && <p className="text-xs text-gray-500 font-medium mt-3 text-center">Ketuk foto untuk memperbarui<br/>verifikasi wajah Anda.</p>}
                       </div>

                       <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                          <div className="space-y-1.5">
                             <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Nama Lengkap</label>
                             <Input 
                               value={editName}
                               onChange={(e) => setEditName(e.target.value)}
                               className="h-12 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl"
                               placeholder="Masukkan nama"
                             />
                          </div>

                          <div className="space-y-1.5">
                             <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5" /> Nomor WhatsApp
                             </label>
                             <Input 
                               value={editPhone}
                               onChange={(e) => setEditPhone(e.target.value)}
                               className="h-12 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl"
                               placeholder="081234567890"
                               type="tel"
                             />
                          </div>
                          
                          <div className="pt-2">
                             <Button 
                               variant="outline" 
                               onClick={handleResetPassword}
                               className="w-full h-12 rounded-xl border-dashed border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700 items-center justify-start gap-3 px-4 font-semibold"
                             >
                                <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                                   <Key className="w-3 h-3" />
                                </div>
                                Reset Password
                             </Button>
                             <p className="text-[10px] text-gray-400 mt-1.5 pl-1 leading-tight text-center">Tautan untuk membuat ulang password akan dikirimkan ke email <b>{user?.email}</b></p>
                          </div>
                       </div>

                       <Button 
                         className="w-full h-14 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-xl shadow-teal-500/20 mt-6"
                         onClick={handleSaveProfile}
                         disabled={isEditSaving}
                       >
                         {isEditSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                       </Button>
                    </Card>
                  </div>
                )}
             </div>
           )}
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
            <div className="sticky top-0 z-50 overflow-hidden flex items-center gap-3 px-4 py-3 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border-b border-teal-500/10 dark:border-white/5 shadow-sm mb-4">
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
    </>
  );
}
