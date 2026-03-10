import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true, // fallisce se 5173 è occupata invece di usare un’altra porta
    proxy: {
      '/api': { target: 'http://127.0.0.1:5172', changeOrigin: true },
    },
  },
})
