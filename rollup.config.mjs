import { readFileSync } from 'fs';
import path from 'path';
import dts from 'rollup-plugin-dts';
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import alias from '@rollup/plugin-alias';
import terser from '@rollup/plugin-terser';
import babel from '@rollup/plugin-babel';
import replace from '@rollup/plugin-replace';

const tsconfigFile = './tsconfig.build.json';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

/**
 * @type {import('rollup').RollupOptions}
 */
export default [
  // 主打包配置 - 混淆版
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.mjs',
        format: 'esm',
        sourcemap: false,
      },
    ],

    plugins: [
      alias({
        entries: [{ find: /^@/, replacement: path.resolve(import.meta.dirname, 'src') }],
      }),
      replace({
        preventAssignment: true, // 推荐加上
        __VERSION__: pkg.version,
      }),
      resolve(),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
        presets: [['@babel/preset-env', { targets: { node: '14' } }]],
        plugins: [
          [
            '@babel/plugin-proposal-decorators',
            {
              version: '2023-11', // 使用新版装饰器，如需旧版使用 legacy: true
            },
          ],
        ],
      }),
      typescript({
        tsconfig: tsconfigFile,
      }),
      terser({
        format: {
          comments: false, // 移除所有注释
        },
        compress: {
          drop_console: true,
          // 安全的常量折叠和死代码消除
          dead_code: true, // ✅ 安全：移除死代码
          evaluate: true, // ✅ 安全：计算常量表达式
          // fold_constants 在新版本的 terser 中已被 evaluate 包含
        },
        mangle: {
          properties: {
            regex: /^_/, // 只混淆以下划线开头的属性
          },
        },
      }),
    ],
    external: [], // 如果要包含所有依赖，这里保持空数组
  },
  // 类型声明打包
  {
    input: 'src/index.ts',
    output: [{ file: 'dist/index.d.ts', format: 'es' }],
    plugins: [
      alias({
        entries: [{ find: /^@/, replacement: path.resolve(import.meta.dirname, 'src') }],
      }),
      dts({
        tsconfig: tsconfigFile,
      }),
    ],
  },
];
