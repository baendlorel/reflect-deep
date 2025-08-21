# ReflectDeep

[English](README.md) | [中文](README.zh-CN.md)

A powerful TypeScript library for deep reflection operations on JavaScript objects.

Utilities for deep cloning, nested property access, and manipulation with support for circular references and various JavaScript types.

> Recommended: set "type": "module" in your package.json to use this module with ES6 imports.

For more awesome packages, check out [my homepage💛](https://baendlorel.github.io/?repoType=npm)

## Features

- 🔍 **Deep Property Access**: Provides functions with classic names like `get`, `set`, `has`, `deleteProperty`, and `defineProperty`. With original function `reach`, you can check nested object properties safely
- 🔄 **Deep Cloning**: Clone complex objects with circular reference handling
- 🔑 **Prototype Chain Inspection**: Extract all keys from prototype chain with `keys()` or grouped by layer with `groupedKeys()`
- 🛡️ **Type Safety**: Full TypeScript support with proper type inference
- 🌐 **Comprehensive Type Support**: Handles Arrays, Maps, Sets, Dates, RegExp, TypedArrays, and more
- 🔗 **Circular Reference Safe**: Prevents infinite recursion in circular structures

## Installation

```bash
npm install reflect-deep
```

## Quick Start

```typescript
import { ReflectDeep } from 'reflect-deep';

const obj = { a: { e: null, b: [1, 2, { c: 3 }] } };

// Nested property access
ReflectDeep.get(obj, ['a', 'b', 2, 'c']); // 3
ReflectDeep.set(obj, ['a', 'b', 2, 'd'], 'new value');
ReflectDeep.has(obj, ['a', 'b', 2, 'd']); // true

// Property deletion
ReflectDeep.deleteProperty(obj, ['a', 'b', 2, 'd']); // true

// Property definition with descriptor
ReflectDeep.defineProperty(obj, ['a', 'readonly'], {
  value: 'immutable',
  writable: false,
  enumerable: true,
  configurable: true,
});

// Property reach
ReflectDeep.reach(obj, ['a', 'e']); // { value: null, index: 1, reached: true }
ReflectDeep.reach(obj, ['a', 'b', 2, 'x']); // { value: { c: 3 }, index: 2, reached: false }

// Deep cloning
const cloned = ReflectDeep.clone(obj);

// Property key extraction
const allKeys = ReflectDeep.keys(obj); // All keys from prototype chain
const grouped = ReflectDeep.groupedKeys(obj); // Keys grouped by prototype layer
```

## API Reference

### get<T>(target, propertyKeys[, receiver])

Gets the value of a nested property safely.

- `T` is the type of returned value. If given, the returned type will be inferred as `T | undefined`
- `target` - Target object
- `propertyKeys` - Array of property keys forming the path
- `receiver` - Optional receiver for getter calls (only applies to the final property access)

```typescript
const obj = { a: { b: { c: 'hello' } } };
const value = ReflectDeep.get(obj, ['a', 'b', 'c']); // 'hello'
const missing = ReflectDeep.get(obj, ['a', 'x', 'y']); // undefined
```

### set<T>(target, propertyKeys, value[, receiver])

Sets a nested property value, creating intermediate objects as needed.

- `T` - Provide `T` to validate the type of `value`
- `target` - Target object
- `propertyKeys` - Array of property keys forming the path
- `value` - Value to set
- `receiver` - Optional receiver for setter calls (only applies to the final property assignment)

```typescript
const obj = {};
ReflectDeep.set(obj, ['a', 'b', 'c'], 'hello');
// obj is now { a: { b: { c: 'hello' } } }
```

### has(target, propertyKeys)

Checks if a nested property exists at the given path.

- `target` - Target object to check
- `propertyKeys` - Array of property keys forming the path

```typescript
const obj = { a: { b: { c: 'hello' } } };
ReflectDeep.has(obj, ['a', 'b', 'c']); // true
ReflectDeep.has(obj, ['a', 'b', 'd']); // false
```

### reach(target, propertyKeys[, receiver])

Traverses a property path and returns the furthest reachable value with its index.

- `target` - Target object to traverse
- `propertyKeys` - Array of property keys forming the path
- `receiver` - Optional receiver for getter calls (only applies to the final property access)

Returns an object with `value` (furthest reachable value), `index` (position reached), and `reached` (whether the full path was traversed).

```typescript
const obj = { a: { b: { c: 'hello' } } };

ReflectDeep.reach(obj, ['a', 'b', 'c']); // { value: 'hello', index: 2, reached: true }
ReflectDeep.reach(obj, ['a', 'b', 'd']); // { value: { c: 'hello' }, index: 1, reached: false }
```

### clone(obj)

Creates a deep clone of an object with circular reference handling. **Circular reference is fully supported!**

- `obj` - Object to clone

```typescript
const origin = { a: 1, b: { c: 2, o: null } };
origin.b.o = origin; // Circular reference
ReflectDeep.clone(origin); // Deep copy of origin
```

### deleteProperty(target, propertyKeys)

Deletes a nested property at the given path. **Has same behavior as the original `Reflect.deleteProperty`**

- `target` - Target object
- `propertyKeys` - Array of property keys forming the path

Returns `true` if successful, `false` otherwise.

```typescript
const obj = { a: { b: { c: 'hello', d: 'world' } } };
ReflectDeep.deleteProperty(obj, ['a', 'b', 'c']); // true
// obj.a.b is now { d: 'world' }

// Returns true even if property doesn't exist (like original Reflect.deleteProperty)
ReflectDeep.deleteProperty(obj, ['a', 'b', 'nonexistent']); // true
```

### defineProperty(target, propertyKeys, descriptor)

Defines a nested property with the given descriptor, creating intermediate objects as needed. **Has same behavior as the original `Reflect.defineProperty`**

- `target` - Target object
- `propertyKeys` - Array of property keys forming the path
- `descriptor` - Property descriptor to apply

Returns `true` if successful, `false` otherwise.

```typescript
const obj = {};

// Define a regular property
ReflectDeep.defineProperty(obj, ['a', 'b', 'c'], {
  value: 'hello',
  writable: true,
  enumerable: true,
  configurable: true,
});
// obj.a.b.c is now 'hello'

// Define a getter/setter property
ReflectDeep.defineProperty(obj, ['x', 'y'], {
  get() {
    return this._value;
  },
  set(v) {
    this._value = v;
  },
  enumerable: true,
  configurable: true,
});
```

### keys(target)

Gets all property keys (including symbols) from the target object and its prototype chain as a flattened array.

- `target` - Target object to extract keys from

```typescript
const obj = { own: 'property', [Symbol('sym')]: 'symbol' };
const allKeys = ReflectDeep.keys(obj);
// Returns: ['own', Symbol(sym), 'toString', 'valueOf', ...]

// Works with custom prototypes
function Parent() {}
Parent.prototype.parentProp = 'parent';
const child = Object.create(Parent.prototype);
child.childProp = 'child';
const keys = ReflectDeep.keys(child);
// ['childProp', 'parentProp', 'toString', ...]
```

### groupedKeys(target)

Gets property keys grouped by prototype layer, preserving the prototype chain structure.

- `target` - Target object to extract grouped keys from

```typescript
const obj = { own: 'property', [Symbol('sym')]: 'symbol' };
const grouped = ReflectDeep.groupedKeys(obj);
// Returns: [
//   { keys: ['own', Symbol(sym)], object: obj },
//   { keys: ['toString', 'valueOf', ...], object: Object.prototype },
//   ...
// ]

// Useful for inspecting prototype chain structure
function Parent() {}
Parent.prototype.parentProp = 'parent';
const child = Object.create(Parent.prototype);
child.childProp = 'child';
const layers = ReflectDeep.groupedKeys(child);
// layers[0] = { keys: ['childProp'], object: child }
// layers[1] = { keys: ['parentProp'], object: Parent.prototype }
// layers[2] = { keys: ['toString', ...], object: Object.prototype }
```

**Supported:**

- Primitive types, Objects, Arrays
- Properties on the prototype chain
- Dates, RegExp, Maps, Sets
- TypedArrays, ArrayBuffer, DataView
- Node.js Buffer, Boxed primitives, BigInt objects

**Special Handling:**

- **Circular References**: Automatically detected and handled
- **WeakMap/WeakSet/Promise/SharedArrayBuffer**: Returns original reference
- **Functions**: Returns original function reference (no cloning)

## Advanced Examples

### Prototype Chain Inspection

```typescript
// Create objects with custom prototype chain
function Animal(name) {
  this.name = name;
}
Animal.prototype.speak = function () {
  return 'noise';
};

function Dog(name, breed) {
  Animal.call(this, name);
  this.breed = breed;
}
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;
Dog.prototype.bark = function () {
  return 'woof';
};

const myDog = new Dog('Rex', 'German Shepherd');

// Get all keys from entire prototype chain
const allKeys = ReflectDeep.keys(myDog);
// ['name', 'breed', 'bark', 'speak', 'constructor', 'toString', ...]

// Get keys grouped by prototype layer
const layers = ReflectDeep.groupedKeys(myDog);
// [
//   { keys: ['name', 'breed'], object: myDog },
//   { keys: ['bark', 'constructor'], object: Dog.prototype },
//   { keys: ['speak'], object: Animal.prototype },
//   { keys: ['toString', 'valueOf', ...], object: Object.prototype }
// ]
```

### Complex Nested Operations

```typescript
const complex = {
  users: [
    { id: 1, profile: { settings: { theme: 'dark' } } },
    { id: 2, profile: { settings: { theme: 'light' } } },
  ],
};

// Get nested value
const theme = ReflectDeep.get(complex, ['users', 0, 'profile', 'settings', 'theme']);

// Set nested value
ReflectDeep.set(complex, ['users', 0, 'profile', 'settings', 'notifications'], true);

// Check if nested property exists
const hasNotifications = ReflectDeep.has(complex, [
  'users',
  0,
  'profile',
  'settings',
  'notifications',
]);
```

## Performance Considerations

- ⚠️ **No Depth Limiting**: Be careful with very deep object structures to avoid stack overflow
- 🔄 **Circular Reference Cache**: Uses WeakMap for efficient circular reference detection
- 🎯 **Type-Specific Optimization**: Different cloning strategies for optimal performance per type

## Error Handling

The library throws `TypeError` for invalid inputs:

```typescript
// These will throw TypeError:
ReflectDeep.get(null, ['key']); // non-object target
ReflectDeep.set({}, []); // empty keys array
```

## License

MIT License
