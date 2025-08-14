// @ts-check
import { readdirSync, readFileSync, existsSync, writeFileSync, statSync } from 'node:fs';
import path from 'node:path';
import console from 'node:console';

// package.json
import pkg from './package.json' with { type: 'json' };

// plugins
import dts from 'rollup-plugin-dts';
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import alias from '@rollup/plugin-alias';
import terser from '@rollup/plugin-terser';
import babel from '@rollup/plugin-babel';
import replace from '@rollup/plugin-replace';

// # common options

/**
 * build config
 */
const tsconfig = './tsconfig.build.json';

/**
 * @type {import('@rollup/plugin-alias').RollupAliasOptions}
 */
const aliasOpts = {
  entries: [{ find: /^@/, replacement: path.resolve(import.meta.dirname, 'src') }],
};

/**
 * @type {import('@rollup/plugin-replace').RollupReplaceOptions}
 */
const replaceOpts = {
  preventAssignment: true,
  values: {
    __NAME__: pkg.name.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase()),
    __VERSION__: pkg.version,
    __AUTHOR__: `${pkg.author.name} <${pkg.author.email}>`,
  },
};

// # private plugins

/**
 * Find all .d.ts files in src and prepend their content to dist/index.d.ts
 */
function prependAllDts() {
  return {
    name: 'prepend-all-dts',
    writeBundle() {
      const srcDir = path.resolve('src');
      const distDts = path.resolve('dist/index.d.ts');
      if (!existsSync(distDts)) {
        console.warn(`Warning: ${distDts} does not exist, skipping prependAllDts.`);
        return;
      }
      const dtsFiles = [];
      function findDtsFiles(dir) {
        for (const file of readdirSync(dir)) {
          const fullPath = path.join(dir, file);
          if (!existsSync(fullPath)) {
            throw new Error(`File not found: ${fullPath}`);
          }
          if (file.endsWith('.d.ts')) {
            dtsFiles.push(fullPath);
            continue;
          }
          const stat = statSync(fullPath);
          if (stat.isDirectory()) {
            findDtsFiles(fullPath);
          }
        }
      }

      findDtsFiles(srcDir);
      const allDtsContent = [];
      for (let i = 0; i < dtsFiles.length; i++) {
        const relativePath = path.relative(srcDir, dtsFiles[i]);
        const content = readFileSync(dtsFiles[i], 'utf8');
        allDtsContent.push(`// # from: ${relativePath}`, content);
      }
      const indexContent = readFileSync(distDts, 'utf8');
      allDtsContent.push('// # index.d.ts', indexContent);

      const content = allDtsContent.join('\n');
      writeFileSync(distDts, content, 'utf8');
    },
  };
}

// # main options

/**
 * @type {import('rollup').RollupOptions[]}
 */
export default [
  // * Main
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
      alias(aliasOpts),
      replace(replaceOpts),
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
              version: '2023-11',
            },
          ],
        ],
      }),
      typescript({ tsconfig }),
      terser({
        format: {
          comments: false, // remove comments
        },
        compress: {
          drop_console: true,
          dead_code: true, // ✅ Safe: remove dead code
          evaluate: true, // ✅ Safe: evaluate constant expressions
        },
        mangle: {
          properties: {
            regex: /^_/, // only mangle properties starting with '_'
          },
        },
      }),
    ],
    external: [],
  },
  // * Declarations
  {
    input: 'src/index.ts',
    output: [{ file: 'dist/index.d.ts', format: 'es' }],
    plugins: [alias(aliasOpts), replace(replaceOpts), dts({ tsconfig }), prependAllDts()],
  },
];
