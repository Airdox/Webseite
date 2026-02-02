import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy temporarily disabled for debugging
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:8888/.netlify/functions',
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/api/, ''),
    //   },
    // },
  },
  preview: {
    // Proxy temporarily disabled for debugging
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:8888/.netlify/functions',
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/api/, ''),
    //   },
    // },
  },
  build: {
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['@neondatabase/serverless', 'react-ga4']
        }
      }
    }
  }
})
