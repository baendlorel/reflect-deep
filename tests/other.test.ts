import { describe, it, expect } from 'vitest';
import { ReflectDeep } from '../src/index.js';

describe('构造函数测试', () => {
  it('应该在尝试实例化时抛出错误', () => {
    expect(() => Reflect.construct(ReflectDeep, [])).toThrow(TypeError);
  });
});

describe('边界情况和刁钻测试', () => {
  it('应该处理包含 Symbol 键的对象', () => {
    const sym1 = Symbol('key1');
    const sym2 = Symbol('key2');
    const obj = {
      [sym1]: { [sym2]: 'value' },
    };

    const cloned = ReflectDeep.clone(obj);
    expect(cloned[sym1][sym2]).toBe('value');
    expect(cloned).not.toBe(obj);

    expect(ReflectDeep.get(obj, [sym1, sym2])).toBe('value');
    expect(ReflectDeep.has(obj, [sym1, sym2])).toBe(true);
  });

  it('应该处理原型链上的属性1', () => {
    function Parent(this: any) {}
    Parent.prototype.inherited = 'parent';

    function Child(this: any) {
      this.own = 'child';
    }
    Child.prototype = Object.create(Parent.prototype);

    const obj = new (Child as any)();
    const cloned = ReflectDeep.clone(obj);

    expect(cloned.own).toBe('child');
    expect(cloned.inherited).toBe('parent');
    expect(cloned).not.toBe(obj);
  });

  it('应该处理原型链上的属性2', () => {
    function Parent(this: any) {}
    Parent.prototype.inherited = 'Parent';

    function Child(this: any) {
      this.own = 'Child';
    }
    Child.prototype = Object.create(Parent.prototype);

    function GrandChild(this: any) {
      this.self = 'GrandChild';
    }
    GrandChild.prototype = Object.create(Child.prototype);

    const obj = new (GrandChild as any)();
    const cloned = ReflectDeep.clone(obj);

    expect(cloned.self).toBe('GrandChild');
    expect(cloned.inherited).toBe('Parent');
    expect(cloned).not.toBe(obj);
  });

  it('应该处理空对象和空数组', () => {
    const emptyObj = {};
    const emptyArr: any[] = [];

    const clonedObj = ReflectDeep.clone(emptyObj);
    const clonedArr = ReflectDeep.clone(emptyArr);

    expect(clonedObj).toEqual({});
    expect(clonedObj).not.toBe(emptyObj);
    expect(clonedArr).toEqual([]);
    expect(clonedArr).not.toBe(emptyArr);
  });

  it('应该处理稀疏数组', () => {
    const sparseArr = [1, , , 4]; // 稀疏数组
    const cloned = ReflectDeep.clone(sparseArr);

    expect(cloned.length).toBe(4);
    expect(cloned[0]).toBe(1);
    expect(cloned[1]).toBe(undefined);
    expect(cloned[3]).toBe(4);
    expect(1 in cloned).toBe(false); // 索引1不存在
  });

  it('应该处理具有数字键的对象', () => {
    const obj = { 0: 'zero', 1: 'one', length: 2 };
    const cloned = ReflectDeep.clone(obj);

    expect(cloned[0]).toBe('zero');
    expect(cloned[1]).toBe('one');
    expect(cloned.length).toBe(2);
    expect(cloned).not.toBe(obj);
  });

  it('应该处理带有 getter/setter 的对象', () => {
    const obj = {
      _value: 'initial',
      get value() {
        return this._value;
      },
      set value(v) {
        this._value = v;
      },
    };

    const cloned = ReflectDeep.clone(obj);
    expect(cloned.value).toBe('initial');

    cloned.value = 'modified';
    expect(cloned.value).toBe('modified');
    expect(obj.value).toBe('initial'); // 原对象不受影响
  });

  it('应该处理超长路径', () => {
    const obj = {};
    const longPath = Array.from({ length: 100 }, (_, i) => `level${i}`);

    expect(ReflectDeep.set(obj, longPath, 'deep')).toBe(true);
    expect(ReflectDeep.get(obj, longPath)).toBe('deep');
    expect(ReflectDeep.has(obj, longPath)).toBe(true);

    const result = ReflectDeep.reach(obj, longPath);
    expect(result.value).toBe('deep');
    expect(result.index).toBe(99);
  });
});
