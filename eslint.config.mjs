import js from '@eslint/js'
import * as tseslint from 'typescript-eslint'

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    ignores: [
      '**/*.js',
      '**/*.mjs',
      '**/dist/**',
      '**/node_modules/**',
      '.yarn/**',
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ['./packages/*/tsconfig.json'],
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
    },
  },
]
