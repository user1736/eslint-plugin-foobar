const validSimple = `
class MyTask extends Task<any> {
  constructor() {
    super('MyTask', ['foo', 'bar']);
  }
  
  execute(context: IContext) {
    console.log(context.foo);
    console.log(context.bar);
  }
}
`

const validWithAssignment = `
class MyTask extends Task<any> {
  constructor() {
    super('MyTask', []);
  }
  
  execute(context: IContext) {
    context.foo = 'bar'
  }
}
`

const validInvertedMethodOrder = `
class MyTask extends Task<any> {
  execute(context: IContext) {
    console.log(context.foo);
  }
  
  constructor() {
    super('MyTask', ['foo']);
  }
}
`

const validMultiClass = `
class MyTask extends Task<any> {
  constructor() {
    super('MyTask', ['foo']);
  }

  execute(context: IContext) {
    console.log(context.foo);
  }
}

class MyOtherTask extends Task<any> {
  constructor() {
    super('MyOtherTask', ['baz']);
  }
  
  execute(context: IContext) {
    console.log(context.baz);
  }
}
`

const validArrow = `
class MyTask extends Task<any> {
  constructor() {
    super('MyTask', ['foo']);
  }
  
  execute = (context: IContext) => {
    console.log(context.foo);
  }
}
`

const invalidSimple = `
class MyTask extends Task<any> {
  constructor() {
    super('MyTask', []);
  }
  
  execute(context: IContext) {
    console.log(context.baz);
  }
}
`

const invalidWithAssignment = `
class MyTask extends Task<any> {
  constructor() {
    super('MyTask', []);
  }
  
  execute(context: IContext) {
    context.foo = new FooService(context.bar)
  }
}
`

const invalidMultiClass = `
class MyTask extends Task<any> {
  constructor() {
    super('MyTask', ['foo']);
  }
  
  execute(context: IContext) {
    console.log(context.foo);
    console.log(context.baz);
  }
}

class MyOtherTask extends Task<any> {
  constructor() {
    super('MyOtherTask', []);
  }
  
  execute(context: IContext) {
    console.log(context.foo);
  }
}
`

const invalidArrow = `
class MyTask extends Task<any> {
  constructor() {
    super('MyTask', []);
  }
  
  execute = (context: IContext) => {
    console.log(context.bar);
  }
}
`

const invalidDeps1 = `
const externalDeps = ['foo'];

class MyTask extends Task<any> {
  constructor() {
    super('MyOtherTask', externalDeps);
  }
  
  execute(context: IContext) {
    console.log(context.foo);
  }
}
`

const invalidDeps2 = `
const externalDep = 'bar';

class MyTask extends Task<any> {
  constructor() {
    super('MyOtherTask', ['foo', externalDep]);
  }
  
  execute(context: IContext) {
    console.log(context.foo);
    console.log(context.bar)
  }
}
`

export const cases = {
  valid: [ validSimple, validWithAssignment, validInvertedMethodOrder, validMultiClass, validArrow ],
  invalid: [
    {
      code: invalidSimple,
      errors: [ '"baz" isn\'t listed in task dependencies.' ],
    },
    {
      code: invalidWithAssignment,
      errors: [ '"bar" isn\'t listed in task dependencies.' ],
    },
    {
      code: invalidMultiClass,
      errors: [
        '"baz" isn\'t listed in task dependencies.',
        '"foo" isn\'t listed in task dependencies.',
      ],
    },
    {
      code: invalidArrow,
      errors: [ '"bar" isn\'t listed in task dependencies.' ],
    },
    {
      code: invalidDeps1,
      errors: [
        'dependencies must be defined as a literal.',
        '"foo" isn\'t listed in task dependencies.',
      ],
    },
    {
      code: invalidDeps2,
      errors: [
        'dependencies must be defined as a literal.',
        '"foo" isn\'t listed in task dependencies.',
        '"bar" isn\'t listed in task dependencies.',
      ],
    },
  ],
}
