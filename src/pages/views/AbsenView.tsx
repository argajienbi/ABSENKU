import React from 'react';
import { ArrowLeft, UserSquare2, Code, MapPin, ChevronUp, ChevronDown, Check } from 'lucide-react';
import { MapPicker } from '../../components/MapPicker';
import Webcam from 'react-webcam';
import { format } from 'date-fns';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import { useUserAppContext } from './UserAppContext';
import { calculateDistance } from '../../settingsObject';

export const AbsenView = () => {
  const { 
    type, setView, activeAbsenTab, setActiveAbsenTab, setPendingQRData, setQrUserIdentity,
    isDocumentCapture, permitStartDate, setPermitStartDate, permitEndDate, setPermitEndDate,
    location, isAbsenMapExpanded, setIsAbsenMapExpanded, isWithinRadius, user, settings,
    webcamRef, loading, checkPendingAndStartAttendance
  } = useUserAppContext();

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
          <h2 className="relative z-10 text-xl font-extrabold ml-2 text-zinc-900 dark:text-white tracking-tight">
              Proses Absen <span className="text-teal-600 dark:text-teal-400">{type === 'in' ? 'Masuk' : type === 'out' ? 'Pulang' : type === 'overtime_in' ? 'Lembur Masuk' : type === 'overtime_out' ? 'Lembur Pulang' : type === 'sick' ? 'Sakit' : 'Izin'}</span>
          </h2>
        </div>

        <Card className="bg-white dark:bg-gray-800 shadow-md rounded-2xl border-0">
          <CardContent className="p-4">
            <Tabs value={activeAbsenTab} onValueChange={(val) => {
              setActiveAbsenTab?.(val);
              setPendingQRData?.(null);
              setQrUserIdentity?.(null);
            }} className="w-full">
              {!isDocumentCapture && (
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-50 dark:bg-gray-700/50 p-1 rounded-lg h-auto">
                  <TabsTrigger value="selfie" className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-[9px] sm:text-[10px] font-semibold py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600"><UserSquare2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span>Selfie</span></TabsTrigger>
                  <TabsTrigger value="qr" className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-[9px] sm:text-[10px] font-semibold py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600"><Code className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span>QR Scan</span></TabsTrigger>
                </TabsList>
              )}
              
              <TabsContent value="selfie" className="space-y-4">
                {isDocumentCapture && type === 'cuti' && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Mulai</label>
                      <Input type="date" value={permitStartDate ? format(permitStartDate, "yyyy-MM-dd") : ""} onChange={(e) => setPermitStartDate?.(new Date(e.target.value))} className="h-10 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Akhir</label>
                      <Input type="date" value={permitEndDate ? format(permitEndDate, "yyyy-MM-dd") : ""} onChange={(e) => setPermitEndDate?.(new Date(e.target.value))} className="h-10 text-sm" />
                    </div>
                  </div>
                )}

                {!isDocumentCapture && location && (
                  <div className="mb-4 bg-gray-50 dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800 transition-all duration-300">
                    <div 
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => setIsAbsenMapExpanded?.(!isAbsenMapExpanded)}
                    >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-600 dark:text-teal-400">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest block leading-none mb-1">Peta Visual (GPS)</span>
                            <span className={`text-[10px] items-center gap-1 inline-flex font-bold px-2 py-0.5 rounded-full ${isWithinRadius ? 'bg-teal-100 text-teal-700' : 'bg-rose-100 text-rose-700'}`}>
                              {isWithinRadius ? 'Dalam Geofence' : 'Di Luar Geofence'}
                              {location && user?.subareaId && settings?.subareas?.[user.subareaId]?.lat !== undefined && settings?.subareas?.[user.subareaId]?.lng !== undefined && (
                                <span className="ml-1 opacity-70">
                                  ({Math.round(calculateDistance(location.lat, location.lng, settings.subareas[user.subareaId].lat, settings.subareas[user.subareaId].lng))}m)
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                          {isAbsenMapExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                    </div>
                    <div className={`grid transition-all duration-300 ease-in-out w-full ${isAbsenMapExpanded ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0"}`}>
                      <div className="overflow-hidden w-full">
                          <MapPicker 
                            center={{ 
                              lat: user?.subareaId && settings?.subareas?.[user.subareaId]?.lat !== undefined ? settings.subareas[user.subareaId].lat! : (location?.lat || -6.2088), 
                              lng: user?.subareaId && settings?.subareas?.[user.subareaId]?.lng !== undefined ? settings.subareas[user.subareaId].lng! : (location?.lng || 106.8456)
                            }} 
                            userLocation={location ? { lat: location.lat, lng: location.lng } : undefined}
                            radius={(() => {
                              if (user?.subareaId && settings?.subareas?.[user.subareaId]?.radius !== undefined) {
                                return settings.subareas[user.subareaId].radius;
                              }
                              return 100;
                            })()}
                            readonly={true}
                          />
                      </div>
                    </div>
                  </div>
                )}

              <div className="aspect-square sm:aspect-video bg-gray-900 rounded-2xl overflow-hidden relative shadow-2xl border-4 border-white dark:border-gray-800">
                {activeAbsenTab === 'selfie' && (
                  <Webcam
                    key={isDocumentCapture ? 'env' : 'user'}
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    screenshotQuality={0.8}
                    className={`w-full h-full object-cover ${isDocumentCapture ? '' : 'scale-x-[-1]'}`}
                    videoConstraints={{ facingMode: isDocumentCapture ? "environment" : "user" }}
                  />
                )}
                
                {/* Face Guide Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {['sick', 'permit', 'cuti', 'melahirkan', 'meninggal'].includes(type) ? (
                    <div className="w-64 h-80 sm:w-80 sm:h-96 rounded-xl border-4 transition-colors duration-300 border-teal-400 border-dashed bg-white/5 flex items-center justify-center relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                        <div className="absolute bottom-6 left-0 right-0 text-center mx-auto w-[90%]">
                            <p className="text-white text-[11px] font-bold drop-shadow-md bg-black/60 py-2 px-4 rounded-full inline-block">
                              Posisikan dokumen dalam bingkai
                            </p>
                        </div>
                    </div>
                  ) : (
                    <div className="w-64 h-80 sm:w-56 sm:h-72 rounded-[100px] border-4 transition-colors duration-300 border-white/50 border-dashed shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] flex items-center justify-center">
                      
                      <div className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full backdrop-blur-md transform translate-y-32 sm:translate-y-28 transition-all duration-300 bg-gray-900/60 text-white/70`}>
                        POSISIKAN WAJAH KE AREA OVAL
                      </div>
                  </div>
                  )}
                  
                  {/* Scanning Line only when no face detected */}
                  {!isDocumentCapture && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-56 sm:h-56 pointer-events-none overflow-hidden rounded-full">
                      <div className="absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_15px_rgba(45,212,191,0.5)] animate-[scan_3s_linear_infinite]" style={{ top: '-10%' }}></div>
                    </div>
                  )}
                </div>
              </div>
              
              {!isDocumentCapture && (
                <p className="text-center text-[10px] text-gray-500 dark:text-gray-400 mt-2">
                  Info: Foto absen hanya digunakan untuk validasi hari ini dan akan otomatis terhapus pada keesokan harinya.
                </p>
              )}

              <style>{`
                @keyframes scan {
                  0% { top: -10%; opacity: 0; }
                  10% { opacity: 1; }
                  90% { opacity: 1; }
                  100% { top: 110%; opacity: 0; }
                }
              `}</style>

              <Button 
                className={`w-full text-xs font-black uppercase tracking-[0.2em] h-12 shadow-xl rounded-2xl text-white transform active:scale-95 transition-all ${type === 'in' ? 'bg-teal-600 hover:bg-teal-700 shadow-teal-500/20' : type === 'overtime_in' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20' : type === 'overtime_out' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20' : type === 'sick' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' : type === 'permit' ? 'bg-cyan-600 hover:bg-cyan-700 shadow-cyan-500/20' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20'}`} 
                onClick={() => checkPendingAndStartAttendance?.("selfie")} 
                disabled={loading || (settings?.geofenceEnabled && !isWithinRadius && !['sick', 'permit', 'cuti', 'melahirkan', 'meninggal'].includes(type))}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    PROSES VERIFIKASI...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {['sick', 'permit', 'cuti', 'melahirkan', 'meninggal'].includes(type) ? <Check className="w-4 h-4" /> : <UserSquare2 className="w-4 h-4" />}
                    {['sick', 'permit', 'cuti', 'melahirkan', 'meninggal'].includes(type) ? 'KIRIM DOKUMEN & LAPOR' : `ABSEN & ${type.includes('in') ? 'MASUK' : type.includes('out') ? 'PULANG' : 'LAPOR'}`}
                  </span>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="qr" className="space-y-4">
              <style>{`
                @keyframes qr-scan {
                  0% { top: 0%; opacity: 0; }
                  10% { opacity: 1; }
                  90% { opacity: 1; }
                  100% { top: 100%; opacity: 0; }
                }
              `}</style>
              <div className="relative w-full max-w-sm mx-auto rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 aspect-square flex flex-col items-center justify-center">
                <div className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-2 text-gray-400">
                    <Code className="w-10 h-10 animate-pulse" />
                    <span className="text-xs font-medium">Menyalakan kamera...</span>
                </div>
                
                <div id="qr-reader" className="w-full h-full relative z-10 [&>video]:object-cover [&>video]:w-full [&>video]:h-full border-none"></div>
                
                <div className="absolute inset-8 border-2 border-teal-500/50 rounded-lg pointer-events-none z-20 overflow-hidden shadow-[inset_0_0_0_999px_rgba(0,0,0,0.3)]">
                  <div className="absolute left-0 w-full h-0.5 bg-teal-400 shadow-[0_0_8px_2px_rgba(45,212,191,0.7)]" style={{ animation: 'qr-scan 2.5s ease-in-out infinite' }}></div>
                </div>
              </div>
              <p className="text-center text-xs text-gray-500 dark:text-gray-400">Posisikan QR Code persis di dalam kotak pindaian.</p>
            </TabsContent>

            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
