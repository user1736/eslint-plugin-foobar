const invalid1 = `
class MyTask extends Task<any> {
  constructor() {
    super('MyTask', []);
  }
  
  execute(context: IContext) {
    console.log(context['foo']);
  }
}
`

const invalid2 = `
class MyTask extends Task<any> {
  constructor() {
    super('MyTask', []);
  }
  
  execute(context: IContext) {
    console.log(context[1]);
  }
}
`

const invalid3 = `
class MyTask extends Task<any> {
  constructor() {
    super('MyTask', []);
  }
  
  execute(context: IContext) {
    const prop = 'foo';
    console.log(context[prop]);
  }
}
`

export const cases = {
  valid: [],
  invalid: [
    {
      code: invalid1,
      errors: ['computed properties disallowed on "context".'],
    },
    {
      code: invalid2,
      errors: ['computed properties disallowed on "context".'],
    },
    {
      code: invalid3,
      errors: ['computed properties disallowed on "context".'],
    },
  ],
}
