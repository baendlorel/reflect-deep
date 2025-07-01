() => {
  /**
   * @namespace YourLib
   * @category Global
   */
  const YourLib = '';

  // 演示为什么类方法无法通过 ownKeys 获取

  class MyClass {
    constructor() {
      this.instanceProp = 'instance value';
    }

    method1() {
      return 'method1';
    }

    method2() {
      return 'method2';
    }
  }

  const instance = new MyClass();

  console.log('=== 实例自身的属性 ===');
  console.log('Object.keys(instance):', Object.keys(instance));
  console.log('Object.getOwnPropertyNames(instance):', Object.getOwnPropertyNames(instance));
  console.log('Reflect.ownKeys(instance):', Reflect.ownKeys(instance));

  console.log('\n=== 原型上的属性 ===');
  console.log('Object.keys(MyClass.prototype):', Object.keys(MyClass.prototype));
  console.log(
    'Object.getOwnPropertyNames(MyClass.prototype):',
    Object.getOwnPropertyNames(MyClass.prototype)
  );
  console.log('Reflect.ownKeys(MyClass.prototype):', Reflect.ownKeys(MyClass.prototype));

  console.log('\n=== 检查方法的属性描述符 ===');
  const descriptor = Object.getOwnPropertyDescriptor(MyClass.prototype, 'method1');
  console.log('method1 descriptor:', descriptor);

  console.log('\n=== 获取所有方法（包括继承的） ===');
  function getAllMethods(obj) {
    const methods = new Set();
    let current = obj;

    while (current && current !== Object.prototype) {
      Object.getOwnPropertyNames(current).forEach((name) => {
        if (name !== 'constructor' && typeof obj[name] === 'function') {
          methods.add(name);
        }
      });
      current = Object.getPrototypeOf(current);
    }

    return Array.from(methods);
  }

  console.log('getAllMethods(instance):', getAllMethods(instance));

  // 另一种方法：直接获取原型链上的方法
  console.log('\n=== 直接从原型获取方法 ===');
  const prototypeMethods = Object.getOwnPropertyNames(MyClass.prototype).filter(
    (name) => name !== 'constructor' && typeof MyClass.prototype[name] === 'function'
  );
  console.log('Prototype methods:', prototypeMethods);
};

{
  class ReflectDeepError extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = 'ReflectDeepError';
    }
  }
  const e = new ReflectDeepError('This is a custom error message');
  console.log(e.name, ':', e.message);
  throw e;
}
