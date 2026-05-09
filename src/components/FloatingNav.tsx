import React from 'react';
import { Home, CalendarDays, User } from 'lucide-react';

export function FloatingNav({ view, setView, setProfileTab }: { view: string, setView: (v: any) => void, setProfileTab: (v: any) => void }) {
  const tabs = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-100 dark:bg-rose-500/20',
      onClick: () => setView('home'),
    },
    {
      id: 'history',
      label: 'Riwayat',
      icon: CalendarDays,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-500/20',
      onClick: () => setView('history'),
    },
    {
      id: 'profile',
      label: 'Profil',
      icon: User,
      color: 'text-fuchsia-600 dark:text-fuchsia-400',
      bgColor: 'bg-fuchsia-100 dark:bg-fuchsia-500/20',
      onClick: () => { setView('profile'); setProfileTab('menu'); },
    }
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 px-4">
      <div 
        className="flex items-center justify-between bg-white dark:bg-zinc-900 p-2 rounded-full shadow-2xl border border-gray-100 dark:border-gray-800 ring-1 ring-black/5 dark:ring-white/10"
      >
        {tabs.map((tab) => {
          const isActive = view === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={tab.onClick}
              className={`relative flex items-center justify-center transition-all duration-300 ease-out p-3 mx-1 rounded-full overflow-hidden ${
                isActive ? tab.bgColor : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <div className="relative z-10 flex items-center gap-2">
                <Icon strokeWidth={2.5} className={`w-6 h-6 shrink-0 transition-colors duration-300 ${isActive ? tab.color : 'text-gray-500 dark:text-gray-400'}`} />
                <div 
                  className={`flex items-center transition-all duration-300 overflow-hidden ${
                    isActive ? 'max-w-xs opacity-100 pl-1 pr-2' : 'max-w-0 opacity-0 px-0'
                  }`}
                >
                  <span className={`text-sm font-bold whitespace-nowrap ${tab.color}`}>
                    {tab.label}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

