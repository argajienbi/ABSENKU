
import { useState, useEffect, useRef } from "react";
import { format, isSameDay } from "date-fns";
import { toast } from "sonner";
import { doc, setDoc } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, db, handleFirestoreError, OperationType } from "../lib/firebase";
import { verifyFace } from "../lib/faceVerification";
import { uploadBase64Image } from "../lib/storage";

export function useUserAppLogic(user: any, settings: any, myHistory: any[], location: any, isWithinRadius: any, locationError: any, isFakeGPS: any, qrUserIdentity: any, type: any, resolvedShifts: any) {
  const [loading, setLoading] = useState(false);
  const [confirmData, setConfirmData] = useState<{ method: "selfie" | "qr"; photoBase64: string | null; extraData?: string } | null>(null);
  
  const webcamRef = useRef<any>(null);

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
          resolve(base64Str);
        }
      };
      img.onerror = () => resolve(base64Str);
    });
  };

  const checkPendingAndStartAttendance = async (method: "selfie" | "qr", pendingQRData: string | null, extraData?: string) => {
    if (!user) return;
    let finalMethod = method;
    let finalExtraData = extraData;
    if (method === "selfie" && pendingQRData) {
       finalMethod = "qr";
       finalExtraData = pendingQRData;
    }
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
          toast.error("Gagal mengambil foto. Pastikan kamera diizinkan.");
          setLoading(false);
          return;
        }
        photoBase64 = await compressImage(rawPhoto);
        if (!isDocumentCapture) {
          if (user.avatarUrl) {
            try {
               toast.info("Memverifikasi wajah...");
               const result = await verifyFace(photoBase64, user.avatarUrl);
               if (result === 'NO_MATCH') {
                  toast.error("Verifikasi Wajah Gagal.");
                  setLoading(false);
                  return;
               }
            } catch (e) {
               console.error("Verification failed", e);
            }
          }
        }
      }
      setConfirmData({ method: finalMethod, photoBase64, extraData: finalExtraData });
    } catch (error) {
       console.error("Error preparing attendance:", error);
       toast.error("Terjadi kesalahan.");
    } finally {
       setLoading(false);
    }
  };

  const submitAttendance = async (permitStartDate: any, permitEndDate: any, notes: string = "") => {
    if (!user || !confirmData) return;
    setLoading(true);
    try {
      const now = new Date();
      let status = "approved";
      const targetUid = qrUserIdentity?.uid || user.uid;
      const shiftId = qrUserIdentity?.shiftId || user.shiftId || "shift1";
      const shift = resolvedShifts[shiftId] || resolvedShifts.shift1;
      const todayWork = shift?.workDays[now.getDay()];

      if (type === "in" && todayWork) {
        const [startHour, startMin] = todayWork.start.split(':').map(Number);
        if (now.getHours() > startHour || (now.getHours() === startHour && now.getMinutes() > startMin)) {
          status = "pending_approval";
        }
      } else if (type === "out" && todayWork) {
        const [endHour, endMin] = todayWork.end.split(':').map(Number);
        if (now.getHours() < endHour || (now.getHours() === endHour && now.getMinutes() < endMin)) {
          status = "pending_approval";
        }
      } else if (["overtime_in", "overtime_out", "sick", "permit", "cuti", "melahirkan", "meninggal"].includes(type) || confirmData.method === "qr") {
        status = "pending_approval";
      }

      const attendanceId = `att_${Date.now()}_${targetUid}`;
      let finalPhotoData = confirmData.photoBase64 || "";
      if (finalPhotoData.startsWith('data:image')) {
          finalPhotoData = await uploadBase64Image(finalPhotoData, `attendance/${attendanceId}`);
      }
      
      let extraDataToUpload = confirmData.extraData || "";
      if (['sick', 'permit', 'cuti', 'melahirkan', 'meninggal'].includes(type) && type === 'cuti') {
         extraDataToUpload = `${permitStartDate ? format(permitStartDate, "yyyy-MM-dd") : ""}|${permitEndDate ? format(permitEndDate, "yyyy-MM-dd") : ""}`;
      }

      const attendancePayload: any = {
        userId: targetUid,
        userName: qrUserIdentity?.name || user.name || "Unknown",
        timestamp: Date.now(),
        type,
        method: confirmData.method,
        photoBase64: finalPhotoData,
        location: location || { lat: 0, lng: 0 },
        withinRadius: isWithinRadius,
        extraData: extraDataToUpload,
        notes,
        status
      };
      if (targetUid !== user.uid) {
        attendancePayload.deviceOwnerUid = user.uid;
        attendancePayload.deviceOwnerName = user.name;
      }
      await setDoc(doc(db, "attendance", attendanceId), attendancePayload);
      toast.success("Absensi berhasil dikirim.");
      setConfirmData(null);
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `attendance`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user || !user.email) return toast.error("Email tidak ditemukan");
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast.success(`Tautan reset password telah dikirim ke ${user.email}`);
    } catch (error) {
      toast.error("Gagal mengirim tautan reset password");
    }
  };

  return {
    loading, confirmData, setConfirmData, webcamRef,
    checkPendingAndStartAttendance, submitAttendance, handleResetPassword
  };
}
