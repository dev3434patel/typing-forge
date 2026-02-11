/**
 * Vitest Test Setup
 * Global test configuration and mocks
 */

import { afterEach } from 'vitest';

// Mock localStorage for Node.js environment
if (typeof global !== 'undefined' && typeof localStorage === 'undefined') {
  const storage: Record<string, string> = {};
  global.localStorage = {
    getItem: (key: string) => storage[key] || null,
    setItem: (key: string, value: string) => { storage[key] = value; },
    removeItem: (key: string) => { delete storage[key]; },
    clear: () => { Object.keys(storage).forEach(key => delete storage[key]); },
    get length() { return Object.keys(storage).length; },
    key: (index: number) => Object.keys(storage)[index] || null,
  } as Storage;
}

// Mock sessionStorage for Node.js environment
if (typeof global !== 'undefined' && typeof sessionStorage === 'undefined') {
  const sessionStorageData: Record<string, string> = {};
  global.sessionStorage = {
    getItem: (key: string) => sessionStorageData[key] || null,
    setItem: (key: string, value: string) => { sessionStorageData[key] = value; },
    removeItem: (key: string) => { delete sessionStorageData[key]; },
    clear: () => { Object.keys(sessionStorageData).forEach(key => delete sessionStorageData[key]); },
    get length() { return Object.keys(sessionStorageData).length; },
    key: (index: number) => Object.keys(sessionStorageData)[index] || null,
  } as Storage;
}

// Cleanup after each test
afterEach(() => {
  // Clear localStorage (if available)
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
  // Clear sessionStorage (if available)
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.clear();
  }
});

// Mock window.matchMedia (only in browser-like environments)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  });
}

// Mock ResizeObserver (only in environments that need it)
if (typeof global !== 'undefined') {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
}
