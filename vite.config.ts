/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

const repoBase = '/PIXEL-FARM-SIMULATOR/';

export default defineConfig(({ command, isPreview }) => {
  const isBuilt = command === 'build' || isPreview;
  const base = process.env.BASE_PATH || (isBuilt ? repoBase : '/');

  return {
    base,
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      chunkSizeWarningLimit: 2000
    },
    server: {
      port: 3000,
      host: true
    },
    test: {
      environment: 'jsdom',
      include: ['tests/**/*.test.ts']
    }
  };
});
