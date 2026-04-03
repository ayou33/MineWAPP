import eslint from '@eslint/js'
import tslint from 'typescript-eslint'
import globals from 'globals'

export default tslint.config(
  eslint.configs.recommended,
  ...tslint.configs.recommended,
  {
    ignores: ['dist', 'lunzi', 'public', '*.config.*', '**/*.d.ts', 'src/router.ts'],
  },
  {
    rules: {
      eqeqeq: 'error',
      quotes: ['error', 'single'],
      semi: ['error', 'never'],
      'array-bracket-spacing': ['error', 'never'],
      'default-case': 'error',
      'keyword-spacing': 'error',
      'max-statements': ['error', 50],
      'max-params': ['error', 5],
      'no-case-declarations': 'error',
      'no-eq-null': 'error',
      'no-empty': 'error',
      'no-else-return': 'error',
      'no-extra-boolean-cast': 'error',
      'no-multiple-empty-lines': ['error', { max: 1 }],
      'no-multi-spaces': 'error',
      'no-magic-numbers': 'off',
      'object-curly-spacing': ['error', 'always'],
      'semi-spacing': 'error',
      'space-before-function-paren': 'error',
      'space-before-blocks': 'error',
      'spaced-comment': ['error', 'always', {
        'markers': ['@once']
      }],
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-magic-numbers': ['warn', {
        ignoreEnums: true,
        ignoreNumericLiteralTypes: true,
        ignoreReadonlyClassProperties: true,
        ignoreTypeIndexes: true,
        ignoreArrayIndexes: true,
        ignoreDefaultValues: true,
        ignoreClassFieldInitialValues: true,
        ignore: [-1, 0, 1, 2],
      }],
    },
    languageOptions: {
      globals: globals.browser,
    },
  },
)
