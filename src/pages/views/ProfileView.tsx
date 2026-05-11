import React from 'react';
import { Code } from 'lucide-react';
import { useUserAppContext } from './UserAppContext';
import { ProfileMenu } from './profile/ProfileMenu';
import { ProfileIdCard } from './profile/ProfileIdCard';
import { ProfileEdit } from './profile/ProfileEdit';

// Versi 4.0.0 - Big Update: Dynamic Maps & Stability
export const ProfileView = () => {
  const { profileTab } = useUserAppContext();

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-xl mx-auto">
        {profileTab === "menu" && (
          <>
            <ProfileMenu />
            
            {/* Changelog Section */}
            <div className="mt-8 px-2 pb-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-teal-600 dark:text-teal-400">
                  <Code className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Changelog & Update</h3>
              </div>
              
              <div className="space-y-6">
                <div className="relative pl-4 border-l-2 border-teal-500">
                  <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-teal-500 ring-4 ring-teal-500/20"></div>
                  <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 4.0.1 <span className="text-xs font-normal text-gray-500 ml-2">Baru saja</span></h5>
                  <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                    <li><b>UI Update:</b> Memperbaiki tampilan history foto menjadi mode portrait yang lebih rapi (tidak terpotong secara landscape).</li>
                  </ul>
                </div>

                <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                  <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                  <h5 className="font-bold text-gray-700 dark:text-gray-300 text-sm">Versi 4.0.0</h5>
                  <p className="mt-1 text-xs text-gray-500">Perbaikan bug QR Scanner dan perapihan UI Profile.</p>
                </div>
              </div>
            </div>
          </>
        )}
        {profileTab === "id-card" && <ProfileIdCard />}
        {profileTab === "edit-profile" && <ProfileEdit />}
    </div>
  );
};
