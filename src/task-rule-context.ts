import { Rule } from 'eslint'
import { ClassDeclaration, Node } from 'estree'

interface TaskInfo {
  consumed: Map<string, Node>
  declared: Map<string, Node>
  contextArgName?: string
}

export class TaskRuleContext {
  private readonly state = new WeakMap<ClassDeclaration, TaskInfo>()
  private readonly context: Rule.RuleContext

  constructor(context: Rule.RuleContext) {
    this.context = context
  }

  public report(descriptor: Rule.ReportDescriptor) {
    this.context.report(descriptor)
  }

  public getMeta(parent?: ClassDeclaration) {
    const classNode = parent ?? this.getClassNode()
    if (!classNode) {
      // FIXME: handle me
      return
    }

    if (!this.state.has(classNode)) {
      this.state.set(classNode, { consumed: new Map(), declared: new Map() })
    }

    const state = this.state.get(classNode)!
    const setArgName = (value: string) => (state.contextArgName = value)

    return {
      declared: state.declared,
      consumed: state.consumed,
      argName: state.contextArgName,
      setArgName,
    }
  }

  private getClassNode() {
    const ancestors = this.context.getAncestors()
    for (let i = ancestors.length - 1; i > 0; i--) {
      const node = ancestors[i]

      if (node.type === 'ClassDeclaration') {
        return node
      }
    }
  }
}
