import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  root: '.',
  publicDir: 'public',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'app/src'),
      '@backend': path.resolve(__dirname, 'app/backend'),
      '@electron': path.resolve(__dirname, 'app/electron'),
      '@types': path.resolve(__dirname, 'app/src/types'),
    },
  },
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
