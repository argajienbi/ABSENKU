import React from 'react';
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Settings, UserPlus, LogOut } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { uploadFileToStorage } from "../../lib/storage";
import { setDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export function SettingsSystemTab({
  loadingConfig, appNameInput, setAppNameInput, 
  appLogoUrlInput, setAppLogoUrlInput, fcmVapidKeyInput, setFcmVapidKeyInput,
  googleMapsApiKeyInput, setGoogleMapsApiKeyInput,
  saveSettings, user, idRefsList
}: any) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border-0 shadow-xl p-6">
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

      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border-0 shadow-xl p-6">
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
            SIMPAN PENGATURAN FCM & MAPS
          </Button>
        </div>
      </Card>

      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border-0 shadow-xl p-6">
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
                {idRefsList?.map((refData: any) => (
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
                {(!idRefsList || idRefsList.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-xs text-slate-400 italic">Belum ada ID REF yang dibuat.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>
    </div>
  );
}
