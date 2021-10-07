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

  execute(context) {
    console.log(context.foo);
  }
}

class MyOtherTask extends Task<any> {
  constructor() {
    super('MyOtherTask', ['baz']);
  }
  
  execute(context) {
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
    super('MyTask', ['foo', 'bar']);
  }
  
  execute(context: IContext) {
    console.log(context.baz);
  }
}
`

const invalidMultiClass = `
class MyTask extends Task<any> {
  constructor() {
    super('MyTask', ['foo', 'bar']);
  }
  
  execute(context) {
    console.log(context.foo);
    console.log(context.baz);
  }
}

class MyOtherTask extends Task<any> {
  constructor() {
    super('MyOtherTask', ['baz']);
  }
  
  execute(context) {
    console.log(context.foo);
  }
}
`

const invalidArrow = `
class MyTask extends Task<any> {
  constructor() {
    super('MyTask', ['foo']);
  }
  
  execute = (context: IContext) => {
    console.log(context.bar);
  }
}
`

export const cases = {
  valid: [validSimple, validInvertedMethodOrder, validMultiClass, validArrow],
  invalid: [
    {
      code: invalidSimple,
      errors: ['"baz" isn\'t listed in task dependencies.'],
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
      errors: ['"bar" isn\'t listed in task dependencies.'],
    },
  ],
}
