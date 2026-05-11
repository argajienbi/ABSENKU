import React from 'react';
import { User, Edit, ChevronRight, IdCard, Sun, Moon, LogOut, Bell, Info, ArrowLeft, Activity, Share2, Download, Fingerprint, Check, Code, Camera, Phone, Key, Settings } from 'lucide-react';
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
import { requestFCMPermission } from '../../../lib/firebase';
import { useTheme } from 'next-themes';
import { useUserAppContext } from '../UserAppContext';

export const ProfileChangelog = () => {
    const { 
        profileTab, setProfileTab, user, settings, resolvedShifts,
        theme, setTheme, idCardSide, setIdCardSide, idCardRef,
        showFaceUpdateCam, setShowFaceUpdateCam, editWebcamRef, editFaceBase64, captureEditFace,
        editName, setEditName, editPhone, setEditPhone, handleResetPassword, handleSaveProfile,
        isEditSaving, handleShareIDCard, handleDownloadIDCard, setView
    } = useUserAppContext();

    const navigate = useNavigate();

    return (
                  <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center mb-4 px-2">
                <button onClick={() => setProfileTab('menu')} className="p-2 -ml-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-300">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold ml-2 dark:text-gray-100">Tentang Aplikasi</h2>
            </div>

            <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm rounded-xl p-6">
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/50 rounded-2xl flex items-center justify-center mb-3">
                  <Activity className="w-8 h-8 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider">{settings?.appName || "ABSENKU"}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">Versi 3.9.25 (Terbaru)</p>
              </div>

              <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Fingerprint className="w-4 h-4" /> Fitur Tersedia
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                      <li className="flex gap-2.5">
                        <Check className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                        <span>Absensi Foto Selfie Otomatis dengan Deteksi Wajah AI & Geolocation.</span>
                      </li>
                      <li className="flex gap-2.5">
                        <Check className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                        <span>Sistem Build Teroptimasi: Code-splitting manual untuk load data super cepat.</span>
                      </li>
                      <li className="flex gap-2.5">
                        <Check className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                        <span>Mode Offline PWA: Absen tersimpan saat internet putus.</span>
                      </li>
                      <li className="flex gap-2.5">
                        <Check className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                        <span>Pengajuan Izin, Sakit, & Cuti dengan persetujuan Admin.</span>
                      </li>
                      <li className="flex gap-2.5">
                        <Check className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                        <span>Push Notification (FCM) untuk info penting dari perusahaan.</span>
                      </li>
                      <li className="flex gap-2.5">
                        <Check className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                        <span>Tampilan Admin Dashboard lengkap & Generate Laporan Excel/PDF/CSV.</span>
                      </li>
                      <li className="flex gap-2.5">
                        <Check className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                        <span>Real-Time Live Logs untuk memantau status absensi karyawan secara langsung.</span>
                      </li>
                      <li className="flex gap-2.5">
                        <Check className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                        <span>Integrasi Peta Live (Live Map) dengan layanan Google Maps API.</span>
                      </li>
                      <li className="flex gap-2.5">
                        <Check className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                        <span>Konfigurasi Geofencing & Multi-Area dengan radius dan titik kordinat cabang.</span>
                      </li>
                      <li className="flex gap-2.5">
                        <Check className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                        <span>Manajemen Lengkap Organisasi (Pengumuman, Akun Karyawan, Shift, & Token Referral).</span>
                      </li>
                      <li className="flex gap-2.5">
                        <Check className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                        <span>Navigasi Ul dan Header Fleksibel untuk mendukung performansi mobile dan layar sempit.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-gray-100 dark:border-gray-700/50">
                    <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Code className="w-4 h-4" /> Log Perubahan (Changelog)
                    </h4>
                    <div className="space-y-5">
                        <div className="relative pl-4 border-l-2 border-indigo-500/30">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-indigo-500"></div>
                          <h5 className="font-bold text-gray-900 dark:text-gray-300 text-sm">Versi 3.9.25 <span className="text-xs font-normal text-gray-500 ml-2">Baru saja</span></h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Fix Deployment Vercel: Mengembalikan konfigurasi output directory build dari 'build' ke standar 'dist' untuk menjamin kompatibilitas deteksi folder output otomatis pada sistem Vercel.</li>
                          </ul>
                        </div>

                        <div className="relative pl-4 border-l-2 border-indigo-200 dark:border-indigo-900/50">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-indigo-300 dark:bg-indigo-700"></div>
                          <h5 className="font-bold text-gray-900 dark:text-gray-300 text-sm">Versi 3.9.24</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Optimalisasi Build & Performa: Mengimplementasikan manual code-splitting (manualChunks) pada konfigurasi Vite untuk membagi pustaka besar (Firebase, Recharts, FaceAPI, dll) menjadi beberapa bagian kecil.</li>
                            <li>Lazy Loading Berjenjang: Menerapkan React.lazy dan Suspense pada Dashoard Admin, rute utama aplikasi, dan view UserApp untuk mempercepat waktu pemuatan halaman awal secara drastis.</li>
                            <li>Fix Vercel Warning: Menyelesaikan peringatan "chunk size limit" pada hosting Vercel dengan optimasi bundle produksi yang lebih efisien.</li>
                          </ul>
                        </div>

                        <div className="relative pl-4 border-l-2 border-indigo-200 dark:border-indigo-900/50">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-indigo-300 dark:bg-indigo-700"></div>
                          <h5 className="font-bold text-gray-900 dark:text-gray-300 text-sm">Versi 3.9.23</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Reorganisasi Navigasi: Memindahkan tombol Home ke posisi tengah pada bilah navigasi bawah (Floating Navigation) untuk akses yang lebih ergonomis dan tampilan yang lebih seimbang secara visual.</li>
                          </ul>
                        </div>

                        <div className="relative pl-4 border-l-2 border-teal-200 dark:border-teal-900/50">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-teal-300 dark:bg-teal-700"></div>
                          <h5 className="font-bold text-gray-900 dark:text-gray-300 text-sm">Versi 3.9.22</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Fitur Pengingat Otomatis Admin: Setiap input manual oleh Admin (Koreksi Alpa atau Lembur) kini secara otomatis mengirimkan notifikasi real-time ke aplikasi karyawan yang bersangkutan.</li>
                            <li>Optimalisasi Transaksi Database: Implementasi Firestore writeBatch untuk menjamin integritas data saat menyimpan record absensi dan notifikasi secara bersamaan.</li>
                          </ul>
                        </div>

                        <div className="relative pl-4 border-l-2 border-emerald-200 dark:border-emerald-900/50">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-emerald-300 dark:bg-emerald-700"></div>
                          <h5 className="font-bold text-gray-900 dark:text-gray-300 text-sm">Versi 3.9.21</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Fix Deployment: Optimalisasi konfigurasi Vite Build (base paths & output directory) untuk menjamin kompatibilitas unggahan artefak pada sistem hosting.</li>
                            <li>PWA Cleanup: Membersihkan referensi aset yang hilang pada plugin Progressive Web App agar proses build lebih bersih dan stabil.</li>
                          </ul>
                        </div>

                        <div className="relative pl-4 border-l-2 border-fuchsia-200 dark:border-fuchsia-900/50">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-fuchsia-300 dark:bg-fuchsia-700"></div>
                          <h5 className="font-bold text-gray-900 dark:text-gray-300 text-sm">Versi 3.9.20</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Fix Sub Area Display: Memperbaiki masalah data Sub Area yang sudah berhasil tersimpan tetapi tidak tampil di daftar Pengaturan Lokasi akibat missing props sinkronisasi tampilan dari Dashboard Induk ke Form Komponen.</li>
                            <li>Optimalisasi Firestore Rules: Konfigurasi tingkat tinggi validasi keamanan backend untuk mencegah penyisipan value pada hierarki Sub Area yang tidak semestinya.</li>
                          </ul>
                        </div>
                        
                        <div className="relative pl-4 border-l-2 border-indigo-200 dark:border-indigo-900/50">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-indigo-300 dark:bg-indigo-700"></div>
                          <h5 className="font-bold text-gray-900 dark:text-gray-300 text-sm">Versi 3.9.19</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Database Refactoring: Area, Perusahaan (PT), dan Cabang sukses dipisahkan dari objek tunggal <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">settings</code> menjadi koleksi level akar (root collections) dinamis tersendiri di dalam sistem database Firestore. Fitur ini dirancang khusus untuk mewadahi jumlah referensi hierarki tanpa batas tanpa melambatkan memori komponen. Data UI diringkas menggunakan state merge global untuk kompabilitas backwards dengan sistem sedia ada.</li>
                          </ul>
                        </div>
                        
                        <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <h5 className="font-bold text-gray-900 dark:text-gray-300 text-sm">Versi 3.9.18</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Role & Permissions: Restriksi dan filter tingkat lanjut untuk role Superadmin dan Admin. Menyembunyikan Pengaturan Shift, Pengaturan Lokasi, dan pembuatan ID Reff untuk Admin perwakilan; dan Admin perwakilan hanya melihat/mengekspor data lingkup PT/Area/Cabang-nya saja. Ekspor PDF & Excel dinonaktifkan untuk role Demo.</li>
                          </ul>
                        </div>

                        <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <h5 className="font-bold text-gray-900 dark:text-gray-300 text-sm">Versi 3.9.17</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Struktur Hybrid: Pembaruan struktur peran admin bertingkat (PT/Perusahaan, Area/Regional, Cabang/Ruangan) dan Integrasinya pada modul Settings, Users, Overview, dan Rekapan Excel/PDF.</li>
                          </ul>
                        </div>

                          <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <h5 className="font-bold text-gray-900 dark:text-gray-300 text-sm">Versi 3.9.16</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Penyempurnaan Visual: Mengganti ikon Map SVG standar dengan ikon gambar Map 3D berwarna-warni sesuai dengan referensi Anda untuk memberikan tampilan UI yang lebih menarik dan meriah di halaman utama.</li>
                          </ul>
                        </div>
                        
                          <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <h5 className="font-bold text-gray-900 dark:text-gray-300 text-sm">Versi 3.9.15</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Refactor Lanjutan: Memecah view Profil Karyawan menjadi komponen-komponen terpisah (Menu Profil, ID Card, Tentang Aplikasi/Changelog, & Edit Profil) agar kode lebih bersih, cepat, terstruktur, dan terhindar dari conflict atau error.</li>
                          </ul>
                        </div>
                        
                          <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <h5 className="font-bold text-gray-900 dark:text-gray-300 text-sm">Versi 3.9.14</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Refactor Skala Besar: Memecah komponen raksasa Dashboard Admin (sebelumnya berukuran 2200+ baris) ke dalam lebih dari lima sub-komponen terpisah yang sesuai fungsinya. Meningkatkan skalabilitas sistem secara drastis.</li>
                          </ul>
                        </div>

                          <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <h5 className="font-bold text-gray-900 dark:text-gray-300 text-sm">Versi 3.9.13</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Refactor Struktur Kode: Memecah view UserApp menjadi komponen-komponen terpisah agar mempermudah maintenance pengembangan dan menghindarkan error bug yang numpuk.</li>
                          </ul>
                        </div>

                          <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <h5 className="font-bold text-gray-900 dark:text-gray-300 text-sm">Versi 3.9.12</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Penyempurnaan Notifikasi: Seluruh pesan notifikasi yang sebelumnya statis di pojok kanan bawah diubah menjadi pop-up notifikasi melayang di atas-tengah (top-center) menggunakan gaya Glassmorphism tembus pandang yang atraktif.</li>
                            <li>Penanganan Error Login: Menambahkan pesan informatif berbahasa Indonesia dengan rincian yang lebih detail ketika pengguna salah memasukkan email, kata sandi, atau ketika akun belum terdaftar, agar pengguna lebih mudah memahaminya.</li>
                          </ul>
                        </div>

                          <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <h5 className="font-bold text-gray-900 dark:text-gray-300 text-sm">Versi 3.9.11</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Perbaikan Bug: Menyelesaikan masalah unduhan file Laporan Excel (XLSX) yang berubah format menjadi .bin pada environment WebView Android (seperti aplkasi hasil build Sketchware Pro) dengan menerapkan metode unduhan data URI base64.</li>
                          </ul>
                        </div>

                          <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <h5 className="font-bold text-gray-900 dark:text-gray-300 text-sm">Versi 3.9.6</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Peningkatan Efisiensi: Menerapkan fitur kompresi gambar otomatis (Canvas Auto-Compression) saat pengambilan foto absen untuk mengurangi drastis ukuran file penyimpanan (storage), menghemat memori Firebase (Pay-As-You-Go), dan mempercepat proses upload tanpa kehilangan kejelasan detail.</li>
                          </ul>
                        </div>

                          <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <h5 className="font-bold text-gray-900 dark:text-gray-300 text-sm">Versi 3.9.5</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Peningkatan Performa & Stabilitas: Menghapus dependensi Deteksi Wajah AI (FaceAPI) di sisi klien. Hal ini menyelesaikan seluruh masalah error kamera di berbagai perangkat HP, secara signifikan menghemat baterai & memori (RAM), membuat absen jauh lebih cepat & ringan diganti dengan bingkai pemindai statis yang sangat stabil.</li>
                          </ul>
                        </div>

                          <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <h5 className="font-bold text-gray-900 dark:text-gray-300 text-sm">Versi 3.9.4</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Penyempurnaan Tampilan: Membuat Header profil pengguna beserta greeting text dan icon notifikasi menjadi fitur "Sticky" agar selalu berada di posisi teratas di setiap menu utama (Home, Riwayat, dan Profil).</li>
                          </ul>
                        </div>

                          <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <h5 className="font-bold text-gray-900 dark:text-gray-300 text-sm">Versi 3.9.3</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Penyempurnaan UI: Menambahkan fitur Show/Hide Peta Visual (GPS) pada menu Kamera Absen dengan efek transisi yang mulus.</li>
                            <li>Penyempurnaan UI: Membuat Header Menu Kamera menjadi Sticky agar tidak ikut terscroll dan tetap terlihat dengan jelas saat scroll.</li>
                          </ul>
                        </div>

                          <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <h5 className="font-bold text-gray-900 dark:text-gray-300 text-sm">Versi 3.9.2</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Penyempurnaan Tampilan: Menambahkan animasi Show/Hide pada detail informasi di tampilan header Utama User untuk pengalaman visual yang lebih lega dan rapi.</li>
                            <li>Penyempurnaan Visual: Penggunaan tema gelombang (Wave Background) seragam pada halaman utama aplikasi, konsisten dengan elemen di halaman Login & Register.</li>
                          </ul>
                        </div>

                          <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <h5 className="font-bold text-gray-900 dark:text-gray-300 text-sm">Versi 3.9.1</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Pembaruan PWA Otomatis: Aplikasi kini dapat memperbarui versinya (PWA auto-update) di latar belakang tanpa mengganggu atau memunculkan peringatan (pop-up) untuk pengguna.</li>
                          </ul>
                        </div>

                          <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <h5 className="font-bold text-gray-900 dark:text-gray-300 text-sm">Versi 3.9.0</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Peningkatan UI: Menambahkan efek berjalan (running text/marquee) pada nama area di halaman utama agar mendukung layar yang lebih kecil.</li>
                            <li>Peningkatan Keamanan: Pembatasan 1 akun 1 perangkat (Device Lock), akun akan logout otomatis jika terdeteksi login di perangkat lain.</li>
                            <li>Log Keamanan Khusus: Menambahkan tab peringatan keamanan di Dashboard Super Admin.</li>
                            <li>Perbaikan Bug: Menyelesaikan masalah model Face API dengan memindahkannya ke direktori proxy yang aman agar berjalan dengan performa yang mantab!.</li>
                          </ul>
                        </div>

                          <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <h5 className="font-bold text-gray-900 dark:text-gray-300 text-sm">Versi 3.8.2</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Fitur Peta Live Baru: Menambahkan Live Map baru di Dashboard Admin untuk melacak dan melihat lokasi absensi karyawan yang tersebar (termasuk deteksi lokasi Fake GPS) secara interaktif.</li>
                            <li>Penyempurnaan Tampilan: Membuat Header Layar Utama (Dashboard Admin & User) menjadi "Sticky" (tetap di posisinya saat halaman di-scroll ke bawah) untuk navigasi yang lebih elegan.</li>
                          </ul>
                        </div>

                          <div className="relative pl-4 border-l-2 border-teal-500/30">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-teal-500"></div>
                          <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.8.0</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Fitur Penghapusan Riwayat Absensi (Global & Per User) dengan Pop-up konfirmasi berjenjang untuk mencegah salah hapus.</li>
                            <li>Fitur Koreksi Dispensasi Alpa pada Riwayat User oleh Admin dengan input keterangan.</li>
                            <li>Pembaruan Kalkulasi Status Alpa: Kalkulasi berdasarkan Work Start Date (Mulai Kontrak) dan Work End Date (Selesai Kontrak), guna mencegah karyawan baru dinilai Alpa pada tanggal sebelum mereka mulai bekerja.</li>
                          </ul>
                        </div>

                          <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.7.7</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Memindahkan menu notifikasi ke header kanan, menggantikan logo aplikasi.</li>
                          </ul>
                        </div>

                          <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.7.6</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Redesign Navigation Bar: Menyederhanakan navigasi menjadi 3 menu (Riwayat, Home Floating, Profil) dan menghapus menu notifikasi.</li>
                          </ul>
                        </div>

                        <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.7.1</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Efisiensi Shift Global: Menghapus pengaturan jam shift global, sistem kini sepenuhnya menggunakan Manajemen Shift dan Working Days yang lebih spesifik.</li>
                            <li>Fitur Edit Area & Radius: Admin kini dapat mengedit detail dari area dan radius yang sudah ditambahkan tanpa harus menghapus lalu membuatnya kembali.</li>
                          </ul>
                        </div>

                        <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.6.1</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Perbaikan Radius Fix: Menghilangkan limit radius pada visual map dan memperbaiki sinkronisasi antara radius global dan area (kini radius asli yang disetel admin akan ditampilkan sepenuhnya).</li>
                          </ul>
                        </div>

                        <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.6.0</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Perbaikan Radius Geofence: Menghadirkan input radius & kordinat global yang sempat tersembunyi di Dashboard Admin, memungkinkan fleksibilitas setting wilayah kerja yang lebih besar (di atas 140m).</li>
                            <li>Info Lokasi Real-Time: Pengguna kini dapat melihat di area/cabang mana mereka sedang berada langsung di dashboard utama.</li>
                            <li>Optimasi Dashboard: Optimalisasi visual dan sinkronisasi data area untuk manajemen multi-cabang.</li>
                          </ul>
                        </div>

                        <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.5.0</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Peningkatan Kemananan Identitas Barcode: Memperbaiki lookup identitas scanner barcode agar dapat bekerja menggunakan Firestore langsung dari QR code secara aman.</li>
                            <li>Notifikasi Anomali Barcode: Notifikasi beda perangkat ditampilkan pada Admin Dashboard secara Real Time.</li>
                          </ul>
                        </div>

                        <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.4.0</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Sekuritas Ganda Barcode: Mengimplementasikan verifikasi 2-langkah untuk fitur QR Scan. Setelah scan barcode, sistem akan mendeteksi identitas dan mewajibkan pengambilan foto verifikasi.</li>
                            <li>Auto-Identity Mapping: Absensi akan otomatis dicatat sesuai dengan akun user yang terdaftar dalam barcode tersebut, memungkinkan satu perangkat digunakan untuk verifikasi banyak user.</li>
                          </ul>
                        </div>

                        <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.3.0</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Pembersihan Sistem: Menghapus seluruh fitur dan referensi RFID untuk menyederhanakan antarmuka absen.</li>
                          </ul>
                        </div>

                        <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.2.6</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Hak Akses Superadmin: Memberikan akses penuh bagi Superadmin untuk melakukan edit dan hapus (termasuk override status absensi).</li>
                            <li>Perbaikan Hapus Foto: Memperbaiki kendala izin Firestore saat menghapus lampiran foto pada log absensi.</li>
                          </ul>
                        </div>

                        <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.2.5</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Perbaikan Tombol Hapus Log: Memperbaiki izin Firestore untuk penghapusan log absensi dan mengoptimalkan urutan penghapusan file agar tidak terjadi tautan gambar rusak.</li>
                            <li>Fitur Hapus Foto: Menambahkan kemampuan bagi Admin/Superadmin untuk menghapus hanya foto lampiran pada log absensi tanpa menghapus seluruh record.</li>
                          </ul>
                        </div>

                        <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.2.4</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Peningkatan UI: Optimasi animasi transisi antar menu di halaman Dashboard Admin menjadi lebih mulus.</li>
                          </ul>
                        </div>

                        <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.2.2</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Peningkatan Keamanan: Menyembunyikan dan menonaktifkan perubahan API Key (Google Maps & VAPID Key) dari tipe akun Demo di Dashboard Pengaturan.</li>
                            <li>Perbaikan Bug Akses Basis Data: Memperbaiki kendala "Missing or insufficient permissions" yang terjadi pada sinkronisasi data realtime Absensi, Izin, dan Penggajian untuk akun non-admin.</li>
                          </ul>
                        </div>

                        <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.2.1</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Perbaikan bug tampilan pada filter dropdown menu rekap absensi yang menyebabkan Invalid Hook Error.</li>
                          </ul>
                        </div>

                        <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.2.0</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Fitur Baru: Penambahan Menu Rekap Absensi Admin. Fitur untuk menampilkan dan mendownload log kehadiran karyawan secara harian, mingguan, dan bulanan.</li>
                          </ul>
                        </div>

                        <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.1.3</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Perbaikan bug tampilan teks tidak terlihat saat mode gelap (Dark Mode) aktif pada form Portal Pengumuman.</li>
                          </ul>
                        </div>

                        <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.1.2</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Perbaikan tata letak tombol Export Laporan di tampilan Desktop / Mobile agar rata kanan.</li>
                          </ul>
                        </div>

                        <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.1.1</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Perbaikan bug tampilan pada menu Export Laporan (Hydration Error - struktur tombol bertumpuk).</li>
                          </ul>
                        </div>

                        <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.1.0</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Penambahan fitur nyata Generate Laporan (Export Excel, CSV, dan PDF) di Dashboard Admin.</li>
                          </ul>
                        </div>
                        
                        <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 3.0.0</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Dukungan PWA (Progresive Web App) & Offline Mode.</li>
                            <li>Optimalisasi kompresi foto base64 untuk menghemat kuota.</li>
                            <li>Perbaikan tata letak responsive & ukuran UI menyesuaikan layar (Desktop/Tablet/Android).</li>
                            <li>Perbaikan masalah menu bawah yang bertumpuk (overlap) dengan isi layar.</li>
                            <li>Penayangan riwayat Log Perubahan & Fitur (Tentang Aplikasi).</li>
                          </ul>
                        </div>

                        <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 2.1.0</h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Integrasi Web Push Notification API untuk pesan dari Admin.</li>
                            <li>Peningkatan limit AI Face-API Detection dan Auto-capture.</li>
                          </ul>
                        </div>

                        <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <h5 className="font-bold text-gray-900 dark:text-white text-sm">Versi 1.0.0 <span className="text-xs font-normal text-gray-500 ml-2">Rilis Awal</span></h5>
                          <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-3">
                            <li>Sistem Absensi Dasar (Masuk/Pulang).</li>
                            <li>Validasi Jarak Titik Koordinat 50m.</li>
                            <li>Auth dengan Firebase (Google/Email).</li>
                          </ul>
                        </div>
                        
                    </div>
                  </div>
              </div>
            </Card>
          </div>
    );
};
