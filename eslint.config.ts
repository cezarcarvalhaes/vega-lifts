import antfu from '@antfu/eslint-config';
import globals from 'globals';

export default antfu(
  {
    typescript: true,
    react: true,
    stylistic: {
      indent: 2,
      quotes: 'single',
      semi: true,
    },
    ignores: [
      '**/dist/**',
      '**/drizzle/**',
      'apps/mobile/ios/**',
      'apps/mobile/android/**',
      '**/babel.config.js',
    ],
  },
  // process.env is idiomatic in Node.js; don't require explicit imports
  {
    rules: {
      'node/prefer-global/process': 'off',
      'style/arrow-parens': ['error', 'always'],
      'style/brace-style': ['error', '1tbs'],
      'react/no-context-provider': 'off',
      'react/no-use-context': 'off',
    },
  },
  // Scripts that need console output
  {
    files: [
      'packages/db/src/seed.ts',
      'packages/db/src/migrate.ts',
      'packages/api/src/server.ts',
    ],
    rules: {
      'no-console': 'off',
    },
  },
  // Test files — expose Jest/Vitest globals (describe, it, expect, etc.)
  // globals.jest covers both since Vitest mirrors the Jest API surface.
  {
    files: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    languageOptions: {
      globals: globals.jest,
    },
    rules: {
      // describe() blocks named after components or functions are naturally PascalCase
      'test/prefer-lowercase-title': 'off',
    },
  },
  // Jest setup files use require() inside jest.mock() factories — that's the idiomatic pattern
  {
    files: ['**/jest.setup.{ts,js}'],
    rules: {
      'ts/no-require-imports': 'off',
    },
  },
  // React Native: StyleSheet.create() is conventionally at the bottom of the file
  {
    files: ['apps/mobile/**/*.{ts,tsx}'],
    rules: {
      'ts/no-use-before-define': 'off',
    },
  },
);
