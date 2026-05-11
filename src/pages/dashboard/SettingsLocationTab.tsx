import React, { useState } from 'react';
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { MapPin, Building, Map } from "lucide-react";
import { MapPicker } from "../../components/MapPicker";
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { toast } from 'sonner';

export function SettingsLocationTab({
  settings, loadingConfig, toggleGeofence,
  areas, companies, branches, subareas, user
}: any) {
  // Area (Provinsi)
  const [newArea, setNewArea] = useState<any>({ name: "" });
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);

  // Company (PT)
  const [newCompany, setNewCompany] = useState<any>({ name: "", areaId: "" });

  // Branch (Cabang / Kordinat)
  const [newBranch, setNewBranch] = useState<any>({ name: "", companyId: "" });
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);

  // SubArea (Titik Koordinat)
  const [newSubArea, setNewSubArea] = useState<any>({ name: "", branchId: "", radius: 100 });
  const [editingSubAreaId, setEditingSubAreaId] = useState<string | null>(null);
  const [newSubAreaLatInput, setNewSubAreaLatInput] = useState("-6.2088");
  const [newSubAreaLngInput, setNewSubAreaLngInput] = useState("106.8456");

  const handleSaveArea = async () => {
    if (user?.role === "demo") { toast.error("Akun demo."); return; }
    if (!newArea.name) { toast.error("Isi Nama Provinsi/Wilayah"); return; }
    try {
      const areaId = editingAreaId || ("area_" + Date.now());
      await setDoc(doc(db, "areas", areaId), { name: newArea.name });
      setNewArea({ name: "" });
      setEditingAreaId(null);
      toast.success("Provinsi/Wilayah disimpan");
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, "areas");
    }
  };

  const handleAddCompany = async () => {
    if (user?.role === "demo") { toast.error("Akun demo."); return; }
    if (!newCompany?.name) { toast.error("Isi Nama Perusahaan"); return; }
    if (!newCompany?.areaId) { toast.error("Pilih Provinsi/Wilayah terlebih dahulu"); return; }
    try {
      const id = `pt_${Date.now()}`;
      await setDoc(doc(db, "companies", id), { name: newCompany.name, areaId: newCompany.areaId });
      setNewCompany({ name: "", areaId: "" });
      toast.success("Perusahaan ditambahkan");
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, "companies");
    }
  };

  const handleSaveBranch = async () => {
    if (user?.role === "demo") { toast.error("Akun demo."); return; }
    if (!newBranch?.name) { toast.error("Isi Nama Cabang"); return; }
    if (!newBranch?.companyId) { toast.error("Pilih PT / Perusahaan"); return; }
    
    // Auto-detect areaId based on companyId
    const targetComp = companies?.[newBranch.companyId];
    const targetAreaId = newBranch.areaId || (targetComp ? targetComp.areaId : "global");

    try {
      const id = editingBranchId || `cb_${Date.now()}`;
      await setDoc(doc(db, "branches", id), { 
        name: newBranch.name, 
        areaId: targetAreaId, 
        companyId: newBranch.companyId
      });
      setNewBranch({ name: "", companyId: "" });
      setEditingBranchId(null);
      toast.success("Cabang / Area disimpan");
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan cabang");
      handleFirestoreError(e, OperationType.WRITE, "branches");
    }
  };

  const handleSaveSubArea = async () => {
    if (user?.role === "demo") { toast.error("Akun demo."); return; }
    if (!newSubArea?.name) { toast.error("Isi Nama Sub Area"); return; }
    if (!newSubArea?.branchId) { toast.error("Pilih Cabang / Area"); return; }
    
    try {
      const id = editingSubAreaId || `sa_${Date.now()}`;
      const parsedLat = parseFloat(newSubAreaLatInput);
      const parsedLng = parseFloat(newSubAreaLngInput);
      await setDoc(doc(db, "subareas", id), { 
        name: newSubArea.name, 
        branchId: newSubArea.branchId,
        radius: newSubArea.radius,
        lat: isNaN(parsedLat) ? 0 : parsedLat, 
        lng: isNaN(parsedLng) ? 0 : parsedLng,
      });
      setNewSubArea({ name: "", branchId: "", radius: 100 });
      setNewSubAreaLatInput("-6.2088");
      setNewSubAreaLngInput("106.8456");
      setEditingSubAreaId(null);
      toast.success("Sub Area / Titik Koordinat disimpan");
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan sub area");
      handleFirestoreError(e, OperationType.WRITE, "subareas");
    }
  };

  const handleDeleteArea = async (id: string) => {
    await deleteDoc(doc(db, "areas", id));
    toast.success("Provinsi dihapus");
  };
  const handleDeleteCompany = async (id: string) => {
    await deleteDoc(doc(db, "companies", id));
    toast.success("Perusahaan dihapus");
  };
  const handleDeleteBranch = async (id: string) => {
    await deleteDoc(doc(db, "branches", id));
    toast.success("Cabang dihapus");
  };
  const handleDeleteSubArea = async (id: string) => {
    await deleteDoc(doc(db, "subareas", id));
    toast.success("Sub Area dihapus");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
      {/* LEVEL 1: PROVINSI */}
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border-0 shadow-xl p-6">
        <div className="text-teal-700 dark:text-teal-300 text-[10px] font-black mb-6 uppercase tracking-widest flex items-center gap-2">
          <Map className="w-4 h-4" /> 1. Manajemen Provinsi / Wilayah
        </div>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input value={newArea?.name || ""} onChange={e => setNewArea({...newArea, name: e.target.value})} placeholder="Nama Provinsi / Wilayah (Contoh: DKI Jakarta)" className="bg-white flex-1" />
            <Button onClick={handleSaveArea} className="bg-teal-600 hover:bg-teal-700 text-white font-bold h-10">
              {editingAreaId ? "Simpan" : "Tambah"}
            </Button>
            {editingAreaId && (
              <Button onClick={() => { setEditingAreaId(null); setNewArea({ name: "" }); }} variant="outline" className="h-10 text-slate-500">Batal</Button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(areas || {}).map(([id, a]: [string, any]) => (
              <div key={id} className="flex justify-between items-center p-3 rounded-xl border border-teal-100 bg-teal-50 dark:bg-teal-900/10 dark:border-teal-900 border-dashed">
                <span className="text-xs font-bold text-teal-900 dark:text-teal-50">{a.name}</span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] text-teal-600" onClick={() => {
                    setEditingAreaId(id);
                    setNewArea({ name: a.name });
                  }}>Edit</Button>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] text-rose-500" onClick={() => handleDeleteArea(id)}>Hapus</Button>
                </div>
              </div>
            ))}
            {Object.keys(areas || {}).length === 0 && <p className="text-xs text-slate-400 italic text-center py-4 sm:col-span-2">Belum ada Provinsi / Wilayah.</p>}
          </div>
        </div>
      </Card>

      {/* LEVEL 2: PT / PERUSAHAAN */}
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border-0 shadow-xl p-6">
        <div className="text-teal-700 dark:text-teal-300 text-[10px] font-black mb-6 uppercase tracking-widest flex items-center gap-2">
          <Building className="w-4 h-4" /> 2. Manajemen PT / Perusahaan
        </div>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <select value={newCompany?.areaId || ""} onChange={e => setNewCompany({...newCompany, areaId: e.target.value})} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 h-10 rounded-xl px-4 text-sm outline-none focus:border-teal-500">
              <option value="">-- Pilih Provinsi / Wilayah --</option>
              {Object.entries(areas || {}).map(([id, a]: [string, any]) => (
                <option key={id} value={id}>{a.name}</option>
              ))}
            </select>
            <Input value={newCompany?.name || ""} onChange={e => setNewCompany({...newCompany, name: e.target.value})} placeholder="Nama PT / Perusahaan (Contoh: PT. Abadi Jaya)" className="bg-white flex-1" />
            <Button onClick={handleAddCompany} className="bg-teal-600 hover:bg-teal-700 text-white font-bold h-10">Tambah</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(companies || {}).map(([id, c]: [string, any]) => (
              <div key={id} className="flex justify-between items-center p-3 rounded-xl border border-teal-100 bg-teal-50 dark:bg-teal-900/10 dark:border-teal-900 border-dashed">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-teal-900 dark:text-teal-50">{c.name}</span>
                  <span className="text-[10px] text-teal-600 dark:text-teal-400 uppercase">{areas?.[c.areaId]?.name || "Tanpa Provinsi"}</span>
                </div>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-rose-500 hover:text-rose-600" onClick={() => handleDeleteCompany(id)}>Hapus</Button>
              </div>
            ))}
            {Object.keys(companies || {}).length === 0 && <p className="text-xs text-slate-400 italic text-center py-4 sm:col-span-2">Belum ada PT / Perusahaan.</p>}
          </div>
        </div>
      </Card>

      {/* GEOFENCE SETTING */}
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border-0 shadow-xl p-6">
        <div className="text-teal-700 dark:text-teal-300 text-[10px] font-black mb-6 uppercase tracking-widest flex items-center gap-2">
          <MapPin className="w-4 h-4" /> Geofence Configuration
        </div>
        <div className="space-y-8">
          <div className="flex items-center justify-between p-5 bg-teal-50/50 dark:bg-teal-900/20 rounded-2xl border border-teal-100 dark:border-teal-900/50 shadow-inner">
            <div className="space-y-0.5">
              <Label className="text-sm font-black text-teal-900 dark:text-teal-50 tracking-tight uppercase">GEOFENCE RADIUS: {settings?.geofenceEnabled ? <span className="text-teal-600">AKTIF</span> : <span className="text-rose-500">NON-AKTIF</span>}</Label>
              <p className="text-[10px] text-teal-600/70 dark:text-teal-400 font-bold tracking-wider">Aktifkan untuk membatasi lokasi absensi user berdasarkan cabang radius</p>
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

      {/* LEVEL 3: CABANG / KOORDINAT (DI SINI) */}
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border-0 shadow-xl p-6">
        <div className="text-teal-700 dark:text-teal-300 text-[10px] font-black mb-6 uppercase tracking-widest flex items-center gap-2">
          <MapPin className="w-4 h-4" /> 3. Manajemen Cabang / Area
        </div>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-2">
            <select value={newBranch?.companyId || ""} onChange={e => setNewBranch({...newBranch, companyId: e.target.value})} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 h-10 rounded-xl px-4 text-sm outline-none focus:border-teal-500 min-w-[200px]">
              <option value="">-- Pilih PT / Perusahaan --</option>
              {Object.entries(companies || {}).map(([id, c]: [string, any]) => (
                <option key={id} value={id}>{c.name}</option>
              ))}
            </select>
            <Input value={newBranch?.name || ""} onChange={e => setNewBranch({...newBranch, name: e.target.value})} className="border-slate-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 h-10 px-4" placeholder="Contoh: Cabang Jakarta Pusat" />
            <Button onClick={handleSaveBranch} className="bg-teal-600 hover:bg-teal-700 text-white font-bold h-10">
              {editingBranchId ? "Simpan" : "Tambah"}
            </Button>
            {editingBranchId && (
              <Button onClick={() => { setEditingBranchId(null); setNewBranch({ name: "", companyId: "" }); }} variant="outline" className="h-10 text-slate-500">Batal</Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {Object.entries(branches || {}).map(([id, b]: [string, any]) => (
              <div key={id} className="flex justify-between items-center p-3 rounded-xl border border-teal-100 bg-teal-50 dark:bg-teal-900/10 dark:border-teal-900 border-dashed">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-teal-900 dark:text-teal-50">{b.name}</span>
                  <span className="text-[10px] text-teal-600 dark:text-teal-400 uppercase">PT: {companies?.[b.companyId]?.name || "Tanpa PT"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] text-teal-600" onClick={() => {
                    setEditingBranchId(id);
                    setNewBranch({ name: b.name, companyId: b.companyId });
                  }}>Edit</Button>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] text-rose-500" onClick={() => handleDeleteBranch(id)}>Hapus</Button>
                </div>
              </div>
            ))}
            {Object.keys(branches || {}).length === 0 && <p className="text-xs text-slate-400 italic text-center py-4 sm:col-span-2">Belum ada Cabang / Area.</p>}
          </div>
        </div>
      </Card>

      {/* LEVEL 4: SUB AREA / TITIK KOORDINAT */}
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border-0 shadow-xl p-6">
        <div className="text-teal-700 dark:text-teal-300 text-[10px] font-black mb-6 uppercase tracking-widest flex items-center gap-2">
          <MapPin className="w-4 h-4" /> 4. Manajemen Sub Area / Titik Koordinat (Di Sini)
        </div>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-teal-50/30 p-4 rounded-2xl border border-teal-100 dark:border-teal-900/50">
            <div className="space-y-1.5 md:col-span-2">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pilih Cabang / Area</Label>
                <select value={newSubArea?.branchId || ""} onChange={e => setNewSubArea({...newSubArea, branchId: e.target.value})} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 h-10 rounded-xl px-4 text-sm outline-none focus:border-teal-500 w-full">
                  <option value="">-- Pilih Cabang --</option>
                  {Object.entries(branches || {}).map(([id, b]: [string, any]) => (
                    <option key={id} value={id}>{b.name}</option>
                  ))}
                </select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nama Sub Area (Koordinat)</Label>
                <Input value={newSubArea?.name || ""} onChange={e => setNewSubArea({...newSubArea, name: e.target.value})} className="border-teal-100 rounded-xl bg-white" placeholder="Contoh: Gedung A" />
            </div>
            
            <div className="space-y-1.5 md:col-span-4 mt-2">
                <MapPicker 
                  center={{ lat: isNaN(parseFloat(newSubAreaLatInput)) ? -6.2088 : parseFloat(newSubAreaLatInput), lng: isNaN(parseFloat(newSubAreaLngInput)) ? 106.8456 : parseFloat(newSubAreaLngInput) }} 
                  radius={newSubArea.radius}
                  onLocationSelect={(lat, lng) => {
                    setNewSubAreaLatInput(lat.toString());
                    setNewSubAreaLngInput(lng.toString());
                  }} 
                />
                <p className="text-[10px] text-slate-400 font-medium italic mt-1 text-center w-full block">Ketuk pada peta untuk memilih lokasi sub area radius</p>
            </div>
            <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Latitude</Label>
                <Input type="text" value={newSubAreaLatInput} onChange={e => setNewSubAreaLatInput(e.target.value.replace(/,/g, '.'))} className="border-teal-100 rounded-xl bg-white font-mono text-sm" />
            </div>
            <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Longitude</Label>
                <Input type="text" value={newSubAreaLngInput} onChange={e => setNewSubAreaLngInput(e.target.value.replace(/,/g, '.'))} className="border-teal-100 rounded-xl bg-white font-mono text-sm" />
            </div>
            <div className="space-y-1.5 md:col-span-2 flex items-end">
                <div className="space-y-1.5 flex-1 pr-2">
                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Radius (Meter)</Label>
                  <Input type="number" value={newSubArea.radius} onChange={e => setNewSubArea({...newSubArea, radius: Number(e.target.value)})} className="border-teal-100 rounded-xl bg-white" />
                </div>
                <Button onClick={handleSaveSubArea} className="bg-teal-500 hover:bg-teal-600 h-10 px-6 rounded-xl font-bold uppercase text-[10px] text-white whitespace-nowrap">
                  {editingSubAreaId ? "SIMPAN" : "TAMBAH"}
                </Button>
                {editingSubAreaId && (
                  <Button onClick={() => {
                    setNewSubArea({ name: "", branchId: "", radius: 100 });
                    setNewSubAreaLatInput("-6.2088");
                    setNewSubAreaLngInput("106.8456");
                    setEditingSubAreaId(null);
                  }} variant="outline" className="h-10 px-4 rounded-xl font-bold uppercase text-[10px] text-slate-500">
                    BATAL
                  </Button>
                )}
            </div>
          </div>

          <div className="space-y-3 mt-4">
            {Object.entries(subareas || {}).map(([id, sa]: [string, any]) => (
              <div key={id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 dark:bg-gray-800/50 dark:border-gray-700/50 rounded-2xl">
                  <div>
                    <div className="font-bold text-sm text-teal-900 dark:text-teal-50">{sa.name}</div>
                    <div className="text-[10px] text-teal-600 dark:text-teal-400 uppercase font-bold mb-1">
                      Cabang: {branches?.[sa.branchId]?.name} 
                    </div>
                    {sa.lat !== undefined && (
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5 font-medium">
                          Lat: {sa.lat}, Lng: {sa.lng} | Radius: <span className="font-bold text-teal-600">{sa.radius}m</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" className="text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded-xl text-xs font-bold" onClick={() => {
                      setEditingSubAreaId(id);
                      setNewSubArea({ name: sa.name, branchId: sa.branchId || "", radius: sa.radius || 100 });
                      setNewSubAreaLatInput(sa.lat?.toString() || "-6.2088");
                      setNewSubAreaLngInput(sa.lng?.toString() || "106.8456");
                    }}>Edit</Button>
                    <Button variant="ghost" className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold" onClick={() => {
                      handleDeleteSubArea(id);
                      if (editingSubAreaId === id) {
                        setEditingSubAreaId(null);
                        setNewSubArea({ name: "", branchId: "", radius: 100 });
                      }
                    }}>Hapus</Button>
                  </div>
              </div>
            ))}
            {Object.keys(subareas || {}).length === 0 && <p className="text-xs text-slate-400 italic text-center py-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200">Belum ada Sub Area yang ditambahkan.</p>}
          </div>

        </div>
      </Card>
    </div>
  );
}
