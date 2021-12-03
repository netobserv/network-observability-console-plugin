module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: [
        '@typescript-eslint',
        'react-hooks'
    ],
    extends: [
        'plugin:react/recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    rules: {
        'max-len': ['warn', { 'code': 100 }],
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        'react/prop-types': 'off',
        '@typescript-eslint/no-empty-interface': 'off'
    },
    settings: {
        react: {
          'pragma': 'React',
          'version': 'detect'
        }
      }
};