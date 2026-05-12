import React, { useState } from 'react';
import { User, Edit, ChevronRight, IdCard, Sun, Moon, LogOut, Info, ArrowLeft, Activity, Share2, Download, Fingerprint, Check, Code, Camera, Phone, Key, Settings } from 'lucide-react';
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
import { toPng } from 'html-to-image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';

export const ProfileIdCard = () => {
    const { 
        profileTab, setProfileTab, user, settings, resolvedShifts,
        theme, setTheme, idCardSide, setIdCardSide, idCardRef,
        showFaceUpdateCam, setShowFaceUpdateCam, editWebcamRef, editFaceBase64, captureEditFace,
        editName, setEditName, editPhone, setEditPhone, handleResetPassword, handleSaveProfile,
        isEditSaving, setView
    } = useUserAppContext();

    const navigate = useNavigate();
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const handleShareIDCard = async () => {
      if (!idCardRef.current) return;
      try {
          const dataUrl = await toPng(idCardRef.current, { cacheBust: true, pixelRatio: 3 });
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], 'id-card.png', { type: 'image/png' });
          if (navigator.share && navigator.canShare({ files: [file] })) {
               await navigator.share({
                   title: 'ID Card Pegawai',
                   files: [file]
               });
          } else {
               toast.error("Fitur share tidak didukung di perangkat ini.");
          }
      } catch (e) {
          console.error(e);
          toast.error("Gagal membagikan kartu.");
      }
    };

    const handleDownloadIDCard = async () => {
      if (!idCardRef.current) return;
      toast.loading("Memproses gambar...", { id: "gen-card" });
      try {
          await new Promise(r => setTimeout(r, 200)); 
          const dataUrl = await toPng(idCardRef.current, { cacheBust: true, pixelRatio: 3 });
          setPreviewImage(dataUrl);
          toast.dismiss("gen-card");
          toast.success("Berhasil! Tahan gambar untuk menyimpan.", { id: "gen-card-success" });
      } catch (e) {
          toast.dismiss("gen-card");
          console.error(e);
          toast.error("Gagal memproses kartu.");
      }
    };

    return (
        <>
        <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center">
                  <button onClick={() => setProfileTab('menu')} className="p-2 -ml-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-300">
                      <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-xl font-bold ml-2 dark:text-gray-100">ID Card Karyawan</h2>
                </div>
                <Button variant="ghost" size="sm" className="text-teal-600 font-bold" onClick={() => setIdCardSide(idCardSide === 'front' ? 'back' : 'front')}>
                  {idCardSide === 'front' ? 'Lihat Belakang' : 'Lihat Depan'}
                </Button>
            </div>

            {/* Portrait Name Tag ID Card */}
            <div className="flex justify-center w-full px-2 pb-8">
                <div 
                  className="relative origin-top rounded-[2.5rem] overflow-hidden shadow-2xl bg-teal-50 dark:bg-gray-900 border-2 border-white/60 dark:border-white/10 transition-all duration-500 shrink-0 cursor-pointer" 
                  style={{ 
                    width: '324px', 
                    height: '516px', 
                    transform: `scale(min(1, ${(typeof window !== 'undefined' ? window.innerWidth : 360) - 32} / 324))`
                  }}
                  ref={idCardRef}
                  onClick={() => setIdCardSide(idCardSide === 'front' ? 'back' : 'front')}
                >
                  {/* Wave Background matching UI */}
                  <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20 mix-blend-overlay">
                    <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="absolute top-0 w-full h-32 text-teal-600 dark:text-teal-900">
                      <path fill="currentColor" fillOpacity="1" d="M0,224L48,213.3C96,203,192,181,288,192C384,203,480,245,576,234.7C672,224,768,160,864,154.7C960,149,1056,203,1152,213.3C1248,224,1344,192,1392,176L1440,160L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
                    </svg>
                    <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="absolute bottom-0 w-full h-32 text-teal-700 dark:text-teal-800">
                      <path fill="currentColor" fillOpacity="1" d="M0,192L48,197.3C96,203,192,213,288,213.3C384,213,480,203,576,170.7C672,139,768,85,864,85.3C960,85,1056,139,1152,149.3C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    </svg>
                  </div>
                  
                  {/* Decorative Background Accents */}
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/60 dark:bg-white/5 rounded-full blur-2xl"></div>
                  <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-teal-300/40 dark:bg-teal-500/10 rounded-full blur-2xl"></div>

                  <div className="relative z-10 w-full h-full flex flex-col items-center px-6 pt-5 pb-6 text-center overflow-hidden">
                    {idCardSide === 'front' ? (
                        <div className="flex flex-col items-center w-full h-full animate-in slide-in-from-right-2 duration-300">
                          {/* Header Logo */}
                          <div className="mb-5 flex flex-col items-center justify-center gap-1.5 mt-2">
                            {settings?.appLogoUrl ? (
                                <img src={settings.appLogoUrl} alt="Logo" className="w-12 h-12 object-contain shadow-sm" />
                            ) : (
                                <div className="w-12 h-12 bg-teal-600 dark:bg-teal-500 rounded-2xl flex items-center justify-center shadow-inner">
                                  <Activity className="w-6 h-6 text-white" />
                                </div>
                            )}
                            <span className="text-xl font-black text-teal-950 dark:text-white tracking-[0.1em] uppercase drop-shadow-sm line-clamp-1">{settings?.appName || "FMI"}</span>
                          </div>

                          {/* Photo Section */}
                          <div className="relative mb-5 group flex-shrink-0">
                              <div className="absolute inset-0 bg-teal-200/60 dark:bg-teal-900/50 rounded-[2.5rem] blur-xl transform scale-110"></div>
                              <div className="relative w-36 h-36 rounded-[2.5rem] bg-white dark:bg-gray-800 border-4 border-white dark:border-gray-700 shadow-xl overflow-hidden flex items-center justify-center">
                                {user?.avatarUrl ? (
                                    <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="font-black text-teal-400 text-6xl">{user?.name?.[0]}</span>
                                  )}
                              </div>
                          </div>

                          {/* Info Section */}
                          <div className="mt-1 space-y-2 w-full flex-grow flex flex-col justify-center">
                              <div className="space-y-1">
                                <h2 className="text-2xl font-black text-teal-950 dark:text-white uppercase tracking-tight leading-tight line-clamp-2">{user?.name}</h2>
                                <div className="h-1 w-10 bg-teal-500 mx-auto rounded-full opacity-60"></div>
                              </div>
                              
                              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl p-2.5 border border-white/40 dark:border-white/10 shadow-sm mx-2">
                                <p className="text-xs font-black text-teal-700 dark:text-teal-300 uppercase tracking-[0.2em] mb-1 line-clamp-1">{user?.role}</p>
                                <div className="flex items-center justify-center gap-2">
                                  <span className="text-[10px] font-bold text-teal-600/80 dark:text-teal-400/80 uppercase tracking-widest line-clamp-1 break-all">NIP: {user?.uniqueId}</span>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                      <span className="text-teal-400/50">•</span>
                                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: resolvedShifts[getEffectiveShiftId(user, new Date())]?.color || '#14b8a6' }}></div>
                                      <p className="text-[10px] font-bold text-teal-600/80 dark:text-teal-400/80 uppercase tracking-widest">
                                        {resolvedShifts[getEffectiveShiftId(user, new Date())]?.name || "CUSTOM"}
                                      </p>
                                  </div>
                                </div>
                              </div>
                          </div>

                          <div className="mt-auto pt-2">
                              <p className="text-[8px] font-bold text-teal-900/30 dark:text-white/30 uppercase tracking-[0.4em]">EMPLOYEE IDENTIFICATION</p>
                          </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center w-full h-full py-6 animate-in slide-in-from-left-2 duration-300">
                          <div className="mb-6 flex-shrink-0">
                              <div className="w-12 h-1 bg-teal-900/10 dark:bg-white/20 rounded-full mx-auto mb-3"></div>
                              <h3 className="text-lg font-black text-teal-950 dark:text-white uppercase tracking-widest">VERIFIKASI</h3>
                          </div>

                          {/* Large QR Code */}
                          <div className="bg-white p-4 rounded-[2.5rem] shadow-xl border-4 border-teal-100 dark:border-teal-900 flex flex-col items-center mb-6 flex-shrink-0 transform hover:scale-105 transition-transform duration-300">
                              <QRCodeCanvas value={user?.uid || "unknown"} size={140} level="H" className="mb-3" includeMargin={false} />
                              <div className="flex items-center gap-1.5 px-3 py-1 bg-teal-50 dark:bg-teal-900/30 rounded-full">
                                <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></div>
                                <p className="text-[9px] font-black text-teal-700 dark:text-teal-400 uppercase tracking-widest">VALID IDENTITY</p>
                              </div>
                          </div>

                          {/* Instructions */}
                          <div className="mt-auto px-1 space-y-3 flex flex-col justify-end">
                              <div className="p-3 bg-teal-900/5 dark:bg-black/20 backdrop-blur-sm rounded-xl border border-teal-900/10 dark:border-white/5 text-center">
                                <p className="text-[9px] font-bold text-teal-900/70 dark:text-teal-100/70 leading-relaxed uppercase tracking-wider">
                                  Scan kode QR di atas menggunakan aplikasi Scanner di POS Kehadiran untuk merekam absen.
                                </p>
                              </div>
                              
                              <div className="pt-3 border-t border-teal-900/10 dark:border-white/10">
                                <p className="text-[8px] font-bold text-teal-900/40 dark:text-white/40 uppercase tracking-[0.2em] leading-relaxed">
                                  KARTU INI MERUPAKAN PROPERTI PERUSAHAAN.<br/>
                                  MOHON KEMBALIKAN KE HRD {settings?.appName || "FMI"} JIKA MENEMUKANNYA.
                                </p>
                              </div>
                          </div>

                          <div className="mt-3 pb-1">
                              <div className="flex items-center gap-1.5 opacity-30">
                                <Activity className="w-3 h-3 text-teal-900 dark:text-white" />
                                <span className="text-[8px] font-black text-teal-900 dark:text-white tracking-tighter uppercase">{settings?.appName || "FMI"} SYSTEM</span>
                              </div>
                          </div>
                        </div>
                    )}
                  </div>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 pt-4 px-2">
                <Button variant="outline" className="flex flex-col h-auto py-3 gap-1.5 rounded-2xl font-semibold border-teal-100 text-teal-700 bg-teal-50 hover:bg-teal-100 dark:bg-gray-800 dark:border-gray-700 dark:text-teal-400" onClick={handleShareIDCard}>
                  <Share2 className="w-5 h-5" /> <span className="text-[10px] uppercase tracking-wider">Bagikan</span>
                </Button>
                <Button variant="outline" className="flex flex-col h-auto py-3 gap-1.5 rounded-2xl font-semibold border-purple-100 text-purple-700 bg-purple-50 hover:bg-purple-100 dark:bg-gray-800 dark:border-gray-700 dark:text-purple-400" onClick={handleDownloadIDCard}>
                  <Download className="w-5 h-5" /> <span className="text-[10px] uppercase tracking-wider">Unduh Gambar (JPG)</span>
                </Button>
            </div>
          </div>

          <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
            <DialogContent className="max-w-[400px] p-6 flex flex-col items-center justify-center bg-white dark:bg-gray-900 border-0 rounded-[2.5rem] shadow-2xl outline-none">
              <DialogHeader>
                 <DialogTitle className="text-center font-bold text-gray-800 dark:text-gray-100 uppercase tracking-widest text-sm mb-2">Simpan ID Card</DialogTitle>
              </DialogHeader>
              <p className="text-[11px] text-center text-slate-500 mb-4 font-medium dark:text-gray-400">Tekan dan tahan gambar di bawah ini lalu pilih <strong>"Download Image" / "Simpan Gambar"</strong>.</p>
              {previewImage && <img src={previewImage} alt="ID Card" className="w-full h-auto rounded-xl shadow-2xl pointer-events-auto" />}
              <Button variant="outline" className="w-full mt-6 h-12 rounded-2xl font-bold uppercase tracking-widest text-xs" onClick={() => setPreviewImage(null)}>Tutup</Button>
            </DialogContent>
          </Dialog>
        </>
    );
};
