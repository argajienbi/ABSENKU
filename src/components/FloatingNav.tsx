import React from 'react';
import { motion } from 'motion/react';
import { Home, CalendarDays, User, Bell } from 'lucide-react';
import { WAVE_SVG } from '../constants';

export function FloatingNav({ view, setView, setProfileTab, unreadCount = 0 }: { view: string, setView: (v: any) => void, setProfileTab: (v: any) => void, unreadCount?: number }) {
  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 px-4">
      <div 
        className="relative flex items-center justify-between w-full max-w-sm bg-gray-100 dark:bg-gray-800/50 p-2 sm:px-4 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 backdrop-blur-md gap-1"
        style={{ backgroundImage: WAVE_SVG, backgroundSize: 'cover', backgroundPosition: 'bottom' }}
      >
        <button 
          onClick={() => setView('home')}
          className={`flex flex-col items-center justify-center flex-1 h-16 rounded-xl transition-all ${view === 'home' ? 'bg-white dark:bg-gray-700 shadow-sm text-teal-600 dark:text-teal-400' : 'text-gray-500 hover:bg-gray-200/50'}`}
        >
          <Home className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">Home</span>
        </button>

        <button 
          onClick={() => setView('history')}
          className={`flex flex-col items-center justify-center flex-1 h-16 rounded-xl transition-all ${view === 'history' ? 'bg-white dark:bg-gray-700 shadow-sm text-teal-600 dark:text-teal-400' : 'text-gray-500 hover:bg-gray-200/50'}`}
        >
          <CalendarDays className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">Riwayat</span>
        </button>

        <button 
          onClick={() => setView('notifications')}
          className={`flex flex-col items-center justify-center flex-1 h-16 relative rounded-xl transition-all ${view === 'notifications' ? 'bg-white dark:bg-gray-700 shadow-sm text-teal-600 dark:text-teal-400' : 'text-gray-500 hover:bg-gray-200/50'}`}
        >
          <Bell className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">Notifikasi</span>
          {unreadCount > 0 && (
             <span className="absolute top-2 right-2 shadow-sm flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black tracking-widest text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
             </span>
          )}
        </button>

        <button 
          onClick={() => { setView('profile'); setProfileTab('menu'); }}
          className={`flex flex-col items-center justify-center flex-1 h-16 rounded-xl transition-all ${view === 'profile' ? 'bg-white dark:bg-gray-700 shadow-sm text-teal-600 dark:text-teal-400' : 'text-gray-500 hover:bg-gray-200/50'}`}
        >
          <User className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">Profil</span>
        </button>
      </div>
    </div>
  );
}

