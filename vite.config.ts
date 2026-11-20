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
    // In development the API runs as its own process (`pnpm dev:server`)
    proxy: {
      '/api': `http://localhost:${process.env.PORT ?? 8080}`,
    },
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
      include: ['src/**', 'server/**'],
      exclude: [
        'src/main.tsx',
        'src/types/**',
        'src/vite-env.d.ts',
        'src/test/**',
        // Wiring only (reads env, starts listening); every behavior lives in the tested modules
        'server/index.ts',
      ],
      thresholds: {
        'src/utils/**': { statements: 90, branches: 90, functions: 90, lines: 90 },
        'src/services/**': { statements: 90, branches: 90, functions: 90, lines: 90 },
        'server/**': { statements: 90, branches: 90, functions: 90, lines: 90 },
        'src/**': { statements: 80, branches: 80, functions: 80, lines: 80 },
      },
    },
  },
})
