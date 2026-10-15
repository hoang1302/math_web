module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:react/jsx-runtime', 'plugin:react-hooks/recommended'],
  ignorePatterns: ['dist/', 'node_modules/'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: 'detect' } },
  rules: {
    'react/prop-types': 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none', ignoreRestSiblings: true }],
  },
  overrides: [{ files: ['*.config.js', '*.cjs', 'tests/*.js'], env: { node: true } }],
};
