import { isPrimitive, expectTargetAndKeys, expectTarget } from './common';
export namespace ReflectDeep {
  type ReachResult = {
    /**
     * The furthest reachable value in the object at the given property path.
     */
    value: any;

    /**
     * The index (of the parameter `propertyKeys`) of the last successfully reached property.
     */
    index: number;

    /**
     * Whether the path was fully traversed and the final value was successfully reached.
     */
    reached: boolean;
  };

  const NO_RECEIVER = Symbol('no-receiver');

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
        if (i in o) {
          result[i] = deepClone(cache, o[i]);
        }
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
      return o;
    }

    if (o instanceof WeakSet) {
      return o;
    }

    if (o instanceof WeakRef) {
      return new WeakRef(deepClone(cache, o.deref()));
    }

    if (o instanceof Promise) {
      return o;
    }

    if (o instanceof SharedArrayBuffer) {
      // SharedArrayBuffer cannot be cloned safely, return the same reference
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
    const result = Object.create(Reflect.getPrototypeOf(o));
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
  export const has = (target: object, propertyKeys: PropertyKey[]): boolean => {
    expectTargetAndKeys('has', target, propertyKeys);

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
  };

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
  export const get = <T = any>(
    target: any,
    propertyKeys: PropertyKey[],
    receiver: any = NO_RECEIVER
  ): T | undefined => {
    expectTargetAndKeys('get', target, propertyKeys);

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

    const result =
      receiver === NO_RECEIVER
        ? Reflect.get(current, propertyKeys[propertyKeys.length - 1])
        : Reflect.get(current, propertyKeys[propertyKeys.length - 1], receiver);

    return result as T | undefined;
  };

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
  export const set = <T = any>(
    target: any,
    propertyKeys: PropertyKey[],
    value: T,
    receiver: any = NO_RECEIVER
  ): boolean => {
    expectTargetAndKeys('set', target, propertyKeys);

    let current = target;
    for (let i = 0; i < propertyKeys.length - 1; i++) {
      if (!Reflect.has(current, propertyKeys[i])) {
        if (!Reflect.set(current, propertyKeys[i], {})) {
          return false;
        }
      }

      // Check if current can be set
      current = Reflect.get(current, propertyKeys[i]);
      if (isPrimitive(current)) {
        return false;
      }
    }

    return receiver === NO_RECEIVER
      ? Reflect.set(current, propertyKeys[propertyKeys.length - 1], value)
      : Reflect.set(current, propertyKeys[propertyKeys.length - 1], value, receiver);
  };

  /**
   * Traverses a property path and returns the furthest reachable value with its index.
   * @param target - Target object to traverse.
   * @param propertyKeys - Property path to traverse.
   * @param receiver - The `this` value for getter calls.
   * @returns Object with `value` (furthest reachable value), `index` (position reached), and `reached` (whether the full path was traversed).
   * @throws If target is not an object or propertyKeys is invalid.
   * @example
   * const obj = { a: { b: { c: 'hello' } } };
   * ReflectDeep.reach(obj, ['a', 'b', 'c']); // { value: 'hello', index: 2, reached: true }
   * ReflectDeep.reach(obj, ['a', 'b', 'd']); // { value: { c: 'hello' }, index: 1, reached: false }
   * ReflectDeep.reach(obj, ['a', 'x']);     // { value: { b: { c: 'hello' } }, index: 0, reached: false }
   * ReflectDeep.reach(obj, ['d', 'x']);     // { value: { a: { b: { c: 'hello' } } }, index: -1, reached: false }
   */
  export const reach = (
    target: object,
    propertyKeys: PropertyKey[],
    receiver: any = NO_RECEIVER
  ): ReachResult => {
    expectTargetAndKeys('reach', target, propertyKeys);

    let current = target;
    for (let i = 0; i < propertyKeys.length; i++) {
      if (!Reflect.has(current, propertyKeys[i])) {
        return { value: current, index: i - 1, reached: false };
      }

      if (i === propertyKeys.length - 1) {
        const value =
          receiver === NO_RECEIVER
            ? Reflect.get(current, propertyKeys[i])
            : Reflect.get(current, propertyKeys[i], receiver);

        return { value, index: i, reached: true };
      }

      current = Reflect.get(current, propertyKeys[i]);
      if (isPrimitive(current)) {
        return { value: current, index: i, reached: false };
      }
    }

    // Should not reach here, but just in case
    return { value: current, index: -1, reached: false };
  };

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
  export const clone = <T = any>(obj: T): T => {
    return deepClone(new WeakMap(), obj);
  };

  export const keys = <T extends object>(target: T): (string | symbol)[] => {
    expectTarget('keys', target);

    const keys = new Set(Reflect.ownKeys(target));
    let proto = Reflect.getPrototypeOf(target);
    while (true) {
      // * Proto chain will not contain any loop
      if (!proto) {
        return Array.from(keys);
      }
      Reflect.apply(keys.add, keys, Reflect.ownKeys(proto));
      proto = Reflect.getPrototypeOf(proto);
    }
  };

  export const keysWithProto = <T extends object>(target: T): (string | symbol)[] => {
    expectTarget('keys', target);

    const keys = new Set(Reflect.ownKeys(target));
    let proto = Reflect.getPrototypeOf(target);
    while (true) {
      // * Proto chain will not contain any loop
      if (!proto) {
        return Array.from(keys);
      }
      Reflect.apply(keys.add, keys, Reflect.ownKeys(proto));
      proto = Reflect.getPrototypeOf(proto);
    }
  };
}
