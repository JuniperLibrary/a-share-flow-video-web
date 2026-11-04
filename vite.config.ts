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
    manifest: true,
    rollupOptions: {
      output: {
        // Leave shared dependencies to Rollup so lazy vendors cannot pull in the app entry.
        onlyExplicitManualChunks: true,
        manualChunks(id) {
          const moduleId = id.replace(/\\/g, '/')
          if (moduleId.includes('\0commonjsHelpers.js')) return 'vendor-runtime'
          if (!moduleId.includes('/node_modules/')) return
          if (/\/node_modules\/(react|react-dom|scheduler)\//.test(moduleId)) {
            return 'vendor-runtime'
          }
          if (/\/node_modules\/(chart\.js|react-chartjs-2|@kurkle\/color)\//.test(moduleId)) {
            return 'vendor-charts'
          }
          if (/\/node_modules\/@tanstack\/(react-query|query-core)\//.test(moduleId)) {
            return 'vendor-query'
          }
          if (/\/node_modules\/@tanstack\/(react-table|table-core|react-virtual|virtual-core)\//.test(moduleId)) {
            return 'vendor-table'
          }
          if (moduleId.includes('/node_modules/@dnd-kit/')) return 'vendor-dnd'
          if (/\/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(moduleId)) {
            return 'vendor-motion'
          }
          if (moduleId.includes('/node_modules/lodash/')) return 'vendor-lodash'
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:8084',
        changeOrigin: true,
      },
      '/output': {
        target: process.env.VITE_API_TARGET || 'http://localhost:8084',
        changeOrigin: true,
      },
    },
  },
})
