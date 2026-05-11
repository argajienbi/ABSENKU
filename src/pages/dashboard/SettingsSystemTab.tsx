import React from 'react';
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Settings, UserPlus, LogOut, Map, Globe } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Switch } from "../../components/ui/switch";
import { uploadFileToStorage } from "../../lib/storage";
import { setDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export function SettingsSystemTab({
  loadingConfig, appNameInput, setAppNameInput, 
  appLogoUrlInput, setAppLogoUrlInput,
  useGoogleMapsInput, setUseGoogleMapsInput,
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
            <Map className="w-4 h-4" /> Provider Peta Utama
        </div>
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-black text-slate-700 dark:text-gray-200 uppercase tracking-wider">Gunakan Google Maps</Label>
              <p className="text-[10px] text-gray-500">
                Gunakan layanan Google Maps (berbayar setelah kuota gratis habis) atau Leaflet/OpenStreetMap (Gratis Selamanya).
              </p>
            </div>
            <Switch 
              checked={useGoogleMapsInput} 
              onCheckedChange={setUseGoogleMapsInput} 
              disabled={user?.role === "demo"}
            />
          </div>

          {!useGoogleMapsInput && (
             <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-900/30 border border-teal-100 dark:border-teal-800 flex items-start gap-3">
                <Globe className="w-4 h-4 text-teal-600 dark:text-teal-400 mt-0.5 shrink-0" />
                <div>
                   <p className="text-xs font-bold text-teal-700 dark:text-teal-300">Mode Peta Gratis Aktif</p>
                   <p className="text-[10px] text-teal-600/80 dark:text-teal-400/80 leading-relaxed">
                      Sistem saat ini menggunakan OpenStreetMap. Fungsi penentuan lokasi, geofence, dan pantauan tetap bekerja normal tanpa biaya tambahan.
                   </p>
                </div>
             </div>
          )}

          {useGoogleMapsInput && (
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border flex flex-col gap-3">
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
                  Peta premium Google Maps memerlukan API Key yang valid. Pastikan Maps JavaScript API telah diaktifkan di Google Cloud Console.
                </p>
              </div>
            </div>
          )}

          <Button onClick={saveSettings} disabled={loadingConfig} className="w-full bg-teal-600 hover:bg-teal-700 h-12 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-lg mt-2 transition-all active:scale-95">
            SIMPAN KONFIGURASI PETA
          </Button>
        </div>
      </Card>
    </div>
  );
}
