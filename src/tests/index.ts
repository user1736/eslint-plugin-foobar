import { RuleTester } from 'eslint'
import { taskRule } from '../task-rule'
import { cases as baseCases } from './base'
import { cases as spreadCases } from './spread-operator'

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    sourceType: 'module',
  },
})

ruleTester.run('task-rule', taskRule, {
  valid: [...baseCases.valid, ...spreadCases.valid],
  invalid: [...baseCases.invalid, ...spreadCases.invalid],
})
