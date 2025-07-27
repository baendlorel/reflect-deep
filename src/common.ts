export const enum Consts {
  Name = 'ReflectDeep',
}

// # utils

export function isPrimitive(o: unknown) {
  return (typeof o !== 'object' || o === null) && typeof o !== 'function';
}

export function typeErr(fnName: string, msg: string) {
  return new TypeError(`${Consts.Name}.${fnName} ${msg}`);
}

export function expectTarget(fnName: string, o: unknown) {
  if (isPrimitive(o)) {
    throw typeErr(fnName, `called with non-object target: ${o}`);
  }
}

export function expectTargetAndKeys(fnName: string, o: unknown, keys: PropertyKey[]) {
  if (isPrimitive(o)) {
    throw typeErr(fnName, `called with non-object target: ${o}`);
  }
  if (!Array.isArray(keys)) {
    throw typeErr(fnName, `called with non-array keys`);
  }
  if (keys.length === 0) {
    throw typeErr(fnName, `called with empty array of keys`);
  }
}
