import { config, common } from './common';

type FnName = 'has' | 'get' | 'set' | 'clone' | 'setDeepSetOptions';

const typeErr = (fnName: FnName, msg: string) => {
  return new TypeError(`Deep.${fnName} ${msg}`);
};

const expectArgs = (f: FnName, o: any, keys: PropertyKey[]) => {
  if (typeof o !== 'object' || o === null) {
    throw typeErr(f, `called with non-object target: ${o}`);
  }
  if (!Array.isArray(keys)) {
    throw typeErr(f, `called with non-array keys`);
  }
  if (keys.length === 0) {
    throw typeErr(f, `called with empty keys array`);
  }
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (typeof k !== 'string' && typeof k !== 'symbol' && typeof k !== 'number') {
      throw typeErr(f, `called with invalid key: ${String(k)}`);
    }
  }
};

const keyChain = (keys: PropertyKey[]) =>
  keys
    .map((k) => {
      switch (typeof k) {
        case 'string':
          return `['${k}']`;
        case 'symbol':
          return `[${String(k)}]`;
        default:
          return `[${k}]`;
      }
    })
    .join('');

const deepClone = (cache: WeakMap<any, any>, o: any | any[]): any | any[] => {
  if (typeof o !== 'object' || o === null) {
    return o;
  }

  // Would be good if cached
  if (cache.has(o)) {
    return cache.get(o);
  }

  if (Array.isArray(o)) {
    return Array.prototype.map.call(o, (v) => deepClone(cache, v));
  }

  if (o instanceof Map) {
    const result = new Map();
    o.forEach((v, k) => {
      result.set(deepClone(cache, k), deepClone(cache, v));
    });
    return result;
  }

  if (o instanceof Set) {
    const result = new Set();
    o.forEach((v) => {
      result.add(deepClone(cache, v));
    });
    return result;
  }

  if (o instanceof Date) {
    return new Date(o);
  }

  if (o instanceof RegExp) {
    return new RegExp(o.source, o.flags);
  }

  if (o instanceof Error) {
    const error = new Error(o.message);
    error.name = o.name;
    error.stack = o.stack;
    return error;
  }

  if (o instanceof WeakMap) {
    common.warn('WeakMap cannot be cloned, returning an empty one');
    return new WeakMap();
  }

  if (o instanceof WeakSet) {
    common.warn('WeakSet cannot be cloned, returning an empty one');
    return new WeakSet();
  }

  if (o instanceof WeakRef) {
    return new WeakRef(o.deref());
  }

  // Copy everything else
  const result = Object.create(o.prototype ?? null);
  cache.set(o, result);
  const keys = Reflect.ownKeys(o);
  for (let i = 0; i < keys.length; i++) {
    // some prop may be carried over from prototype chain, so we need to check if it exists on the object
    if (!Reflect.has(o, keys[i])) {
      continue;
    }
    Reflect.set(result, keys[i], deepClone(cache, Reflect.get(o, keys[i])));
  }
  return result;
};

export class ReflectDeep {
  constructor() {
    throw new TypeError('ReflectDeep is not a constructor.');
  }

  /**
   * Gets a deep copy of the current configuration object.
   * @returns {object} A deep clone of the configuration object.
   */
  static getConfig() {
    return deepClone(new WeakMap(), config);
  }

  /**
   * Disables warning messages for ReflectDeep operations.
   * When disabled, warning messages will not be logged to the console.
   */
  static disableWarning() {
    common.setShowWarn(false);
  }

  /**
   * Enables warning messages for ReflectDeep operations.
   * When enabled, warning messages will be logged to the console.
   */
  static enableWarning() {
    common.setShowWarn(true);
  }

  /**
   * Checks if a nested property exists in the target object.
   * Equivalent to checking `propertyKeys[0] in target && propertyKeys[1] in target[propertyKeys[0]]...`
   * @param {object} target - The target object to check.
   * @param {PropertyKey[]} propertyKeys - An array of property keys representing the path to the nested property.
   * @returns {boolean} `true` if the nested property exists, `false` otherwise.
   * @throws {TypeError} If target is not an object, propertyKeys is not an array, or contains invalid keys.
   * @example
   * const obj = { a: { b: { c: 1 } } };
   * ReflectDeep.has(obj, ['a', 'b', 'c']); // true
   * ReflectDeep.has(obj, ['a', 'b', 'd']); // false
   */
  static has(target: object, propertyKeys: PropertyKey[]): boolean {
    expectArgs('has', target, propertyKeys);

    let current = target;
    for (let i = 0; i < propertyKeys.length; i++) {
      if (!Reflect.has(current, propertyKeys[i])) {
        return false;
      }
      current = Reflect.get(current, propertyKeys[i]) as any;
    }
    return true;
  }

  /**
   * Gets the value of a nested property from the target object.
   * @template T - The expected return type of the nested property.
   * @param {any} target - The target object to get the property from.
   * @param {PropertyKey[]} propertyKeys - An array of property keys representing the path to the nested property.
   * @param {any} [reciever] - The value of `this` provided for the call to the getter if a getter is encountered.
   * @returns {T | undefined} The value of the nested property, or `undefined` if the property doesn't exist.
   * @throws {TypeError} If target is not an object, propertyKeys is not an array, or contains invalid keys.
   * @example
   * const obj = { a: { b: { c: 'hello' } } };
   * ReflectDeep.get<string>(obj, ['a', 'b', 'c']); // 'hello'
   * ReflectDeep.get(obj, ['a', 'b', 'd']); // undefined
   */
  static get<T = any>(
    target: any,
    propertyKeys: PropertyKey[],
    reciever?: any
  ): T | undefined {
    expectArgs('has', target, propertyKeys);

    let current = target;
    for (let i = 0; i <= propertyKeys.length - 2; i++) {
      if (!Reflect.has(current, propertyKeys[i])) {
        return undefined;
      }
      current = Reflect.get(current, propertyKeys[i]) as any;
    }
    return Reflect.get(current, propertyKeys[propertyKeys.length - 1], reciever) as
      | T
      | undefined;
  }

  /**
   * Sets the value of a nested property in the target object.
   * Creates intermediate objects as needed if they don't exist.
   * @template T - The type of the value being set.
   * @param {any} target - The target object to set the property on.
   * @param {PropertyKey[]} propertyKeys - An array of property keys representing the path to the nested property.
   * @param {T} value - The value to set.
   * @param {any} [receiver] - The value of `this` provided for the call to the setter if a setter is encountered.
   * @returns {boolean} `true` if the property was set successfully, `false` otherwise.
   * @throws {TypeError} If target is not an object, propertyKeys is not an array, or contains invalid keys.
   * @example
   * const obj = {};
   * ReflectDeep.set(obj, ['a', 'b', 'c'], 'hello'); // true, obj becomes { a: { b: { c: 'hello' } } }
   * 
   * const readOnlyObj = Object.freeze({ a: {} });
   * ReflectDeep.set(readOnlyObj, ['a', 'b'], 'value'); // false, cannot set on frozen object
   */
  static set<T = any>(
    target: any,
    propertyKeys: PropertyKey[],
    value: T,
    receiver?: any
  ): boolean {
    expectArgs('set', target, propertyKeys);

    let current = target;
    for (let i = 0; i <= propertyKeys.length - 2; i++) {
      if (!Reflect.has(current, propertyKeys[i])) {
        const result = Reflect.set(current, propertyKeys[i], {});
        if (!result) {
          const key = keyChain(propertyKeys.slice(0, i + 1));
          common.warn(`Fail to set target${key}.`);
          return false;
        }
      }

      // But if the current key is not an object, we cannot set a nested value
      current = Reflect.get(current, propertyKeys[i]) as any;
      if (
        (typeof current !== 'object' && typeof current !== 'function') ||
        current === null
      ) {
        const key = keyChain(propertyKeys.slice(0, i + 1));
        common.warn(`Cannot set target${key} because it is not an object.`);
        return false;
      }
    }

    const result = Reflect.set(
      current,
      propertyKeys[propertyKeys.length - 1],
      value,
      receiver
    );
    if (!result) {
      const key = keyChain(propertyKeys);
      common.warn(`Fail to set target${key}.`);
    }
    return result;
  }

  /**
   * Creates a deep clone of the given object.
   * Handles various JavaScript types including primitives, objects, arrays, Maps, Sets, Dates, RegExp, Errors, etc.
   * Uses a WeakMap to handle circular references properly.
   * @template T - The type of the object being cloned.
   * @param {T} obj - The object to clone.
   * @returns {T} A deep clone of the input object.
   * @example
   * const original = { a: { b: [1, 2, { c: 3 }] } };
   * const cloned = ReflectDeep.clone(original);
   * cloned.a.b[2].c = 4; // original.a.b[2].c is still 3
   * 
   * // Handles circular references
   * const circular = { self: null };
   * circular.self = circular;
   * const clonedCircular = ReflectDeep.clone(circular); // Works without infinite recursion
   */
  clone<T = any>(obj: T): T {
    return deepClone(new WeakMap(), obj);
  }
}
