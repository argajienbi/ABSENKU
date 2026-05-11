
import { useState, useEffect, useRef } from "react";
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, setDoc, deleteDoc, getDocs, writeBatch, where } from "firebase/firestore";
import { ref, set } from "firebase/database";
import { db, rtdb, handleFirestoreError, OperationType } from "../lib/firebase";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { SHIFTS } from "../constants";
import { deleteFileFromStorage } from "../lib/storage";

export function useDashboardData(user: any, settings: any) {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [idRefsList, setIdRefsList] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);

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
               if (att.method === "qr" && att.deviceOwnerUid && att.deviceOwnerUid !== att.userId) {
                  const scannnerName = att.deviceOwnerName || 'User Lain';
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
    
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const uData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsersList(uData);
    }, (error) => {
       console.log('Cant list users', error);
    });

    const qRefs = query(collection(db, "idRefs"), orderBy("createdAt", "desc"));
    const unsubRefs = onSnapshot(qRefs, (snapshot) => {
      setIdRefsList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("idRefs snapshot error:", error));

    const qAnn = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsubAnn = onSnapshot(qAnn, (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("announcements snapshot error:", error));

    const qNotif = query(collection(db, "notifications"), where("userId", "in", ["all", "admin_only"]), orderBy("createdAt", "desc"));
    const unsubNotif = onSnapshot(qNotif, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) })) as any[];
      setSecurityLogs(logs.filter(l => l.userId === "admin_only" || l.type === "danger"));
    }, (error) => console.error("notifications snapshot error:", error));

    return () => { 
      unsub(); 
      unsubUsers(); 
      unsubRefs();
      unsubAnn();
      unsubNotif();
    };
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

  const saveSettings = async (newSettings: any) => {
    if (user?.role === "demo") {
      toast.error("Akun demo tidak diizinkan untuk menyimpan pengaturan.");
      return;
    }
    try {
      setLoadingConfig(true);
      await setDoc(doc(db, "settings", "global"), {
        ...settings,
        ...newSettings
      }, { merge: true });
      toast.success("Pengaturan berhasil disimpan");
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, "settings/global");
    } finally {
      setLoadingConfig(false);
    }
  };

  const publishAnnouncement = async (title: string, content: string, type: string) => {
    if (!title || !content) return toast.error("Semua field harus diisi");
    if (user?.role === "demo") return toast.error("Demo role tidak bisa mempublikasikan pengumuman");
    try {
       setLoadingConfig(true);
       await setDoc(doc(db, "announcements", `ann_${Date.now()}`), {
          title, content, type,
          createdAt: Date.now(),
          createdBy: user?.name,
       });

       await setDoc(doc(db, "notifications", `notif_${Date.now()}_all`), {
          userId: "all",
          title: `Pengumuman: ${title}`,
          body: content.length > 50 ? content.substring(0, 50) + "..." : content,
          createdAt: Date.now(),
          read: false,
          type
       });

       if (usersList) {
          const promises = usersList.map((u: any) => 
            set(ref(rtdb, `notifications/users/${u.id}/broadcast`), {
              title: `Pengumuman: ${title}`,
              message: content.length > 50 ? content.substring(0, 50) + "..." : content,
              read: false,
              createdAt: Date.now()
            })
          );
          await Promise.all(promises);
       }

       toast.success("Pengumuman berhasil dipublikasikan");
       return true;
    } catch (e) {
       toast.error("Gagal mempublikasikan pengumuman");
       return false;
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

  const deleteUser = async (selectedUserForEdit: any) => {
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
      await deleteDoc(doc(db, "users", (selectedUserForEdit.uid || selectedUserForEdit.id)));
      toast.success("User berhasil dihapus.");
      return true;
    } catch (e) {
      console.error("Error deleting user:", e);
      toast.error(`Gagal menghapus user: ${e instanceof Error ? e.message : 'Unknown error'}`);
      return false;
    }
  };

  const saveUserChanges = async (userId: string, data: any) => {
    if (user?.role === "demo") {
      toast.error("Akun demo tidak diizinkan untuk mengubah data karyawan.");
      return;
    }
    try {
      await updateDoc(doc(db, "users", userId), data);
      toast.success("Data user diperbarui successfully");
      return true;
    } catch (err) {
      toast.error("Gagal memperbarui data user");
      console.error(err);
      return false;
    }
  };

  const submitKoreksiAlpa = async (koreksiUser: any, koreksiDate: string, koreksiNotes: string) => {
    if (!koreksiDate || !koreksiUser) {
      toast.error("Tanggal harus dipilih");
      return;
    }
    try {
      const parts = koreksiDate.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const dateObj = new Date(year, month, day, 8, 0, 0);

      const attId = `att_${Date.now()}_${koreksiUser.id}`;
      const batch = writeBatch(db);

      const attRef = doc(db, "attendance", attId);
      batch.set(attRef, {
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

      const notifId = `notif_${Date.now()}_${koreksiUser.id}`;
      const notifRef = doc(db, "notifications", notifId);
      batch.set(notifRef, {
        userId: koreksiUser.uid || koreksiUser.id,
        title: "Dispensasi Kehadiran",
        body: `Admin telah menambahkan data kehadiran manual untuk Anda pada tanggal ${format(dateObj, "dd MMMM yyyy", { locale: id })}.`,
        createdAt: Date.now(),
        read: false,
        type: "success"
      });

      await batch.commit();

      await set(ref(rtdb, `notifications/users/${koreksiUser.id}/broadcast`), {
        title: "Dispensasi Kehadiran",
        message: `Admin telah menambahkan data kehadiran manual (Koreksi Alpa) untuk Anda.`,
        read: false,
        createdAt: Date.now()
      });

      toast.success("Dispensasi alpa berhasil ditambahkan!");
      return true;
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, "attendance");
      toast.error(`Gagal menambahkan dispensasi alpa: ${err.message}`);
      return false;
    }
  };

  const saveManualOvertime = async (overtimeUser: any, overtimeDate: string, overtimeStartTime: string, overtimeEndTime: string, overtimeNotes: string) => {
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
      const batch = writeBatch(db);
      
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

      batch.set(doc(db, "attendance", inId), {
         ...basePayload,
         timestamp: startDate.getTime(),
         type: "overtime_in",
      });

      batch.set(doc(db, "attendance", outId), {
         ...basePayload,
         timestamp: endDate.getTime(),
         type: "overtime_out",
      });

      const notifId = `notif_${Date.now()}_ov_${uId}`;
      batch.set(doc(db, "notifications", notifId), {
        userId: uId,
        title: "Data Lembur Ditambahkan",
        body: `Admin telah menambahkan data lembur manual untuk Anda pada tanggal ${format(new Date(overtimeDate), "dd MMMM yyyy", { locale: id })} (${overtimeStartTime} - ${overtimeEndTime}).`,
        createdAt: Date.now(),
        read: false,
        type: "success"
      });

      await batch.commit();

      await set(ref(rtdb, `notifications/users/${uId}/broadcast`), {
        title: "Data Lembur Ditambahkan",
        message: `Admin telah menambahkan data lembur manual untuk Anda (${overtimeStartTime} - ${overtimeEndTime}).`,
        read: false,
        createdAt: Date.now()
      });

      toast.success("Lembur ditambahkan dan tersimpan di riwayat user");
      return true;
    } catch (err: any) {
      console.error(err);
      toast.error("Gagal menambahkan lembur");
      return false;
    }
  };

  const handleDeleteAllHistory = async () => {
    if (user?.role !== "superadmin") return;
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
      return true;
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, "attendance");
      toast.error("Gagal menghapus riwayat masal");
      return false;
    }
  };

  const handleDeleteUserHistory = async (deleteUserTarget: any) => {
    if (user?.role !== "superadmin" || !deleteUserTarget) return;
    const targetUserId = deleteUserTarget.id;
    const userName = deleteUserTarget.name;

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
      return true;
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, "attendance");
      toast.error(`Gagal menghapus riwayat user ${userName}`);
      return false;
    }
  };

  return {
    attendances, usersList, loadingConfig, idRefsList, announcements, securityLogs,
    toggleGeofence, saveSettings, publishAnnouncement, deleteAnnouncement,
    deleteUser, saveUserChanges, submitKoreksiAlpa, saveManualOvertime,
    handleDeleteAllHistory, handleDeleteUserHistory
  };
}
