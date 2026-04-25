import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8788',
        changeOrigin: true,
      },
    },
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
        en: resolve('en/index.html'),
        desktop: resolve('desktop.html')
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom']
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  }
})
