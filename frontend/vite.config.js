import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    allowedHosts: [
      'chalazian-subtilely-rowena.ngrok-free.dev', // ngrok share link (example)
      /\.ngrok-free\.app$/, // allow other ngrok-free.app hosts
      /\.ngrok-free\.dev$/, // allow other ngrok-free.dev hosts
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})

