import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from "eslint-plugin-react";

export default [
  reactPlugin.configs.flat.recommended,
	{
    languageOptions: {
      parser: tsParser,
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    files: ['**/*.{ts,tsx}'],
    rules: {
      'max-len': ['warn', { code: 170 }],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/prop-types': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
    settings: {
      react: {
        pragma: 'React',
        version: 'detect'
      }
    }
  },
];
