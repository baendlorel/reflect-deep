const MERGE_STRATEGY_TYPE = [
  'default',
  'nullish',
  'falsy',
  'keep-old',
  'custom',
] as const;
type MergeStrategyType = (typeof MERGE_STRATEGY_TYPE)[number];

const applyMergePredicate = (
  target: any,
  propertyKey: PropertyKey,
  value: any,
  predicate: Function
) => {
  const old = Reflect.get(target, propertyKey);
  if (predicate(old, value)) {
    return Reflect.set(target, propertyKey, value);
  }
  return true;
};

const mergeSet: {
  [key in MergeStrategyType]: (
    target: any,
    propertyKey: PropertyKey,
    value: any
  ) => boolean;
} = {
  default: Reflect.set,
  nullish: (target: any, propertyKey: PropertyKey, value: any) => {
    const old = Reflect.get(target, propertyKey);
    if (old === null || old === undefined) {
      return Reflect.set(target, propertyKey, value);
    }
    return true;
  },
  falsy: (target: any, propertyKey: PropertyKey, value: any) => {
    const old = Reflect.get(target, propertyKey);
    if (!old) {
      return Reflect.set(target, propertyKey, value);
    }
    return true;
  },
  'keep-old': (target: any, propertyKey: PropertyKey, value: any) => {
    if (Reflect.has(target, propertyKey)) {
      // If the property already exists, do nothing
      return true;
    }
    return Reflect.set(target, propertyKey, value);
  },
  custom: Reflect.set,
};

const warn = (...args: any[]) => console.warn('[ReflectDeep]', ...args);
export const common = {
  warn,
  applyMergeSet: (
    target: any,
    propertyKey: PropertyKey,
    value: any,
    strategy?: MergeStrategyType
  ) => {
    strategy = strategy ?? config.deepSetOpt.mergeStrategy;
    if (typeof strategy === 'string') {
      return mergeSet[strategy](target, propertyKey, value);
    } else if (typeof strategy === 'function') {
      return applyMergePredicate(target, propertyKey, value, strategy);
    }
  },
  setShowWarn: (value: boolean) => {
    config.showWarn = value;
    common.warn = value ? warn : (...args: any[]) => {};
  },
  setMergeStrategy: (strategy: MergeStrategyType | Function) => {
    if (typeof strategy === 'string') {
      config.deepSetOpt.mergeStrategy = strategy;
    } else {
      config.deepSetOpt.mergeStrategy = 'custom';
      mergeSet.custom = (target: any, propertyKey: PropertyKey, value: any) =>
        applyMergePredicate(target, propertyKey, value, strategy);
    }
  },
};

export const config = {
  showWarn: true,
  deepSetOpt: {
    mergeStrategy: 'default',
  } as DeepSetOptions,
  display() {
    const o = {} as Record<string, any>;
    Object.keys(config).forEach((key) => {
      const v = Reflect.get(config, key);
      if (typeof v !== 'function') {
        o[key] = v;
      }
    });
    return o;
  },
};

export type DeepSetOptions = {
  /**
   * When both `old` and `new` are objects, this option determines how to merge them.
   *
   * It takes value below
   * - `default`: Just call `Reflect.set`.
   * - `nullish`: Only override when the old value is `null` or `undefined`.
   * - `falsy`: Overrides `false`, `0`, `-0`, `0n`, `NaN`, `""`, `null` and `undefined`.
   * - `keep-old`: Keep the old value if it exists, otherwise use the new value.
   * - `custom` : Comparer function that takes two values and returns a boolean indicating which value to keep.
   */
  mergeStrategy: MergeStrategyType;
};
