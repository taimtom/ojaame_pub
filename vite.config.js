import path from 'path';
import checker from 'vite-plugin-checker';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';

// ----------------------------------------------------------------------

const PORT = 3030;

export default defineConfig({
  // Expose GOOGLE_* so client code can read GOOGLE_CLIENT_ID and GOOGLE_REDIRECT_URL from .env
  // (Vite only exposes VITE_ by default.)
  envPrefix: ['VITE_', 'GOOGLE_'],
  // base: import.meta.env.VITE_BASE_PATH, // set via defineConfig callback + loadEnv if needed
  plugins: [
    react(),
    checker({
      eslint: {
        lintCommand: 'eslint "./src/**/*.{js,jsx,ts,tsx}"',
      },
      overlay: {
        position: 'tl',
        initialIsOpen: false,
      },
      enableBuild: false,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo/logo-single.svg'],
      manifest: {
        name: 'Ojaa.Me',
        short_name: 'Ojaa Me',
        description: 'My Business Management System',
        theme_color: '#1C252E',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/logo/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/logo/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/logo/pwa-192x192.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|woff2|woff)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'assets-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-cache' },
          },
        ],
      },
      devOptions: { enabled: true },
    }),
  ],
  optimizeDeps: {
    include: [
      '@emotion/react',
      '@emotion/styled',
      '@mui/material',
      '@mui/system',
      '@mui/system/createTheme',
    ],
  },
  resolve: {
    dedupe: ['@mui/material', '@mui/system', '@emotion/react', '@emotion/styled'],
    alias: [
      {
        find: /^~(.+)/,
        replacement: path.join(process.cwd(), 'node_modules/$1'),
      },
      {
        find: /^src(.+)/,
        replacement: path.join(process.cwd(), 'src/$1'),
      },
      {
        find: 'store-site',
        replacement: path.join(process.cwd(), '../store_site_fe/src'),
      },
    ],
  },
  server: {
    port: PORT,
    host: true,
    // If VITE_SERVER_URL is empty, browser calls same-origin /api/*; forward to API.
    proxy: {
      '/api': {
        target: process.env.VITE_SERVER_URL || 'http://localhost:8004',
        changeOrigin: true,
      },
    },
  },
  preview: { port: PORT, host: true },
});
