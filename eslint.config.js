// @ts-check
import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    // The baseline in src/ is linted from Phase 2 onwards.
    ignores: ['src/**', 'node_modules/**', 'dist/**', 'coverage/**', '.vite/**', 'reference/**'],
  },
  js.configs.recommended,
  {
    files: ['*.config.js', 'tests/**/*.js', '.githooks/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
  {
    // The commit guards are owner-managed and not edited here. This rule flags the unused default
    // value in `let expected = ''` (check-pre-commit.mjs:43), which is stylistic only.
    files: ['.githooks/*.mjs'],
    rules: { 'no-useless-assignment': 'off' },
  },
];
