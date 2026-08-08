import { defineConfig } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      all: true,
      include: ['src/**'],
      exclude: ['src/main.tsx', 'src/types/**', 'src/vite-env.d.ts', 'src/test/**'],
      thresholds: {
        'src/utils/**': { statements: 90, branches: 90, functions: 90, lines: 90 },
        'src/services/**': { statements: 90, branches: 90, functions: 90, lines: 90 },
        'src/**': { statements: 80, branches: 80, functions: 80, lines: 80 },
      },
    },
  },
})
