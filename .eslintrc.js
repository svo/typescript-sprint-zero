module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.test.json'],
  },
  plugins: ['@typescript-eslint', 'boundaries'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:boundaries/recommended',
    'prettier',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    complexity: ['error', 5],
    'max-depth': ['error', 3],
    'max-nested-callbacks': ['error', 2],
    'max-lines-per-function': [
      'error',
      {
        max: 50,
        skipBlankLines: true,
        skipComments: true,
        IIFEs: false,
      },
    ],
    'max-statements': ['error', 10],
    'max-params': ['error', 3],
    'boundaries/element-types': [
      'error',
      {
        default: 'disallow',
        rules: [
          { from: 'domain', allow: [] },
          { from: 'application', allow: ['domain'] },
          { from: 'infrastructure', allow: ['domain', 'application'] },
          { from: 'interfaces', allow: ['application'] },
          { from: 'config', allow: ['domain', 'application', 'infrastructure', 'interfaces'] },
        ],
      },
    ],
  },
  settings: {
    'boundaries/elements': [
      { type: 'domain', pattern: 'src/domain/**' },
      { type: 'application', pattern: 'src/application/**' },
      { type: 'infrastructure', pattern: 'src/infrastructure/**' },
      { type: 'interfaces', pattern: 'src/interfaces/**' },
      { type: 'config', pattern: 'src/config/**' },
    ],
  },
  env: {
    node: true,
    es6: true,
  },
  ignorePatterns: ['dist/', 'coverage/', 'tmp/', '*.js', '*.d.ts'],
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.spec.ts'],
      rules: {
        complexity: ['error', 10],
        'max-nested-callbacks': ['error', 4],
        'max-lines-per-function': [
          'error',
          {
            max: 300,
            skipBlankLines: true,
            skipComments: true,
            IIFEs: false,
          },
        ],
        'max-statements': ['error', 20],
      },
    },
  ],
};
