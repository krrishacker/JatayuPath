import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    open: true,
    port: 5174,
    strictPort: false,
    proxy: {
      '/camera': {
        target: 'http://10.108.106.40',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/camera/, ''),
      },
      '/camera-stream': {
        target: 'http://10.108.106.40:81',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/camera-stream/, ''),
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    open: true,
    port: 4174,
    strictPort: false,
  },
})
