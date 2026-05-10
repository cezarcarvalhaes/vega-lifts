import antfu from '@antfu/eslint-config';

export default antfu({
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
// React Native: StyleSheet.create() is conventionally at the bottom of the file
{
  files: ['apps/mobile/**/*.{ts,tsx}'],
  rules: {
    'ts/no-use-before-define': 'off',
  },
});
