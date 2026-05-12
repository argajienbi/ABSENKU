import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../../components/ui/dropdown-menu";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../../components/ui/table";
import { Download, ChevronDown, Trash2, MapPin } from "lucide-react";
import { BankingStyleDashboardCards } from "../../components/BankingStyleDashboardCards";
import { format } from "date-fns";

import { toast } from "sonner";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { updateDoc, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db, rtdb } from "../../lib/firebase";
import { ref, set } from "firebase/database";
import { SHIFTS } from "../../constants";
import { deleteFileFromStorage } from "../../lib/storage";
import { CheckCircle2 } from "lucide-react";


export function OverviewTab({ user, filteredAttendances, filteredUsersList, setConfirmDeleteGlobal }: any) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
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
                      const header = ["Nama Karyawan", "Role", "Shift", "PT / Perusahaan", "Area / Regional", "Cabang / Ruangan", "ID Karyawan", "Tanggal Transaksi", "Jam Transaksi", "Tipe", "Metode", "Status Radius", "Catatan", "Status Approval", "Pemindai (Scanner)"];
                      let allRecords: any[][] = [header];
                      
                      filteredUsersList.forEach(usr => {
                        const userAttendances = filteredAttendances.filter(a => a.userId === usr.uid || a.userId === usr.id);
                        
                        const ptName = usr.companyId && usr.companyId !== 'global' ? usr.companyId : "ALL"; 
                        const areaName = usr.areaId && usr.areaId !== 'global' ? usr.areaId : "ALL";
                        const branchName = usr.branchId && usr.branchId !== 'global' ? usr.branchId : "ALL";

                        if (userAttendances.length === 0) {
                          allRecords.push([usr.name || "-", usr.role || "-", usr.shiftId || "-", ptName, areaName, branchName, usr.uniqueId || "-", "-", "-", "-", "-", "-", "-", "-", "-"]);
                        } else {
                          userAttendances.forEach(log => {
                            let scanner = "-";
                            if (log.method === "qr" && log.deviceOwnerUid && log.deviceOwnerUid !== log.userId) {
                              scanner = log.deviceOwnerName || log.deviceOwnerUid;
                            } else if (log.method === "qr") {
                              scanner = "Diri Sendiri";
                            }
                            
                            allRecords.push([
                              usr.name || "-", usr.role || "-", usr.shiftId || "-", ptName, areaName, branchName, usr.uniqueId || "-",
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
                      // Gunakan base64 untuk WebView Android (Sketchware) agar tidak jadi .bin
                      const b64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
                      const a = document.createElement('a');
                      a.href = "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64," + b64;
                      a.download = `Laporan_Absensi_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
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
                      const header = ["Nama Karyawan", "Role", "Shift", "ID Karyawan", "Tanggal Transaksi", "Jam Transaksi", "Tipe Transaksi", "Metode", "Status Validasi Radius", "Catatan Laporan Tambahan", "Keterangan Pegawai", "Status Approval", "Pemindai (Scanner)"].map(h => `"${h}"`).join(',');
                      let allRecords: string[] = [];
                      filteredUsersList.forEach(usr => {
                        const userAttendances = filteredAttendances.filter(a => a.userId === usr.uid || a.userId === usr.id);
                        if (userAttendances.length === 0) {
                          allRecords.push([usr.name || "N/A", usr.role || "N/A", usr.shiftId || "N/A", usr.uniqueId || "N/A", "-", "-", "-", "-", "-", "-", "-", "-", "-"].map(v => `"${v}"`).join(','));
                        } else {
                          userAttendances.forEach(log => {
                            let scanner = "-";
                            if (log.method === "qr" && log.deviceOwnerUid && log.deviceOwnerUid !== log.userId) {
                              scanner = log.deviceOwnerName || log.deviceOwnerUid;
                            } else if (log.method === "qr") {
                              scanner = "Diri Sendiri";
                            }
                            allRecords.push([usr.name || "N/A", usr.role || "N/A", usr.shiftId || "N/A", usr.uniqueId || "N/A", format(new Date(log.timestamp), "yyyy-MM-dd"), format(new Date(log.timestamp), "HH:mm:ss"), log.type, log.method, log.withinRadius ? "Ya" : "Tidak/Manual", log.extraData ? log.extraData.replace(/,/g, ' ') : "-", log.notes ? log.notes.replace(/,/g, ' ') : "-", log.status || "APPROVED", scanner].map(v => `"${v}"`).join(','));
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
                            <div className="mt-1 flex flex-col gap-1 items-start">
                               <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${log.status === 'approved' ? 'bg-green-100 text-green-700' : log.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                 {log.status === 'approved' ? 'Disetujui' : log.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                               </span>
                               {log.notes && (
                                  <div className="mt-1 w-full max-w-[120px] sm:max-w-[150px]">
                                    <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-0.5">Keterangan:</div>
                                    <div className="text-[10px] text-gray-600 dark:text-gray-300 italic truncate" title={log.notes}>"{log.notes}"</div>
                                  </div>
                               )}
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
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${log.status === 'rejected' ? 'bg-rose-500 text-white' : log.status === 'approved' ? 'bg-teal-500 text-white' : log.status === 'pending_approval' || log.status === 'PENDING' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500 dark:bg-gray-700 dark:text-gray-300'}`}>
                                  {log.status === 'pending_approval' || log.status === 'PENDING' ? 'MENUNGGU' : (log.status || 'APPROVED')}
                                </span>
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
                      {filteredAttendances.length === 0 && (
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
          </div>
  );
}
