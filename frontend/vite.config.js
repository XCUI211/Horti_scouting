import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        short_name: "Vireo",
        name: "Vireo Plant Quality Control",
        icons: [
          {
            "src": "logo.png",
            "sizes": "any",
            "type": "image/png",
            "purpose": "any maskable"
          }
        ],
        "start_url": "/",
        "display": "standalone",
        "theme_color": "#ffffff",
        "background_color": "#ffffff"
      },
      workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      }
    })
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test-setup.js',
  },
})
