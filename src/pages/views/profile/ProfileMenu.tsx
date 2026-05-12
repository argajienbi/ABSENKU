import React from 'react';
import { User, LogOut, ArrowLeft, Sun, Moon, Settings, Info, Fingerprint, Code, MapPin, Camera } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../../lib/firebase';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useUserAppContext } from '../UserAppContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

export const ProfileMenu = () => {
    const { 
        user, settings, setView, theme, setTheme, setProfileTab, myHistory
    } = useUserAppContext();

    const navigate = useNavigate();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
            {/* Header Profil */}
            <div className="flex items-center gap-4 px-2 mb-2">
                <button 
                    onClick={() => setView('home')}
                    className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-slate-200 dark:border-gray-700 flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-95 transition-transform"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Profil</h2>
            </div>

            {/* Profile Overview Section */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/50">
                <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full border-4 border-teal-50 dark:border-teal-900/50 overflow-hidden shadow-md mb-4 bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center relative group">
                        {user?.faceImage ? (
                            <img src={user.faceImage} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-10 h-10 text-teal-600 dark:text-teal-400" />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => setProfileTab('edit-profile')}>
                            <Camera className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    
                    <h3 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">{user?.name || "Karyawan"}</h3>
                    <p className="text-teal-600 dark:text-teal-400 text-xs font-bold uppercase tracking-widest mt-1">{user?.role || "Staff"}</p>
                </div>

                <div className="mt-8 space-y-3">
                    <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-gray-900/50 border border-slate-100 dark:border-gray-800">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 shrink-0">
                            <Fingerprint className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ID Karyawan</span>
                            <span className="text-sm font-black text-gray-700 dark:text-gray-200 truncate font-mono">{user?.uniqueId || "-"}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-gray-900/50 border border-slate-100 dark:border-gray-800">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 shrink-0">
                            <Code className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</span>
                            <span className="text-sm font-black text-gray-700 dark:text-gray-200 truncate">{user?.email || "-"}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-gray-900/50 border border-slate-100 dark:border-gray-800">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 shrink-0">
                            <Settings className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shift Kerja</span>
                            <span className="text-sm font-black text-gray-700 dark:text-gray-200 truncate">{settings?.shifts?.[user?.shiftId]?.name || user?.shiftId || "REGULER"}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-gray-900/50 border border-slate-100 dark:border-gray-800">
                        <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 shrink-0">
                            <MapPin className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Penempatan</span>
                            <div className="flex flex-col gap-0.5 mt-0.5">
                                <span className="text-[11px] font-black text-gray-800 dark:text-gray-200 uppercase">
                                    {settings?.companies?.[user?.companyId]?.name || "Global"}
                                </span>
                                <div className="flex flex-wrap gap-1 items-center">
                                    <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase">
                                        {settings?.areas?.[user?.areaId]?.name || "Global Area"}
                                    </span>
                                    <span className="text-[10px] text-slate-300">•</span>
                                    <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase">
                                        {settings?.branches?.[user?.branchId]?.name || "Semua Cabang"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Attendance Calendar Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                    <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Kehadiran: {format(new Date(), "MMMM yyyy")}</h4>
                </div>
                
                <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm rounded-3xl p-5">
                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-2 mb-4">
                        {['S', 'S', 'R', 'K', 'J', 'S', 'M'].map((day, i) => (
                            <div key={i} className="text-[10px] font-black text-center text-slate-300 dark:text-gray-600 py-1 uppercase">{day}</div>
                        ))}
                        {(() => {
                            const today = new Date();
                            const start = startOfMonth(today);
                            const end = endOfMonth(today);
                            const days = eachDayOfInterval({ start, end });
                            const startDay = start.getDay(); // 0 is Sunday
                            const prefixes = Array(startDay === 0 ? 6 : startDay - 1).fill(null);
                            
                            return [...prefixes, ...days].map((day, i) => {
                                if (!day) return <div key={`empty-${i}`} />;
                                
                                const dateStr = format(day, "yyyy-MM-dd");
                                const hist = (myHistory || []).filter((h: any) => h.timestamp && format(new Date(h.timestamp), "yyyy-MM-dd") === dateStr);
                                
                                let statusColor = "bg-slate-50 dark:bg-gray-900/30 text-slate-400 dark:text-gray-600";
                                if (hist.length > 0) {
                                    const hasTelat = hist.some((h: any) => h.status === 'telat');
                                    const hasNormal = hist.some((h: any) => h.status === 'normal' || h.status === 'approved');
                                    if (hasTelat) statusColor = "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800";
                                    else if (hasNormal) statusColor = "bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800";
                                } else if (day < today) {
                                  // Simplified logic for alpa (should check holiday/weekend in reality)
                                  const dayOfWeek = day.getDay();
                                  if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                                      statusColor = "bg-rose-50 dark:bg-rose-900/20 text-rose-300 dark:text-rose-800";
                                  }
                                }

                                const isToday = dateStr === format(new Date(), "yyyy-MM-dd");

                                return (
                                    <div 
                                        key={dateStr} 
                                        className={`aspect-square rounded-xl flex items-center justify-center text-[11px] font-black transition-all ${statusColor} ${isToday ? 'ring-2 ring-teal-500 ring-offset-2 dark:ring-offset-gray-800' : ''}`}
                                    >
                                        {format(day, "d")}
                                    </div>
                                );
                            });
                        })()}
                    </div>

                    {/* Legend */}
                    <div className="pt-4 border-t border-slate-50 dark:border-gray-700/50 flex flex-wrap justify-between gap-y-2 px-1">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                            <span className="text-[9px] font-bold text-slate-500 uppercase">Tepat</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                            <span className="text-[9px] font-bold text-slate-500 uppercase">Telat</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                            <span className="text-[9px] font-bold text-slate-500 uppercase">Izin</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                            <span className="text-[9px] font-bold text-slate-500 uppercase">Alpa</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-gray-700" />
                            <span className="text-[9px] font-bold text-slate-500 uppercase">Libur</span>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">Kartu & Keamanan</div>
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

                <button 
                  onClick={() => setProfileTab('id-card')}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Code className="w-4 h-4" />
                    </div>
                    ID Card Digital
                  </div>
                </button>

                {(user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'demo') && (
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 text-sm font-semibold text-teal-600 dark:text-teal-400">
                      <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-900/40 flex items-center justify-center text-teal-600">
                          <Settings className="w-4 h-4" />
                      </div>
                      Admin Dashboard
                    </div>
                  </button>
                )}

                <button 
                  onClick={() => toast.info("Presensi v4.1.2 - Aplikasi absensi modern dengan fitur Geofencing & Face Recognition.")}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Info className="w-4 h-4" />
                    </div>
                    Tentang Aplikasi
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">v4.1.2</span>
                </button>

                <button 
                  onClick={() => auth.signOut()}
                  className="w-full flex items-center justify-between p-4 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <div className="flex items-center gap-3 text-sm font-semibold text-red-500">
                    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                        <LogOut className="w-4 h-4" />
                    </div>
                    Keluar Sesi
                  </div>
                </button>
            </Card>
        </div>
    );
};
