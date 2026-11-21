import { copyFileSync, mkdirSync } from 'node:fs';
import basicSsl from '@vitejs/plugin-basic-ssl';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

const PRECACHE_LIMIT = 80 * 1024 * 1024;

// Runtime files loaded by URL must match the installed package version, so they are copied
// from node_modules on every dev or build run instead of being versioned.
const RUNTIME_ASSETS: ReadonlyArray<readonly [from: string, to: string]> = [
  ['onnxruntime-web/dist/ort-wasm-simd-threaded.mjs', 'voice/ort'],
  ['onnxruntime-web/dist/ort-wasm-simd-threaded.wasm', 'voice/ort'],
  ['@lichess-org/vosk-browser/dist/vosk.worker.js', 'ear'],
  ['@lichess-org/vosk-browser/dist/vosk.wasm', 'ear'],
];

function runtimeAssets(): Plugin {
  return {
    name: 'runtime-assets',
    configResolved() {
      for (const [from, to] of RUNTIME_ASSETS) {
        const dir = new URL(`./public/${to}/`, import.meta.url);
        mkdirSync(dir, { recursive: true });
        copyFileSync(
          new URL(`./node_modules/${from}`, import.meta.url),
          new URL(from.slice(from.lastIndexOf('/') + 1), dir),
        );
      }
    },
  };
}

export default defineConfig(({ mode }) => ({
  base: './',
  worker: { format: 'es' },
  plugins: [
    runtimeAssets(),
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
