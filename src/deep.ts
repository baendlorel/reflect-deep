/* eslint-disable @typescript-eslint/no-explicit-any */
import { NAME, isPrimitive, expectTargetAndKeys, expectTarget } from './common';

interface ReachResult {
  /**
   * The furthest reachable value in the object at the given property path.
   */
  value: any;

  /**
   * The index in `propertyKeys` of the last successfully accessed property.
   * - Will be -1 if the first property failed.
   */
  index: number;

  /**
   * Whether the path was fully traversed and the final value was successfully reached.
   */
  reached: boolean;
}

interface GroupedKey {
  /**
   * Keys (includes symbols)
   */
  keys: (string | symbol)[];

  /**
   * Target itself or its prototype.
   */
  object: any;
}

const deepClone = (cache: WeakMap<any, any>, o: any): any => {
  if (typeof o !== 'object' || o === null) {
    return o;
  }

  if (cache.has(o)) {
    return cache.get(o);
  }

  // # Boxed primitives (Number, String, Boolean, BigInt, Symbol objects)
  if (
    o instanceof Number ||
    o instanceof String ||
    o instanceof Boolean ||
    (typeof BigInt !== 'undefined' && o instanceof BigInt)
  ) {
    return Object(o.valueOf());
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

const NOT_GIVEN = Symbol('not-given');

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ReflectDeep {
  constructor() {
    throw TypeError(`${NAME} is not a constructor`);
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
    receiver: any = NOT_GIVEN
  ): T | undefined {
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
      receiver === NOT_GIVEN
        ? Reflect.get(current, propertyKeys[propertyKeys.length - 1])
        : Reflect.get(current, propertyKeys[propertyKeys.length - 1], receiver);

    return result as T | undefined;
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
    receiver: any = NOT_GIVEN
  ): boolean {
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

    return receiver === NOT_GIVEN
      ? Reflect.set(current, propertyKeys[propertyKeys.length - 1], value)
      : Reflect.set(current, propertyKeys[propertyKeys.length - 1], value, receiver);
  }

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
  static reach(
    target: object,
    propertyKeys: PropertyKey[],
    receiver: any = NOT_GIVEN
  ): ReachResult {
    expectTargetAndKeys('reach', target, propertyKeys);

    let current = target;
    for (let i = 0; i < propertyKeys.length; i++) {
      if (!Reflect.has(current, propertyKeys[i])) {
        return { value: current, index: i - 1, reached: false };
      }

      if (i === propertyKeys.length - 1) {
        const value =
          receiver === NOT_GIVEN
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
  }

  /**
   * Creates a deep clone of an object, handling circular references and various JS types.
   *
   * **Circular references are fully suppported**
   *
   * ! Will not check depth of the object, so be careful with very deep objects.
   * @param obj - Object to clone.
   * @returns A deep clone of the object.
   * @example
   * const obj = { a: { b: [1, 2, { c: 3 }] } };
   * const cloned = ReflectDeep.clone(obj);
   * cloned.a.b[2].c = 4; // obj.a.b[2].c is still 3
   */
  static clone<T = any>(obj: T): T {
    return deepClone(new WeakMap(), obj);
  }

  /**
   * Gets all property keys (including symbols) from the target object and its prototype chain.
   * Returns a flattened array of unique keys from all prototype layers.
   * @param target - Target object to extract keys from.
   * @returns Array of all unique property keys from the object and its prototype chain.
   * @throws If target is not an object.
   * @example
   * const obj = { own: 'property', [Symbol('sym')]: 'symbol' };
   * const keys = ReflectDeep.keys(obj);
   * // Returns: ['own', Symbol(sym), 'toString', 'valueOf', ...] (includes prototype keys)
   *
   * // Works with custom prototypes
   * function Parent() {}
   * Parent.prototype.parentProp = 'parent';
   * const child = Object.create(Parent.prototype);
   * child.childProp = 'child';
   * ReflectDeep.keys(child); // ['childProp', 'parentProp', 'toString', ...]
   */
  static keys<T extends object>(target: T): (string | symbol)[] {
    expectTarget('keys', target);

    const keySet = new Set(Reflect.ownKeys(target));
    let proto: object | null = target;
    while (true) {
      proto = Reflect.getPrototypeOf(proto);

      // * Proto chain will not contain any loop
      if (proto) {
        const keys = Reflect.ownKeys(proto);
        for (let i = 0; i < keys.length; i++) {
          keySet.add(keys[i]);
        }
      } else {
        return Array.from(keySet);
      }
    }
  }

  /**
   * Gets property keys grouped by prototype layer, preserving the prototype chain structure.
   * Returns an array where each element represents a layer in the prototype chain with its keys and object reference.
   * @param target - Target object to extract grouped keys from.
   * @returns Array of objects, each containing `keys` and `object` for each prototype layer.
   * @throws If target is not an object.
   * @example
   * const obj = { own: 'property', [Symbol('sym')]: 'symbol' };
   * const grouped = ReflectDeep.groupedKeys(obj);
   * // Returns: [
   * //   { keys: ['own', Symbol(sym)], object: obj },
   * //   { keys: ['toString', 'valueOf', ...], object: Object.prototype },
   * //   { keys: [], object: null }
   * // ]
   *
   * // Useful for inspecting prototype chain structure
   * function Parent() {}
   * Parent.prototype.parentProp = 'parent';
   * const child = Object.create(Parent.prototype);
   * child.childProp = 'child';
   * const layers = ReflectDeep.groupedKeys(child);
   * // layers[0] = { keys: ['childProp'], object: child }
   * // layers[1] = { keys: ['parentProp'], object: Parent.prototype }
   * // layers[2] = { keys: ['toString', ...], object: Object.prototype }
   */
  static groupedKeys<T extends object>(target: T): GroupedKey[] {
    expectTarget('groupedKeys', target);

    const keys: GroupedKey[] = [{ keys: Reflect.ownKeys(target), object: target }];
    let proto = Reflect.getPrototypeOf(target);
    while (true) {
      // * Proto chain will not contain any loop
      if (!proto) {
        return keys;
      }
      keys.push({
        object: proto,
        keys: Reflect.ownKeys(proto),
      });
      proto = Reflect.getPrototypeOf(proto);
    }
  }
}

Reflect.setPrototypeOf(ReflectDeep, null);
