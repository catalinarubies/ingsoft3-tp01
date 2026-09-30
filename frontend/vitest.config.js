import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['src/api/**', 'src/utils/**'],
      reporter: ['text', 'html', 'json-summary'],
      thresholds: {
        lines: 85,
        branches: 80,
      },
    },
  },
});
