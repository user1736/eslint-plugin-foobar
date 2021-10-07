import { RuleTester } from 'eslint'
import { taskRule } from '../task-rule'
import { cases as baseCases } from './base'
import { cases as contextLeakCases } from './context-leak'
import { cases as noComputedCases } from './no-computed'
import { cases as spreadCases } from './spread-operator'

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    sourceType: 'module',
  },
})

const cases = [baseCases, spreadCases, contextLeakCases, noComputedCases]
const tests = cases.reduce(
  (acc, seed) => {
    acc.valid.push(...seed.valid)
    acc.invalid.push(...seed.invalid)
    return acc
  },
  { valid: [], invalid: [] },
)

ruleTester.run('task-rule', taskRule, tests)
