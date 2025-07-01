import path from 'path';
import dts from 'rollup-plugin-dts';
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import alias from '@rollup/plugin-alias';
import terser from '@rollup/plugin-terser';
import babel from '@rollup/plugin-babel';

const tsconfigFile = './tsconfig.build.json';
/**
 * @type {import('rollup').RollupOptions}
 */
export default [
  // 主打包配置 - 混淆版
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs', // 指定为CommonJS格式
        sourcemap: true,
        name: 'ReflectDeep', // 全局名称
      },
    ],

    plugins: [
      alias({
        entries: [{ find: /^@/, replacement: path.resolve(import.meta.dirname, 'src') }],
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
              version: '2021-12', // 使用新版装饰器，如需旧版使用 legacy: true
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
          drop_console: false, // 保留console语句
          pure_getters: true,

          // 移除高风险配置
          // unsafe: true,           // 🚫 移除：可能不安全
          // unsafe_comps: true,     // 🚫 移除：可能改变比较行为

          // 安全的常量折叠和死代码消除
          dead_code: true, // ✅ 安全：移除死代码
          evaluate: true, // ✅ 安全：计算常量表达式
          fold_constants: true, // ✅ 安全：折叠常量表达式

          // 谨慎使用的优化（相对安全）
          // reduce_vars: true,      // ⚠️  谨慎：简化变量使用
          // inline: 2,              // ⚠️  谨慎：只内联简单函数（限制复杂度）

          // 安全的额外优化选项
          collapse_vars: true, // ✅ 相对安全：合并变量声明
          sequences: true, // ✅ 安全：合并连续语句
          conditionals: true, // ✅ 安全：优化条件表达式
          comparisons: true, // ✅ 安全：优化比较操作
          booleans: true, // ✅ 安全：优化布尔表达式

          // 额外的安全优化
          hoist_funs: true, // ✅ 安全：函数提升
          hoist_vars: false, // ✅ 保持变量作用域不变
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
