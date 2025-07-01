export const NAME = 'ReflectDeep';

// # utils

export const isPrimitive = (o: unknown) =>
  (typeof o !== 'object' || o === null) && typeof o !== 'function';

export const typeErr = (fnName: string, msg: string) => {
  return new TypeError(`${NAME}.${fnName} ${msg}`);
};

export const expectTarget = (fnName: string, o: unknown) => {
  if (isPrimitive(o)) {
    throw typeErr(fnName, `called with non-object target: ${o}`);
  }
};

export const expectTargetAndKeys = (fnName: string, o: unknown, keys: PropertyKey[]) => {
  if (isPrimitive(o)) {
    throw typeErr(fnName, `called with non-object target: ${o}`);
  }
  if (!Array.isArray(keys)) {
    throw typeErr(fnName, `called with non-array keys`);
  }
  if (keys.length === 0) {
    throw typeErr(fnName, `called with empty array of keys`);
  }
};
