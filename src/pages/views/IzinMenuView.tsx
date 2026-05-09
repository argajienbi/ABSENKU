import React from 'react';
import { ArrowLeft, ChevronRight, UserSquare2, CalendarDays } from 'lucide-react';
import { useUserAppContext } from './UserAppContext';

export const IzinMenuView = () => {
  const { setType, setView, setActiveAbsenTab } = useUserAppContext();

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 max-w-xl mx-auto pb-10">
        <div className="sticky top-0 z-50 overflow-hidden flex items-center mb-4 px-4 py-3 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border-b border-teal-500/10 dark:border-white/5 shadow-sm -mx-4 -mt-4 rounded-b-[2rem]">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 via-transparent to-transparent dark:from-teal-950/20 pointer-events-none" />
          <svg className="absolute inset-x-0 -top-4 w-full h-[150%] opacity-[0.05] dark:opacity-[0.03] pointer-events-none" viewBox="0 0 1440 320" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path fill="#0d9488" d="M0,256L48,229.3C96,203,192,149,288,154.7C384,160,480,224,576,218.7C672,213,768,139,864,122.7C960,107,1056,149,1152,176C1248,203,1344,213,1392,218.7L1440,224L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
          </svg>
          <button onClick={() => setView('home')} className="relative z-10 p-2 -ml-2 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-zinc-300 transition-colors">
              <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="relative z-10 text-xl font-extrabold ml-2 text-zinc-900 dark:text-white tracking-tight">Pilih Jenis Laporan</h2>
        </div>
      
      <div className="grid grid-cols-1 gap-4">
        <button 
          onClick={() => { setType("sick"); setView("absen"); setActiveAbsenTab?.("selfie"); }}
          className="p-3.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-gray-700 rounded-2xl flex items-center justify-between font-bold shadow-sm transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0">
              <UserSquare2 className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-gray-900 dark:text-gray-100 font-bold text-sm">Sakit</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Wajib lapirkan surat dokter</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        <button 
          onClick={() => { setType("permit"); setView("absen"); setActiveAbsenTab?.("selfie"); }}
          className="p-3.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-gray-700 rounded-2xl flex items-center justify-between font-bold shadow-sm transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 rounded-xl flex items-center justify-center shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-gray-900 dark:text-gray-100 font-bold text-sm">Izin Biasa</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Keperluan pribadi / mendesak</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        <button 
          onClick={() => { setType("cuti"); setView("absen"); setActiveAbsenTab?.("selfie"); }}
          className="p-3.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-gray-700 rounded-2xl flex items-center justify-between font-bold shadow-sm transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-gray-900 dark:text-gray-100 font-bold text-sm">Cuti Tahunan</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Libur terencana tahunan</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        <button 
          onClick={() => { setType("melahirkan"); setView("absen"); setActiveAbsenTab?.("selfie"); }}
          className="p-3.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-gray-700 rounded-2xl flex items-center justify-between font-bold shadow-sm transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400 rounded-xl flex items-center justify-center shrink-0">
              <UserSquare2 className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-gray-900 dark:text-gray-100 font-bold text-sm">Cuti Melahirkan</p>
              <p className="text-[10px] sm:text-xs text-gray-500 font-medium mt-0.5">Wajib lampirkan surat RS</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
        </button>

        <button 
          onClick={() => { setType("meninggal"); setView("absen"); setActiveAbsenTab?.("selfie"); }}
          className="p-3.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-gray-700 rounded-2xl flex items-center justify-between font-bold shadow-sm transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl flex items-center justify-center shrink-0">
              <UserSquare2 className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-gray-900 dark:text-gray-100 font-bold text-sm">Izin Berduka / Meninggal</p>
              <p className="text-[10px] sm:text-xs text-gray-500 font-medium mt-0.5">Keluarga inti meninggal</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
        </button>
      </div>
    </div>
  );
};
