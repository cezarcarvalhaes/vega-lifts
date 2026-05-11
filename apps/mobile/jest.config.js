/** @type {import('jest').Config} */
const config = {
  preset: 'jest-expo',
  setupFiles: ['./jest.setup.ts'],
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.{ts,tsx}'],
  // pnpm resolves packages through node_modules/.pnpm/<pkg@ver>/node_modules/<pkg>.
  // jest-expo's default transformIgnorePatterns assume flat node_modules and fail
  // to match the pnpm path prefix. Two patterns handle both layouts:
  //
  // Pattern 1: standard flat node_modules — explicitly excludes .pnpm paths so
  //   they are not mistakenly left un-transformed.
  // Pattern 2: pnpm .pnpm store — only whitelist react-native and @react-native
  //   packages that ship Flow types requiring Babel. All other .pnpm packages are
  //   kept un-transformed (CJS or already mocked).
  transformIgnorePatterns: [
    'node_modules/(?!\\.pnpm|((jest-)?react-native|@react-native(-community)?(/.*)?|expo(nent)?|@expo(nent)?/(?!font)|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg))',
    'node_modules/\\.pnpm/(?!(@react-native|react-native))',
  ],
  moduleNameMapper: {
    // Workspace packages — point at TypeScript source so tests pick up changes
    // without a separate build step.
    '^@vega/types$': '<rootDir>/../../packages/types/src/index.ts',
    '^@vega/api$': '<rootDir>/../../packages/api/src/index.ts',
    // @react-native/js-polyfills ships Flow type annotations that Babel can't
    // parse when the file is accessed via pnpm's .pnpm path. Stub it out since
    // polyfill error handling setup is not meaningful in unit tests.
    '^@react-native/js-polyfills(.*)': '<rootDir>/src/test-utils/empty-stub.js',
    // expo-modules-core ships ESM-only source in its .web.ts entry when resolved
    // through pnpm. Provide a minimal stub with the globals jest-expo setup needs.
    '^expo-modules-core(.*)': '<rootDir>/src/test-utils/expo-modules-stub.js',
    // expo/src/winter is expo's web-worker runtime — not needed in unit tests.
    '^expo/src/winter(.*)': '<rootDir>/src/test-utils/empty-stub.js',
  },
};

module.exports = config;
