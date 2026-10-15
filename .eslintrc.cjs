module.exports = {
  root: true,
  env: { es2022: true, node: true },
  extends: ['eslint:recommended'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  ignorePatterns: ['node_modules/', 'dist/'],
  rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none', ignoreRestSiblings: true }] },
  overrides: [{
    files: ['frontend/**/*.{js,jsx}'],
    env: { browser: true },
    parserOptions: { ecmaFeatures: { jsx: true } },
    plugins: ['react', 'react-hooks'],
    extends: ['plugin:react/jsx-runtime'],
    rules: { 'react/jsx-uses-vars': 'error', 'react-hooks/rules-of-hooks': 'error' },
  }],
};
