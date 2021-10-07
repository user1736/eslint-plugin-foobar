const validSimple = `
class MyTask extends Task<any> {
  constructor() {
    super('MyTask', []);
  }
  
  execute(context: IContext) {
    console.log(context);
  }
}
`

const validArrow = `
class MyTask extends Task<any> {
  constructor() {
    super('MyTask', []);
  }
  
  execute = (context: IContext) => {
    console.log(context);
  }
}
`

const invalidSimple = `
class MyTask extends Task<any> {
  constructor() {
    super('MyTask', []);
  }
  
  execute(context: IContext) {
    doSomethingCrazy(context);
  }
}
`

const invalidArrow = `
class MyTask extends Task<any> {
  constructor() {
    super('MyTask', []);
  }
  
  execute = (context: IContext) => {
    doSomethingCrazy(context);
  }
}
`

export const cases = {
  valid: [validSimple, validArrow],
  invalid: [
    {
      code: invalidSimple,
      errors: ['leaking "context" is prohibited.'],
    },
    {
      code: invalidArrow,
      errors: ['leaking "context" is prohibited.'],
    },
  ],
}
