import eslint from '@eslint/js'
import { globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  eslint.configs.recommended,
  {
    files: ['**/*.ts'],
    extends: [
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
  },

  globalIgnores([
    '**/dist/**',
    '**/node_modules/**',
    '.cursor',
    '.github',
    '.husky',
    '.vscode',
    '.yarn',
  ]),
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['eslint.config.mjs'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // Other configs
  {
    name: 'local:rules',
    rules: {
      curly: 'error',

      // Enforce comments above code, never inline
      'line-comment-position': ['error', { position: 'above' }],

      // Enforce max length for comments only
      'max-len': [
        'error',
        {
          // Effectively unlimited for code (prettier takes care of this)
          code: 999,
          // Max 80 characters for comments only
          comments: 80,
          ignoreUrls: true,
        },
      ],
    },
  },
  // Rule to block describe wrappers in test files
  {
    name: 'local:test-rules',
    files: ['**/*.test.ts', '**/*.test.js', '**/*.spec.ts', '**/*.spec.js'],
    rules: {
      // Block usage of describe wrappers in test files
      'no-restricted-globals': [
        'error',
        {
          name: 'describe',
          message:
            'Use flat test structure with it() methods only. Do not use describe wrappers.',
        },
      ],
    },
  },
)
