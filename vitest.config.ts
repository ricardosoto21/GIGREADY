import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['app/tests/**/*.test.ts'],
    exclude: ['app/tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['app/backend/**/*.ts'],
      exclude: ['app/backend/database/database.ts'],
      thresholds: {
        statements: 45,
        branches: 38,
        functions: 50,
        lines: 45,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'app/src'),
      '@backend': path.resolve(__dirname, 'app/backend'),
    },
  },
});
