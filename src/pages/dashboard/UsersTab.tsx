import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../../components/ui/dropdown-menu";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../../components/ui/table";
import { Download, ChevronDown, Trash2, MapPin, Search, Printer } from "lucide-react";
import { format } from "date-fns";
import { Input } from "../../components/ui/input";

export function UsersTab({
  user, filteredUsersList, setDeleteUserTarget, setSelectedUserForEdit, 
  setSelectedUserForCard, setKoreksiUser, setShowKoreksiModal,
  setOvertimeUser, setShowOvertimeModal, setEditName, setEditRole, 
  setEditShift, setEditUniqueId, setEditArea, setEditIsBanned, 
  setEditWorkStartDate, setEditWorkEndDate, setEditMonthlyShifts, 
  setEditWeeklyShiftPattern, setEditShiftMode, settings, handleEditUser, shiftsInput, areasInput, handleKoreksiAlpa, handleAddManualOvertime
}: any) {
  const [searchTerm, setSearchTerm] = React.useState("");

  const displayUsers = filteredUsersList.filter((u: any) => 
    (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.uniqueId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border-0 shadow-xl overflow-hidden p-0">
              <CardHeader className="border-b border-teal-50 dark:border-teal-900 p-6 m-0 bg-transparent flex flex-col space-y-1">
                <CardTitle className="text-teal-900 dark:text-teal-50 font-black text-xl tracking-tight">User Directory</CardTitle>
                <CardDescription className="text-xs font-medium text-slate-500 dark:text-gray-400">Manajemen data akun, peran, dan kartu akses digital user.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="w-full text-left">
                    <TableHeader className="bg-teal-50/50 dark:bg-teal-900/20 text-teal-900 dark:text-teal-100">
                      <TableRow className="border-b border-teal-100 dark:border-teal-900 hover:bg-transparent">
                        <TableHead className="px-6 py-4 h-auto text-[11px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300">Nama User</TableHead>
                        <TableHead className="px-6 py-4 h-auto text-[11px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300">Kontak Email</TableHead>
                        <TableHead className="px-6 py-4 h-auto text-[11px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300">Jabatan</TableHead>
                        <TableHead className="px-6 py-4 h-auto text-[11px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300 px-6">Bergabung</TableHead>
                        <TableHead className="px-6 py-4 h-auto text-[11px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300">Shift</TableHead>
                        <TableHead className="px-6 py-4 h-auto text-[11px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300">Unique ID</TableHead>
                        <TableHead className="px-6 py-4 h-auto text-[11px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300 text-right px-6">Navigasi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-xs divide-y divide-teal-50 dark:divide-teal-900/50">
                      {filteredUsersList.map((usr) => (
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
                          <TableCell className="px-6 py-4 text-slate-500 dark:text-gray-400 font-medium">
                            {areasInput[usr.areaId]?.name || 'Global'}
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
          </div>
  );
}
