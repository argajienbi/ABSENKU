import React from 'react';
import { ArrowLeft, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { Card } from '../../components/ui/card';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useUserAppContext } from './UserAppContext';

export const NotificationsView = () => {
  const { setView, appNotifications } = useUserAppContext();

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-xl mx-auto mb-24 pb-10">
        <div className="sticky top-0 z-50 overflow-hidden flex items-center justify-between px-4 py-3 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border-b border-teal-500/10 dark:border-white/5 shadow-sm -mx-4 -mt-4 mb-4 rounded-b-[2rem]">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 via-transparent to-transparent dark:from-teal-950/20 pointer-events-none" />
          <svg className="absolute inset-x-0 -top-4 w-full h-[150%] opacity-[0.05] dark:opacity-[0.03] pointer-events-none" viewBox="0 0 1440 320" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path fill="#0d9488" d="M0,256L48,229.3C96,203,192,149,288,154.7C384,160,480,224,576,218.7C672,213,768,139,864,122.7C960,107,1056,149,1152,176C1248,203,1344,213,1392,218.7L1440,224L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
          </svg>
          <div className="relative z-10 flex items-center gap-3">
              <button onClick={() => setView('home')} className="p-2 -ml-2 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-zinc-300 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                <Bell className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                Notifikasi In-App & Push
              </h2>
          </div>
        </div>
      
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-white/50 dark:border-gray-700 shadow-xl overflow-hidden rounded-3xl p-6 relative">
          <div className="space-y-3">
            <p className="text-sm font-bold text-teal-700 dark:text-teal-300 uppercase tracking-widest">Notifikasi Terbaru</p>
            {appNotifications.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                  <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-400">Belum ada notifikasi.</p>
                </div>
            ) : (
                appNotifications.map((notif: any) => (
                  <div key={notif.id} onClick={async () => {
                    if (!notif.read) {
                      try {
                        await updateDoc(doc(db, "notifications", notif.id), { read: true });
                      } catch (e) {
                        console.error("Gagal update notifikasi", e);
                      }
                    }
                  }} className={`p-4 rounded-2xl border transition-all cursor-pointer ${notif.read ? 'bg-gray-50/50 dark:bg-gray-800/30 border-transparent opacity-70' : 'bg-white dark:bg-gray-800 border-teal-100 dark:border-teal-900/50 shadow-sm'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`text-sm ${notif.read ? 'font-medium' : 'font-bold'} text-gray-900 dark:text-white`}>{notif.title}</h4>
                      <span className="text-[9px] text-slate-400 font-bold ml-2 shrink-0">{format(new Date(notif.createdAt), "dd MMM HH:mm")}</span>
                    </div>
                    <p className={`text-xs ${notif.read ? 'text-slate-500' : 'text-slate-600 dark:text-slate-300'}`}>{notif.body}</p>
                  </div>
                ))
            )}
          </div>
      </Card>
    </div>
  );
};
