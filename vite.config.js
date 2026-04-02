import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

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
      input: {
        main: resolve('index.html'),
        en: resolve('en/index.html')
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom']
        }
      }
    }
  }
})
