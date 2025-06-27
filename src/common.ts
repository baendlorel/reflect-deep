const originWarn = (...args: any[]) => console.warn('[ReflectDeep]', ...args);
export const common = {
  warn: originWarn,
  setShowWarn: (value: boolean) => {
    config.showWarn = value;
    common.warn = value ? originWarn : (...args: any[]) => {};
  },
};

export const config = {
  showWarn: true,
};

// # utils

export const isPrimitive = (o: any) =>
  (typeof o !== 'object' || o === null) && typeof o !== 'function';

export const typeErr = (fnName: string, msg: string) => {
  return new TypeError(`[ReflectDeep] ${fnName} ${msg}`);
};

export const expectArgs = (f: string, o: any, keys: PropertyKey[]) => {
  if (isPrimitive(o)) {
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
