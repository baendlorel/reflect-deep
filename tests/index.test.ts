import { expect } from '@jest/globals';
import { describe, it, fit, env, Env } from './injected-jest';

describe('刁钻测试用例', () => {
  it('不是函数，应该报错', () => {
    const fn = {};
    expect(() => getFunctionFeatures(fn)).toThrowError();
  });
});
