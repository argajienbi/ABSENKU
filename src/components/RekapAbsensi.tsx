import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Search, Loader2, Download, Table as TableIcon } from "lucide-react";
import { Button } from "./ui/button";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface RekapAbsensiProps {
  usersList: any[];
}

export function RekapAbsensi({ usersList }: RekapAbsensiProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [period, setPeriod] = useState<string>("daily"); // daily, weekly, monthly
  const [searchQuery, setSearchQuery] = useState("");
  
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    return usersList.filter(u => 
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [usersList, searchQuery]);

  // Fetch attendance data when user changes
  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        if (selectedUserId === "all") {
           setAttendanceData([]);
           setLoading(false);
           return;
        }

        const q = query(
          collection(db, "attendance"),
          where("userId", "==", selectedUserId)
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        // Sort descending locally to avoid requiring a composite index
        data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setAttendanceData(data);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, "attendance");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [selectedUserId]);

  const filteredDataByPeriod = useMemo(() => {
    const now = new Date();
    
    return attendanceData.filter(record => {
      if (!record.timestamp) return false;
      const recordDate = new Date(record.timestamp);

      if (period === "daily") {
        return format(recordDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
      } else if (period === "weekly") {
        const start = startOfWeek(now, { weekStartsOn: 1 });
        const end = endOfWeek(now, { weekStartsOn: 1 });
        return isWithinInterval(recordDate, { start, end });
      } else if (period === "monthly") {
        const start = startOfMonth(now);
        const end = endOfMonth(now);
        return isWithinInterval(recordDate, { start, end });
      }
      return true;
    });
  }, [attendanceData, period]);

  const handleExportExcel = () => {
    const header = ["Tanggal", "Jam", "Status", "Tipe", "Radius", "Lokasi", "Catatan"];
    const records = filteredDataByPeriod.map(log => [
      format(new Date(log.timestamp), "yyyy-MM-dd"),
      format(new Date(log.timestamp), "HH:mm:ss"),
      log.status || "APPROVED",
      log.type,
      log.withinRadius ? "Dalam Radius" : "Luar Radius",
      log.location ? `${log.location.lat}, ${log.location.lng}` : "-",
      log.extraData ? log.extraData.replace(/,/g, ' ') : "-"
    ]);
    
    const ws = XLSX.utils.aoa_to_sheet([header, ...records]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Absensi");
    XLSX.writeFile(wb, `Rekap_Absen_${selectedUserId}_${period}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Laporan Rekap Absensi", 14, 20);
    doc.setFontSize(10);
    const selectedUser = usersList.find(u => u.uid === selectedUserId || u.id === selectedUserId);
    doc.text(`User: ${selectedUser?.name || 'Unknown'}`, 14, 28);
    doc.text(`Periode: ${period.toUpperCase()}`, 14, 34);
    
    const tableColumn = ["Tanggal", "Jam", "Status", "Tipe", "Radius", "Catatan"];
    const tableRows = filteredDataByPeriod.map(log => [
      format(new Date(log.timestamp), "yyyy-MM-dd"),
      format(new Date(log.timestamp), "HH:mm:ss"),
      log.status || "APPROVED",
      log.type,
      log.withinRadius ? "Dalam Radius" : "Luar Radius",
      log.extraData ? log.extraData.replace(/,/g, ' ') : "-"
    ]);
    
    autoTable(doc, { 
      head: [tableColumn],
      body: tableRows,
      startY: 40,
    });
    doc.save(`Rekap_Absen_${selectedUserId}_${period}.pdf`);
  };

  return (
    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border-0 shadow-xl overflow-hidden p-0 relative">
      <CardHeader className="border-b border-teal-50 dark:border-teal-900 p-6 m-0 bg-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <CardTitle className="text-teal-900 dark:text-teal-50 font-black text-xl tracking-tight">Rekap Absensi</CardTitle>
          <CardDescription className="text-xs font-medium text-slate-500 dark:text-gray-400">Rekapitulasi harian, mingguan, dan bulanan untuk tiap user.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
           <div className="w-full sm:w-1/3">
             <label className="text-xs font-bold text-slate-500 dark:text-gray-400 mb-1 block uppercase tracking-wider">Cari & Pilih User</label>
             <select 
               value={selectedUserId} 
               onChange={(e) => setSelectedUserId(e.target.value)}
               className="w-full h-10 items-center justify-between rounded-xl border border-teal-100 dark:border-teal-900 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-slate-500 dark:text-gray-300 font-bold outline-none"
             >
                <option value="all">-- Pilih Karyawan --</option>
                {filteredUsers.map(u => (
                  <option key={u.uid || u.id} value={u.uid || u.id}>
                    {u.name || "Unnamed"} {u.role ? `(${u.role})` : ''}
                  </option>
                ))}
             </select>
           </div>
           
           <div className="w-full sm:w-1/4">
             <label className="text-xs font-bold text-slate-500 dark:text-gray-400 mb-1 block uppercase tracking-wider">Periode Rekap</label>
             <select 
               value={period} 
               onChange={(e) => setPeriod(e.target.value)} 
               disabled={selectedUserId === 'all'}
               className="w-full h-10 items-center justify-between rounded-xl border border-teal-100 dark:border-teal-900 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-slate-500 dark:text-gray-300 font-bold outline-none"
             >
                 <option value="daily">Harian (Hari Ini)</option>
                 <option value="weekly">Mingguan (Minggu Ini)</option>
                 <option value="monthly">Bulanan (Bulan Ini)</option>
             </select>
           </div>

           <div className="w-full sm:w-auto mt-auto flex gap-2">
             <Button 
               disabled={selectedUserId === 'all' || filteredDataByPeriod.length === 0} 
               onClick={handleExportExcel}
               variant="outline" 
               className="h-10 rounded-xl text-teal-600 border-teal-200 hover:bg-teal-50 dark:text-teal-400 dark:border-teal-800 dark:hover:bg-teal-900/50 flex-1 sm:flex-none"
             >
                <TableIcon className="w-4 h-4 mr-2" /> Excel
             </Button>
             <Button 
               disabled={selectedUserId === 'all' || filteredDataByPeriod.length === 0} 
               onClick={handleExportPDF}
               variant="outline" 
               className="h-10 rounded-xl text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/50 flex-1 sm:flex-none"
             >
                <Download className="w-4 h-4 mr-2" /> PDF
             </Button>
           </div>
        </div>

        {selectedUserId === 'all' ? (
           <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-teal-100 dark:border-teal-900 rounded-3xl min-h-[300px]">
             <TableIcon className="w-12 h-12 text-teal-200 dark:text-teal-800 mb-4" />
             <p className="text-teal-800 dark:text-teal-300 font-semibold mb-1">Pilih Karyawan</p>
             <p className="text-xs text-teal-500/70 dark:text-teal-400/50 max-w-[250px]">
               Gunakan kotak pencarian di atas untuk memilih karyawan yang ingin dilihat rekap absensinya.
             </p>
           </div>
        ) : loading ? (
           <div className="flex flex-col items-center justify-center p-12 min-h-[300px]">
              <Loader2 className="w-8 h-8 text-teal-500 animate-spin mb-4" />
              <p className="text-sm font-medium text-slate-500">Memuat riwayat...</p>
           </div>
        ) : filteredDataByPeriod.length === 0 ? (
           <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-100 dark:border-gray-700 rounded-3xl min-h-[300px]">
             <p className="text-slate-400 dark:text-slate-500 mb-1 text-sm">Tidak ada data.</p>
             <p className="text-xs text-slate-400/70 max-w-[250px]">
               Belum ada catatan kehadiran untuk karyawan ini pada periode yang dipilih.
             </p>
           </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-teal-50 dark:border-teal-900/50 overflow-x-auto ring-1 ring-black/5 dark:ring-white/5">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-gray-700/50 border-b border-teal-50 dark:border-teal-900/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[120px] font-bold text-slate-500 dark:text-gray-400 uppercase text-[10px] tracking-wider py-4 px-4 whitespace-nowrap">Tanggal</TableHead>
                  <TableHead className="font-bold text-slate-500 dark:text-gray-400 uppercase text-[10px] tracking-wider py-4 px-4 whitespace-nowrap">Jam</TableHead>
                  <TableHead className="font-bold text-slate-500 dark:text-gray-400 uppercase text-[10px] tracking-wider py-4 px-4 whitespace-nowrap">Status</TableHead>
                  <TableHead className="font-bold text-slate-500 dark:text-gray-400 uppercase text-[10px] tracking-wider py-4 px-4 whitespace-nowrap">Tipe</TableHead>
                  <TableHead className="font-bold text-slate-500 dark:text-gray-400 uppercase text-[10px] tracking-wider py-4 px-4 whitespace-nowrap text-right">Lokasi / Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDataByPeriod.map((log) => (
                  <TableRow key={log.id} className="group border-b border-teal-50/50 dark:border-teal-900/30 hover:bg-slate-50/80 dark:hover:bg-gray-700/50 transition-colors">
                    <TableCell className="py-4 px-4 font-semibold text-xs text-slate-700 dark:text-slate-300">
                      {format(new Date(log.timestamp), "d MMM yyyy")}
                    </TableCell>
                    <TableCell className="py-4 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {format(new Date(log.timestamp), "HH:mm")}
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      {log.status === "PENDING" ? (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800">Pending</Badge>
                      ) : log.status === "REJECTED" ? (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">Rejected</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">Approved</Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.type === 'in' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' 
                        : log.type === 'overtime' ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        : log.type === 'location' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                      }`}>
                        {log.type.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 px-4 text-right">
                       <div className="flex flex-col items-end gap-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                             log.withinRadius ? "bg-teal-50 text-teal-700 border border-teal-200" : "bg-orange-50 text-orange-700 border border-orange-200"
                          }`}>
                             {log.withinRadius ? "Dalam Radius" : "Luar Radius"}
                          </span>
                          {log.extraData && (
                             <span className="text-[10px] text-slate-500 max-w-[150px] truncate" title={log.extraData}>
                               {log.extraData}
                             </span>
                          )}
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
