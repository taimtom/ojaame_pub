import path from 'path';
import checker from 'vite-plugin-checker';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

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
    }),
  ],
  resolve: {
    alias: [
      {
        find: /^~(.+)/,
        replacement: path.join(process.cwd(), 'node_modules/$1'),
      },
      {
        find: /^src(.+)/,
        replacement: path.join(process.cwd(), 'src/$1'),
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
