import React from 'react';
import { ArrowLeft, Camera, Phone, User, Key } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import Webcam from 'react-webcam';
import { useUserAppContext } from '../UserAppContext';

export const ProfileEdit = () => {
    const { 
        setProfileTab, user,
        showFaceUpdateCam, setShowFaceUpdateCam, editWebcamRef, editFaceBase64, captureEditFace,
        editName, setEditName, editPhone, setEditPhone, handleResetPassword, handleSaveProfile,
        isEditSaving
    } = useUserAppContext();

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center mb-2 px-2">
                <button onClick={() => setProfileTab('menu')} className="p-2 -ml-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-300">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold ml-2 dark:text-gray-100">Edit Profilku</h2>
            </div>

            <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm rounded-2xl p-5 space-y-5">
                {/* Face / Avatar Update */}
                <div className="flex flex-col items-center">
                  {showFaceUpdateCam ? (
                    <div className="w-full flex flex-col items-center gap-3">
                        <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-teal-500 relative">
                          <Webcam
                            audio={false}
                            ref={editWebcamRef}
                            screenshotFormat="image/jpeg"
                            screenshotQuality={0.8}
                            className="w-full h-full object-cover scale-x-[-1]"
                            videoConstraints={{ facingMode: "user" }}
                          />
                        </div>
                        <div className="flex gap-2 w-full">
                          <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowFaceUpdateCam(false)}>Batal</Button>
                          <Button className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white" onClick={captureEditFace}>Ambil Foto</Button>
                        </div>
                    </div>
                  ) : (
                    <div className="relative group cursor-pointer" onClick={() => setShowFaceUpdateCam(true)}>
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-xl bg-teal-100 flex items-center justify-center">
                          {editFaceBase64 ? (
                              <img src={editFaceBase64} alt="New Avatar" className="w-full h-full object-cover" />
                          ) : user?.avatarUrl ? (
                              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                              <span className="font-black text-teal-400 text-3xl">{user?.name?.[0]}</span>
                          )}
                        </div>
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="w-6 h-6 text-white" />
                        </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2 font-medium">Klik untuk perbarui wajah absen</p>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500 flex items-center gap-1"><User className="w-3 h-3" /> Nama Lengkap</Label>
                        <Input 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Nama Lengkap"
                            className="rounded-xl border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" /> No. WhatsApp</Label>
                        <Input 
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            placeholder="08xxxxxxxx"
                            className="rounded-xl border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800"
                        />
                    </div>
                </div>

                <div className="pt-2">
                    <Button 
                        variant="outline" 
                        className="w-full rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-900/50 dark:text-orange-400 dark:hover:bg-orange-900/20 shadow-sm"
                        onClick={handleResetPassword}
                    >
                        <Key className="w-4 h-4 mr-2" /> Reset Password
                    </Button>
                </div>

                <Button 
                  onClick={handleSaveProfile}
                  disabled={isEditSaving}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-12 font-bold shadow-lg mt-6"
                >
                  {isEditSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
            </Card>
        </div>
    );
};
