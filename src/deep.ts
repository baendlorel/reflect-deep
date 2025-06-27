import { common, isPrimitive, expectArgs } from './common';

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

const deepClone = (cache: WeakMap<any, any>, o: any): any => {
  if (typeof o !== 'object' || o === null) {
    return o;
  }

  if (cache.has(o)) {
    return cache.get(o);
  }

  // Handle boxed primitives (Number, String, Boolean, BigInt, Symbol objects)
  if (o instanceof Number || o instanceof String || o instanceof Boolean) {
    return Object(o.valueOf());
  }

  if (typeof BigInt !== 'undefined' && o instanceof Object && o.constructor === BigInt) {
    return BigInt(o.toString());
  }

  if (Array.isArray(o)) {
    const result: any[] = [];
    cache.set(o, result);
    for (let i = 0; i < o.length; i++) {
      result[i] = deepClone(cache, o[i]);
    }
    return result;
  }

  if (o instanceof Map) {
    const result = new Map();
    cache.set(o, result);
    o.forEach((v, k) => {
      result.set(deepClone(cache, k), deepClone(cache, v));
    });
    return result;
  }

  if (o instanceof Set) {
    const result = new Set();
    cache.set(o, result);
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

  // Handle typed arrays and DataView
  if (ArrayBuffer.isView(o)) {
    const TypedArrayConstructor = (o as any).constructor;
    if (o instanceof DataView) {
      // DataView needs special handling - copy the underlying buffer and recreate
      const clonedBuffer = o.buffer.slice(o.byteOffset, o.byteOffset + o.byteLength);
      return new DataView(clonedBuffer);
    } else {
      // TypedArrays can be created from the original array
      return new TypedArrayConstructor(o);
    }
  }

  if (o instanceof ArrayBuffer) {
    return o.slice(0);
  }

  if (o instanceof SharedArrayBuffer) {
    // SharedArrayBuffer cannot be cloned safely, return the same reference
    common.warn('SharedArrayBuffer cannot be cloned, returning the same reference');
    return o;
  }

  // Handle Node.js Buffer (if available)
  if (typeof Buffer !== 'undefined' && o instanceof Buffer) {
    return Buffer.from(o);
  }

  if (o instanceof WeakMap) {
    common.warn('WeakMap cannot be cloned, returning the origin one');
    return o;
  }

  if (o instanceof WeakSet) {
    common.warn('WeakSet cannot be cloned, returning the origin one');
    return o;
  }

  if (o instanceof WeakRef) {
    return new WeakRef(deepClone(cache, o.deref()));
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

    const value = Reflect.get(o, keys[i]);
    Reflect.set(result, keys[i], deepClone(cache, value));
  }
  return result;
};

export class ReflectDeep {
  constructor() {
    throw new TypeError('ReflectDeep is not a constructor.');
  }

  /**
   * Gets a deep copy of the current configuration object.
   * @returns A deep clone of the configuration object.
   */
  // static getConfig() {
  //   return deepClone(new WeakMap(), config);
  // }

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
   * @param target - The target object to check.
   * @param propertyKeys - An array of property keys representing the path to the nested property.
   * @returns `true` if the nested property exists, `false` otherwise.
   * @throws If target is not an object, propertyKeys is not an array, or contains invalid keys.
   * @example
   * const obj = { a: { b: { c: 1 } } };
   * ReflectDeep.has(obj, ['a', 'b', 'c']); // true
   * ReflectDeep.has(obj, ['a', 'b', 'd']); // false
   */
  static has(target: object, propertyKeys: PropertyKey[]): boolean {
    expectArgs(ReflectDeep.has.name, target, propertyKeys);

    let current = target;
    for (let i = 0; i < propertyKeys.length - 1; i++) {
      if (!Reflect.has(current, propertyKeys[i])) {
        return false;
      }

      current = Reflect.get(current, propertyKeys[i]);
      if (isPrimitive(current)) {
        return false;
      }
    }
    return Reflect.has(current, propertyKeys[propertyKeys.length - 1]);
  }

  /**
   * Reaches as far as possible along the given property keys path and returns the value at the furthest reachable point.
   * Unlike `get`, this method does not require the full path to exist - it returns the value at the last accessible property.
   * @param target - The target object to traverse.
   * @param propertyKeys - An array of property keys representing the path to traverse.
   * @param receiver - The value of `this` provided for the call to the getter if a getter is encountered.
   * @returns The value at the furthest reachable point, or `undefined` if the first key doesn't exist.
   * @throws If target is not an object, propertyKeys is not an array, or contains invalid keys.
   * @example
   * const obj = { a: { b: { c: 'hello' } } };
   * ReflectDeep.reach(obj, ['a', 'b', 'c']); // 'hello' (full path exists)
   * ReflectDeep.reach(obj, ['a', 'b', 'd']); // { c: 'hello' } (reaches 'a.b', then stops)
   * ReflectDeep.reach(obj, ['a', 'x', 'y']); // { b: { c: 'hello' } } (reaches 'a', then stops)
   * ReflectDeep.reach(obj, ['z']); // undefined (cannot reach 'z')
   */
  static reach(
    target: object,
    propertyKeys: PropertyKey[],
    receiver?: any
  ): { value: any; index: number } {
    expectArgs(ReflectDeep.reach.name, target, propertyKeys);

    let current = target;
    for (let i = 0; i < propertyKeys.length; i++) {
      if (!Reflect.has(current, propertyKeys[i])) {
        return { value: current, index: i - 1 };
      }

      if (i === propertyKeys.length - 1) {
        return { value: Reflect.get(current, propertyKeys[i], receiver), index: i };
      }

      current = Reflect.get(current, propertyKeys[i]);
      if (isPrimitive(current)) {
        return { value: current, index: i };
      }
    }

    // Should not reach here, but just in case
    common.warn(`Unexpected reach: target${keyChain(propertyKeys)}`);
    return { value: current, index: -1 };
  }

  /**
   * Gets the value of a nested property from the target object.
   * @template T - The expected return type of the nested property.
   * @param target - The target object to get the property from.
   * @param propertyKeys - An array of property keys representing the path to the nested property.
   * @param receiver - The value of `this` provided for the call to the getter if a getter is encountered.
   * @returns The value of the nested property, or `undefined` if the property doesn't exist.
   * @throws If target is not an object, propertyKeys is not an array, or contains invalid keys.
   * @example
   * const obj = { a: { b: { c: 'hello' } } };
   * ReflectDeep.get<string>(obj, ['a', 'b', 'c']); // 'hello'
   * ReflectDeep.get(obj, ['a', 'b', 'd']); // undefined
   */
  static get<T = any>(
    target: any,
    propertyKeys: PropertyKey[],
    receiver?: any
  ): T | undefined {
    expectArgs(ReflectDeep.get.name, target, propertyKeys);

    let current = target;
    for (let i = 0; i < propertyKeys.length - 1; i++) {
      if (!Reflect.has(current, propertyKeys[i])) {
        return undefined;
      }

      current = Reflect.get(current, propertyKeys[i]);
      if (isPrimitive(current)) {
        return undefined;
      }
    }

    return Reflect.get(current, propertyKeys[propertyKeys.length - 1], receiver) as
      | T
      | undefined;
  }

  /**
   * Sets the value of a nested property in the target object.
   * Creates intermediate objects as needed if they don't exist.
   * @template T - The type of the value being set.
   * @param target - The target object to set the property on.
   * @param propertyKeys - An array of property keys representing the path to the nested property.
   * @param value - The value to set.
   * @param receiver - The value of `this` provided for the call to the setter if a setter is encountered.
   * @returns `true` if the property was set successfully, `false` otherwise.
   * @throws If target is not an object, propertyKeys is not an array, or contains invalid keys.
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
    expectArgs(ReflectDeep.set.name, target, propertyKeys);

    let current = target;
    for (let i = 0; i < propertyKeys.length - 1; i++) {
      if (!Reflect.has(current, propertyKeys[i])) {
        const result = Reflect.set(current, propertyKeys[i], {});
        if (!result) {
          const key = keyChain(propertyKeys.slice(0, i + 1));
          common.warn(`Fail to set target${key}.`);
          return false;
        }
      }

      // Check if current can be set
      current = Reflect.get(current, propertyKeys[i]);
      if (isPrimitive(current)) {
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
   * @param obj - The object to clone.
   * @returns A deep clone of the input object.
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
  static clone<T = any>(obj: T): T {
    return deepClone(new WeakMap(), obj);
  }
}
