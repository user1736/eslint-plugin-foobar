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
const classExitSelector = 'ClassDeclaration[superClass.name="Task"]:exit'

/**
 * TODO:
 * - check import for Task class;
 * - handle index access to context;
 * - handle context leaking to other methods;
 * - ensure that dependencies specified as a literal;
 * - report unused dependencies;
 */
function create(context: Rule.RuleContext): Rule.RuleListener {
  const declaredDependencies = new WeakMap<ESTree.Node, Set<string>>()
  const consumedDependencies = new WeakMap<ESTree.Node, Map<string, ESTree.Node>>()
  const contextArgName = new WeakMap<ESTree.Node, string>()

  return {
    [superCallSelector](node: CallExpression) {
      const depsArg = node.arguments[1] as ArrayExpression
      if (!depsArg) {
        // FIXME: handle me
        return
      }

      const classNode = getClassNode(context)
      if (!classNode) {
        // FIXME: handle me
        return
      }
      if (!declaredDependencies.has(classNode)) {
        declaredDependencies.set(classNode, new Set())
      }

      for (const element of depsArg.elements) {
        if (isStringLiteral(element)) {
          declaredDependencies.get(classNode)!.add(element.value)
        } else {
          console.log('non literal dependency!')
        }
      }
    },

    [contextArgSelector](node: FunctionExpression) {
      visitExecuteMethod(node, context, contextArgName, consumedDependencies)
    },

    [contextArgArrowSelector](node: ArrowFunctionExpression) {
      visitExecuteMethod(node, context, contextArgName, consumedDependencies)
    },

    [contextUseSelector](node: MemberExpression) {
      visitSimpleDepConsume(node, context, contextArgName, consumedDependencies)
    },

    [contextUseArrowSelector](node: MemberExpression) {
      visitSimpleDepConsume(node, context, contextArgName, consumedDependencies)
    },

    [contextSpreadSelector](node: VariableDeclarator) {
      visitSpreadContext(node, context, contextArgName, consumedDependencies)
    },

    [contextSpreadArrowSelector](node: VariableDeclarator) {
      visitSpreadContext(node, context, contextArgName, consumedDependencies)
    },

    [classExitSelector](node: ClassDeclaration) {
      const declared = declaredDependencies.get(node)
      const consumed = consumedDependencies.get(node)
      if (!consumed || !declared) {
        return
      }

      for (const [key, node] of Array.from(consumed.entries())) {
        if (declared.has(key)) {
          continue
        }

        context.report({
          node,
          message: `"${key}" isn't listed in task dependencies.`,
        })
      }
    },
  }
}

/**
 * TODO: add rule metadata
 * @see {@link https://eslint.org/docs/developer-guide/working-with-rules}
 */
export const taskRule = { create }

interface StringLiteral extends SimpleLiteral {
  value: string
}

function isStringLiteral(value: Expression | SpreadElement | null): value is StringLiteral {
  return value?.type === 'Literal' && typeof value?.value === 'string'
}

function visitSpreadContext(
  node: VariableDeclarator,
  context: Rule.RuleContext,
  contextArgName: WeakMap<ESTree.Node, string>,
  consumedDependencies: WeakMap<ESTree.Node, Map<string, ESTree.Node>>,
) {
  const contextMeta = getContextMeta(context, contextArgName, consumedDependencies)
  if (!contextMeta) {
    // FIXME: handle me
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

  setConsumedFromSpread(consumed, leftHand)
}

function visitSimpleDepConsume(
  node: MemberExpression,
  context: Rule.RuleContext,
  contextArgName: WeakMap<ESTree.Node, string>,
  consumedDependencies: WeakMap<ESTree.Node, Map<string, ESTree.Node>>,
) {
  const obj = node.object
  if (obj.type !== 'Identifier') {
    return
  }

  const contextMeta = getContextMeta(context, contextArgName, consumedDependencies)
  if (!contextMeta) {
    // FIXME: handle me
    return
  }

  const { argName, consumed } = contextMeta
  if (obj.name !== argName) {
    return
  }

  const prop = node.property
  if (prop.type !== 'Identifier') {
    // FIXME: handle me
    return
  }

  consumed.set(prop.name, node)
}

function visitExecuteMethod(
  node: ArrowFunctionExpression | FunctionExpression,
  context: Rule.RuleContext,
  contextArgName: WeakMap<ESTree.Node, string>,
  consumedDependencies: WeakMap<ESTree.Node, Map<string, ESTree.Node>>,
) {
  const contextMeta = getContextMeta(context, contextArgName, consumedDependencies)
  if (!contextMeta) {
    // FIXME: handle me
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
      setConsumedFromSpread(consumed, contextArg)
      break
    }
  }
}

function setConsumedFromSpread(
  consumedDependencies: Map<string, ESTree.Node>,
  contextSpread: ESTree.ObjectPattern,
) {
  for (const prop of contextSpread.properties) {
    /**
     * TODO: handle rest property somehow
     */
    if (prop.type === 'Property') {
      if (prop.key.type === 'Identifier') {
        if (prop.computed) {
          /**
           * TODO: report an error, we don't want to support such complex options here
           * @example
           * const field = 'foo'
           * const { [field]: testField } = context;
           */
          continue
        }

        consumedDependencies.set(prop.key.name, prop)
      } else if (prop.key.type === 'Literal') {
        const value = prop.key.value?.toString()
        if (value) {
          consumedDependencies.set(value, prop)
        }
      }
    }
  }
}

function getContextMeta(
  context: Rule.RuleContext,
  contextArgName: WeakMap<ESTree.Node, string>,
  consumedDependencies: WeakMap<ESTree.Node, Map<string, ESTree.Node>>,
) {
  const classNode = getClassNode(context)
  if (!classNode) {
    // FIXME: handle me
    return
  }

  const argName = contextArgName.get(classNode)
  const setArgName = (value: string) => contextArgName.set(classNode, value)

  if (!consumedDependencies.has(classNode)) {
    consumedDependencies.set(classNode, new Map())
  }

  const consumed = consumedDependencies.get(classNode)!
  return { consumed, argName, setArgName }
}

function getClassNode(context: Rule.RuleContext) {
  const ancestors = context.getAncestors()
  for (let i = ancestors.length - 1; i > 0; i--) {
    const node = ancestors[i]

    if (node.type === 'ClassDeclaration') {
      return node
    }
  }
}
