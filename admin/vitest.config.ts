import path from 'path';
import { defineConfig } from 'vitest/config';

// Kept separate from vite.config.ts so unit tests skip the Sentry plugin.
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
