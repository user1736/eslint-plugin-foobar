const validSpreadSimple = `
class MyTask extends Task<any> {
  constructor() {
    super('MyTask', ['foo', 'bar']);
  }

  execute({foo, bar}: IContext) {
    console.log(foo);
    console.log(bar);
  }
}
`

const validSpreadVariable = `
class MyTask extends Task<any> {
  constructor() {
    super('MyTask', ['foo', 'bar']);
  }

  execute(context: IContext) {
    const {foo, bar} = context;
    console.log(foo);
    console.log(bar);
  }
}
`

const validSpreadRename = `
class MyTask extends Task<any> {
  constructor() {
    super('MyTask', ['foo']);
  }

  execute(context: IContext) {
    const {foo: bar} = context;
    console.log(bar);
  }
}
`

const validArrow = `
class MyTask extends Task<any> {
  constructor() {
    super('MyTask', ['foo']);
  }

  execute = (context: IContext) => {
    const {foo} = context;
    console.log(foo);
  }
}
`

const invalidSpreadSimple = `
class MyTask extends Task<any> {
  constructor() {
    super('MyTask', ['foo']);
  }

  execute({foo, baz}: IContext) {
    console.log(foo);
    console.log(baz);
  }
}
`

const invalidSpreadVariable = `
class MyTask extends Task<any> {
  constructor() {
    super('MyTask', ['foo']);
  }

  execute(context: IContext) {
    const {foo, baz} = context;
    console.log(foo);
    console.log(baz);
  }
}
`

const invalidSpreadComputed = `
class MyTask extends Task<any> {
  constructor() {
    super('MyTask', ['foo']);
  }

  execute(context: IContext) {
    const prop = 'foo'
    const {[prop]: foo} = context;
  }
}
`

const invalidArrow = `
class MyTask extends Task<any> {
  constructor() {
    super('MyTask', []);
  }

  execute = (context: IContext) => {
    const {bar} = context;
    console.log(bar);
  }
}
`

export const cases = {
  valid: [validSpreadSimple, validSpreadVariable, validSpreadRename, validArrow],
  invalid: [
    {
      code: invalidSpreadSimple,
      errors: ['"baz" isn\'t listed in task dependencies.'],
    },
    {
      code: invalidSpreadVariable,
      errors: ['"baz" isn\'t listed in task dependencies.'],
    },
    {
      code: invalidArrow,
      errors: ['"bar" isn\'t listed in task dependencies.'],
    },
    {
      code: invalidSpreadComputed,
      errors: ['"foo" is redundant.', 'computed properties are disallowed for "context".'],
    },
  ],
}
