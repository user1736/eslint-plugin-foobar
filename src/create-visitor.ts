import { Rule } from 'eslint'
import * as ESTree from 'estree'
import {
  ArrayExpression,
  ArrowFunctionExpression,
  CallExpression,
  ClassDeclaration,
  Expression,
  FunctionExpression,
  MemberExpression,
  SimpleLiteral,
  SpreadElement,
  VariableDeclarator,
} from 'estree'
import { TaskRuleContext } from './task-rule-context'

const superCallSelector =
  'ClassDeclaration[superClass.name="Task"] MethodDefinition[kind="constructor"] CallExpression[callee.type="Super"]'
const contextArgSelector =
  'ClassDeclaration[superClass.name="Task"] MethodDefinition[key.name="execute"] > FunctionExpression'
const contextArgArrowSelector =
  'ClassDeclaration[superClass.name="Task"] ClassProperty[key.name="execute"] > ArrowFunctionExpression'
const contextUseSelector =
  'ClassDeclaration[superClass.name="Task"] MethodDefinition[key.name="execute"] MemberExpression'
const contextUseArrowSelector =
  'ClassDeclaration[superClass.name="Task"] ClassProperty[key.name="execute"] MemberExpression'
const contextSpreadSelector =
  'ClassDeclaration[superClass.name="Task"] MethodDefinition[key.name="execute"] VariableDeclarator'
const contextSpreadArrowSelector =
  'ClassDeclaration[superClass.name="Task"] ClassProperty[key.name="execute"] VariableDeclarator'
const contextLeakSelector =
  'ClassDeclaration[superClass.name="Task"] MethodDefinition[key.name="execute"] CallExpression'
const contextLeakArrowSelector =
  'ClassDeclaration[superClass.name="Task"] ClassProperty[key.name="execute"] CallExpression'
const classExitSelector = 'ClassDeclaration[superClass.name="Task"]:exit'

/**
 * TODO:
 * - check import for Task class;
 */
export function create(context: Rule.RuleContext): Rule.RuleListener {
  const ruleContext = new TaskRuleContext(context)

  /**
   * node types for visitor's function guaranteed by selectors
   */
  return {
    [superCallSelector](node: CallExpression) {
      visitSuperCall(node, ruleContext)
    },

    [contextArgSelector](node: FunctionExpression) {
      visitExecuteMethod(node, ruleContext)
    },

    [contextArgArrowSelector](node: ArrowFunctionExpression) {
      visitExecuteMethod(node, ruleContext)
    },

    [contextUseSelector](node: MemberExpression) {
      visitSimpleDepConsume(node, ruleContext)
    },

    [contextUseArrowSelector](node: MemberExpression) {
      visitSimpleDepConsume(node, ruleContext)
    },

    [contextSpreadSelector](node: VariableDeclarator) {
      visitContextSpread(node, ruleContext)
    },

    [contextSpreadArrowSelector](node: VariableDeclarator) {
      visitContextSpread(node, ruleContext)
    },

    [contextLeakSelector](node: CallExpression) {
      visitContextLeak(node, ruleContext)
    },

    [contextLeakArrowSelector](node: CallExpression) {
      visitContextLeak(node, ruleContext)
    },

    [classExitSelector](node: ClassDeclaration) {
      reportDependencyErrors(node, ruleContext)
    },
  }
}

interface StringLiteral extends SimpleLiteral {
  value: string
}

function isStringLiteral(value: Expression | SpreadElement | null): value is StringLiteral {
  return value?.type === 'Literal' && typeof value?.value === 'string'
}

function isValidDepsArg(node: Expression | SpreadElement): node is ArrayExpression {
  if (node.type !== 'ArrayExpression') {
    return false
  }

  return node.elements.every(isStringLiteral)
}

function reportDependencyErrors(node: ClassDeclaration, context: TaskRuleContext) {
  const contextMeta = context.getMeta(node)
  if (!contextMeta) {
    return
  }

  const { consumed, declared } = contextMeta
  for (const [ key, node ] of Array.from(consumed.entries())) {
    if (declared.has(key)) {
      continue
    }

    context.report({
      node,
      message: `"${key}" isn't listed in task dependencies.`,
    })
  }

  for (const [ key, node ] of Array.from(declared.entries())) {
    if (consumed.has(key)) {
      continue
    }

    context.report({
      node,
      message: `"${key}" is redundant.`,
    })
  }
}

function visitSuperCall(node: CallExpression, context: TaskRuleContext) {
  const contextMeta = context.getMeta()
  if (!contextMeta) {
    return
  }

  const depsArg = node.arguments[1]
  if (!depsArg) {
    /**
     * dependencies is an option parameter - the lack of thereof equals an empty dependency list.
     */
    return
  }

  if (!isValidDepsArg(depsArg)) {
    context.report({ node: depsArg, message: 'dependencies must be defined as a literal.' })
    return
  }

  const { declared } = contextMeta
  for (const element of depsArg.elements) {
    if (isStringLiteral(element)) {
      declared.set(element.value, element)
    }
  }
}

function visitContextLeak(node: CallExpression, context: TaskRuleContext) {
  const contextMeta = context.getMeta()
  if (!contextMeta) {
    return
  }

  const { argName } = contextMeta
  const leakingArg = node.arguments.find(arg => arg.type === 'Identifier' && arg.name === argName)
  if (!leakingArg) {
    return
  }

  const callee = node.callee
  if (
    callee.type === 'MemberExpression' &&
    callee.object.type === 'Identifier' &&
    callee.object.name === 'console'
  ) {
    /**
     * allow console.* methods
     */
    return
  }

  context.report({
    node: leakingArg,
    message: `leaking "${argName}" is prohibited.`,
  })
}

function visitContextSpread(node: VariableDeclarator, context: TaskRuleContext) {
  const contextMeta = context.getMeta()
  if (!contextMeta) {
    return
  }

  const { consumed, argName } = contextMeta
  const rightHand = node.init
  const leftHand = node.id
  if (
    rightHand?.type !== 'Identifier' ||
    rightHand?.name !== argName ||
    leftHand.type !== 'ObjectPattern'
  ) {
    return
  }

  setConsumedFromSpread(consumed, leftHand, e => context.report(e))
}

function visitSimpleDepConsume(node: MemberExpression, context: TaskRuleContext) {
  const obj = node.object
  if (obj.type !== 'Identifier') {
    return
  }

  const parent = context.getParent();
  if (parent.type === "AssignmentExpression" && parent.left === node) {
    /**
     * Skip, if member expression is left part of an assignment
     *
     * @example
     * context.foo = { bar: 'baz' }
     */
    return;
  }

  const contextMeta = context.getMeta()
  if (!contextMeta) {
    return
  }

  const { argName, consumed } = contextMeta
  if (obj.name !== argName) {
    return
  }

  const prop = node.property
  if (node.computed || prop.type !== 'Identifier') {
    context.report({ node, message: `computed properties disallowed on "${argName}".` })
    return
  }

  consumed.set(prop.name, node)
}

function visitExecuteMethod(
  node: ArrowFunctionExpression | FunctionExpression,
  context: TaskRuleContext,
) {
  const contextMeta = context.getMeta()
  if (!contextMeta) {
    return
  }

  const { consumed, setArgName } = contextMeta

  // context is the first argument in code samples
  const contextArg = node.params[0]
  switch (contextArg?.type) {
    case 'Identifier': {
      setArgName(contextArg.name)
      break
    }

    case 'ObjectPattern': {
      setConsumedFromSpread(consumed, contextArg, e => context.report(e))
      break
    }
  }
}

function setConsumedFromSpread(
  consumedDependencies: Map<string, ESTree.Node>,
  contextSpread: ESTree.ObjectPattern,
  report: (descriptor: Rule.ReportDescriptor) => void,
) {
  for (const prop of contextSpread.properties) {
    if (prop.type === 'Property') {
      if (prop.key.type === 'Identifier') {
        if (prop.computed) {
          /**
           * @example
           * const field = 'foo'
           * const { [field]: testField } = context;
           * // or
           * const { ['foo']: testField } = context;
           */
          report({ node: prop, message: 'computed properties disallowed on "context".' })
          continue
        }

        consumedDependencies.set(prop.key.name, prop)
      } else if (prop.key.type === 'Literal') {
        const value = prop.key.value?.toString()
        if (value) {
          consumedDependencies.set(value, prop)
        }
      }
    } else {
      /**
       * Prohibit rest property usage on context all together, to simplify leak tracking
       *
       * @example
       * function execute(context) {
       *   const {foo, ...leakingContext} = context;
       *   doStuff(leakingContext);
       * }
       */
      report({
        node: prop,
        message: 'rest property disallowed on "context".',
      })
    }
  }
}
