import nextPlugin from '@next/eslint-plugin-next';
import globals from 'globals';
import rootConfig from '../../eslint.config';

export default rootConfig.append(
  {
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
  // Vitest is configured with globals: true, so describe/it/expect etc. are
  // injected into test files. Declare them here so ESLint doesn't flag them
  // as undefined — can't rely solely on the root config's pattern resolution
  // when ESLint runs from the apps/web/ directory.
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.jest,
    },
  },
);
