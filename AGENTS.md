# Agent Instructions

## Custom User Guidelines
- **Changelog and Versioning:** Every time you add a new feature or make changes to existing features, you must always update the changelog (in the "Tentang Aplikasi" / "Changelog" UI inside the app, usually in `UserApp.tsx` or similar) and bump the version number for each change. Maintain a record of these changes.
- **Build Optimization:** Untuk menjaga performa hosting (seperti Vercel) dan menghindari peringatan *chunk size limit*, selalu gunakan `React.lazy` dan `Suspense` untuk komponen besar atau rute utama aplikasi. Pastikan konfigurasi `manualChunks` di `vite.config.ts` diperbarui jika menambahkan pustaka eksternal berukuran besar.
