/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Keycloak's redirect URIs and the backend's CORS origin are registered for this exact port
    strictPort: true,
  },
  build: {
    rolldownOptions: {
      onwarn(warning, warn) {
        // keycloak-js 22 bundles js-sha256, which feature-detects Node's Buffer with a guarded eval().
        // That branch never runs in the browser; the warning is noise we cannot fix upstream.
        if (warning.code === 'EVAL' && warning.id?.includes('js-sha256')) return;
        warn(warning);
      },
    },
  },
  preview: {
    port: 4173,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
    css: false,
  },
});
