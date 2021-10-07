import { RuleTester } from 'eslint'
import { testRule } from '../testRule'
import { cases as baseCases } from './base'
import { cases as spreadCases } from './spread-operator'

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    sourceType: 'module',
  },
})

ruleTester.run('test-rule', testRule, {
  valid: [...baseCases.valid, ...spreadCases.valid],
  invalid: [...baseCases.invalid, ...spreadCases.invalid],
})
