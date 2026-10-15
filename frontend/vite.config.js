import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [react()],
    server: {
      host: true,
      port: 3000,
      allowedHosts: (env.VITE_ALLOWED_HOSTS || '').split(',').map(host => host.trim()).filter(Boolean),
      proxy: {
        '/api': { target: 'http://127.0.0.1:5000', changeOrigin: true },
        '/uploads': { target: 'http://127.0.0.1:5000', changeOrigin: true },
      },
    },
  };
});
