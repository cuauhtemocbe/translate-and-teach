// Test setup file for vitest
// This file is executed before each test file

import { JSDOM } from 'jsdom';
import '@testing-library/jest-dom/vitest';

// Global test setup
console.log('Test setup initialized');

// Node >=26 defines a native `localStorage` global that stays undefined
// unless started with --localstorage-file. In vitest's jsdom environment
// `window` is globalThis itself, so `window.localStorage` resolves through
// that same broken native getter instead of jsdom's implementation. Pull a
// working Storage instance from a standalone JSDOM instance instead.
Object.defineProperty(globalThis, 'localStorage', {
  value: new JSDOM('', { url: 'http://localhost' }).window.localStorage,
  writable: true,
  configurable: true,
});

// Mock environment variables for testing
Object.defineProperty(import.meta, 'env', {
  value: {
    ...import.meta.env,
    VITE_TOGETHER_API_KEY: 'test-api-key-12345',
  },
  configurable: true,
  writable: true,
});
