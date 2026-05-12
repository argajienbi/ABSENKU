import { useState } from "react";
import { format } from "date-fns";
import { doc, updateDoc, setDoc } from "firebase/firestore";
import { ref, set } from "firebase/database";
import { db, rtdb } from "../../lib/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Check, X, Clock, HelpCircle, MapPin, Inbox, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";

export const ApprovalsTab = ({ user, filteredAttendances, usersList }: { user: any, filteredAttendances: any[], usersList: any[] }) => {
  const [rejectLogTarget, setRejectLogTarget] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const pendingApprovals = filteredAttendances.filter(a => a.status === "pending_approval" || a.status === "PENDING" || (["sick", "permit", "cuti", "melahirkan", "meninggal"].includes(a.type) && a.status !== "approved" && a.status !== "rejected"));

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "in": return "Absen Masuk";
      case "out": return "Absen Keluar";
      case "sick": return "Sakit";
      case "permit": return "Izin";
      case "cuti": return "Cuti";
      case "melahirkan": return "Melahirkan";
      case "meninggal": return "Meninggal";
      case "overtime_in": return "Lembur Masuk";
      case "overtime_out": return "Lembur Keluar";
      default: return type || "Unknown";
    }
  };

  const handleApprove = async (log: any) => {
    if (user?.role === "demo") { toast.error("Akun demo."); return; }
    setSubmittingId(log.id);
    try {
      await updateDoc(doc(db, "attendance", log.id), { status: "approved" });
      await setDoc(doc(db, "notifications", `notif_${Date.now()}_${log.userId}`), {
        userId: log.userId,
        title: "Persetujuan Diterima",
        body: `Pengajuan ${getTypeLabel(log.type)} Anda pada ${format(new Date(log.timestamp), "dd MMM yyyy")} telah disetujui.`,
        createdAt: Date.now(),
        read: false,
        type: "success"
      });
      await set(ref(rtdb, `notifications/users/${log.userId}/broadcast`), {
        title: "Persetujuan Diterima",
        message: `Pengajuan ${getTypeLabel(log.type)} Anda pada ${format(new Date(log.timestamp), "dd MMM yyyy")} telah disetujui.`,
        read: false,
        createdAt: Date.now()
      });
      toast.success("Pengajuan disetujui");
    } catch (e: any) {
      console.error(e);
      toast.error("Gagal menyetujui. Coba lagi.");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleReject = async () => {
    if (user?.role === "demo") { toast.error("Akun demo."); return; }
    if (!rejectLogTarget || !rejectReason.trim()) { toast.error("Alasan penolakan wajib diisi"); return; }
    
    setSubmittingId(rejectLogTarget.id);
    try {
      await updateDoc(doc(db, "attendance", rejectLogTarget.id), { 
          status: "rejected", 
          notes: rejectReason + (rejectLogTarget.notes ? ` (Pesan Asli: ${rejectLogTarget.notes})` : "") 
      });
      await setDoc(doc(db, "notifications", `notif_${Date.now()}_${rejectLogTarget.userId}`), {
        userId: rejectLogTarget.userId,
        title: "Persetujuan Ditolak",
        body: `Pengajuan ${getTypeLabel(rejectLogTarget.type)} Anda pada ${format(new Date(rejectLogTarget.timestamp), "dd MMM yyyy")} ditolak. Alasan: ${rejectReason}`,
        createdAt: Date.now(),
        read: false,
        type: "error"
      });
      await set(ref(rtdb, `notifications/users/${rejectLogTarget.userId}/broadcast`), {
        title: "Persetujuan Ditolak",
        message: `Pengajuan ${getTypeLabel(rejectLogTarget.type)} Anda pada ${format(new Date(rejectLogTarget.timestamp), "dd MMM yyyy")} ditolak. Alasan: ${rejectReason}`,
        read: false,
        createdAt: Date.now()
      });
      toast.success("Pengajuan ditolak");
      setRejectLogTarget(null);
      setRejectReason("");
    } catch (e: any) {
      console.error(e);
      toast.error("Gagal menolak pengajuan");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Persetujuan & Ajuan</h2>
          <p className="text-slate-500 dark:text-gray-400 mt-1 text-sm font-medium">Tinjau semua ajuan izin, cuti, lembur, dan absensi tertunda.</p>
        </div>
        <Badge variant="outline" className="px-4 py-1.5 rounded-full border-orange-200 text-orange-600 bg-orange-50 font-black text-sm tracking-widest gap-2 uppercase">
            <Clock className="w-4 h-4" />
            {pendingApprovals.length} AJUAN TERTUNDA
        </Badge>
      </div>

       <Card className="border-0 shadow-xl bg-white dark:bg-gray-900 rounded-3xl overflow-hidden ring-1 ring-slate-100 dark:ring-gray-800">
        <div className="p-0 border-b border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-900/50">
           {pendingApprovals.length === 0 ? (
               <div className="py-32 flex flex-col items-center justify-center text-center px-4">
                 <div className="w-24 h-24 bg-slate-100 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-6">
                   <Check className="w-10 h-10 text-slate-400 dark:text-gray-500" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 tracking-tight">Semua Bersih!</h3>
                 <p className="text-slate-500 dark:text-gray-400 text-sm max-w-sm">
                   Tidak ada persetujuan yang tertunda saat ini. Anda telah meninjau semua pengajuan.
                 </p>
               </div>
           ) : (
                <div className="overflow-x-auto w-full no-scrollbar">
                    <Table>
                        <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-gray-900/50 border-slate-100 dark:border-gray-800">
                            <TableHead className="font-bold text-slate-500 dark:text-gray-400 text-xs py-4">TANGGAL & WAKTU</TableHead>
                            <TableHead className="font-bold text-slate-500 dark:text-gray-400 text-xs py-4">KARYAWAN</TableHead>
                            <TableHead className="font-bold text-slate-500 dark:text-gray-400 text-xs py-4">JENIS AJUAN</TableHead>
                            <TableHead className="font-bold text-slate-500 dark:text-gray-400 text-xs py-4">KETERANGAN & LAMPIRAN</TableHead>
                            <TableHead className="font-bold text-slate-500 dark:text-gray-400 text-xs py-4 text-center">AKSI</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {pendingApprovals.map(log => {
                            const u = usersList.find((v: any) => v.uid === log.userId || v.id === log.userId);
                            return (
                                <TableRow key={log.id} className="border-b border-slate-100 dark:border-gray-800 hover:bg-slate-50/50 dark:hover:bg-gray-800/50">
                                   <TableCell className="px-4 py-4 align-top">
                                      <div className="font-bold text-slate-800 dark:text-white mb-0.5">{format(new Date(log.timestamp), "dd MMM yyyy")}</div>
                                      <div className="text-xs text-slate-500 font-mono tracking-widest">{format(new Date(log.timestamp), "HH:mm")} WIB</div>
                                   </TableCell>
                                   <TableCell className="px-4 py-4 align-top">
                                      <div className="font-bold text-slate-800 dark:text-white">{u?.name || log.userName || "User Tidak Dikenal"}</div>
                                      <div className="text-xs text-slate-500 uppercase tracking-widest">{u?.role || "Karyawan"}</div>
                                   </TableCell>
                                   <TableCell className="px-4 py-4 align-top">
                                       <Badge variant="outline" className={`
                                        ${(log.type === "sick" || log.type === "permit" || log.type === "cuti") ? "bg-amber-50 text-amber-600 border-amber-200" : 
                                          (log.type === "overtime_in" || log.type === "overtime_out") ? "bg-indigo-50 text-indigo-600 border-indigo-200" :
                                          "bg-rose-50 text-rose-600 border-rose-200"
                                        } rounded-sm px-2 py-0.5 uppercase tracking-widest font-black text-[10px]
                                       `}>
                                           {getTypeLabel(log.type)}
                                       </Badge>
                                       {log.method === "qr" && <span className="block mt-2 text-[10px] text-gray-400 font-bold tracking-widest uppercase">Via QR Code</span>}
                                   </TableCell>
                                   <TableCell className="px-4 py-4 align-top min-w-[240px]">
                                       <p className="text-sm text-slate-700 dark:text-gray-300 italic mb-2">"{log.notes || "Tidak ada keterangan."}"</p>
                                       {log.photoUrl && (
                                           <a href={log.photoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline">
                                               Lihat Foto Lampiran
                                           </a>
                                       )}
                                       {log.location && typeof log.location === 'object' && log.location.lat && (
                                            <a href={`https://www.google.com/maps?q=${log.location.lat},${log.location.lng}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 hover:text-teal-700 hover:underline ml-3">
                                               <MapPin className="w-3 h-3" /> Lihat Peta
                                           </a>
                                       )}
                                   </TableCell>
                                    <TableCell className="px-4 py-4 align-top">
                                        <div className="flex flex-col sm:flex-row justify-center gap-2">
                                            <Button 
                                                variant="outline" 
                                                disabled={submittingId === log.id}
                                                className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-600 hover:text-white transition-colors h-9 px-4 rounded-xl"
                                                onClick={() => handleApprove(log)}
                                            >
                                                {submittingId === log.id ? <Clock className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                                                <span className="text-xs font-black uppercase tracking-widest">Setuju</span>
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                disabled={submittingId === log.id}
                                                className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-600 hover:text-white transition-colors h-9 px-4 rounded-xl"
                                                onClick={() => setRejectLogTarget(log)}
                                            >
                                                <X className="w-4 h-4 mr-1" />
                                                <span className="text-xs font-black uppercase tracking-widest">Tolak</span>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        </TableBody>
                    </Table>
                </div>
           )}
        </div>
       </Card>

      {/* Reject Modal */}
      <Dialog open={!!rejectLogTarget} onOpenChange={(open) => !open && setRejectLogTarget(null)}>
        <DialogContent className="sm:max-w-md border-0 bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl p-0">
          <div className="px-6 pt-8 pb-4">
              <div className="mx-auto w-16 h-16 bg-rose-100 dark:bg-rose-900/40 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-rose-600 dark:text-rose-500" />
              </div>
              <DialogTitle className="text-xl text-center font-bold text-gray-900 dark:text-white">Tolak Ajuan</DialogTitle>
              <DialogDescription className="text-center text-gray-500 dark:text-gray-400 mt-2">
                Tuliskan alasan penolakan untuk ajuan ini. Alasan akan dikirimkan kepada <strong>{rejectLogTarget ? (usersList.find(u => u.uid === rejectLogTarget.userId || u.id === rejectLogTarget.userId)?.name || "Karyawan") : ""}</strong>.
              </DialogDescription>

              <div className="mt-6">
                  <textarea
                    autoFocus
                    placeholder="Contoh: Dokumen tidak jelas, tanggal salah, dll..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full min-h-[100px] bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl p-4 text-sm text-slate-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
              </div>
          </div>
          <DialogFooter className="px-6 py-4 bg-slate-50 dark:bg-gray-800/50 flex gap-2">
            <Button variant="ghost" onClick={() => setRejectLogTarget(null)} className="h-12 flex-1 rounded-xl font-bold">Batal</Button>
            <Button 
                onClick={handleReject} 
                className="h-12 flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black tracking-widest uppercase text-xs"
                disabled={submittingId === rejectLogTarget?.id || !rejectReason.trim()}
            >
                {submittingId === rejectLogTarget?.id ? "Menyimpan..." : "Kirim Penolakan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
