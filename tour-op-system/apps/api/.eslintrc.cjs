module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  env: {
    node: true,
    es2023: true,
  },
  ignorePatterns: ['dist/', 'coverage/'],
};
