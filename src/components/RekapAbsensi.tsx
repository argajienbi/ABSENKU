import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Search, Loader2, Download, Table as TableIcon, Filter, Clock, Activity, UserCheck, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface RekapAbsensiProps {
  usersList: any[];
  settings?: any;
}

export function RekapAbsensi({ usersList, settings }: RekapAbsensiProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [period, setPeriod] = useState<string>("monthly");
  
  // New Filters
  const [selectedArea, setSelectedArea] = useState<string>("all");
  const [selectedShift, setSelectedShift] = useState<string>("all");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all"); // Tipe log
  
  const [searchQuery, setSearchQuery] = useState("");
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFetched, setIsFetched] = useState(false);

  // Extract unique areas, shifts, roles from usersList
  const uniqueAreas = useMemo(() => Array.from(new Set(usersList.map(u => u.areaId).filter(Boolean))), [usersList]);
  const uniqueShifts = useMemo(() => Array.from(new Set(usersList.map(u => u.shiftId).filter(Boolean))), [usersList]);
  const uniqueRoles = useMemo(() => Array.from(new Set(usersList.map(u => u.role).filter(Boolean))), [usersList]);

  // Available variants based on current selection to disable invalid combinations
  const availableAreas = useMemo(() => {
    const list = usersList.filter(u => 
      (selectedShift === "all" || u.shiftId === selectedShift) &&
      (selectedRole === "all" || u.role === selectedRole) &&
      (selectedUserId === "all" || (u.uid || u.id) === selectedUserId)
    );
    return new Set(list.map(u => u.areaId).filter(Boolean));
  }, [usersList, selectedShift, selectedRole, selectedUserId]);

  const availableShifts = useMemo(() => {
    const list = usersList.filter(u => 
      (selectedArea === "all" || u.areaId === selectedArea) &&
      (selectedRole === "all" || u.role === selectedRole) &&
      (selectedUserId === "all" || (u.uid || u.id) === selectedUserId)
    );
    return new Set(list.map(u => u.shiftId).filter(Boolean));
  }, [usersList, selectedArea, selectedRole, selectedUserId]);

  const availableRoles = useMemo(() => {
    const list = usersList.filter(u => 
      (selectedArea === "all" || u.areaId === selectedArea) &&
      (selectedShift === "all" || u.shiftId === selectedShift) &&
      (selectedUserId === "all" || (u.uid || u.id) === selectedUserId)
    );
    return new Set(list.map(u => u.role).filter(Boolean));
  }, [usersList, selectedArea, selectedShift, selectedUserId]);

  const filteredUsers = useMemo(() => {
    return usersList.filter(u => 
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.uniqueId && u.uniqueId.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [usersList, searchQuery]);

  const availableUsers = useMemo(() => {
    const list = filteredUsers.filter(u => 
      (selectedArea === "all" || u.areaId === selectedArea) &&
      (selectedShift === "all" || u.shiftId === selectedShift) &&
      (selectedRole === "all" || u.role === selectedRole)
    );
    return new Set(list.map(u => u.uid || u.id));
  }, [filteredUsers, selectedArea, selectedShift, selectedRole]);

  // Auto-reset invalid selections
  useEffect(() => {
    if (selectedArea !== "all" && !availableAreas.has(selectedArea)) setSelectedArea("all");
  }, [availableAreas, selectedArea]);

  useEffect(() => {
    if (selectedShift !== "all" && !availableShifts.has(selectedShift)) setSelectedShift("all");
  }, [availableShifts, selectedShift]);

  useEffect(() => {
    if (selectedRole !== "all" && !availableRoles.has(selectedRole)) setSelectedRole("all");
  }, [availableRoles, selectedRole]);

  useEffect(() => {
    if (selectedUserId !== "all" && !availableUsers.has(selectedUserId)) setSelectedUserId("all");
  }, [availableUsers, selectedUserId]);

  const handleFetchData = async () => {
    setLoading(true);
    setIsFetched(false);
    try {
      const now = new Date();
      let start, end;
      if (period === "daily") {
        start = startOfDay(now); end = endOfDay(now);
      } else if (period === "weekly") {
        start = startOfWeek(now, { weekStartsOn: 1 }); end = endOfWeek(now, { weekStartsOn: 1 });
      } else if (period === "monthly") {
        start = startOfMonth(now); end = endOfMonth(now);
      } else {
        start = startOfDay(now); end = endOfDay(now);
      }

      let q;
      if (period === "all_time") {
        q = query(
          collection(db, "attendance"),
          orderBy("timestamp", "desc")
        );
      } else {
        q = query(
          collection(db, "attendance"),
          where("timestamp", ">=", start.getTime()),
          where("timestamp", "<=", end.getTime())
        );
      }
      
      const querySnapshot = await getDocs(q);
      let data = querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) })) as any[];
      
      // Sort descending locally
      data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setAttendanceData(data);
      setIsFetched(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summaryStats = useMemo(() => {
    if (!isFetched || attendanceData.length === 0) return null;

    let totalHadir = 0;
    let totalTelat = 0;
    let totalSakitIzin = 0;
    let totalHariLembur = 0;
    let totalMenitKerja = 0;
    let totalMenitLembur = 0;

    const baseData = attendanceData.filter(log => {
      const user = usersList.find(u => u.uid === log.userId || u.id === log.userId);
      if (selectedUserId !== "all" && log.userId !== selectedUserId) return false;
      if (selectedArea !== "all" && user?.areaId !== selectedArea) return false;
      if (selectedShift !== "all" && user?.shiftId !== selectedShift) return false;
      if (selectedRole !== "all" && user?.role !== selectedRole) return false;
      // We don't filter by selectedStatus to make sure we don't skew the pairing of "in" and "out" logs
      return true;
    });

    const grouped: Record<string, Record<string, any[]>> = {};

    baseData.forEach(log => {
       const uId = log.userId;
       const dateStr = format(new Date(log.timestamp), "yyyy-MM-dd");
       if (!grouped[uId]) grouped[uId] = {};
       if (!grouped[uId][dateStr]) grouped[uId][dateStr] = [];
       grouped[uId][dateStr].push(log);
    });

    Object.keys(grouped).forEach(uId => {
       const user = usersList.find(u => u.uid === uId || u.id === uId);
       const shiftStr = user?.shiftId || 'morning';
       const shiftConfig = settings?.shifts?.[shiftStr] || { startTime: "09:00", gracePeriod: 0 };
       const startParts = (shiftConfig.start || shiftConfig.startTime || "09:00").split(':');
       const startHour = Number(startParts[0] || '9');
       const startMin = Number(startParts[1] || '0');
       const shiftStartMinutes = (startHour * 60) + startMin + (shiftConfig.gracePeriod || 0);

       Object.keys(grouped[uId]).forEach(dateStr => {
          const dayLogs = grouped[uId][dateStr].sort((a: any, b: any) => a.timestamp - b.timestamp);
          
          const inLog = dayLogs.find(l => l.type === 'in');
          const outLog = dayLogs.slice().reverse().find(l => l.type === 'out');
          const hasSickIzin = dayLogs.find(l => ['sick', 'permit', 'cuti'].includes(l.type));
          const ovInLog = dayLogs.find(l => l.type === 'overtime_in' || l.type === 'overtime');
          const ovOutLog = dayLogs.slice().reverse().find(l => l.type === 'overtime_out');
          
          if (inLog) {
             totalHadir++;
             const logDate = new Date(inLog.timestamp);
             const userInMinutes = (logDate.getHours() * 60) + logDate.getMinutes();
             if (userInMinutes > shiftStartMinutes) totalTelat++;
          }
          
          if (hasSickIzin) totalSakitIzin++;
          if (ovInLog) totalHariLembur++;

          if (inLog && outLog && outLog.timestamp > inLog.timestamp) {
             totalMenitKerja += Math.floor((outLog.timestamp - inLog.timestamp) / 60000);
          }
          
          if (ovInLog && ovOutLog && ovOutLog.timestamp > ovInLog.timestamp) {
             totalMenitLembur += Math.floor((ovOutLog.timestamp - ovInLog.timestamp) / 60000);
          }
       });
    });

    return { totalHadir, totalTelat, totalSakitIzin, totalHariLembur, totalMenitKerja, totalMenitLembur };
  }, [attendanceData, selectedUserId, selectedArea, selectedShift, selectedRole, isFetched, usersList, settings]);

  const filteredData = useMemo(() => {
    if (!isFetched) return [];
    
    return attendanceData.filter(log => {
      const user = usersList.find(u => u.uid === log.userId || u.id === log.userId);
      
      // Filter by User
      if (selectedUserId !== "all" && log.userId !== selectedUserId) return false;
      
      // Filter by Area
      if (selectedArea !== "all" && user?.areaId !== selectedArea) return false;
      
      // Filter by Shift
      if (selectedShift !== "all" && user?.shiftId !== selectedShift) return false;
      
      // Filter by Role
      if (selectedRole !== "all" && user?.role !== selectedRole) return false;
      
      // Filter by Status (Hadir, Sakit, Ijin, Lembur, Telat)
      if (selectedStatus !== "all") {
        if (selectedStatus === 'hadir') {
           if (log.type !== 'in' && log.type !== 'out') return false;
        } else if (selectedStatus === 'sakit') {
           if (log.type !== 'sick') return false;
        } else if (selectedStatus === 'ijin' || selectedStatus === 'cuti') {
           if (log.type !== 'permit' && log.type !== 'cuti') return false;
        } else if (selectedStatus === 'lembur') {
           if (log.type !== 'overtime' && log.type !== 'overtime_in' && log.type !== 'overtime_out') return false;
        } else if (selectedStatus === 'telat') {
           if (log.type !== 'in') return false;
           // Check if late based on settings
           let isLate = false;
           const userShiftStr = user?.shiftId || 'morning';
           const shiftConfig = settings?.shifts?.[userShiftStr] || { startTime: "09:00", gracePeriod: 0 };
           const logDate = new Date(log.timestamp);
           const [startHour, startMin] = (shiftConfig.start || shiftConfig.startTime || "09:00").split(':').map(Number);
           const shiftStartMinutes = (startHour * 60) + startMin + (shiftConfig.gracePeriod || 0);
           const userInMinutes = (logDate.getHours() * 60) + logDate.getMinutes();
           if (userInMinutes > shiftStartMinutes) isLate = true;
           if (!isLate) return false;
        }
      }
      return true;
    });
  }, [attendanceData, selectedUserId, selectedArea, selectedShift, selectedRole, selectedStatus, isFetched, usersList, settings]);

  const handleExportExcel = () => {
    const header = ["Nama", "Role", "Shift", "Tanggal", "Jam", "Tipe", "Status", "Radius", "Lokasi", "Catatan"];
    const records = filteredData.map(log => {
      const user = usersList.find(u => u.uid === log.userId || u.id === log.userId);
      return [
        user?.name || "Unknown",
        user?.role || "-",
        user?.shiftId || "-",
        format(new Date(log.timestamp), "yyyy-MM-dd"),
        format(new Date(log.timestamp), "HH:mm:ss"),
        log.type,
        log.status || "APPROVED",
        log.withinRadius ? "Dalam Radius" : "Luar Radius",
        log.location ? `${log.location.lat}, ${log.location.lng}` : "-",
        log.extraData || log.notes ? String(log.extraData || log.notes).replace(/,/g, ' ') : "-"
      ];
    });
    
    const ws = XLSX.utils.aoa_to_sheet([header, ...records]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Absensi");
    // Gunakan base64 untuk mengatasi masalah download menjadi .bin di WebView Android (Sketchware)
    const b64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
    const a = document.createElement('a');
    a.href = "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64," + b64;
    a.download = `Rekap_Absen_${period}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Laporan Rekap Absensi", 14, 20);
    doc.setFontSize(10);
    doc.text(`Periode: ${period.toUpperCase()}`, 14, 28);
    
    const tableColumn = ["Nama", "Tanggal", "Jam", "Tipe", "Radius", "Catatan"];
    const tableRows = filteredData.map(log => {
      const user = usersList.find(u => u.uid === log.userId || u.id === log.userId);
      return [
        user?.name || "Unknown",
        format(new Date(log.timestamp), "yyyy-MM-dd"),
        format(new Date(log.timestamp), "HH:mm:ss"),
        log.type,
        log.withinRadius ? "Dalam Radius" : "Luar Radius",
        log.extraData || log.notes ? String(log.extraData || log.notes).replace(/,/g, ' ') : "-"
      ];
    });
    
    autoTable(doc, { 
      head: [tableColumn],
      body: tableRows,
      startY: 35,
    });
    doc.save(`Rekap_Absen_${period}.pdf`);
  };

  return (
    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border-0 shadow-lg overflow-hidden p-0 relative">
      <CardHeader className="border-b border-teal-50 dark:border-teal-900 p-6 m-0 bg-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <CardTitle className="text-teal-900 dark:text-teal-50 font-black text-xl tracking-tight">Rekap & Tarik Laporan</CardTitle>
          <CardDescription className="text-xs font-medium text-slate-500 dark:text-gray-400">Filter, rekap, dan tarik data absensi dengan cepat.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 bg-slate-50 dark:bg-gray-900/50 p-4 rounded-xl border border-slate-100 dark:border-gray-800">
           
           {/* Row 1/2 of Filters */}
           <div className="col-span-1 lg:col-span-2">
             <label className="text-[10px] font-bold text-slate-500 dark:text-gray-400 mb-1.5 block uppercase tracking-wider">Cari Karyawan / NIK</label>
             <Input 
                placeholder="Ketik nama atau NIK..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 text-xs rounded-lg bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700"
             />
           </div>

           <div className="col-span-1 lg:col-span-2">
             <label className="text-[10px] font-bold text-slate-500 dark:text-gray-400 mb-1.5 block uppercase tracking-wider">Pilih Karyawan</label>
             <select 
               value={selectedUserId} 
               onChange={(e) => setSelectedUserId(e.target.value)}
               className="w-full h-9 rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1 text-xs text-slate-700 dark:text-gray-300 font-medium outline-none"
             >
                <option value="all">-- Semua Karyawan --</option>
                {filteredUsers.map(u => {
                  const uId = u.uid || u.id;
                  return (
                    <option key={uId} value={uId} disabled={!availableUsers.has(uId)}>
                      {u.name || "Unnamed"} {u.role ? `(${u.role})` : ''} 
                    </option>
                  );
                })}
             </select>
           </div>
           
           <div className="col-span-1">
             <label className="text-[10px] font-bold text-slate-500 dark:text-gray-400 mb-1.5 block uppercase tracking-wider">Rentang Waktu</label>
             <select 
               value={period} 
               onChange={(e) => { setPeriod(e.target.value); setIsFetched(false); }} 
               className="w-full h-9 rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1 text-xs text-slate-700 dark:text-gray-300 font-medium outline-none"
             >
                 <option value="daily">Hari Ini</option>
                 <option value="weekly">Minggu Ini</option>
                 <option value="monthly">Bulan Ini</option>
                 <option value="all_time">Semua Waktu</option>
             </select>
           </div>

           <div className="col-span-1">
             <label className="text-[10px] font-bold text-slate-500 dark:text-gray-400 mb-1.5 block uppercase tracking-wider">Area</label>
             <select 
               value={selectedArea} 
               onChange={(e) => setSelectedArea(e.target.value)}
               className="w-full h-9 rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1 text-xs text-slate-700 dark:text-gray-300 font-medium outline-none"
             >
                <option value="all">Semua Area</option>
                {uniqueAreas.map(a => <option key={String(a)} value={String(a)} disabled={!availableAreas.has(a)}>{String(a)}</option>)}
             </select>
           </div>

           <div className="col-span-1">
             <label className="text-[10px] font-bold text-slate-500 dark:text-gray-400 mb-1.5 block uppercase tracking-wider">Shift</label>
             <select 
               value={selectedShift} 
               onChange={(e) => setSelectedShift(e.target.value)}
               className="w-full h-9 rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1 text-xs text-slate-700 dark:text-gray-300 font-medium outline-none"
             >
                <option value="all">Semua Shift</option>
                {uniqueShifts.map(s => <option key={String(s)} value={String(s)} disabled={!availableShifts.has(s)}>{String(s).toUpperCase()}</option>)}
             </select>
           </div>

           <div className="col-span-1">
             <label className="text-[10px] font-bold text-slate-500 dark:text-gray-400 mb-1.5 block uppercase tracking-wider">Jabatan / Role</label>
             <select 
               value={selectedRole} 
               onChange={(e) => setSelectedRole(e.target.value)}
               className="w-full h-9 rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1 text-xs text-slate-700 dark:text-gray-300 font-medium outline-none"
             >
                <option value="all">Semua Role</option>
                {uniqueRoles.map(r => <option key={String(r)} value={String(r)} disabled={!availableRoles.has(r)}>{String(r).toUpperCase()}</option>)}
             </select>
           </div>

           <div className="col-span-1">
             <label className="text-[10px] font-bold text-slate-500 dark:text-gray-400 mb-1.5 block uppercase tracking-wider">Status Absen</label>
             <select 
               value={selectedStatus} 
               onChange={(e) => setSelectedStatus(e.target.value)}
               className="w-full h-9 rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1 text-xs text-slate-700 dark:text-gray-300 font-medium outline-none"
             >
                 <option value="all">Semua Data</option>
                 <option value="hadir">Hadir Normal</option>
                 <option value="telat">Datang Terlambat</option>
                 <option value="ijin">Ijin / Cuti</option>
                 <option value="sakit">Sakit</option>
                 <option value="lembur">Lembur</option>
             </select>
           </div>
           
           <div className="col-span-1 lg:col-span-3 flex items-end justify-end mt-2 lg:mt-0 gap-2">
             <Button 
                onClick={handleFetchData}
                disabled={loading}
                className="h-9 rounded-lg px-6 font-bold shadow-sm bg-teal-600 hover:bg-teal-700 text-white w-full sm:w-auto transition-all active:scale-95"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Filter className="w-4 h-4 mr-2" />}
                Tarik Data
              </Button>
           </div>
        </div>

        <div className="flex justify-between items-center mb-4">
           {isFetched && (
             <div className="text-xs font-medium text-slate-500">
               Menampilkan <span className="font-bold text-teal-600 dark:text-teal-400">{filteredData.length}</span> baris data
             </div>
           )}
           
           <div className="flex gap-2 ml-auto">
             <Button 
               disabled={!isFetched || filteredData.length === 0} 
               onClick={handleExportExcel}
               variant="outline" 
               className="h-8 rounded-[8px] text-[11px] text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/50"
             >
                <TableIcon className="w-3.5 h-3.5 mr-1.5" /> Excel
             </Button>
             <Button 
               disabled={!isFetched || filteredData.length === 0} 
               onClick={handleExportPDF}
               variant="outline" 
               className="h-8 rounded-[8px] text-[11px] text-rose-600 border-rose-200 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-800 dark:hover:bg-rose-900/50"
             >
                <Download className="w-3.5 h-3.5 mr-1.5" /> PDF
             </Button>
           </div>
        </div>

        {/* Summary Stats Region */}
        {summaryStats && !loading && isFetched && (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
            <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30 flex flex-col items-center text-center justify-center">
               <span className="text-xl font-black text-indigo-700 dark:text-indigo-400">{summaryStats.totalHadir}</span>
               <span className="text-[10px] font-bold text-indigo-600/70 dark:text-indigo-400/70 uppercase tracking-wider mt-1 flex items-center justify-center gap-1"><UserCheck className="w-3 h-3"/> Kehadiran</span>
            </div>
            <div className="bg-rose-50/50 dark:bg-rose-900/20 p-3 rounded-xl border border-rose-100 dark:border-rose-900/30 flex flex-col items-center text-center justify-center">
               <span className="text-xl font-black text-rose-700 dark:text-rose-400">{summaryStats.totalTelat}</span>
               <span className="text-[10px] font-bold text-rose-600/70 dark:text-rose-400/70 uppercase tracking-wider mt-1 flex items-center justify-center gap-1"><AlertCircle className="w-3 h-3"/> Datang Telat</span>
            </div>
            <div className="bg-amber-50/50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30 flex flex-col items-center text-center justify-center">
               <span className="text-xl font-black text-amber-700 dark:text-amber-400">{summaryStats.totalHariLembur}</span>
               <span className="text-[10px] font-bold text-amber-600/70 dark:text-amber-400/70 uppercase tracking-wider mt-1 flex items-center justify-center gap-1"><Activity className="w-3 h-3"/> Hr Lembur</span>
            </div>
            <div className="bg-yellow-50/50 dark:bg-yellow-900/20 p-3 rounded-xl border border-yellow-100 dark:border-yellow-900/30 flex flex-col items-center text-center justify-center">
               <span className="text-xl font-black text-yellow-700 dark:text-yellow-400">{summaryStats.totalSakitIzin}</span>
               <span className="text-[10px] font-bold text-yellow-600/70 dark:text-yellow-400/70 uppercase tracking-wider mt-1 flex items-center justify-center gap-1"><Activity className="w-3 h-3"/> Izin / Sakit</span>
            </div>
            <div className="bg-emerald-50/50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30 flex flex-col items-center text-center justify-center">
               <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">{Math.floor(summaryStats.totalMenitKerja / 60)}h {summaryStats.totalMenitKerja % 60}m</span>
               <span className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wider mt-1 flex items-center justify-center gap-1"><Clock className="w-3 h-3"/> Jam Kerja</span>
            </div>
            <div className="bg-orange-50/50 dark:bg-orange-900/20 p-3 rounded-xl border border-orange-100 dark:border-orange-900/30 flex flex-col items-center text-center justify-center">
               <span className="text-xl font-black text-orange-700 dark:text-orange-400">{Math.floor(summaryStats.totalMenitLembur / 60)}h {summaryStats.totalMenitLembur % 60}m</span>
               <span className="text-[10px] font-bold text-orange-600/70 dark:text-orange-400/70 uppercase tracking-wider mt-1 flex items-center justify-center gap-1"><Clock className="w-3 h-3"/> Jam Lembur</span>
            </div>
          </div>
        )}

        {!isFetched && !loading ? (
           <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-teal-100 dark:border-teal-900 rounded-xl min-h-[300px] bg-slate-50/50 dark:bg-gray-800/30">
             <Filter className="w-12 h-12 text-teal-200 dark:text-teal-800 mb-4" />
             <p className="text-teal-900 dark:text-teal-300 font-semibold mb-1">Menarik Data...</p>
           </div>
        ) : loading ? (
           <div className="flex flex-col items-center justify-center p-12 min-h-[300px]">
              <Loader2 className="w-8 h-8 text-teal-500 animate-spin mb-4" />
              <p className="text-sm font-medium text-slate-500">Memuat riwayat...</p>
           </div>
        ) : filteredData.length === 0 ? (
           <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-200 dark:border-gray-700 rounded-xl min-h-[300px]">
             <p className="text-slate-400 dark:text-slate-500 mb-1 text-sm font-bold">Tidak ada data ditemukan pada rentang waktu atau filter ini.</p>
             <p className="text-xs text-slate-400/70 max-w-[300px]">
               Atur ulang filter atau ubah rentang waktu menjadi <b>Semua Waktu</b>.
             </p>
           </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-x-auto ring-1 ring-black/5 dark:ring-white/5">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-gray-700/50">
                <TableRow className="hover:bg-transparent border-slate-200 dark:border-gray-700">
                  <TableHead className="font-bold text-slate-600 dark:text-gray-300 uppercase text-[10px] tracking-wider py-3 px-4">Karyawan</TableHead>
                  <TableHead className="font-bold text-slate-600 dark:text-gray-300 uppercase text-[10px] tracking-wider py-3 px-4">Tanggal & Jam</TableHead>
                  <TableHead className="font-bold text-slate-600 dark:text-gray-300 uppercase text-[10px] tracking-wider py-3 px-4">Tipe & Status</TableHead>
                  <TableHead className="font-bold text-slate-600 dark:text-gray-300 uppercase text-[10px] tracking-wider py-3 px-4 min-w-[200px]">Detail / Informasi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((log) => {
                  const u = usersList.find(user => user.uid === log.userId || user.id === log.userId);
                  return (
                  <TableRow key={log.id} className="group border-b border-slate-100 dark:border-gray-700/50 hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                    <TableCell className="py-3 px-4">
                       <div className="flex flex-col">
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{u?.name || log.userId}</span>
                          <span className="text-[10px] text-slate-500">{u?.role ? String(u.role).toUpperCase() : "-"} • {u?.areaId || "Area PUSAT"}</span>
                       </div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                       <div className="flex flex-col">
                         <span className="font-bold text-xs text-slate-700 dark:text-slate-300">
                           {format(new Date(log.timestamp), "d MMM yyyy", { locale: localeId })}
                         </span>
                         <span className="font-mono text-[11px] text-slate-500">
                           {format(new Date(log.timestamp), "HH:mm")} WIB
                         </span>
                       </div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          log.type === 'in' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' 
                          : log.type === 'out' ? 'bg-slate-100 text-slate-700 dark:bg-gray-700 dark:text-slate-300'
                          : log.type === 'overtime_in' || log.type === 'overtime' ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                          : log.type === 'overtime_out' ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                          : log.type === 'sick' ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : log.type === 'permit' || log.type === 'cuti' ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                        }`}>
                          {log.type.replace('_', ' ')}
                        </span>
                        {log.status === "PENDING" || log.status === "pending_approval" ? (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-[9px] h-4">Menunggu</Badge>
                        ) : log.status === "REJECTED" || log.status === "rejected" ? (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[9px] h-4">Ditolak</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] h-4">Valid</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                       <div className="flex flex-col gap-1 items-start">
                          {log.method === "qr" ? (
                             <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">Scan QR</span>
                          ) : (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                               log.withinRadius ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-orange-50 text-orange-700 border-orange-200"
                            }`}>
                               {log.withinRadius ? "✅ VALID GEOFENCE" : "⚠️ LUAR GEOFENCE"}
                            </span>
                          )}
                          {(log.extraData || log.notes) && (
                             <span className="text-[10px] text-slate-600 dark:text-slate-400 italic mt-0.5 break-all max-w-[250px]">
                               &quot;{log.extraData || log.notes}&quot;
                             </span>
                          )}
                          {log.location && log.method !== "qr" && typeof log.location.lat === 'number' && typeof log.location.lng === 'number' && (
                            <span className="text-[9px] text-slate-400 font-mono">
                               {log.location.lat.toFixed(5)}, {log.location.lng.toFixed(5)}
                            </span>
                          )}
                       </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
