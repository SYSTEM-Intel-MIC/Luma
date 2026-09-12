import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'packages/*/src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@luma/shared': path.resolve(__dirname, 'packages/shared/src'),
      '@luma/storage': path.resolve(__dirname, 'packages/storage/src'),
      '@luma/permissions': path.resolve(__dirname, 'packages/permissions/src'),
      '@luma/models': path.resolve(__dirname, 'packages/models/src'),
      '@luma/memory': path.resolve(__dirname, 'packages/memory/src'),
      '@luma/agent': path.resolve(__dirname, 'packages/agent/src'),
      '@luma/tools': path.resolve(__dirname, 'packages/tools/src'),
    },
  },
});
