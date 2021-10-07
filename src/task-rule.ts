import { create } from './create-visitor'

/**
 * Enforces following conventions for descendants of Task class:
 * - dependency list should be defined as simple array literal;
 * - dependency list should contain all used dependencies;
 * - dependency list should not contain unused dependencies;
 * - context object should not leave execute method (i.e. not leak);
 */
export const taskRule = {
  meta: {
    type: 'problem' as const,
    docs: {
      description: 'enforce Task class conventions',
      category: 'Best Practices',
      recommended: true,
    },
  },
  create,
}
