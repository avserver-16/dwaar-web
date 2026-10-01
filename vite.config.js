import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, the browser talks to the Vite server (same origin) and Vite forwards
// API + Socket.IO traffic to VITE_API_URL, so CORS on the backend doesn't matter.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = (env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
  const proxied = { target, changeOrigin: true, secure: true, headers: { Origin: target } };

  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/api': proxied,
        '/health': proxied,
        '/docs': proxied,
        '/socket.io': { ...proxied, ws: true },
      },
    },
  };
});
