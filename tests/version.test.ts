import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
// @ts-ignore
import { ReflectDeep } from '../dist/index.mjs';

const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));

describe('测试版本获取', () => {
  it('ReflectDeep.version should match package.json version', () => {
    console.log('ReflectDeep.version:', ReflectDeep.version);
    expect(ReflectDeep.version).toBe(pkg.version);
  });
});
