import { defineConfig } from 'vite';

export default defineConfig(({ command }) => {
  const base = command === 'build' ? '/PIXEL-FARM-SIMULATOR/' : '/';
  
  return {
    base,
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false
    },
    server: {
      port: 3000
    },
    test: {
      globals: true,
      environment: 'jsdom'
    }
  };
});
