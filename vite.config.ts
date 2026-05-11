import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './',
    plugins: [react(), tailwindcss(), VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [],
        manifest: {
            name: 'ABSENKU',
            short_name: 'Absenku',
            description: 'Sistem Absensi Karyawan',
            theme_color: '#0d9488',
            background_color: '#ffffff',
            display: 'standalone',
            icons: [
                {
                    src: 'https://cdn-icons-png.flaticon.com/512/3204/3204361.png',
                    sizes: '192x192',
                    type: 'image/png'
                },
                {
                    src: 'https://cdn-icons-png.flaticon.com/512/3204/3204361.png',
                    sizes: '512x512',
                    type: 'image/png'
                }
            ]
        },
        workbox: {
            maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        }
    })],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: 'dist',
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('firebase')) return 'vendor-firebase';
              if (id.includes('recharts')) return 'vendor-recharts';
              if (id.includes('lucide-react')) return 'vendor-icons';
              if (id.includes('face-api.js')) return 'vendor-faceapi';
              if (id.includes('leaflet')) return 'vendor-maps';
              return 'vendor-libs';
            }
          }
        }
      }
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
