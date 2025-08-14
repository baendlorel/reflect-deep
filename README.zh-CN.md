# ReflectDeep

[English](README.md) | [中文](README.zh-CN.md)

一个强大的 TypeScript 库，用于对 JavaScript 对象进行深度反射操作。

提供深度克隆、嵌套属性访问和操作的实用工具，支持循环引用和各种 JavaScript 类型。

> 推荐设置: 将package.json里的type设为module，享受ES6风格的import语句

## 特性

- 🔍 **深度属性访问**：提供经典命名的函数，如 `get`、`set`、`has`、`deleteProperty` 和 `defineProperty`。原创函数 `reach` 可以安全地检查嵌套对象属性
- 🔄 **深度克隆**：克隆复杂对象，支持循环引用处理
- 🔑 **原型链检查**：使用 `keys()` 从原型链提取所有键，或使用 `groupedKeys()` 按层分组
- 🛡️ **类型安全**：完整的 TypeScript 支持，具有适当的类型推断
- 🌐 **全面的类型支持**：处理 Arrays、Maps、Sets、Dates、RegExp、TypedArrays 等
- 🔗 **循环引用安全**：防止循环结构中的无限递归

## 安装

```bash
npm install reflect-deep
```

## 快速开始

```typescript
import { ReflectDeep } from 'reflect-deep';

const obj = { a: { e: null, b: [1, 2, { c: 3 }] } };

// 嵌套属性访问
ReflectDeep.get(obj, ['a', 'b', 2, 'c']); // 3
ReflectDeep.set(obj, ['a', 'b', 2, 'd'], 'new value');
ReflectDeep.has(obj, ['a', 'b', 2, 'd']); // true

// 属性删除
ReflectDeep.deleteProperty(obj, ['a', 'b', 2, 'd']); // true

// 使用描述符定义属性
ReflectDeep.defineProperty(obj, ['a', 'readonly'], {
  value: 'immutable',
  writable: false,
  enumerable: true,
  configurable: true,
});

// 属性到达
ReflectDeep.reach(obj, ['a', 'e']); // { value: null, index: 1, reached: true }
ReflectDeep.reach(obj, ['a', 'b', 2, 'x']); // { value: { c: 3 }, index: 2, reached: false }

// 深度克隆
const cloned = ReflectDeep.clone(obj);

// 属性键提取
const allKeys = ReflectDeep.keys(obj); // 原型链中的所有键
const grouped = ReflectDeep.groupedKeys(obj); // 按原型层分组的键
```

## API 参考

### get<T>(target, propertyKeys[, receiver])

安全地获取嵌套属性的值。

- `T` 是返回值的类型。如果给定，返回类型将被推断为 `T | undefined`
- `target` - 目标对象
- `propertyKeys` - 组成路径的属性键数组
- `receiver` - getter 调用的可选接收者（仅适用于最终属性访问）

```typescript
const obj = { a: { b: { c: 'hello' } } };
const value = ReflectDeep.get(obj, ['a', 'b', 'c']); // 'hello'
const missing = ReflectDeep.get(obj, ['a', 'x', 'y']); // undefined
```

### set<T>(target, propertyKeys, value[, receiver])

设置嵌套属性值，根据需要创建中间对象。

- `T` - 提供 `T` 来验证 `value` 的类型
- `target` - 目标对象
- `propertyKeys` - 组成路径的属性键数组
- `value` - 要设置的值
- `receiver` - setter 调用的可选接收者（仅适用于最终属性赋值）

```typescript
const obj = {};
ReflectDeep.set(obj, ['a', 'b', 'c'], 'hello');
// obj 现在是 { a: { b: { c: 'hello' } } }
```

### has(target, propertyKeys)

检查给定路径上是否存在嵌套属性。

- `target` - 要检查的目标对象
- `propertyKeys` - 组成路径的属性键数组

```typescript
const obj = { a: { b: { c: 'hello' } } };
ReflectDeep.has(obj, ['a', 'b', 'c']); // true
ReflectDeep.has(obj, ['a', 'b', 'd']); // false
```

### reach(target, propertyKeys[, receiver])

遍历属性路径并返回最远可达的值及其索引。

- `target` - 要遍历的目标对象
- `propertyKeys` - 组成路径的属性键数组
- `receiver` - getter 调用的可选接收者（仅适用于最终属性访问）

返回一个对象，包含 `value`（最远可达值）、`index`（到达位置）和 `reached`（是否遍历了完整路径）。

```typescript
const obj = { a: { b: { c: 'hello' } } };

ReflectDeep.reach(obj, ['a', 'b', 'c']); // { value: 'hello', index: 2, reached: true }
ReflectDeep.reach(obj, ['a', 'b', 'd']); // { value: { c: 'hello' }, index: 1, reached: false }
```

### clone(obj)

创建对象的深度克隆，支持循环引用处理。**完全支持循环引用！**

- `obj` - 要克隆的对象

```typescript
const origin = { a: 1, b: { c: 2, o: null } };
origin.b.o = origin; // 循环引用
ReflectDeep.clone(origin); // origin 的深度拷贝
```

### deleteProperty(target, propertyKeys)

删除给定路径上的嵌套属性。**与原生 `Reflect.deleteProperty` 行为相同**

- `target` - 目标对象
- `propertyKeys` - 组成路径的属性键数组

成功时返回 `true`，否则返回 `false`。

```typescript
const obj = { a: { b: { c: 'hello', d: 'world' } } };
ReflectDeep.deleteProperty(obj, ['a', 'b', 'c']); // true
// obj.a.b 现在是 { d: 'world' }

// 即使属性不存在也返回 true（与原生 Reflect.deleteProperty 相同）
ReflectDeep.deleteProperty(obj, ['a', 'b', 'nonexistent']); // true
```

### defineProperty(target, propertyKeys, descriptor)

使用给定的描述符定义嵌套属性，根据需要创建中间对象。**与原生 `Reflect.defineProperty` 行为相同**

- `target` - 目标对象
- `propertyKeys` - 组成路径的属性键数组
- `descriptor` - 要应用的属性描述符

成功时返回 `true`，否则返回 `false`。

```typescript
const obj = {};

// 定义常规属性
ReflectDeep.defineProperty(obj, ['a', 'b', 'c'], {
  value: 'hello',
  writable: true,
  enumerable: true,
  configurable: true,
});
// obj.a.b.c 现在是 'hello'

// 定义 getter/setter 属性
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

从目标对象及其原型链中获取所有属性键（包括符号），作为扁平数组返回。

- `target` - 要提取键的目标对象

```typescript
const obj = { own: 'property', [Symbol('sym')]: 'symbol' };
const allKeys = ReflectDeep.keys(obj);
// 返回：['own', Symbol(sym), 'toString', 'valueOf', ...]

// 适用于自定义原型
function Parent() {}
Parent.prototype.parentProp = 'parent';
const child = Object.create(Parent.prototype);
child.childProp = 'child';
const keys = ReflectDeep.keys(child);
// ['childProp', 'parentProp', 'toString', ...]
```

### groupedKeys(target)

按原型层分组获取属性键，保留原型链结构。

- `target` - 要提取分组键的目标对象

```typescript
const obj = { own: 'property', [Symbol('sym')]: 'symbol' };
const grouped = ReflectDeep.groupedKeys(obj);
// 返回：[
//   { keys: ['own', Symbol(sym)], object: obj },
//   { keys: ['toString', 'valueOf', ...], object: Object.prototype },
//   ...
// ]

// 用于检查原型链结构
function Parent() {}
Parent.prototype.parentProp = 'parent';
const child = Object.create(Parent.prototype);
child.childProp = 'child';
const layers = ReflectDeep.groupedKeys(child);
// layers[0] = { keys: ['childProp'], object: child }
// layers[1] = { keys: ['parentProp'], object: Parent.prototype }
// layers[2] = { keys: ['toString', ...], object: Object.prototype }
```

**支持的类型：**

- 基本类型、对象、数组
- 原型链上的属性
- Dates、RegExp、Maps、Sets
- TypedArrays、ArrayBuffer、DataView
- Node.js Buffer、装箱基本类型、BigInt 对象

**特殊处理：**

- **循环引用**：自动检测和处理
- **WeakMap/WeakSet/Promise/SharedArrayBuffer**：返回原始引用
- **函数**：返回原始函数引用（不克隆）

## 高级示例

### 原型链检查

```typescript
// 创建具有自定义原型链的对象
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

// 从整个原型链获取所有键
const allKeys = ReflectDeep.keys(myDog);
// ['name', 'breed', 'bark', 'speak', 'constructor', 'toString', ...]

// 按原型层分组获取键
const layers = ReflectDeep.groupedKeys(myDog);
// [
//   { keys: ['name', 'breed'], object: myDog },
//   { keys: ['bark', 'constructor'], object: Dog.prototype },
//   { keys: ['speak'], object: Animal.prototype },
//   { keys: ['toString', 'valueOf', ...], object: Object.prototype }
// ]
```

### 复杂嵌套操作

```typescript
const complex = {
  users: [
    { id: 1, profile: { settings: { theme: 'dark' } } },
    { id: 2, profile: { settings: { theme: 'light' } } },
  ],
};

// 获取嵌套值
const theme = ReflectDeep.get(complex, ['users', 0, 'profile', 'settings', 'theme']);

// 设置嵌套值
ReflectDeep.set(complex, ['users', 0, 'profile', 'settings', 'notifications'], true);

// 检查嵌套属性是否存在
const hasNotifications = ReflectDeep.has(complex, [
  'users',
  0,
  'profile',
  'settings',
  'notifications',
]);

// 删除嵌套属性
ReflectDeep.deleteProperty(complex, ['users', 0, 'profile', 'settings', 'theme']);

// 定义嵌套的只读属性
ReflectDeep.defineProperty(complex, ['users', 0, 'profile', 'readonly'], {
  value: 'cannot be changed',
  writable: false,
  enumerable: true,
  configurable: false,
});
```

## 性能考虑

- ⚠️ **无深度限制**：小心非常深的对象结构，以避免堆栈溢出
- 🔄 **循环引用缓存**：使用 WeakMap 进行高效的循环引用检测
- 🎯 **类型特定优化**：针对每种类型的最佳性能使用不同的克隆策略

## 错误处理

库会对无效输入抛出 `TypeError`：

```typescript
// 这些会抛出 TypeError：
ReflectDeep.get(null, ['key']); // 非对象目标
ReflectDeep.set({}, []); // 空键数组
```

## 许可证

MIT License
