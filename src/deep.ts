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

  // # Boxed primitives (Number, String, Boolean, BigInt, Symbol objects)
  if (o instanceof Number || o instanceof String || o instanceof Boolean) {
    return Object(o.valueOf());
  }

  if (typeof BigInt !== 'undefined' && o instanceof Object && o.constructor === BigInt) {
    return BigInt(o.toString());
  }

  // # Common types
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

  // #  Values cannot be copied
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

  if (o instanceof Promise) {
    common.warn('Promise cannot be cloned, returning the original Promise');
    return o;
  }

  if (o instanceof SharedArrayBuffer) {
    // SharedArrayBuffer cannot be cloned safely, return the same reference
    common.warn('SharedArrayBuffer cannot be cloned, returning the same reference');
    return o;
  }

  // # Typed arrays and DataView
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

  // # Node.js Buffer (if available)
  if (typeof Buffer !== 'undefined' && o instanceof Buffer) {
    return Buffer.from(o);
  }

  // # Copy everything else
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

type ReachResult = {
  /**
   * The furthest reachable value in the object at the given property path.
   */
  value: any;

  /**
   * The index (of the parameter `propertyKeys`) of the last successfully reached property.
   */
  index: number;
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
   */
  static disableWarning() {
    common.setShowWarn(false);
  }

  /**
   * Enables warning messages for ReflectDeep operations.
   */
  static enableWarning() {
    common.setShowWarn(true);
  }

  /**
   * Checks if a nested property exists at the given path.
   * @param target - Target object to check.
   * @param propertyKeys - Property path to check.
   * @returns `true` if the property exists, `false` otherwise.
   * @throws If target is not an object or propertyKeys is invalid.
   * @example
   * const obj = { a: { b: { c: 'hello' } } };
   * ReflectDeep.has(obj, ['a', 'b', 'c']); // true
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
   * Traverses a property path and returns the furthest reachable value with its index.
   * @param target - Target object to traverse.
   * @param propertyKeys - Property path to traverse.
   * @param receiver - The `this` value for getter calls.
   * @returns Object with `value` (furthest reachable value) and `index` (position reached).
   * @throws If target is not an object or propertyKeys is invalid.
   * @example
   * const obj = { a: { b: { c: 'hello' } } };
   * ReflectDeep.reach(obj, ['a', 'b', 'c']); // { value: 'hello', index: 2 }
   * ReflectDeep.reach(obj, ['a', 'b', 'd']); // { value: { c: 'hello' }, index: 1 }
   * ReflectDeep.reach(obj, ['a', 'x']);     // { value: { b: { c: 'hello' } }, index: 0 }
   * ReflectDeep.reach(obj, ['d', 'x']);     // { value:  { a: { b: { c: 'hello' } } }, index: -1 }
   */
  static reach(target: object, propertyKeys: PropertyKey[], receiver?: any): ReachResult {
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
   * Gets the value of a nested property.
   * @param target - Target object.
   * @param propertyKeys - Property path.
   * @param receiver - The `this` value for getter calls.
   * @returns The property value, or `undefined` if not found.
   * @throws If target is not an object or propertyKeys is invalid.
   * @example
   * const obj = { a: { b: { c: 'hello' } } };
   * ReflectDeep.get(obj, ['a', 'b', 'c']); // 'hello'
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
   * Sets a nested property value, creating intermediate objects as needed.
   * @param target - Target object.
   * @param propertyKeys - Property path.
   * @param value - Value to set.
   * @param receiver - The `this` value for setter calls.
   * @returns `true` if successful, `false` otherwise.
   * @throws If target is not an object or propertyKeys is invalid.
   * @example
   * const obj = { };
   * ReflectDeep.set(obj, ['a', 'b', 'c'], 'hello'); // Creates nested structure
   * obj.a.b.c; // 'hello'
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
   * Creates a deep clone of an object, handling circular references and various JS types.
   *
   * ! Will not check depth of the object, so be careful with very deep objects.
   * @param obj - Object to clone.
   * @returns A deep clone of the object.
   * @example
   * const obj = { a: { b: [1, 2, { c: 3 }] } };
   * const cloned = ReflectDeep.clone(obj);
   * cloned.a.b[2].c = 4; // obj.a.b[2].c is still 3
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
