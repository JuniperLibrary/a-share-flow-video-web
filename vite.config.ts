import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@fund': path.resolve(__dirname, './src/fund'),
    },
  },
  plugins: [react()],
  base: process.env.VITE_BASE_URL || '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:8084',
        changeOrigin: true,
      },
    },
  },
})
