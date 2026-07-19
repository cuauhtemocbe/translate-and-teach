// Test setup file for vitest
// This file is executed before each test file

import '@testing-library/jest-dom/vitest';

// Global test setup
console.log('Test setup initialized');

// Mock environment variables for testing
Object.defineProperty(import.meta, 'env', {
  value: {
    ...import.meta.env,
    VITE_TOGETHER_API_KEY: 'test-api-key-12345',
  },
  configurable: true,
  writable: true,
});
