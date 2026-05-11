import React from 'react';
import { CalendarDays, Briefcase, LogOut, Activity, UserSquare2 } from 'lucide-react';
import { format, isSameDay, isSunday, isSaturday, eachDayOfInterval, subDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { Card, CardContent } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { isHoliday } from '../../lib/dateUtils';
import { useUserAppContext } from './UserAppContext';

export const HistoryView = () => {
  const { 
    summary, summaryModalCategory, setSummaryModalCategory, selectedDate, setSelectedDate, myHistory 
  } = useUserAppContext();

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-3xl mx-auto">
        <h2 className="text-xl font-bold px-2 flex items-center gap-2 dark:text-gray-100">
          <CalendarDays className="w-5 h-5 text-teal-600 dark:text-teal-400" /> Rekap Kehadiran
        </h2>
        
        <h2 className="text-xl font-bold px-2 flex items-center gap-2 dark:text-gray-100 mb-2 mt-4">
          <CalendarDays className="w-5 h-5 text-teal-600 dark:text-teal-400" /> Ringkasan Bulan Ini
        </h2>
        <div className="grid grid-cols-5 gap-2 mb-4">
            <div onClick={() => setSummaryModalCategory('hadir')} className="bg-teal-50 dark:bg-teal-900/40 p-3 rounded-2xl text-center flex flex-col items-center shadow-sm cursor-pointer hover:bg-teal-100 dark:hover:bg-teal-800/40 transition-colors active:scale-95">
              <span className="text-lg font-bold text-teal-600 dark:text-teal-400">{summary.hadirCount}</span>
              <span className="text-[9px] uppercase tracking-wider font-bold text-teal-700/60 dark:text-teal-500">Hadir</span>
            </div>
            <div onClick={() => setSummaryModalCategory('telat')} className="bg-yellow-50 dark:bg-yellow-900/40 p-3 rounded-2xl text-center flex flex-col items-center shadow-sm cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-800/40 transition-colors active:scale-95">
              <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{summary.telatCount}</span>
              <span className="text-[9px] uppercase tracking-wider font-bold text-yellow-700/60 dark:text-yellow-500">Telat</span>
            </div>
            <div onClick={() => setSummaryModalCategory('ijin')} className="bg-blue-50 dark:bg-blue-900/40 p-3 rounded-2xl text-center flex flex-col items-center shadow-sm cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors active:scale-95">
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{summary.ijinCount}</span>
              <span className="text-[9px] uppercase tracking-wider font-bold text-blue-700/60 dark:text-blue-500">Ijin</span>
            </div>
            <div onClick={() => setSummaryModalCategory('alpa')} className="bg-red-50 dark:bg-red-900/40 p-3 rounded-2xl text-center flex flex-col items-center shadow-sm cursor-pointer hover:bg-red-100 dark:hover:bg-red-800/40 transition-colors active:scale-95">
              <span className="text-lg font-bold text-red-600 dark:text-red-400">{summary.alpaCount}</span>
              <span className="text-[9px] uppercase tracking-wider font-bold text-red-700/60 dark:text-red-500">Alpa</span>
            </div>
            <div onClick={() => setSummaryModalCategory('lembur')} className="bg-amber-50 dark:bg-amber-900/40 p-3 rounded-2xl text-center flex flex-col items-center shadow-sm cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-800/40 transition-colors active:scale-95">
              <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{summary.lemburHours.toFixed(1)}</span>
              <span className="text-[9px] uppercase tracking-wider font-bold text-amber-700/60 dark:text-amber-500">Jam Lmbr</span>
            </div>
        </div>

        {summaryModalCategory && (
          <Dialog open={!!summaryModalCategory} onOpenChange={(open) => !open && setSummaryModalCategory(null)}>
            <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 rounded-[2rem] border-0 shadow-2xl p-6 w-[90%] mx-auto max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-black capitalize tracking-tight text-gray-900 dark:text-white">
                  Rincian {summaryModalCategory === 'ijin' ? 'Ijin / Sakit' : summaryModalCategory}
                </DialogTitle>
              </DialogHeader>
              <div className="mt-4 space-y-3">
                {summaryModalCategory === 'hadir' && summary.hadirDates.length === 0 && <p className="text-sm text-gray-500 italic text-center">Belum ada riwayat</p>}
                {summaryModalCategory === 'hadir' && summary.hadirDates.map((d: Date, i: number) => (
                    <div key={i} className="flex justify-between items-center bg-teal-50 dark:bg-teal-900/20 px-4 py-3 rounded-xl border border-teal-100 dark:border-teal-800/30">
                      <span className="font-bold text-sm text-teal-800 dark:text-teal-200">{format(d, "EEEE, dd MMM yyyy", { locale: id })}</span>
                    </div>
                ))}
                
                {summaryModalCategory === 'telat' && summary.telatDates.length === 0 && <p className="text-sm text-gray-500 italic text-center">Belum ada riwayat</p>}
                {summaryModalCategory === 'telat' && summary.telatDates.map((d: Date, i: number) => (
                    <div key={i} className="flex justify-between items-center bg-yellow-50 dark:bg-yellow-900/20 px-4 py-3 rounded-xl border border-yellow-100 dark:border-yellow-800/30">
                      <span className="font-bold text-sm text-yellow-800 dark:text-yellow-200">{format(d, "EEEE, dd MMM yyyy", { locale: id })}</span>
                    </div>
                ))}

                {summaryModalCategory === 'ijin' && summary.ijinDates.length === 0 && <p className="text-sm text-gray-500 italic text-center">Belum ada riwayat</p>}
                {summaryModalCategory === 'ijin' && summary.ijinDates.map((d: Date, i: number) => (
                    <div key={i} className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 px-4 py-3 rounded-xl border border-blue-100 dark:border-blue-800/30">
                      <span className="font-bold text-sm text-blue-800 dark:text-blue-200">{format(d, "EEEE, dd MMM yyyy", { locale: id })}</span>
                    </div>
                ))}

                {summaryModalCategory === 'alpa' && summary.alpaDates.length === 0 && <p className="text-sm text-gray-500 italic text-center">Belum ada riwayat</p>}
                {summaryModalCategory === 'alpa' && summary.alpaDates.map((d: Date, i: number) => (
                    <div key={i} className="flex justify-between items-center bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl border border-red-100 dark:border-red-800/30">
                      <span className="font-bold text-sm text-red-800 dark:text-red-200">{format(d, "EEEE, dd MMM yyyy", { locale: id })}</span>
                    </div>
                ))}
                
                {summaryModalCategory === 'lembur' && summary.lemburDetails.length === 0 && <p className="text-sm text-gray-500 italic text-center">Belum ada riwayat</p>}
                {summaryModalCategory === 'lembur' && summary.lemburDetails.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center bg-amber-50 dark:bg-amber-900/20 px-4 py-3 rounded-xl border border-amber-100 dark:border-amber-800/30">
                      <span className="font-bold text-sm text-amber-800 dark:text-amber-200">{format(item.date, "EEEE, dd MMM", { locale: id })}</span>
                      <span className="text-xs font-black bg-amber-200 dark:bg-amber-700 text-amber-900 dark:text-amber-100 px-2 py-1 rounded-md">{item.hours.toFixed(1)} Jam</span>
                    </div>
                ))}
              </div>
              <div className="mt-6">
                <Button onClick={() => setSummaryModalCategory(null)} className="w-full rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 font-bold">Tutup</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        <div className="flex overflow-x-auto gap-3 py-4 px-2 -mx-2 mb-4 scrollbar-hide snap-x">
            {eachDayOfInterval({ start: subDays(new Date(), 14), end: new Date() }).reverse().map(date => {
                const isSelected = isSameDay(date, selectedDate);
                const holiday = isHoliday(date);
                const sunday = isSunday(date);
                const saturday = isSaturday(date);
                
                let baseClass = 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300';
                if (holiday) baseClass = 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
                else if (sunday) baseClass = 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400';
                else if (saturday) baseClass = 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
                
                let selectedClass = 'bg-teal-500 text-white shadow-lg shadow-teal-500/30';
                if (holiday) selectedClass = 'bg-purple-500 text-white shadow-lg shadow-purple-500/30';
                else if (sunday) selectedClass = 'bg-red-500 text-white shadow-lg shadow-red-500/30';
                else if (saturday) selectedClass = 'bg-blue-500 text-white shadow-lg shadow-blue-500/30';

                return (
                  <button
                      key={date.toString()}
                      onClick={() => setSelectedDate(date)}
                      className={`flex flex-col items-center justify-center p-2 rounded-[2rem] min-w-[65px] transition-all duration-300 snap-center relative focus:outline-none ${isSelected ? 'min-h-[90px] scale-110 z-10 ' + selectedClass : 'min-h-[75px] scale-100 opacity-90 hover:opacity-100 ' + baseClass}`}
                  >
                      <span className={`text-[10px] font-bold uppercase mb-1 ${isSelected ? 'opacity-90' : 'opacity-70'}`}>{format(date, "EEE", { locale: id })}</span>
                      <span className={`text-xl font-black ${isSelected ? 'scale-110' : ''}`}>{format(date, "dd")}</span>
                  </button>
                );
            })}
        </div>

        {((): any => {
            const filteredHistory = myHistory.filter((log: any) => isSameDay(new Date(log.timestamp), selectedDate));
            if (filteredHistory.length === 0) {
              return (
                <Card className="bg-white dark:bg-gray-800 shadow-sm border-0">
                  <CardContent className="p-8 text-center text-gray-500 dark:text-gray-400">
                      Tidak ada riwayat absensi di tanggal {format(selectedDate, "dd MMM yyyy", { locale: id })}.
                  </CardContent>
                </Card>
              );
            }
            return (
              <div className="space-y-3 pb-8">
                {filteredHistory.map((log: any) => (
                  <Card key={log.id} className="bg-white dark:bg-gray-800 border-0 shadow-sm rounded-xl overflow-hidden">
                    <div className="flex p-4 items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${log.type === 'in' ? 'bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400' : log.type === 'overtime_in' ? 'bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' : log.type === 'overtime_out' ? 'bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400' : ['sick', 'permit', 'cuti', 'melahirkan', 'meninggal', 'dispensasi'].includes(log.type) ? 'bg-cyan-50 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400' : 'bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400'}`}>
                          {['sick', 'permit', 'cuti', 'melahirkan', 'meninggal', 'dispensasi'].includes(log.type) ? <UserSquare2 className="w-5 h-5"/> : (log.type === 'in' || log.type === 'overtime_in') ? <Briefcase className="w-5 h-5"/> : <LogOut className="w-5 h-5"/>}
                        </div>
                        <div>
                            <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">
                              {log.type === 'in' ? 'Masuk' : log.type === 'out' ? 'Pulang' : log.type === 'overtime_in' ? 'Lembur Msk' : log.type === 'overtime_out' ? 'Lembur Plg' : log.type === 'sick' ? 'Sakit' : log.type === 'permit' ? 'Izin Biasa' : log.type === 'cuti' ? 'Cuti' : log.type === 'melahirkan' ? 'Cuti Hamil' : log.type === 'meninggal' ? 'Berduka' : log.type === 'dispensasi' ? 'Dispensasi' : log.type}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">{format(new Date(log.timestamp), "dd MMM yyyy")}</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                          <p className="text-lg font-bold text-gray-800 dark:text-gray-100 tracking-tight">{format(new Date(log.timestamp), "HH:mm")}</p>
                          <div className="flex items-center gap-1 mt-1">
                            {log.isPending && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[8px] uppercase font-bold animate-pulse">
                                <Activity className="w-2 h-2" /> Syncing
                              </span>
                            )}
                            {log.status === "pending_approval" && <span className="inline-block px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 text-[8px] uppercase font-bold">Pending</span>}
                            {log.status === "rejected" && <span className="inline-block px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[8px] uppercase font-bold">Ditolak</span>}
                            <span className="inline-block px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-[9px] uppercase font-bold text-gray-600 dark:text-gray-300">
                              {log.method}
                            </span>
                          </div>
                      </div>
                    </div>
                    {log.photoBase64 && (
                      <div className="relative mt-0 border-t border-gray-100 dark:border-gray-700/50 p-4">
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wide font-bold">Foto Absen (Otomatis Dihapus Besok)</p>
                        <img src={log.photoBase64} alt="Foto Absen" className="w-full h-auto max-h-48 object-cover rounded-xl" />
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            );
        })()}

    </div>
  );
};
