/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defineConfig, type Plugin, type ResolvedConfig } from 'vite';

/**
 * Static hosts without rewrites (GitHub Pages) answer unknown paths with `404.html`. Making it a copy of
 * `index.html` boots the SPA on any deep link (`/HRWebApp-UI/people/<id>`) with the URL intact, and React
 * Router then renders the right page (or its own "not found"). Only needed when served under a sub-path.
 */
function spaFallbackPage(): Plugin {
  let resolved: ResolvedConfig;
  return {
    name: 'spa-fallback-404',
    apply: 'build',
    configResolved(config) {
      resolved = config;
    },
    async writeBundle() {
      if (resolved.base === '/' || resolved.build.ssr) return;
      const outDir = resolve(resolved.root, resolved.build.outDir);
      await copyFile(resolve(outDir, 'index.html'), resolve(outDir, '404.html'));
    },
  };
}

export default defineConfig({
  // `/` by default; the GitHub Pages demo is built with `--base /HRWebApp-UI/` (see `npm run build:pages`).
  plugins: [react(), spaFallbackPage()],
  server: {
    port: 5173,
    // Keycloak's redirect URIs and the backend's CORS origin are registered for this exact port
    strictPort: true,
  },
  preview: {
    port: 4173,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    css: false,
  },
});
