import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

const PRECACHE_LIMIT = 80 * 1024 * 1024;

export default defineConfig(({ mode }) => ({
  base: './',
  worker: { format: 'es' },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      workbox: {
        globPatterns: [
          '**/*.{js,css,html,svg,png,woff2,json,bin,webmanifest}',
          'voice/**/*',
          'ear/**/*',
        ],
        maximumFileSizeToCacheInBytes: PRECACHE_LIMIT,
        navigateFallback: 'index.html',
      },
      manifest: {
        name: 'Chispa',
        short_name: 'Chispa',
        description: 'Chispa, la robot huevito que flota y charla contigo.',
        lang: 'es',
        display: 'standalone',
        orientation: 'any',
        start_url: './',
        scope: './',
        theme_color: '#fdf6ff',
        background_color: '#fdf6ff',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
    ...(mode === 'lan' ? [basicSsl()] : []),
  ],
  test: { environment: 'node', include: ['test/**/*.test.ts'] },
}));
