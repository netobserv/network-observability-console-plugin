import eslint from '@eslint/js';
import react from 'eslint-plugin-react';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      "**/node_modules/*",
      "**/dist/*"
    ]
  },
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      react,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        pragma: "React",
        version: "detect",
      },
    },
    rules: {
      "max-len": ["warn", {
        code: 170,
      }],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react/prop-types": "off",
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  }
];