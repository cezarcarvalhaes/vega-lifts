// CSS files are bundled by Next.js; no typed exports needed.
declare module '*.css';

// Expose Vitest's global describe/it/expect etc. to TypeScript.
// Required because vitest.config.ts sets globals: true.
/// <reference types="vitest/globals" />
