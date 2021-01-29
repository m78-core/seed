module.exports = {
  extends: [require.resolve('@lxjx/preset-config/.eslintrc.js')],

  globals: {},

  rules: {
    'no-restricted-syntax': 'off',
    'no-bitwise': 'off',
    'no-useless-constructor': 'off',
    'no-empty-function': 'off',
    '@typescript-eslint/naming-convention': 'off',
    'import/no-extraneous-dependencies': 'off',
    'no-await-in-loop': 'off',
    '@typescript-eslint/no-unused-expressions': 'off',
  },
};
