import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'GridFail — study when the grid fails',
        short_name: 'GridFail',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
        display: 'standalone',
        start_url: '.',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json}'],
      },
    }),
  ],
})
