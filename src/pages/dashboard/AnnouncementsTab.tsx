import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Label } from "../../components/ui/label";
import { Trash2, Briefcase } from "lucide-react";
import { format } from "date-fns";

export function AnnouncementsTab({
  announcementTitle, setAnnouncementTitle,
  announcementContent, setAnnouncementContent,
  announcementType, setAnnouncementType,
  announcements, publishAnnouncement, deleteAnnouncement, loadingConfig
}: any) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
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
          </div>
  );
}
