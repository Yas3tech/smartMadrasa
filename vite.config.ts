/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    host: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
  },
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
  build: {
    // Increase chunk size warning limit (optional)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Manual chunking strategy for better caching
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-firebase-auth': ['firebase/app', 'firebase/auth'],
          'vendor-firebase-db': ['firebase/firestore', 'firebase/storage'],
          'vendor-icons': ['lucide-react'],
          'vendor-i18n': ['i18next', 'react-i18next'],
          'vendor-pdf': ['jspdf', 'jspdf-autotable'],
          // WARN-01/LOGIC-05: Removed unused dompurify/html2canvas and
          // removed manual exceljs chunk to let Vite handle the dynamic import perfectly
        },
      },
    },
    // Enable source maps for production debugging (optional)
    sourcemap: false,
    // Minification options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'lucide-react',
    ],
  },
});
