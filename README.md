# ReflectDeep

A powerful TypeScript library for deep reflection operations on JavaScript objects. Provides utilities for deep cloning, nested property access, and manipulation with support for circular references and various JavaScript types.

## Features

- 🔍 **Deep Property Access**: Provides functions with classic names like `get`, `set` and `has`. With original function `reach`, you can check nested object properties safely
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

### get(target, propertyKeys[, receiver])

Gets the value of a nested property safely.

- `target` - Target object
- `propertyKeys` - Array of property keys forming the path
- `receiver` - Optional receiver for getter calls (only applies to the final property access)

```typescript
const obj = { a: { b: { c: 'hello' } } };
const value = ReflectDeep.get(obj, ['a', 'b', 'c']); // 'hello'
const missing = ReflectDeep.get(obj, ['a', 'x', 'y']); // undefined
```

### set(target, propertyKeys, value[, receiver])

Sets a nested property value, creating intermediate objects as needed.

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

Creates a deep clone of an object, handling circular references and various JavaScript types.

- `obj` - Object to clone

```typescript
const original = {
  date: new Date(),
  regex: /pattern/g,
  map: new Map([['key', 'value']]),
  nested: { deep: { value: 42 } },
};

const cloned = ReflectDeep.clone(original);
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

### Warning Management

#### enableWarning() / disableWarning()

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
ReflectDeep.has({}, [Symbol(), null]); // invalid key type
```

## TypeScript Support

Full TypeScript support with proper type inference:

```typescript
interface User {
  name: string;
  settings: { theme: 'light' | 'dark' };
}

const user: User = { name: 'John', settings: { theme: 'dark' } };
const cloned = ReflectDeep.clone(user); // Type: User
const theme = ReflectDeep.get<string>(user, ['settings', 'theme']); // Type: string | undefined
```

## License

MIT License
