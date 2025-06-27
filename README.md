# Reflect Deep

A powerful TypeScript library for deep reflection operations on JavaScript objects. Provides utilities for deep cloning, nested property access, and manipulation with support for circular references and various JavaScript types.

## Features

- 🔍 **Deep Property Access**: Get, set, and check nested object properties safely
- 🔄 **Deep Cloning**: Clone complex objects with circular reference handling
- 🛡️ **Type Safety**: Full TypeScript support with proper type inference
- 🌐 **Comprehensive Type Support**: Handles Arrays, Maps, Sets, Dates, RegExp, TypedArrays, and more
- ⚠️ **Smart Warnings**: Configurable warning system for edge cases
- 🔗 **Circular Reference Safe**: Prevents infinite recursion in circular structures

## Installation

```bash
npm install reflect-deep
```

## Quick Start

```typescript
import { ReflectDeep } from 'reflect-deep';

// Deep cloning
const obj = { a: { b: [1, 2, { c: 3 }] } };
const cloned = ReflectDeep.clone(obj);

// Nested property access
const value = ReflectDeep.get(obj, ['a', 'b', 2, 'c']); // 3
ReflectDeep.set(obj, ['a', 'b', 2, 'd'], 'new value');
const exists = ReflectDeep.has(obj, ['a', 'b', 2, 'd']); // true
```

## API Reference

### Deep Cloning

#### `ReflectDeep.clone<T>(obj: T): T`

Creates a deep clone of an object, handling circular references and various JavaScript types.

```typescript
const original = {
  date: new Date(),
  regex: /pattern/g,
  map: new Map([['key', 'value']]),
  nested: { deep: { value: 42 } },
};

const cloned = ReflectDeep.clone(original);
// Fully independent copy with all types preserved
```

**Supported Types:**

- Primitive types (string, number, boolean, null, undefined)
- Objects and Arrays
- Dates and RegExp
- Maps and Sets
- TypedArrays (Int8Array, Float32Array, etc.)
- ArrayBuffer and DataView
- Node.js Buffer (when available)
- Boxed primitives (Number, String, Boolean objects)
- BigInt objects
- WeakRef (with null-safe dereferencing)

**Special Handling:**

- **Circular References**: Automatically detected and handled
- **WeakMap/WeakSet**: Returns original reference (cannot be cloned)
- **SharedArrayBuffer**: Returns original reference (unsafe to clone)
- **Promise**: Returns original reference (stateful object)

### Nested Property Operations

#### `ReflectDeep.get<T>(target: any, propertyKeys: PropertyKey[], receiver?: any): T | undefined`

Gets the value of a nested property safely.

```typescript
const obj = { a: { b: { c: 'hello' } } };
const value = ReflectDeep.get(obj, ['a', 'b', 'c']); // 'hello'
const missing = ReflectDeep.get(obj, ['a', 'x', 'y']); // undefined
```

#### `ReflectDeep.set<T>(target: any, propertyKeys: PropertyKey[], value: T, receiver?: any): boolean`

Sets a nested property value, creating intermediate objects as needed.

```typescript
const obj = {};
ReflectDeep.set(obj, ['a', 'b', 'c'], 'hello');
// obj is now { a: { b: { c: 'hello' } } }
```

#### `ReflectDeep.has(target: object, propertyKeys: PropertyKey[]): boolean`

Checks if a nested property exists at the given path.

```typescript
const obj = { a: { b: { c: 'hello' } } };
ReflectDeep.has(obj, ['a', 'b', 'c']); // true
ReflectDeep.has(obj, ['a', 'b', 'd']); // false
```

#### `ReflectDeep.reach(target: object, propertyKeys: PropertyKey[], receiver?: any): ReachResult`

Traverses a property path and returns the furthest reachable value with its index.

```typescript
const obj = { a: { b: { c: 'hello' } } };

ReflectDeep.reach(obj, ['a', 'b', 'c']);
// { value: 'hello', index: 2 }

ReflectDeep.reach(obj, ['a', 'b', 'd']);
// { value: { c: 'hello' }, index: 1 }

ReflectDeep.reach(obj, ['a', 'x']);
// { value: { b: { c: 'hello' } }, index: 0 }
```

### Warning Management

#### `ReflectDeep.enableWarning()` / `ReflectDeep.disableWarning()`

Control warning messages for operations that cannot be performed safely.

```typescript
ReflectDeep.disableWarning(); // Suppress all warnings
ReflectDeep.enableWarning(); // Re-enable warnings
```

## Advanced Examples

### Circular Reference Handling

```typescript
const circular = { name: 'parent' };
circular.self = circular;
circular.child = { parent: circular };

const cloned = ReflectDeep.clone(circular);
// Works without infinite recursion
// cloned.self === cloned (circular reference preserved)
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

### Working with Different Types

```typescript
const data = {
  timestamp: new Date(),
  pattern: /^\d+$/,
  mapping: new Map([['key1', 'value1']]),
  numbers: new Set([1, 2, 3]),
  buffer: new ArrayBuffer(8),
  view: new DataView(new ArrayBuffer(16)),
};

const cloned = ReflectDeep.clone(data);
// All types are properly cloned and preserved
```

## Performance Considerations

- ⚠️ **No Depth Limiting**: The library does not limit recursion depth. Be careful with very deep object structures to avoid stack overflow.
- 🔄 **Circular Reference Cache**: Uses WeakMap for efficient circular reference detection.
- 🎯 **Type-Specific Optimization**: Different cloning strategies for optimal performance per type.

## Error Handling

The library throws `TypeError` for invalid inputs:

```typescript
// These will throw TypeError:
ReflectDeep.get(null, ['key']); // non-object target
ReflectDeep.set({}, []); // empty keys array
ReflectDeep.has({}, [Symbol(), null]); // invalid key type
```

## TypeScript Support

Full TypeScript support with proper type inference:

```typescript
interface User {
  name: string;
  settings: {
    theme: 'light' | 'dark';
  };
}

const user: User = { name: 'John', settings: { theme: 'dark' } };
const cloned = ReflectDeep.clone(user); // Type: User
const theme = ReflectDeep.get<string>(user, ['settings', 'theme']); // Type: string | undefined
```

## License

MIT License
