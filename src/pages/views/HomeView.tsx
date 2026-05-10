import React from 'react';
import { ChevronUp, ChevronDown, Clock, MapPin, Globe, AlarmClock, DoorOpen, TrendingUp, TrendingDown, CalendarDays, ChevronRight } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { getEffectiveShiftId } from '../../lib/dateUtils';
import { Badge } from '../../components/ui/badge';
import { useUserAppContext } from './UserAppContext';
import { toast } from 'sonner';

export const HomeView = () => {
  const { 
    isCardExpanded, setIsCardExpanded, currentTime, user, resolvedShifts, 
    settings, location, distance, locationError, currentAreaName, 
    myHistory, setType, setView, canEnableOvertime, pendingCount, announcements 
  } = useUserAppContext();

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-5xl mx-auto md:px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <div className="group relative w-full rounded-[24px] p-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-sm transition-all text-left overflow-hidden">
          <button 
            onClick={() => setIsCardExpanded(!isCardExpanded)}
            className="absolute top-4 right-4 z-30 p-1.5 text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-colors hidden sm:block"
          >
              {isCardExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          
          {/* Inner Time & Shift Card */}
          <div 
            className="relative w-full rounded-[18px] bg-gradient-to-br from-indigo-500/90 to-cyan-600/90 p-4 text-center shadow-inner overflow-hidden mb-2 cursor-pointer transition-all active:scale-[0.98]"
            onClick={() => setIsCardExpanded(!isCardExpanded)}
          >
            <div className="absolute -top-4 -left-4 opacity-20 pointer-events-none">
              <Clock className="w-24 h-24 text-white" />
            </div>
            
            <div className={`grid transition-all duration-300 ease-in-out w-full ${isCardExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="overflow-hidden flex flex-col items-center w-full">
                  <div className="pt-2 pb-2 flex flex-col items-center w-full">
                    <h2 className="text-4xl sm:text-5xl font-black text-white tracking-[-0.02em] leading-none mb-1 drop-shadow-md">
                      {format(currentTime, "HH:mm:ss")}
                    </h2>
                    <p className="text-white/80 font-bold text-[11px] uppercase mb-4 tracking-widest drop-shadow-sm">
                      {format(currentTime, "EEEE, dd MMMM yyyy", { locale: id })}
                    </p>
                    
                    {/* Shift Info */}
                    <div className="flex flex-col items-center w-full z-10 bg-black/10 rounded-[14px] p-3 backdrop-blur-md border border-white/10">
                      {(() => {
                          const shiftId = getEffectiveShiftId(user, new Date());
                          const shift = resolvedShifts[shiftId] || resolvedShifts.shift1;
                          return (
                            <>
                              <span className="text-[10px] font-black text-cyan-100 uppercase tracking-widest mb-1 bg-white/20 px-2 py-0.5 rounded-full shadow-sm">INFO SHIFT</span>
                              <p className="text-xl leading-none font-black text-white mb-1.5 tracking-tight drop-shadow-sm">
                                {shift?.name || "Shift Standard"}
                              </p>
                              {shift?.gracePeriod > 0 && (
                                <p className="text-[9px] font-bold text-white/70 uppercase tracking-[0.1em]">
                                  TOLERANSI: {shift.gracePeriod} MENIT
                                </p>
                              )}
                            </>
                          )
                      })()}
                    </div>
                  </div>
              </div>
            </div>
            
            {/* Collapsed minimal view */}
            {!isCardExpanded && (
                <div className="flex items-center justify-center gap-3 py-1 relative z-10">
                  <Clock className="w-6 h-6 text-white/90 drop-shadow-sm" />
                  <div className="text-left">
                    <h2 className="text-2xl font-black text-white leading-none tracking-tight drop-shadow-sm">{format(currentTime, "HH:mm")}</h2>
                    <p className="text-[10px] text-white/80 font-bold tracking-wider uppercase mt-0.5 leading-none">{format(currentTime, "EEEE, dd MMM", { locale: id })}</p>
                  </div>
                </div>
            )}
          </div>
          
          {/* Location Pill */}
          <div className="relative w-full rounded-[18px] bg-white/70 dark:bg-gray-800/70 p-3 shadow-inner border border-white/60 dark:border-white/5 overflow-hidden flex flex-col gap-2">
              <div className="flex items-start gap-3 w-full relative z-10">
                <div className="shrink-0 w-10 h-10 bg-blue-50/80 dark:bg-blue-900/40 rounded-xl flex justify-center items-center relative shadow-sm border border-blue-100 dark:border-blue-900/60 overflow-hidden">
                    <img 
                      src="https://cdn-icons-png.flaticon.com/512/2838/2838912.png" 
                      alt="Map Icon" 
                      className="w-7 h-7 object-contain drop-shadow-md hover:scale-110 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                </div>
                
                <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 text-[10px] font-black text-slate-800 dark:text-white tracking-widest leading-none truncate uppercase bg-slate-100/80 dark:bg-slate-900/50 px-2 py-1 rounded-md">
                        {!settings?.geofenceEnabled 
                          ? (location && distance !== null ? `JARAK: ${Math.round(distance)}M (BEBAS)` : "GEOFENCE NONAKTIF")
                          : (locationError ? "GAGAL LOKASI" : (location ? (distance !== null ? `JARAK: ${Math.round(distance)}M` : "MENGHITUNG...") : "MENCARI LOKASI..."))}
                      </div>
                      
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-md shrink-0 border border-emerald-100/50 dark:border-emerald-800/30 max-w-[110px]">
                        <MapPin className="w-3 h-3 fill-current shrink-0" />
                        {((currentAreaName || "Area...").length > 7) ? (
                          <div className="marquee-container w-full overflow-hidden">
                            <span className="text-[9px] font-black uppercase whitespace-nowrap animate-marquee block">
                              {currentAreaName || "Area..."}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[9px] font-black uppercase truncate">
                            {currentAreaName || "Area..."}
                          </span>
                        )}
                      </div>
                    </div>
                    {location ? (
                      <div className="flex items-center justify-between text-[9px] text-slate-500 dark:text-gray-400 mt-1 pl-0.5">
                        <span className="font-mono font-semibold tracking-tight truncate mr-2">LT: {location.lat.toFixed(5)} LG: {location.lng.toFixed(5)}</span>
                        {settings?.geofenceEnabled && (
                          <span className="font-bold tracking-widest uppercase shrink-0">
                            RAD: {
                            (() => {
                              if (user?.areaId && settings?.areas && settings.areas[user.areaId]) {
                                return `${settings.areas[user.areaId].radius}M`;
                              } else if (settings?.areas && Object.keys(settings.areas).length > 0) {
                                return `TITIK`;
                              }
                              return "-";
                            })()
                            }
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[9px] text-slate-500 dark:text-gray-400 mt-1 pl-0.5">
                        <span className="font-mono font-semibold tracking-tight">Menunggu koordinat...</span>
                      </div>
                    )}
                </div>
              </div>
          </div>
        </div>

      <div className="grid grid-cols-2 gap-3">
        {(() => {
            const todayLogs = myHistory.filter((log: any) => isSameDay(new Date(log.timestamp), new Date()));
            const inLog = todayLogs.find((log: any) => log.type === 'in');
            const outLog = todayLogs.find((log: any) => log.type === 'out');
            const myShiftId = getEffectiveShiftId(user, new Date());
            const myShift = resolvedShifts[myShiftId] || resolvedShifts["shift1"];
            const dayOfWeek = currentTime.getDay();
            const shiftDay = myShift && myShift.workDays ? myShift.workDays[dayOfWeek as keyof typeof myShift.workDays] : null;
            
            return (
              <>
                <button 
                  onClick={() => { setType("in"); setView("absen"); }}
                  className="group relative w-full rounded-[24px] p-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-left overflow-hidden"
                >
                  <div className="relative w-full rounded-[18px] bg-gradient-to-br from-teal-400 to-emerald-500 p-3 flex flex-col items-center justify-center text-white shadow-inner h-[88px] mb-2 overflow-hidden">
                      <div className="absolute -top-3 -right-3 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
                        <AlarmClock className="w-16 h-16" />
                      </div>
                      <AlarmClock className="w-7 h-7 mb-1.5 opacity-90 drop-shadow-sm" />
                      <span className="font-bold text-xs tracking-wide drop-shadow-sm">Absen Masuk</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 px-1 pb-1 text-center">
                      {shiftDay ? (
                        <>
                          <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Jadwal: {shiftDay.start}</span>
                          <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black tracking-wider uppercase shadow-[0_2px_10px_-2px_rgba(0,0,0,0.1)] ${inLog ? 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400'}`}>
                            {inLog ? 'Sudah Absen' : 'Belum Absen'}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Libur</span>
                          <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black tracking-wider uppercase shadow-[0_2px_10px_-2px_rgba(0,0,0,0.1)] ${inLog ? 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400'}`}>
                            {inLog ? 'Sudah Absen' : 'Belum Absen'}
                          </span>
                        </>
                      )}
                  </div>
                </button>

                <button 
                  onClick={() => {
                    if (!inLog) {
                      toast.error("Anda belum Absen Masuk. Tidak bisa Absen Pulang. Silakan hubungi Admin.");
                      return;
                    }
                    if (inLog.status === 'pending_approval') {
                      toast.error("Absen Masuk Anda masih menunggu Approval Admin. Tidak bisa Absen Pulang.");
                      return;
                    }
                    
                    setType("out"); 
                    setView("absen"); 
                  }}
                  className="group relative w-full rounded-[24px] p-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-left overflow-hidden"
                >
                  <div className="relative w-full rounded-[18px] bg-gradient-to-br from-purple-500 to-violet-500 p-3 flex flex-col items-center justify-center text-white shadow-inner h-[88px] mb-2 overflow-hidden">
                      <div className="absolute -top-3 -right-3 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
                        <DoorOpen className="w-16 h-16" />
                      </div>
                      <DoorOpen className="w-7 h-7 mb-1.5 opacity-90 drop-shadow-sm" />
                      <span className="font-bold text-xs tracking-wide drop-shadow-sm">Absen Pulang</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 px-1 pb-1 text-center">
                      {shiftDay ? (
                        <>
                          <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Jadwal: {shiftDay.end}</span>
                          <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black tracking-wider uppercase shadow-[0_2px_10px_-2px_rgba(0,0,0,0.1)] ${outLog ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400'}`}>
                            {outLog ? 'Sudah Absen' : 'Belum Absen'}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Libur</span>
                          <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black tracking-wider uppercase shadow-[0_2px_10px_-2px_rgba(0,0,0,0.1)] ${outLog ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400'}`}>
                            {outLog ? 'Sudah Absen' : 'Belum Absen'}
                          </span>
                        </>
                      )}
                  </div>
                </button>
              </>
            );
        })()}
        <button 
          disabled={!canEnableOvertime}
          onClick={() => { setType("overtime_in"); setView("absen"); }}
          className="group relative w-full rounded-[24px] p-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-left overflow-hidden"
        >
          <div className="relative w-full rounded-[18px] bg-gradient-to-br from-amber-400 to-amber-500 p-3 flex flex-col items-center justify-center text-white shadow-inner h-[88px] overflow-hidden">
              <div className="absolute -top-3 -right-3 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
                <TrendingUp className="w-16 h-16" />
              </div>
              <TrendingUp className="w-7 h-7 mb-1.5 opacity-90 drop-shadow-sm" />
              <span className="font-bold text-xs tracking-wide drop-shadow-sm">Lembur Masuk</span>
          </div>
        </button>
        <button 
          disabled={!canEnableOvertime}
          onClick={() => { setType("overtime_out"); setView("absen"); }}
          className="group relative w-full rounded-[24px] p-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-left overflow-hidden"
        >
          <div className="relative w-full rounded-[18px] bg-gradient-to-br from-rose-400 to-rose-500 p-3 flex flex-col items-center justify-center text-white shadow-inner h-[88px] overflow-hidden">
              <div className="absolute -top-3 -right-3 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
                <TrendingDown className="w-16 h-16" />
              </div>
              <TrendingDown className="w-7 h-7 mb-1.5 opacity-90 drop-shadow-sm" />
              <span className="font-bold text-xs tracking-wide drop-shadow-sm">Lembur Pulang</span>
          </div>
        </button>
        <button 
          onClick={() => { setView("izin_menu"); }}
          className="group relative w-full col-span-2 rounded-[24px] p-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-sm transition-all active:scale-95 text-left overflow-hidden"
        >
          <div className="relative w-full rounded-[18px] bg-gradient-to-br from-blue-400 to-indigo-500 p-4 flex flex-row items-center justify-between text-white shadow-inner overflow-hidden">
              <div className="absolute -top-6 -right-2 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
                <CalendarDays className="w-24 h-24" />
              </div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                    <CalendarDays className="w-6 h-6 drop-shadow-sm" />
                </div>
                <span className="font-bold text-sm tracking-wide drop-shadow-sm">Lapor Izin / Sakit / Cuti</span>
              </div>
              <ChevronRight className="w-6 h-6 opacity-70 relative z-10" />
          </div>
        </button>
      </div>
      </div>
      
      {pendingCount > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700/50 text-yellow-800 dark:text-yellow-400 px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse shrink-0 drop-shadow-sm"></div>
            <span className="text-xs font-medium">Anda memiliki <b>{pendingCount} absen menuggu approval.</b></span>
          </div>
        </div>
      )}
      
      {announcements.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.slice(0, 2).map((ann: any, idx: number) => (
              <div key={ann.id || idx} className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-teal-50 dark:border-teal-900/50 flex gap-3">
                  <div className={`mt-1 w-2 h-full rounded-full shrink-0 ${ann.type === 'danger' ? 'bg-rose-500' : ann.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={`text-[8px] uppercase font-black uppercase px-1.5 py-0 border-0 ${ann.type === 'danger' ? 'bg-rose-100 text-rose-700' : ann.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                        {ann.type === 'danger' ? 'PENTING' : ann.type === 'success' ? 'BERITA BAIK' : 'INFO'}
                      </Badge>
                      <span className="text-[9px] text-slate-400 font-bold">{format(new Date(ann.createdAt), 'dd MMM yyyy')}</span>
                    </div>
                    <h4 className="font-bold text-teal-900 dark:text-white text-sm capitalize leading-tight mb-1">{ann.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{ann.content}</p>
                  </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
