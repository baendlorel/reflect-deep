import { config, DeepSetOptions, log } from './common';

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
    log.warn('WeakMap cannot be cloned, returning an empty one');
    return new WeakMap();
  }

  if (o instanceof WeakSet) {
    log.warn('WeakSet cannot be cloned, returning an empty one');
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
  static disableWarning() {
    config.setShowWarn(false);
  }

  static setDeepSetOptions(options: DeepSetOptions) {
    if (typeof options !== 'object' || options === null) {
      throw typeErr('setDeepSetOptions', 'called with non-object options');
    }
    switch (options.mergeStrategy) {
      case 'keep-new':
      case 'keep-old':
      case 'nullish':
      case 'replace':
        config.deepSetOpt.mergeStrategy = options.mergeStrategy;
        break;
      default:
        throw typeErr(
          'setDeepSetOptions',
          'called with invalid mergeStrategy, must be one of: replace, nullish, keep-old, keep-new'
        );
    }
  }

  /**
   * Equivalent to `propertyKey in target`.
   * @param target Object that contains the property on itself or in its prototype chain.
   * @param propertyKey Name of the property.
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

  static get<T = any>(
    target: any,
    propertyKeys: PropertyKey[],
    receiver?: unknown
  ): T | undefined {
    expectArgs('has', target, propertyKeys);

    let current = target;
    for (let i = 0; i <= propertyKeys.length - 1; i++) {
      if (!Reflect.has(current, propertyKeys[i])) {
        return undefined;
      }
      current = Reflect.get(current, propertyKeys[i], receiver) as any;
    }
    return current as T | undefined;
  }

  /**
   * Sets a value to a deep property of an object.
   * @param target The target object.
   * @param propertyKeys The property key to set.
   * @param value The value to set.
   * @param options Options for setting the value.
   * @returns True if the value was set, false otherwise.
   */
  static set<T = any>(
    target: any,
    propertyKeys: PropertyKey[],
    value: T,
    options?: {
      receiver?: any;
      mergeStrategy?: DeepSetOptions['mergeStrategy'];
    }
  ): boolean {
    expectArgs('set', target, propertyKeys);

    let current = target;
    for (let i = 0; i < propertyKeys.length - 1; i++) {
      if (!Reflect.has(current, propertyKeys[i])) {
        const result = Reflect.set(current, propertyKeys[i], {});
        if (!result) {
          const key = keyChain(propertyKeys.slice(0, i + 1));
          log.warn(`Fail to set target${key}.`);
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
        log.warn(`Cannot set target${key} because it is not an object.`);
        return false;
      }
    }

    // 最后一步set要应用
    const result = Reflect.set(current, propertyKeys[propertyKeys.length - 1], value);
    if (!result) {
      const key = keyChain(propertyKeys);
      log.warn(`Fail to set target${key}.`);
    }
    return result;
  }

  clone<T = any>(obj: T): T {
    return deepClone(new WeakMap(), obj);
  }
}
