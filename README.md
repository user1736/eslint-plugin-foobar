# Sample ESLint plugin

Boilerplate repo with a sample eslint rule and tests.

## TaskRule

Given that there's a base class `Task`

```typescript
abstract class Task<TContext extends IContext,
  TDependency extends keyof TContext = keyof TContext> implements ITask {
  public id: string;
  public dependencies: TDependency[];

  protected constructor(
    id: string,
    dependencies: TDependency[] = []
  ) {
    this.id = id;
    this.dependencies = dependencies;
  }

  abstract execute(context: TContext): Promise<void>;
}
```

enforces following conventions for all its descendants:

- dependency list should be defined as simple array literal;
- dependency list should contain all used dependencies;
- dependency list should not contain unused dependencies;
- context object should not leave execute method i.e., not leak;

## Examples

```typescript
// all conventions are met
class MyTask extends Task<IContext> {
  constructor() {
    super('MyTask', [ 'foo', 'bar' ]);
  }

  execute(context: IContext) {
    console.log(context.foo);
    console.log(context.bar);
  }
}
```

```typescript
// missing dependency "baz" will be reported
class MyTask extends Task<IContext> {
  constructor() {
    super('MyTask', []);
  }

  execute(context: IContext) {
    console.log(context.baz);
  }
}
```

```typescript
// redundant dependency "bar" will be reported
class MyTask extends Task<IContext> {
  constructor() {
    super('MyTask', [ 'foo', 'bar' ]);
  }

  execute(context: IContext) {
    console.log(context.foo);
  }
}
```

```typescript
// context leak will be reported
class MyTask extends Task<IContext> {
  constructor() {
    super('MyTask');
  }

  execute(context: IContext) {
    doSomeMagic(context);
  }
}
```

## References

[Working with Rules](https://eslint.org/docs/developer-guide/working-with-rules)
