import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development, /api/* is forwarded to the Express server so the browser
// sees one origin. Override the target with VITE_API_PROXY if the API runs elsewhere.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: process.env.VITE_API_PROXY || 'http://localhost:5000', changeOrigin: true },
    },
  },
});
