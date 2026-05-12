import { BookOpen, MapPin, Users, Briefcase, Settings, ShieldAlert, Activity, ClipboardList } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";

export function GuideTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center border border-teal-200 dark:border-teal-800">
          <BookOpen className="w-6 h-6 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Buku Petunjuk Admin</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-gray-400">Panduan lengkap cara menggunakan dan mengatur aplikasi Absenku.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-slate-200 dark:border-gray-800 shadow-sm">
          <CardHeader className="bg-slate-50 dark:bg-gray-900/50 border-b border-slate-100 dark:border-gray-800 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              Overview & Analytics
            </CardTitle>
            <CardDescription>Melihat ringkasan data absensi hari ini dan performa.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-sm text-slate-600 dark:text-gray-300">
            <p>
              <strong>Overview:</strong> Menampilkan ringkasan singkat jumlah pengguna, kehadiran hari ini, dan absensi terbaru. Anda dapat mengunduh rekap absensi harian dari sini.
            </p>
            <p>
              <strong>Analytics (Performance):</strong> Memberikan wawasan mendalam tentang performa kehadiran karyawan dari waktu ke waktu, persentase keterlambatan, dan jam kerja lembur menggunakan grafik interaktif.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-gray-800 shadow-sm">
          <CardHeader className="bg-slate-50 dark:bg-gray-900/50 border-b border-slate-100 dark:border-gray-800 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              User Management
            </CardTitle>
            <CardDescription>Manajemen data karyawan dan hak akses.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-sm text-slate-600 dark:text-gray-300">
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Tambah Pengguna:</strong> Admin dapat menambahkan karyawan baru secara manual atau registrasi dari perangkat karyawan.</li>
              <li><strong>Ganti Peran:</strong> Anda dapat mengubah hak akses (Admin/User).</li>
              <li><strong>Print ID Card:</strong> Mencetak ID Card (Barcode) untuk absen menggunakan scanner.</li>
              <li><strong>Nonaktifkan Akun:</strong> Bila karyawan sudah berhenti atau bermasalah, Anda bisa menonaktifkannya.</li>
              <li><strong>Reset Device:</strong> Digunakan untuk mereset data login di HP karyawan (Device UUID) jika karyawan berganti HP.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-gray-800 shadow-sm">
          <CardHeader className="bg-slate-50 dark:bg-gray-900/50 border-b border-slate-100 dark:border-gray-800 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              Pengaturan (Settings)
            </CardTitle>
            <CardDescription>Konfigurasi sistem keamanan dan operasional.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-sm text-slate-600 dark:text-gray-300">
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Nama & Logo Aplikasi:</strong> Mengganti branding (Absenku).</li>
              <li><strong>Batas Jarak Absen Radius (Meter):</strong> Berapa meter dari titik kordinat kantor karyawan bisa absen. Jika 0, maka karyawan bisa absen dari mana saja (WFA).</li>
              <li><strong>Koordinat Kantor:</strong> Menentukan titik pusat di Maps tempat kantor berada. Gunakan "Map Picker" untuk visualisasi lebih gampang.</li>
              <li><strong>QR/Barcode Aktif:</strong> Menghidupkan fitur absensi menggunakan kamera atau scanner.</li>
              <li><strong>Wajib Foto Selfie Aktif:</strong> Mengharuskan pengguna swafoto (webcam/kamera depan) saat absen hadir / pulang.</li>
              <li><strong>Pengaturan Shift Kerja:</strong> Custom jadwal masuk dan keluar per shift.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-gray-800 shadow-sm">
          <CardHeader className="bg-slate-50 dark:bg-gray-900/50 border-b border-slate-100 dark:border-gray-800 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              Peta Live & Rekap
            </CardTitle>
            <CardDescription>Melacak riwayat lokasi absensi dan rekapitulasi data.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-sm text-slate-600 dark:text-gray-300">
            <p>
              <strong>Peta Live:</strong> Memungkinkan Admin untuk memantau sebaran lokasi absensi terkini pada peta interaktif. Fitur ini sangat berguna jika karyawan bekerja di lapangan.
            </p>
            <p>
              <strong>Rekap Kehadiran:</strong> Untuk mencari, mengurutkan, dan mencetak laporan absensi dalam format CSV (Excel) sesuai bulan yang dipilih.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-gray-800 shadow-sm md:col-span-2">
          <CardHeader className="bg-slate-50 dark:bg-gray-900/50 border-b border-slate-100 dark:border-gray-800 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Struktur Organisasi (PT, Area, Cabang)
            </CardTitle>
            <CardDescription>Manajemen penempatan multi-level untuk operasional terpusat.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-sm text-slate-600 dark:text-gray-300">
            <p>
              Anda dapat mengkonfigurasi penempatan berlapis (PT / Perusahaan, Area / Regional, dan Cabang / Ruangan) untuk menyesuaikan dengan struktur organisasi Anda.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Manajemen Struktur:</strong> Data PT, Area (termasuk radius/geofence titik peta), dan Cabang dapat ditambah, diubah, maupun dihapus di menu <strong>Peta & Lokasi</strong> (Geofence Configuration & Manajemen Lokasi).</li>
              <li><strong>Penempatan User:</strong> Setelah ditambahkan, Anda dapat menentukan penempatan PT, Area, dan Cabang untuk masing-masing karyawan di tab <strong>User</strong> (klik Edit / Ikon Pensil pada salah satu user).</li>
              <li><strong>Rekapitulasi:</strong> Di menu <strong>Rekap</strong> dan <strong>Overview</strong>, Anda kini bisa memfilter list kehadiran, file export (Excel / PDF), serta status approval sesuai dengan struktur hirarki ini. Tingkat Admin juga akan disesuaikan pada opsi (Superadmin, Admin PT, Admin Area, Admin Cabang).</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-gray-800 shadow-sm md:col-span-2">
          <CardHeader className="bg-slate-50 dark:bg-gray-900/50 border-b border-slate-100 dark:border-gray-800 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              Log Keamanan & Anti-Fake GPS
            </CardTitle>
            <CardDescription>Memantau peringatan aktivitas mencurigakan.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-sm text-slate-600 dark:text-gray-300">
            <p>
              Sistem telah dilengkapi dengan pendeteksi Fake GPS (Mock Location). Apabila pengguna terindikasi memalsukan koordinat (misalnya menggunakan aplikasi simulator GPS), aplikasinya tidak akan mengizinkan proses absensi. Bagi akun berhak Superadmin, fitur 'Log Keamanan' akan mencatat siapa saja yang pernah terkena peringatan ini beserta detail waktunya.
            </p>
          </CardContent>
        </Card>

        <Card className="border-teal-200 dark:border-teal-900 shadow-sm md:col-span-2 bg-teal-50/30 dark:bg-teal-900/10">
          <CardHeader className="border-b border-teal-100 dark:border-teal-900 pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-teal-800 dark:text-teal-200">
              <ClipboardList className="w-5 h-5" />
              Changelog & Pembaruan
            </CardTitle>
            <CardDescription>Riwayat pembaruan fitur dan perbaikan sistem.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-4">
              <div className="border-l-2 border-teal-500 pl-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-black text-teal-700 dark:text-teal-400">v4.1.2</span>
                  <span className="text-[10px] bg-teal-100 dark:bg-teal-900 px-2 py-0.5 rounded-full font-bold text-teal-600">Terbaru</span>
                </div>
                <ul className="text-xs text-slate-600 dark:text-gray-400 list-disc pl-4 space-y-1">
                  <li>Rancang ulang menu Profil: Tampilan lebih bersih tanpa header gradien.</li>
                  <li>Detail informasi pengguna: Email, NIP, Unit Penempatan, dan Shift Kerja.</li>
                  <li>Fitur Kalender Kehadiran Bulanan dengan legenda status (Tepat, Telat, Izin, Alpa).</li>
                  <li>Pembaruan versi sistem ke v4.1.2.</li>
                </ul>
              </div>

              <div className="border-l-2 border-slate-300 pl-4 opacity-70">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-black text-slate-700 dark:text-slate-400">v4.1.1</span>
                </div>
                <ul className="text-xs text-slate-600 dark:text-gray-400 list-disc pl-4 space-y-1">
                  <li>Peningkatan UI Profil Pengguna dengan kartu identitas modern.</li>
                  <li>Penambahan Ringkasan Statistik Kehadiran bulanan di menu Profil.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
