import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Same-origin API in development — cookies stay "first-party", no CORS needed
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Serve product images uploaded to the API
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
