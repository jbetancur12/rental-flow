import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    chunkSizeWarningLimit: 1000, // Aumenta el límite del warning a 1000 kB
    rollupOptions: {
      output: {
        manualChunks: {
          recharts: ['recharts'],
          html2canvas: ['html2canvas'],
        }
      }
    }
  }
});
