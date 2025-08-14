// Cache global methods for better performance and robustness
export const ObjectCreate = Object.create;
export const ObjectPrototype = Object.prototype;
export const ObjectValueOf = ObjectPrototype.valueOf;

export const ReflectGet = Reflect.get;
export const ReflectSet = Reflect.set;
export const ReflectHas = Reflect.has;
export const ReflectOwnKeys = Reflect.ownKeys;
export const ReflectGetPrototypeOf = Reflect.getPrototypeOf;
export const ReflectDeleteProperty = Reflect.deleteProperty;
export const ReflectDefineProperty = Reflect.defineProperty;

export const ArrayIsArray = Array.isArray;
export const ArrayFromIterator = Array.from;

export const ArrayBufferIsView = ArrayBuffer.isView;
export const ArrayBufferSlice = ArrayBuffer.prototype.slice;

export const DateConstructor = Date;
export const RegExpConstructor = RegExp;
export const MapConstructor = Map;
export const SetConstructor = Set;
export const WeakMapConstructor = WeakMap;
export const WeakSetConstructor = WeakSet;
export const WeakRefConstructor = WeakRef;
export const DataViewConstructor = DataView;

export const NumberConstructor = Number;
export const StringConstructor = String;
export const BooleanConstructor = Boolean;
export const BigIntConstructor = typeof BigInt !== 'undefined' ? BigInt : undefined;

export const PromiseConstructor = Promise;
export const SharedArrayBufferConstructor =
  typeof SharedArrayBuffer !== 'undefined' ? SharedArrayBuffer : undefined;

// Buffer is Node.js specific, may not exist in browsers
export const BufferConstructor = typeof Buffer !== 'undefined' ? Buffer : undefined;
export const BufferFrom = BufferConstructor?.from;

export const SetAdd = Set.prototype.add;
export const SetForEach = Set.prototype.forEach;
export const MapSet = Map.prototype.set;
export const MapForEach = Map.prototype.forEach;
export const TypeErr = TypeError;
