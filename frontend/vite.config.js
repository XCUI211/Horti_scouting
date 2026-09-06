import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }

  return {
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
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test-setup.js',
    },
  }
})
