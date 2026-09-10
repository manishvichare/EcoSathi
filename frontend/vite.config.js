import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — always needed
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Charts — only loaded on dashboard/comparison pages
          'vendor-charts': ['recharts'],
          // Map — only loaded on complaints map view
          'vendor-map': ['leaflet', 'react-leaflet'],
          // Icons
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
  define: {
    'process.env': {},
  },
});