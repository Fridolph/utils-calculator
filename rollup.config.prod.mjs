import terser from '@rollup/plugin-terser'
import { baseConfig, dtsConfig } from './rollup.config.base.mjs'

const packageName = 'rollupTsUtils'

const productionConfig = {
  ...baseConfig,
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
    },
    {
      file: 'dist/index.esm.js',
      format: 'es',
    },
    {
      file: 'dist/index.umd.js',
      format: 'umd',
      sourcemap: true,
      name: packageName,
      globals: {
        // 如果你的库依赖其他全局变量，在这里定义它们
        '@babel/runtime-corejs3/regenerator': 'regeneratorRuntime',
        '@babel/runtime-corejs3/helpers/asyncToGenerator': 'asyncToGenerator',
        '@babel/runtime-corejs3/core-js-stable/promise': 'Promise',
      },
    },
  ],
  plugins: [...baseConfig.plugins, terser()],
}

export default [productionConfig, dtsConfig]
