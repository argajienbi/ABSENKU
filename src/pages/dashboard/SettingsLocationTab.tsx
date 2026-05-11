import React from 'react';
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { MapPin } from "lucide-react";
import { MapPicker } from "../../components/MapPicker";

export function SettingsLocationTab({
  settings, loadingConfig, areasInput, setAreasInput,
  newAreaLatInput, setNewAreaLatInput, newAreaLngInput, setNewAreaLngInput,
  newArea, setNewArea, editingAreaId, setEditingAreaId,
  toggleGeofence, saveSettings,
  companiesInput, setCompaniesInput, newCompany, setNewCompany,
  branchesInput, setBranchesInput, newBranch, setNewBranch
}: any) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border-0 shadow-xl p-6">
        <div className="text-teal-700 dark:text-teal-300 text-[10px] font-black mb-6 uppercase tracking-widest flex items-center gap-2">
          Manajemen PT / Perusahaan
        </div>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input value={newCompany?.name || ""} onChange={e => setNewCompany({name: e.target.value})} placeholder="Nama PT / Perusahaan (Contoh: PT. Abadi Jaya)" className="bg-white" />
            <Button onClick={() => {
              if (settings?.role === "demo") return;
              if (!newCompany?.name) return;
              const id = `pt_${Date.now()}`;
              setCompaniesInput({ ...companiesInput, [id]: { name: newCompany.name } });
              setNewCompany({ name: "" });
            }} className="bg-teal-600 hover:bg-teal-700 text-white font-bold">Tambah</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(companiesInput || {}).map(([id, c]: [string, any]) => (
              <div key={id} className="flex justify-between items-center p-3 rounded-xl border border-teal-100 bg-teal-50 dark:bg-teal-900/10 dark:border-teal-900 border-dashed">
                <span className="text-xs font-bold text-teal-900 dark:text-teal-50">{c.name}</span>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-rose-500 hover:text-rose-600" onClick={() => {
                  const newObj = {...companiesInput};
                  delete newObj[id];
                  setCompaniesInput(newObj);
                }}>Hapus</Button>
              </div>
            ))}
            {Object.keys(companiesInput || {}).length === 0 && <p className="text-xs text-slate-400 italic text-center py-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 w-full sm:col-span-2">Belum ada PT / Perusahaan.</p>}
          </div>
        </div>
      </Card>

      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border-0 shadow-xl p-6">
        <div className="text-teal-700 dark:text-teal-300 text-[10px] font-black mb-6 uppercase tracking-widest flex items-center gap-2">
          Manajemen Cabang / Ruangan
        </div>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input value={newBranch?.name || ""} onChange={e => setNewBranch({name: e.target.value, areaId: newBranch?.areaId || ""})} placeholder="Nama Cabang / Ruangan (Contoh: Cabang Bekasi)" className="bg-white" />
            <Button onClick={() => {
              if (settings?.role === "demo") return;
              if (!newBranch?.name) return;
              const id = `cb_${Date.now()}`;
              setBranchesInput({ ...branchesInput, [id]: { name: newBranch.name, areaId: newBranch.areaId } });
              setNewBranch({ name: "", areaId: "" });
            }} className="bg-teal-600 hover:bg-teal-700 text-white font-bold">Tambah</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(branchesInput || {}).map(([id, b]: [string, any]) => (
              <div key={id} className="flex justify-between items-center p-3 rounded-xl border border-teal-100 bg-teal-50 dark:bg-teal-900/10 dark:border-teal-900 border-dashed">
                <span className="text-xs font-bold text-teal-900 dark:text-teal-50">{b.name}</span>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-rose-500 hover:text-rose-600" onClick={() => {
                  const newObj = {...branchesInput};
                  delete newObj[id];
                  setBranchesInput(newObj);
                }}>Hapus</Button>
              </div>
            ))}
            {Object.keys(branchesInput || {}).length === 0 && <p className="text-xs text-slate-400 italic text-center py-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 w-full sm:col-span-2">Belum ada Cabang / Ruangan yang ditambahkan.</p>}
          </div>
        </div>
      </Card>

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
    </div>
  );
}
