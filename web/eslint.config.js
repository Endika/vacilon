import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

const forbid = (message, ...groups) => ({
  'no-restricted-imports': ['error', { patterns: [{ group: groups, message }] }],
});

const MAIN = ['**/main', '**/main.ts'];

const BROWSER_APIS = [
  'window',
  'document',
  'navigator',
  'localStorage',
  'sessionStorage',
  'fetch',
  'AudioContext',
  'Worker',
  'requestAnimationFrame',
].map((name) => ({ name, message: 'Browser APIs belong in infrastructure or ui.' }));

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules', 'public', 'src/vendor'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  {
    files: ['src/domain/**/*.ts'],
    rules: {
      ...forbid(
        'The domain is pure: it cannot import from the layers above it.',
        '**/application',
        '**/application/**',
        '**/infrastructure',
        '**/infrastructure/**',
        '**/ui',
        '**/ui/**',
        ...MAIN,
      ),
      'no-restricted-globals': ['error', ...BROWSER_APIS],
    },
  },
  {
    files: ['src/application/**/*.ts'],
    rules: {
      ...forbid(
        'Use cases reach adapters through ports, never directly.',
        '**/infrastructure',
        '**/infrastructure/**',
        '**/ui',
        '**/ui/**',
        ...MAIN,
      ),
      'no-restricted-globals': ['error', ...BROWSER_APIS],
    },
  },
  {
    files: ['src/ui/**/*.ts'],
    rules: forbid(
      'The UI talks to use cases, never to adapters.',
      '**/infrastructure',
      '**/infrastructure/**',
      ...MAIN,
    ),
  },
);
