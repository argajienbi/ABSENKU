import React from 'react';
import { User, Edit, ChevronRight, IdCard, Sun, Moon, LogOut, ArrowLeft, Activity, Share2, Download, Fingerprint, Check, Code, Camera, Phone, Key, Settings } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { db, auth } from '../../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { getEffectiveShiftId } from '../../../lib/dateUtils';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useUserAppContext } from '../UserAppContext';

export const ProfileMenu = () => {
    const { 
        profileTab, setProfileTab, user, settings, resolvedShifts,
        theme, setTheme, idCardSide, setIdCardSide, idCardRef,
        showFaceUpdateCam, setShowFaceUpdateCam, editWebcamRef, editFaceBase64, captureEditFace,
        editName, setEditName, editPhone, setEditPhone, handleResetPassword, handleSaveProfile,
        isEditSaving, handleShareIDCard, handleDownloadIDCard, setView
    } = useUserAppContext();

    const navigate = useNavigate();

    return (
                  <>
            <h2 className="text-xl font-bold px-2 dark:text-gray-100 flex items-center gap-2">
              <User className="w-5 h-5 text-teal-600 dark:text-teal-400" /> Profil Saya
            </h2>

            <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-700/50">
                <button 
                  onClick={() => setProfileTab('edit-profile')}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-900/40 flex items-center justify-center text-teal-600 dark:text-teal-400">
                        <Edit className="w-4 h-4" />
                    </div>
                    Edit Profil & Wajah
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>

                <button 
                  onClick={() => setProfileTab('id-card')}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
                        <IdCard className="w-4 h-4" />
                    </div>
                    ID Card Karyawan
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
            </Card>

            <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2 py-1 mt-4">Pengaturan</div>
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-700/50">
                <button 
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                    </div>
                    {theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                  </div>
                </button>

                {(user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'demo') && (
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 text-sm font-semibold text-teal-600 dark:text-teal-400">
                      <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-900/40 flex items-center justify-center">
                          <Settings className="w-4 h-4" />
                      </div>
                      Admin Dashboard
                    </div>
                  </button>
                )}

                <button 
                  onClick={() => auth.signOut()}
                  className="w-full flex items-center justify-between p-4 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <div className="flex items-center gap-3 text-sm font-semibold text-red-500">
                    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                        <LogOut className="w-4 h-4" />
                    </div>
                    Keluar
                  </div>
                </button>
            </Card>
          </>
    );
};
