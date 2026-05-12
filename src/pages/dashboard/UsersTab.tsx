import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../../components/ui/dropdown-menu";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../../components/ui/table";
import { Download, ChevronDown, Trash2, MapPin, Search, Printer, UserPlus, LogOut } from "lucide-react";
import { format } from "date-fns";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";
import { setDoc, doc, deleteDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../lib/firebase";

export function UsersTab({
  user, filteredUsersList, setDeleteUserTarget, setSelectedUserForEdit, 
  setSelectedUserForCard, setKoreksiUser, setShowKoreksiModal,
  setOvertimeUser, setShowOvertimeModal, setEditName, setEditRole, 
  setEditShift, setEditUniqueId, setEditArea, setEditIsBanned, 
  setEditWorkStartDate, setEditWorkEndDate, setEditMonthlyShifts, 
  setEditWeeklyShiftPattern, setEditShiftMode, settings, handleEditUser, shiftsInput, areasInput, handleKoreksiAlpa, handleAddManualOvertime, idRefsList
}: any) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState("");
  const [filterRole, setFilterRole] = React.useState("all");
  const [filterShift, setFilterShift] = React.useState("all");
  const [filterCompany, setFilterCompany] = React.useState("all");
  const [filterArea, setFilterArea] = React.useState("all");
  const [filterBranch, setFilterBranch] = React.useState("all");
  const [filterSubArea, setFilterSubArea] = React.useState("all");

  // Debounce search term
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  const [refCompany, setRefCompany] = React.useState("global");
  const [refArea, setRefArea] = React.useState("global");
  const [refBranch, setRefBranch] = React.useState("global");
  const [refSubArea, setRefSubArea] = React.useState("global");

  const displayUsers = React.useMemo(() => {
    return filteredUsersList.filter((u: any) => {
      const matchSearch = !debouncedSearchTerm || 
                          (u.name || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
                          (u.email || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                          (u.uniqueId || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      
      const matchRole = filterRole === "all" || u.role === filterRole;
      const matchShift = filterShift === "all" || u.shiftId === filterShift;
      const matchCompany = filterCompany === "all" || u.companyId === filterCompany;
      const matchArea = filterArea === "all" || (filterArea === "global" ? (!u.areaId || u.areaId === "global") : u.areaId === filterArea);
      const matchBranch = filterBranch === "all" || u.branchId === filterBranch;
      const matchSubArea = filterSubArea === "all" || u.subareaId === filterSubArea;

      return matchSearch && matchRole && matchShift && matchCompany && matchArea && matchBranch && matchSubArea;
    });
  }, [filteredUsersList, debouncedSearchTerm, filterRole, filterShift, filterCompany, filterArea, filterBranch, filterSubArea]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border-0 shadow-xl overflow-hidden p-0 mb-6">
              <CardHeader className="border-b border-teal-50 dark:border-teal-900 p-6 m-0 bg-transparent flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-teal-900 dark:text-teal-50 font-black text-xl tracking-tight">User Directory</CardTitle>
                  <CardDescription className="text-xs font-medium text-slate-500 dark:text-gray-400">Manajemen data akun, peran, dan kartu akses digital user.</CardDescription>
                </div>
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Cari nama, email, No NIP..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full md:w-64 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 h-10 rounded-xl px-4 text-sm outline-none focus:border-teal-500 transition-colors"
                    />
                  </div>
                </div>
              </CardHeader>
              <div className="p-4 bg-slate-50 dark:bg-gray-900/50 border-b border-slate-100 dark:border-gray-800 flex items-center flex-wrap gap-3">
                <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 h-9 rounded-lg px-3 text-xs outline-none focus:border-teal-500">
                  <option value="all">Semua Jabatan</option>
                  <option value="superadmin">Superadmin</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                  <option value="crew">Crew</option>
                  <option value="demo">Demo</option>
                  <option value="demouser">Demo User</option>
                </select>
                <select value={filterShift} onChange={e => setFilterShift(e.target.value)} className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 h-9 rounded-lg px-3 text-xs outline-none focus:border-teal-500">
                  <option value="all">Semua Shift</option>
                  {Object.entries(shiftsInput || {}).map(([id, shift]: [string, any]) => (
                    <option key={id} value={id}>{shift.name}</option>
                  ))}
                </select>
                <select value={filterCompany} onChange={e => setFilterCompany(e.target.value)} className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 h-9 rounded-lg px-3 text-xs outline-none focus:border-teal-500">
                  <option value="all">Semua Perusahaan</option>
                  <option value="global">Global (Default)</option>
                  {Object.entries(settings?.companies || {}).map(([id, c]: [string, any]) => (
                    <option key={id} value={id}>{c.name}</option>
                  ))}
                </select>
                <select value={filterArea} onChange={e => setFilterArea(e.target.value)} className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 h-9 rounded-lg px-3 text-xs outline-none focus:border-teal-500">
                  <option value="all">Semua Area</option>
                  <option value="global">Global (Default)</option>
                  {Object.entries(settings?.areas || {}).map(([id, a]: [string, any]) => (
                    <option key={id} value={id}>{a.name}</option>
                  ))}
                </select>
                <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 h-9 rounded-lg px-3 text-xs outline-none focus:border-teal-500">
                  <option value="all">Semua Cabang / Area</option>
                  <option value="global">Global (Default)</option>
                  {Object.entries(settings?.branches || {}).map(([id, b]: [string, any]) => (
                    <option key={id} value={id}>{b.name}</option>
                  ))}
                </select>
                <select value={filterSubArea} onChange={e => setFilterSubArea(e.target.value)} className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 h-9 rounded-lg px-3 text-xs outline-none focus:border-teal-500">
                  <option value="all">Semua Sub Area (Koordinat)</option>
                  <option value="global">Global (Default)</option>
                  {Object.entries(settings?.subareas || {}).map(([id, sa]: [string, any]) => (
                    <option key={id} value={id}>{sa.name}</option>
                  ))}
                </select>
              </div>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="w-full text-left">
                    <TableHeader className="bg-teal-50/50 dark:bg-teal-900/20 text-teal-900 dark:text-teal-100">
                      <TableRow className="border-b border-teal-100 dark:border-teal-900 hover:bg-transparent">
                        <TableHead className="px-6 py-4 h-auto text-[11px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300">Nama User</TableHead>
                        <TableHead className="px-6 py-4 h-auto text-[11px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300">Kontak Email</TableHead>
                        <TableHead className="px-6 py-4 h-auto text-[11px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300">Jabatan</TableHead>
                        <TableHead className="px-6 py-4 h-auto text-[11px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300">Shift</TableHead>
                        <TableHead className="px-6 py-4 h-auto text-[11px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300">Penempatan</TableHead>
                        <TableHead className="px-6 py-4 h-auto text-[11px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300">Bergabung</TableHead>
                        <TableHead className="px-6 py-4 h-auto text-[11px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300">No NIP</TableHead>
                        <TableHead className="px-6 py-4 h-auto text-[11px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300 text-right px-6">Navigasi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-xs divide-y divide-teal-50 dark:divide-teal-900/50">
                      {displayUsers.map((usr: any) => (
                        <TableRow key={usr.id} className="hover:bg-teal-50/50 dark:hover:bg-teal-900/10 border-0 transition-colors">
                          <TableCell className="px-6 py-4 font-bold text-teal-900 dark:text-teal-50 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900 border-2 border-white dark:border-teal-800 flex items-center justify-center font-black text-teal-700 dark:text-teal-300 overflow-hidden shrink-0 shadow-sm">
                              {usr.avatarUrl ? <img src={usr.avatarUrl} className="w-full h-full object-cover" /> : usr.name?.[0]}
                            </div>
                            <span className="tracking-tight">{usr.name}</span>
                            {usr.isBanned && (
                              <Badge variant="destructive" className="ml-2 h-5 text-[8px] font-black uppercase tracking-widest px-2 bg-rose-600">BANNED</Badge>
                            )}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-500 dark:text-gray-400 font-medium">{usr.email}</TableCell>
                          <TableCell className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${usr.role === 'superadmin' ? 'bg-rose-500/20 text-rose-600' : usr.role === 'admin' ? 'bg-teal-500/20 text-teal-600' : 'bg-slate-100 text-slate-600 dark:bg-gray-700 dark:text-gray-300'}`}>{usr.role}</span>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            {(() => {
                              const isWeekly = usr.weeklyShiftPattern && usr.weeklyShiftPattern.length > 0;
                              const isMonthly = usr.monthlyShifts && Object.keys(usr.monthlyShifts).length > 0;
                              
                              const strategyBadge = isWeekly ? (
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase bg-teal-600 text-white shadow-sm">ROTASI</span>
                              ) : isMonthly ? (
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase bg-purple-600 text-white shadow-sm">BULANAN</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase bg-slate-500 text-white shadow-sm">DEFAULT</span>
                              );

                              const shiftName = isWeekly ? "ROTASI AKTIF" : isMonthly ? "BULANAN AKTIF" : (shiftsInput[usr.shiftId]?.name || usr.shiftId || "NO SHIFT");
                              
                              return (
                                <div className="flex flex-col gap-1 items-start">
                                  <span 
                                    className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase text-white shadow-sm"
                                    style={{ backgroundColor: isWeekly ? '#0d9488' : isMonthly ? '#9333ea' : (shiftsInput[usr.shiftId]?.color || '#64748b') }}
                                  >
                                    {shiftName}
                                  </span>
                                  {strategyBadge}
                                </div>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex flex-col gap-1 text-[10px] font-bold text-slate-500 dark:text-gray-400">
                              {usr.companyId && usr.companyId !== 'global' && <span className="uppercase">{settings?.companies?.[usr.companyId]?.name || usr.companyId}</span>}
                              {usr.areaId && usr.areaId !== 'global' && <span className="uppercase text-teal-600 dark:text-teal-400">{settings?.areas?.[usr.areaId]?.name || usr.areaId}</span>}
                              {usr.branchId && usr.branchId !== 'global' && <span className="uppercase text-indigo-600 dark:text-indigo-400">{settings?.branches?.[usr.branchId]?.name || usr.branchId}</span>}
                              {usr.subareaId && usr.subareaId !== 'global' && <span className="uppercase text-fuchsia-600 dark:text-fuchsia-400">{settings?.subareas?.[usr.subareaId]?.name || usr.subareaId}</span>}
                              {(!usr.companyId || usr.companyId === 'global') && (!usr.areaId || usr.areaId === 'global') && (!usr.branchId || usr.branchId === 'global') && (!usr.subareaId || usr.subareaId === 'global') && <span>GLOBAL</span>}
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-500 dark:text-gray-400 font-medium">{usr.createdAt ? format(new Date(usr.createdAt), "dd MMM yyyy") : "-"}</TableCell>
                          <TableCell className="px-6 py-4 text-slate-500 dark:text-gray-400 font-black font-mono">{usr.uniqueId || "-"}</TableCell>
                          <TableCell className="px-6 py-4 text-right px-6 flex items-center justify-end gap-2">
                             {user?.role === 'superadmin' && (
                               <Button variant="outline" size="sm" className="h-9 px-2 text-[10px] font-black tracking-widest uppercase rounded-xl border-rose-100 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 shadow-sm" onClick={() => setDeleteUserTarget({id: usr.uid || usr.id, name: usr.name || 'User'})} title="Hapus Riwayat Absensi">
                                 <Trash2 className="w-3.5 h-3.5" />
                               </Button>
                             )}
                             <Button variant="outline" size="sm" className="h-9 px-3 text-[10px] font-black tracking-widest uppercase rounded-xl border-amber-100 dark:border-amber-900 text-amber-600 dark:text-amber-400 hover:bg-amber-50 shadow-sm" onClick={() => handleKoreksiAlpa(usr)}>Koreksi Alpa</Button>
                             <Button variant="outline" size="sm" className="h-9 px-3 text-[10px] font-black tracking-widest uppercase rounded-xl border-amber-100 dark:border-amber-900 text-amber-600 dark:text-amber-400 hover:bg-amber-50 shadow-sm" onClick={() => handleAddManualOvertime(usr)}>Lembur</Button>
                             <Button variant="outline" size="sm" className="h-9 px-3 text-[10px] font-black tracking-widest uppercase rounded-xl border-teal-100 dark:border-teal-900 text-teal-600 dark:text-teal-400 hover:bg-teal-50 shadow-sm" onClick={() => handleEditUser(usr)}>Edit</Button>
                             <Button 
                               variant="outline" 
                               size="sm" 
                               className="h-9 px-3 text-[10px] font-black tracking-widest uppercase rounded-xl border-teal-100 dark:border-teal-900 text-teal-600 dark:text-teal-400 hover:bg-teal-600 hover:text-white transition-all shadow-sm flex items-center gap-2" 
                               onClick={() => setSelectedUserForCard(usr)}
                             >
                                <Printer className="w-3.5 h-3.5" /> ID Card
                             </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredUsersList.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                            Sedang sinkronisasi data user...
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
      {user?.role === "superadmin" && (
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border-0 shadow-xl overflow-hidden p-0 mt-6 pt-6">
          <div className="px-6 text-teal-700 dark:text-teal-300 text-[10px] font-black mb-6 uppercase tracking-widest flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Registration ID REF Manager
          </div>
          <CardContent className="px-6 pb-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-teal-700 dark:text-teal-300 uppercase tracking-[0.2em] ml-1">PT / Perusahaan Default</label>
              <select 
                value={refCompany}
                onChange={(e) => setRefCompany(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-teal-100 dark:border-teal-900 h-10 rounded-xl font-bold text-teal-900 dark:text-teal-50 px-3 text-xs outline-none"
              >
                <option value="global">Semua / Global (Default)</option>
                {Object.entries(settings?.companies || {}).map(([id, c]: [string, any]) => (
                  <option key={id} value={id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-teal-700 dark:text-teal-300 uppercase tracking-[0.2em] ml-1">Provinsi / Wilayah Default</label>
              <select 
                value={refArea}
                onChange={(e) => setRefArea(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-teal-100 dark:border-teal-900 h-10 rounded-xl font-bold text-teal-900 dark:text-teal-50 px-3 text-xs outline-none"
              >
                <option value="global">Semua / Global (Default)</option>
                {Object.entries(settings?.areas || {}).map(([id, a]: [string, any]) => (
                  <option key={id} value={id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-teal-700 dark:text-teal-300 uppercase tracking-[0.2em] ml-1">Cabang / Area</label>
              <select 
                value={refBranch}
                onChange={(e) => setRefBranch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-teal-100 dark:border-teal-900 h-10 rounded-xl font-bold text-teal-900 dark:text-teal-50 px-3 text-xs outline-none"
              >
                <option value="global">Semua / Global (Default)</option>
                {Object.entries(settings?.branches || {}).map(([id, b]: [string, any]) => (
                  <option key={id} value={id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-teal-700 dark:text-teal-300 uppercase tracking-[0.2em] ml-1">Sub Area Default</label>
              <select 
                value={refSubArea}
                onChange={(e) => setRefSubArea(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-teal-100 dark:border-teal-900 h-10 rounded-xl font-bold text-teal-900 dark:text-teal-50 px-3 text-xs outline-none"
              >
                <option value="global">Semua / Global (Default)</option>
                {Object.entries(settings?.subareas || {}).map(([id, sa]: [string, any]) => (
                  <option key={id} value={id}>{sa.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { role: "crew", prefix: "USER", color: "teal", label: "Crew" },
              { role: "staff", prefix: "STAFF", color: "teal", label: "Staff" },
              { role: "admin", prefix: "ADMIN", color: "rose", label: "Admin" },
              { role: "demo", prefix: "DEMO", color: "indigo", label: "Demo" },
              { role: "demouser", prefix: "DEMOUSER", color: "indigo", label: "DemoUser" }
            ].map((btn) => (
              <Button 
                key={btn.role}
                onClick={async () => {
                    if (user?.role === "demo") { toast.error("Akun demo."); return; }
                    try {
                      const refId = `${btn.prefix}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                      await setDoc(doc(db, "idRefs", refId), { role: btn.role, companyId: refCompany, areaId: refArea, branchId: refBranch, subareaId: refSubArea, used: false, createdAt: Date.now() });
                      toast.success(`${btn.label} REF di-generate: ${refId}`);
                    } catch (e) {
                      handleFirestoreError(e, OperationType.WRITE, "idRefs");
                    }
                }}
                className={`bg-${btn.color}-500 hover:bg-${btn.color}-600 rounded-xl font-bold uppercase tracking-widest text-[10px] px-4 text-white`}
              >Generate {btn.label} REF</Button>
            ))}
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-1 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-100 dark:border-gray-800">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 relative bg-white dark:bg-gray-900">ID REF</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 relative bg-white dark:bg-gray-900">Dibuat</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 relative bg-white dark:bg-gray-900">Role</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 relative bg-white dark:bg-gray-900">Penempatan Default</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 relative bg-white dark:bg-gray-900">Status</TableHead>
                  <TableHead className="text-right relative bg-white dark:bg-gray-900"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {idRefsList?.filter((refData: any) => {
                  if (user?.role === 'superadmin' || user?.role === 'demo') return true;
                  let match = true;
                  if (user?.areaId && user?.areaId !== 'global') match = match && refData.areaId === user.areaId;
                  if (user?.companyId && user?.companyId !== 'global') match = match && refData.companyId === user.companyId;
                  if (user?.branchId && user?.branchId !== 'global') match = match && refData.branchId === user.branchId;
                  if (user?.subareaId && user?.subareaId !== 'global') match = match && refData.subareaId === user.subareaId;
                  return match;
                }).map((refData: any) => (
                  <TableRow key={refData.id} className="border-gray-100 dark:border-gray-800">
                    <TableCell className="font-mono font-bold text-teal-600">{refData.id}</TableCell>
                    <TableCell className="text-xs text-slate-500">{format(new Date(refData.createdAt), "dd MMM yyyy, HH:mm")}</TableCell>
                    <TableCell>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${refData.role === 'admin' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                          {refData.role}
                        </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-[9px] font-black text-slate-500 dark:text-gray-400">
                        {refData.companyId && refData.companyId !== 'global' && <span className="uppercase text-slate-600 dark:text-slate-400">{settings?.companies?.[refData.companyId]?.name || refData.companyId}</span>}
                        {refData.areaId && refData.areaId !== 'global' && <span className="uppercase text-teal-600 dark:text-teal-400">{settings?.areas?.[refData.areaId]?.name || refData.areaId}</span>}
                        {refData.branchId && refData.branchId !== 'global' && <span className="uppercase text-indigo-600 dark:text-indigo-400">{settings?.branches?.[refData.branchId]?.name || refData.branchId}</span>}
                        {refData.subareaId && refData.subareaId !== 'global' && <span className="uppercase text-fuchsia-600 dark:text-fuchsia-400">{settings?.subareas?.[refData.subareaId]?.name || refData.subareaId}</span>}
                        {(!refData.companyId || refData.companyId === 'global') && (!refData.areaId || refData.areaId === 'global') && (!refData.branchId || refData.branchId === 'global') && (!refData.subareaId || refData.subareaId === 'global') && <span>GLOBAL</span>}
                      </div>
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
                            try {
                              await deleteDoc(doc(db, "idRefs", refData.id));
                              toast.success("REF dihapus");
                            } catch(e) {
                              handleFirestoreError(e, OperationType.DELETE, "idRefs");
                            }
                          }}
                        >
                          <LogOut className="w-4 h-4 rotate-45" />
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!idRefsList || idRefsList.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-xs text-slate-400 italic">Belum ada ID REF yang dibuat.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        </CardContent>
      </Card>
      )}
          </div>
  );
}
