module.exports = {
  printWidth: 100,
  useTabs: false,
  tabWidth: 2,
  singleQuote: true,
  semi: false,
  trailingComma: 'es5',
  arrowParens: 'avoid',
  overrides: [
    {
      files: '*.{ts,tsx}',
      parser: 'typescript',
      options: {
        trailingComma: 'all',
      },
    },
  ],
}
