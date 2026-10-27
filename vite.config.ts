import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig(({ command }) => {
  const base = command === 'build' ? '/pixel-farm-simulator/' : '/';
  
  return {
    base,
    plugins: [
      legacy({
        targets: ['defaults', 'not IE 11']
      })
    ],
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
