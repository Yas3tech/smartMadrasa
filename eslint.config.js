import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Disable strict type rules that cause noise in this project
      '@typescript-eslint/no-explicit-any': 'warn', // Downgrade from error to warning
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Allow underscore-prefixed unused vars
      '@typescript-eslint/ban-ts-comment': 'off', // Allow @ts-ignore comments
      'react-hooks/exhaustive-deps': 'warn', // Downgrade dependency warnings
      // Disable React Compiler strict rules (experimental feature causing false positives)
      'react-refresh/only-export-components': 'warn',
      'react-hooks/set-state-in-effect': 'off', // Allow setState in useEffect
      'react-hooks/purity': 'off', // Allow impure functions like Math.random() in handlers
      'react-hooks/preserve-manual-memoization': 'off', // Allow manual memoization patterns
    },
  },
]);
