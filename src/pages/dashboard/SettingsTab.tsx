import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { MapPin, Plus, Trash2, Clock, Map, Settings2, LogOut, Settings as SettingsIcon } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "../../components/ui/dialog";

import { MapPicker } from "../../components/MapPicker";
import { Briefcase, CalendarDays, Settings, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { uploadFileToStorage } from "../../lib/storage";
import { setDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";


export function SettingsTab({
  settings, loadingConfig, appNameInput, setAppNameInput, 
  appLogoUrlInput, setAppLogoUrlInput, fcmVapidKeyInput, setFcmVapidKeyInput,
  googleMapsApiKeyInput, setGoogleMapsApiKeyInput, shiftsInput, setShiftsInput,
  holidaysInput, setHolidaysInput, areasInput, setAreasInput,
  newAreaLatInput, setNewAreaLatInput, newAreaLngInput, setNewAreaLngInput,
  newArea, setNewArea, editingAreaId, setEditingAreaId, newHoliday, setNewHoliday,
  toggleGeofence, saveSettings, user, idRefsList
}: any) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border-0 shadow-xl p-6">
                <div className="text-teal-700 dark:text-teal-300 text-[10px] font-black mb-6 uppercase tracking-widest flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Geofence Configuration
                </div>
                <div className="space-y-8">
                  <div className="flex items-center justify-between p-5 bg-teal-50/50 dark:bg-teal-900/20 rounded-2xl border border-teal-100 dark:border-teal-900/50 shadow-inner">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-black text-teal-900 dark:text-teal-50 tracking-tight uppercase">GEOFENCE RADIUS: {settings?.geofenceEnabled ? <span className="text-teal-600">AKTIF</span> : <span className="text-rose-500">NON-AKTIF</span>}</Label>
                      <p className="text-[10px] text-teal-600/70 dark:text-teal-400 font-bold tracking-wider">Aktifkan untuk membatasi lokasi absensi user berdasarkan area/cabang</p>
                    </div>
                    <Switch 
                      checked={settings?.geofenceEnabled || false} 
                      onCheckedChange={toggleGeofence} 
                      disabled={loadingConfig}
                      className="data-[state=checked]:bg-teal-600"
                    />
                  </div>
                </div>
              </Card>

              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border-0 shadow-xl p-6">
                <div className="text-teal-700 dark:text-teal-300 text-[10px] font-black mb-6 uppercase tracking-widest flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Manajemen Area / Cabang
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5 md:col-span-4">
                       <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nama Area</Label>
                       <Input value={newArea.name} onChange={e => setNewArea({...newArea, name: e.target.value})} className="border-teal-100 rounded-xl bg-white" placeholder="Contoh: Cabang Jakarta" />
                    </div>
                    <div className="space-y-1.5 md:col-span-4 mt-2">
                       <MapPicker 
                         center={{ lat: isNaN(parseFloat(newAreaLatInput)) ? -6.2088 : parseFloat(newAreaLatInput), lng: isNaN(parseFloat(newAreaLngInput)) ? 106.8456 : parseFloat(newAreaLngInput) }} 
                         radius={newArea.radius}
                         onLocationSelect={(lat, lng) => {
                           setNewAreaLatInput(lat.toString());
                           setNewAreaLngInput(lng.toString());
                         }} 
                       />
                       <p className="text-[10px] text-slate-400 font-medium italic mt-1 text-center w-full block">Ketuk pada peta untuk memilih lokasi cabang/area baru</p>
                    </div>
                    <div className="space-y-1.5">
                       <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Latitude</Label>
                       <Input type="text" value={newAreaLatInput} onChange={e => setNewAreaLatInput(e.target.value.replace(/,/g, '.'))} className="border-teal-100 rounded-xl bg-white font-mono text-sm" />
                    </div>
                    <div className="space-y-1.5">
                       <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Longitude</Label>
                       <Input type="text" value={newAreaLngInput} onChange={e => setNewAreaLngInput(e.target.value.replace(/,/g, '.'))} className="border-teal-100 rounded-xl bg-white font-mono text-sm" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2 flex items-end">
                       <div className="space-y-1.5 flex-1 pr-2">
                         <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Radius (Meter)</Label>
                         <Input type="number" value={newArea.radius} onChange={e => setNewArea({...newArea, radius: Number(e.target.value)})} className="border-teal-100 rounded-xl bg-white" />
                       </div>
                       <Button onClick={() => {
                          if (newArea.name) {
                            const areaId = editingAreaId || ("area_" + Date.now());
                            const parsedLat = parseFloat(newAreaLatInput);
                            const parsedLng = parseFloat(newAreaLngInput);
                            setAreasInput({ ...areasInput, [areaId]: { ...newArea, lat: isNaN(parsedLat) ? 0 : parsedLat, lng: isNaN(parsedLng) ? 0 : parsedLng } });
                            setNewArea({ name: "", radius: 100 });
                            setNewAreaLatInput("-6.2088");
                            setNewAreaLngInput("106.8456");
                            setEditingAreaId(null);
                          }
                       }} className="bg-teal-500 hover:bg-teal-600 h-10 px-6 rounded-xl font-bold uppercase text-[10px] text-white whitespace-nowrap">
                         {editingAreaId ? "SIMPAN" : "TAMBAH"}
                       </Button>
                       {editingAreaId && (
                         <Button onClick={() => {
                           setNewArea({ name: "", radius: 100 });
                           setNewAreaLatInput("-6.2088");
                           setNewAreaLngInput("106.8456");
                           setEditingAreaId(null);
                         }} variant="outline" className="h-10 px-4 rounded-xl font-bold uppercase text-[10px] text-slate-500">
                           BATAL
                         </Button>
                       )}
                    </div>
                  </div>

                  <div className="space-y-3 mt-4">
                    {Object.entries(areasInput || {}).map(([id, a]: [string, any]) => (
                      <div key={id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 dark:bg-gray-800/50 dark:border-gray-700/50 rounded-2xl">
                         <div>
                            <div className="font-bold text-sm text-teal-900 dark:text-teal-50">{a.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5 font-medium">
                               Lat: {a.lat}, Lng: {a.lng} | Radius: <span className="font-bold text-teal-600">{a.radius}m</span>
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                           <Button variant="ghost" className="text-teal-600 hover:text-teal-800 hover:bg-teal-50 dark:hover:bg-teal-900/40 rounded-xl text-xs font-bold" onClick={() => {
                              setEditingAreaId(id);
                              setNewArea({ name: a.name, radius: a.radius || 100 });
                              setNewAreaLatInput(a.lat?.toString() || "-6.2088");
                              setNewAreaLngInput(a.lng?.toString() || "106.8456");
                           }}>Edit</Button>
                           <Button variant="ghost" className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/40 rounded-xl text-xs font-bold" onClick={() => {
                              const newObj = {...areasInput};
                              delete newObj[id];
                              setAreasInput(newObj);
                              if (editingAreaId === id) {
                                setEditingAreaId(null);
                                setNewArea({ name: "", radius: 100 });
                              }
                           }}>Hapus</Button>
                         </div>
                      </div>
                    ))}
                    {Object.keys(areasInput || {}).length === 0 && <p className="text-xs text-slate-400 italic text-center py-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200">Belum ada area yang ditambahkan.</p>}
                  </div>
                  
                  <Button onClick={saveSettings} disabled={loadingConfig} className="w-full bg-teal-600 hover:bg-teal-700 h-12 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-lg mt-8 transition-all active:scale-95">
                    SIMPAN MANAJEMEN AREA
                  </Button>
                </div>
              </Card>

              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border-0 shadow-xl p-6 flex flex-col md:col-span-2">
                <div className="text-teal-700 dark:text-teal-300 text-[10px] font-black mb-6 uppercase tracking-widest flex items-center gap-2">
                   <Briefcase className="w-4 h-4" /> Shift & Working Days Management
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(shiftsInput).map(([id, shift]: [string, any]) => (
                    <div key={id} className="bg-teal-50/50 dark:bg-teal-900/20 p-4 rounded-2xl border border-teal-100 dark:border-teal-900/50 space-y-4">
                      <div className="flex justify-between items-center text-teal-700 dark:text-teal-300">
                        <Input 
                          value={shift.name} 
                          onChange={(e) => {
                            const newShifts = {...shiftsInput};
                            newShifts[id].name = e.target.value;
                            setShiftsInput(newShifts);
                          }}
                          className="bg-transparent border-0 font-black uppercase p-0 h-auto focus-visible:ring-0 text-sm w-32"
                        />
                        <div className="flex gap-2 items-center">
                          <Input 
                            type="color" 
                            value={shift.color} 
                            onChange={(e) => {
                              const newShifts = {...shiftsInput};
                              newShifts[id].color = e.target.value;
                              setShiftsInput(newShifts);
                            }}
                            className="w-8 h-8 rounded-full border-0 p-0 pointer cursor-pointer"
                          />
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                            onClick={() => {
                              const newShifts = {...shiftsInput};
                              delete newShifts[id];
                              setShiftsInput(newShifts);
                            }}
                          >
                            <LogOut className="w-4 h-4 rotate-45" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[8px] font-black uppercase text-slate-500">Jam Masuk</Label>
                          <Input 
                            type="time" 
                            value={shift.startTime || "08:00"} 
                            onChange={(e) => {
                              const newShifts = {...shiftsInput};
                              newShifts[id].startTime = e.target.value;
                              setShiftsInput(newShifts);
                            }}
                            className="h-8 py-1 text-[10px] px-2 rounded-lg"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[8px] font-black uppercase text-slate-500">Jam Pulang</Label>
                          <Input 
                            type="time" 
                            value={shift.endTime || "17:00"} 
                            onChange={(e) => {
                              const newShifts = {...shiftsInput};
                              newShifts[id].endTime = e.target.value;
                              setShiftsInput(newShifts);
                            }}
                            className="h-8 py-1 text-[10px] px-2 rounded-lg"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[8px] font-black uppercase text-slate-500">Toleransi (M)</Label>
                          <Input 
                            type="number" 
                            value={shift.gracePeriod || 0} 
                            onChange={(e) => {
                              const newShifts = {...shiftsInput};
                              newShifts[id].gracePeriod = Number(e.target.value);
                              setShiftsInput(newShifts);
                            }}
                            className="h-8 py-1 text-[10px] px-2 rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-teal-100/50">
                        {["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((dayName, idx) => {
                          const workDay = shift.workDays[idx];
                          return (
                            <div key={idx} className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-slate-500 w-16">{dayName}</span>
                              <div className="flex gap-2 items-center flex-1 justify-end">
                                {workDay ? (
                                  <>
                                    <Input 
                                      type="time" 
                                      value={workDay.start} 
                                      onChange={(e) => {
                                        const newShifts = {...shiftsInput};
                                        newShifts[id].workDays[idx].start = e.target.value;
                                        setShiftsInput(newShifts);
                                      }}
                                      className="h-7 py-1 text-[10px] w-20 px-2 rounded-lg"
                                    />
                                    <span>-</span>
                                    <Input 
                                      type="time" 
                                      value={workDay.end} 
                                      onChange={(e) => {
                                        const newShifts = {...shiftsInput};
                                        newShifts[id].workDays[idx].end = e.target.value;
                                        setShiftsInput(newShifts);
                                      }}
                                      className="h-7 py-1 text-[10px] w-20 px-2 rounded-lg"
                                    />
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-6 w-6 p-0 text-rose-500"
                                      onClick={() => {
                                        const newShifts = {...shiftsInput};
                                        newShifts[id].workDays[idx] = null;
                                        setShiftsInput(newShifts);
                                      }}
                                    ><LogOut className="w-3 h-3"/></Button>
                                  </>
                                ) : (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-7 text-[10px] uppercase font-black px-4 rounded-lg bg-white"
                                    onClick={() => {
                                      const newShifts = {...shiftsInput};
                                      newShifts[id].workDays[idx] = { start: "08:00", end: "16:00" };
                                      setShiftsInput(newShifts);
                                    }}
                                  >SET LIBUR</Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => {
                      const newId = `shift_${Date.now()}`;
                      setShiftsInput({
                        ...shiftsInput,
                        [newId]: {
                          name: "New Shift",
                          label: "Custom",
                          color: "#64748b",
                          startTime: "08:00",
                          endTime: "16:00",
                          gracePeriod: 0,
                          workDays: {
                            0: null,
                            1: { start: "08:00", end: "16:00" },
                            2: { start: "08:00", end: "16:00" },
                            3: { start: "08:00", end: "16:00" },
                            4: { start: "08:00", end: "16:00" },
                            5: { start: "08:00", end: "16:00" },
                            6: null
                          }
                        }
                      });
                    }}
                    className="border-2 border-dashed border-teal-200 dark:border-teal-900/50 rounded-2xl flex flex-col items-center justify-center p-8 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-all gap-2"
                  >
                    <Briefcase className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Tambah Shift Baru</span>
                  </button>
                </div>
                <Button onClick={saveSettings} disabled={loadingConfig} className="w-full bg-teal-600 hover:bg-teal-700 h-12 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-lg mt-8 transition-all active:scale-95">
                  SIMPAN PENGATURAN SHIFT
                </Button>
              </Card>

              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border-0 shadow-xl p-6 md:col-span-2">
                <div className="text-teal-700 dark:text-teal-300 text-[10px] font-black mb-6 uppercase tracking-widest flex items-center gap-2">
                   <CalendarDays className="w-4 h-4" /> Manual Holiday Table (Overwrites Automatic)
                </div>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input 
                      type="date" 
                      value={newHoliday} 
                      onChange={(e) => setNewHoliday(e.target.value)}
                      className="border-teal-100 dark:border-teal-900 bg-white dark:bg-gray-900 h-10 text-sm font-bold rounded-xl"
                    />
                    <Button 
                      onClick={() => {
                        if (newHoliday && !holidaysInput.includes(newHoliday)) {
                          setHolidaysInput([...holidaysInput, newHoliday].sort());
                          setNewHoliday("");
                        }
                      }}
                      className="bg-teal-500 hover:bg-teal-600 rounded-xl font-bold uppercase tracking-widest text-[10px] px-6"
                    >TAMBAH LIBUR</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {holidaysInput.map(h => (
                      <div key={h} className="bg-rose-50 border border-rose-100 text-rose-600 px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-2">
                        {format(new Date(h), "dd MMM yyyy")}
                        <button onClick={() => setHolidaysInput(holidaysInput.filter(d => d !== h))} className="hover:text-rose-800">
                          <LogOut className="w-3 h-3 rotate-45" />
                        </button>
                      </div>
                    ))}
                    {holidaysInput.length === 0 && <p className="text-xs text-slate-400 italic">Belum ada hari libur manual yang ditambahkan.</p>}
                  </div>
                  <Button onClick={saveSettings} disabled={loadingConfig} className="w-full bg-teal-600 hover:bg-teal-700 h-12 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-lg mt-4 transition-all active:scale-95">
                    SIMPAN DAFTAR LIBUR
                  </Button>
                </div>
              </Card>

              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border-0 shadow-xl p-6 md:col-span-2">
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

              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border-0 shadow-xl p-6 md:col-span-2">
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
                    SIMPAN PENGATURAN FCM
                  </Button>
                </div>
              </Card>

              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border-0 shadow-xl p-6 md:col-span-2">
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
                        {idRefsList.map((refData) => (
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
                        {idRefsList.length === 0 && (
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
