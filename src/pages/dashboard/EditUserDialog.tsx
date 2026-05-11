
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { CardDescription } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Switch } from "../../components/ui/switch";
import { Trash2 } from "lucide-react";

interface EditUserDialogProps {
  selectedUserForEdit: any;
  setSelectedUserForEdit: (user: any | null) => void;
  editName: string;
  setEditName: (name: string) => void;
  editRole: string;
  setEditRole: (role: string) => void;
  editCompany: string;
  setEditCompany: (company: string) => void;
  editArea: string;
  setEditArea: (area: string) => void;
  editBranch: string;
  setEditBranch: (branch: string) => void;
  editSubArea: string;
  setEditSubArea: (subArea: string) => void;
  editShift: string;
  setEditShift: (shift: string) => void;
  editUniqueId: string;
  setEditUniqueId: (id: string) => void;
  editWorkStartDate: string;
  setEditWorkStartDate: (date: string) => void;
  editWorkEndDate: string;
  setEditWorkEndDate: (date: string) => void;
  editWeeklyShiftPattern: string[];
  setEditWeeklyShiftPattern: (pattern: any) => void;
  editMonthlyShifts: Record<string, string>;
  setEditMonthlyShifts: (shifts: any) => void;
  editIsBanned: boolean;
  setEditIsBanned: (banned: boolean) => void;
  saveUserChanges: () => void;
  deleteUser: () => void;
  settings: any;
  shiftsInput: any;
  currentUser: any;
}

export function EditUserDialog({
  selectedUserForEdit, setSelectedUserForEdit,
  editName, setEditName, editRole, setEditRole,
  editCompany, setEditCompany, editArea, setEditArea,
  editBranch, setEditBranch, editSubArea, setEditSubArea,
  editShift, setEditShift, editUniqueId, setEditUniqueId,
  editWorkStartDate, setEditWorkStartDate, editWorkEndDate, setEditWorkEndDate,
  editWeeklyShiftPattern, setEditWeeklyShiftPattern,
  editMonthlyShifts, setEditMonthlyShifts,
  editIsBanned, setEditIsBanned,
  saveUserChanges, deleteUser,
  settings, shiftsInput, currentUser
}: EditUserDialogProps) {
  return (
    <Dialog open={!!selectedUserForEdit} onOpenChange={(open) => !open && setSelectedUserForEdit(null)}>
      <DialogContent className="sm:max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border-0 shadow-2xl rounded-[2rem] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-xl font-black text-teal-900 dark:text-teal-50 uppercase tracking-tighter">Edit Data User</DialogTitle>
          <CardDescription className="text-xs font-bold text-slate-500 uppercase tracking-widest">Update profile & shift information</CardDescription>
        </DialogHeader>
        <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-2xl border border-teal-100 dark:border-teal-900/30 mb-6">
          <p className="text-[10px] font-bold text-teal-800 dark:text-teal-200 leading-relaxed">
            <strong>💡 Catatan Prioritas Shift:</strong> Sistem mengikuti urutan berikut: 
            <br/>1. Shift Mingguan (jika diatur &gt; 0)
            <br/>2. Shift Bulanan (jika ada untuk bulan ini)
            <br/>3. Penempatan Shift (Default)
          </p>
        </div>
        {selectedUserForEdit && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-teal-700 dark:text-teal-300 uppercase tracking-[0.2em] ml-1">Nama Lengkap</Label>
              <Input 
                value={editName} 
                onChange={(e) => setEditName(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900/50 border-teal-100 dark:border-teal-900 h-12 rounded-2xl font-bold text-teal-900 dark:text-teal-50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-teal-700 dark:text-teal-300 uppercase tracking-[0.2em] ml-1">Jabatan / Role</Label>
              <select 
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-teal-100 dark:border-teal-900 h-12 rounded-2xl font-bold text-teal-900 dark:text-teal-50 px-4 focus:ring-2 focus:ring-teal-500/20 transition-all outline-none"
              >
                <option value="superadmin">SUPERADMIN</option>
                <option value="admin_pt">ADMIN PT / PERUSAHAAN</option>
                <option value="admin_area">ADMIN AREA / REGIONAL</option>
                <option value="admin_cabang">ADMIN CABANG</option>
                <option value="admin">ADMIN (LEAD)</option>
                <option value="staff">STAFF</option>
                <option value="crew">CREW</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-teal-700 dark:text-teal-300 uppercase tracking-[0.2em] ml-1">PT / Perusahaan</Label>
              <select 
                value={editCompany}
                onChange={(e) => setEditCompany(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-teal-100 dark:border-teal-900 h-12 rounded-2xl font-bold text-teal-900 dark:text-teal-50 px-4 focus:ring-2 focus:ring-teal-500/20 transition-all outline-none"
              >
                <option value="global">Semua / Global</option>
                {Object.entries(settings?.companies || {}).map(([id, c]: [string, any]) => (
                  <option key={id} value={id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-teal-700 dark:text-teal-300 uppercase tracking-[0.2em] ml-1">Area / Regional</Label>
              <select 
                value={editArea}
                onChange={(e) => setEditArea(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-teal-100 dark:border-teal-900 h-12 rounded-2xl font-bold text-teal-900 dark:text-teal-50 px-4 focus:ring-2 focus:ring-teal-500/20 transition-all outline-none"
              >
                <option value="global">Semua / Global</option>
                {Object.entries(settings?.areas || {}).map(([id, a]: [string, any]) => (
                  <option key={id} value={id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-teal-700 dark:text-teal-300 uppercase tracking-[0.2em] ml-1">Cabang / Area</Label>
              <select 
                value={editBranch}
                onChange={(e) => setEditBranch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-teal-100 dark:border-teal-900 h-12 rounded-2xl font-bold text-teal-900 dark:text-teal-50 px-4 focus:ring-2 focus:ring-teal-500/20 transition-all outline-none"
              >
                <option value="global">Semua / Global</option>
                {Object.entries(settings?.branches || {}).map(([id, b]: [string, any]) => (
                  <option key={id} value={id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-teal-700 dark:text-teal-300 uppercase tracking-[0.2em] ml-1">Sub Area (Koordinat)</Label>
              <select 
                value={editSubArea}
                onChange={(e) => setEditSubArea(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-teal-100 dark:border-teal-900 h-12 rounded-2xl font-bold text-teal-900 dark:text-teal-50 px-4 focus:ring-2 focus:ring-teal-500/20 transition-all outline-none"
              >
                <option value="global">Semua / Global</option>
                {Object.entries(settings?.subareas || {}).map(([id, sa]: [string, any]) => (
                  <option key={id} value={id}>{sa.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-teal-700 dark:text-teal-300 uppercase tracking-[0.2em] ml-1">Penempatan Shift</Label>
              <select 
                value={editShift}
                onChange={(e) => setEditShift(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-teal-100 dark:border-teal-900 h-12 rounded-2xl font-bold text-teal-900 dark:text-teal-50 px-4 focus:ring-2 focus:ring-teal-500/20 transition-all outline-none"
              >
                <option value="none">TIDAK ADA SHIFT (NONE)</option>
                {Object.entries(shiftsInput).map(([id, s]: [string, any]) => (
                  <option key={id} value={id}>{s.name} ({s.label})</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-teal-700 dark:text-teal-300 uppercase tracking-[0.2em] ml-1">NO NIP</Label>
              <Input 
                value={editUniqueId} 
                onChange={(e) => setEditUniqueId(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900/50 border-teal-100 dark:border-teal-900 h-12 rounded-2xl font-bold text-teal-900 dark:text-teal-50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-teal-700 dark:text-teal-300 uppercase tracking-[0.2em] ml-1">Mulai Kontrak</Label>
                <Input 
                  type="date"
                  value={editWorkStartDate} 
                  onChange={(e) => setEditWorkStartDate(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900/50 border-teal-100 dark:border-teal-900 h-12 rounded-2xl font-bold text-teal-900 dark:text-teal-50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-teal-700 dark:text-teal-300 uppercase tracking-[0.2em] ml-1">Selesai Kontrak</Label>
                <Input 
                  type="date"
                  value={editWorkEndDate} 
                  onChange={(e) => setEditWorkEndDate(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900/50 border-teal-100 dark:border-teal-900 h-12 rounded-2xl font-bold text-teal-900 dark:text-teal-50"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black text-teal-700 dark:text-teal-300 uppercase tracking-[0.2em] ml-1">SHIFT MINGGUAN (ROTASI)</Label>
              <div className="space-y-2">
                {editWeeklyShiftPattern.map((sId, index) => (
                  <div key={index} className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Minggu {index + 1}</span>
                    <span className="text-xs font-bold text-teal-700 dark:text-teal-300">{shiftsInput[sId]?.name || sId}</span>
                    <button onClick={() => setEditWeeklyShiftPattern((prev: any) => prev.filter((_: any, i: any) => i !== index))} className="text-rose-500 hover:text-rose-700 text-xs font-bold">Hapus</button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <select className="h-10 text-xs font-bold bg-slate-50 dark:bg-slate-900 border rounded-lg px-2 flex-grow" id="newWeeklyShift">
                    {Object.entries(shiftsInput).map(([id, s]: [string, any]) => (
                      <option key={id} value={id}>{s.name || id}</option>
                    ))}
                  </select>
                  <Button size="sm" onClick={() => {
                    const s = (document.getElementById("newWeeklyShift") as HTMLSelectElement).value;
                    if(s) setEditWeeklyShiftPattern((prev: any) => [...prev, s]);
                  }} className="h-10 px-3">+</Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black text-teal-700 dark:text-teal-300 uppercase tracking-[0.2em] ml-1">SHIFT BULANAN</Label>
              <div className="space-y-2">
                {Object.entries(editMonthlyShifts).map(([month, sId]) => (
                  <div key={month} className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{month}</span>
                    <span className="text-xs font-bold text-teal-700 dark:text-teal-300">{shiftsInput[sId]?.name || sId}</span>
                    <button onClick={() => setEditMonthlyShifts((prev: any) => { const next = {...prev}; delete next[month]; return next; })} className="text-rose-500 hover:text-rose-700 text-xs font-bold">Hapus</button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input type="month" className="h-10 text-xs font-bold" id="newMonth" />
                  <select className="h-10 text-xs font-bold bg-slate-50 dark:bg-slate-900 border rounded-lg px-2" id="newMonthShift">
                    {Object.entries(shiftsInput).map(([id, s]: [string, any]) => (
                      <option key={id} value={id}>{s.name || id}</option>
                    ))}
                  </select>
                  <Button size="sm" onClick={() => {
                    const m = (document.getElementById("newMonth") as HTMLInputElement).value;
                    const s = (document.getElementById("newMonthShift") as HTMLSelectElement).value;
                    if(m && s) setEditMonthlyShifts((prev: any) => ({ ...prev, [m]: s }));
                  }} className="h-10 px-3">+</Button>
                </div>
              </div>
            </div>

            {currentUser?.role === "superadmin" && (
              <div className="flex flex-col gap-4 p-4 bg-rose-50 dark:bg-rose-900/20 rounded-[1.5rem] border border-rose-100 dark:border-rose-900/30">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-widest">Banned User</Label>
                    <p className="text-[9px] text-rose-600/70 dark:text-rose-500/70">Wajibkan user untuk tidak bisa absen.</p>
                  </div>
                  <Switch 
                    checked={editIsBanned}
                    onCheckedChange={setEditIsBanned}
                  />
                </div>
                
                <Button 
                  variant="destructive" 
                  onClick={deleteUser}
                  className="bg-rose-600 hover:bg-rose-700 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-600/20"
                >
                  <Trash2 className="w-3 h-3 mr-2" /> Hapus Akun Permanen
                </Button>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button variant="ghost" className="flex-1 text-slate-400 font-bold uppercase text-xs h-12 rounded-2xl" onClick={() => setSelectedUserForEdit(null)}>Batal</Button>
              <Button onClick={saveUserChanges} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-black tracking-widest uppercase text-xs h-12 shadow-lg shadow-teal-600/20 rounded-2xl active:scale-95 transition-all">SIMPAN PERUBAHAN</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
