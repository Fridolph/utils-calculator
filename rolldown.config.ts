// rolldown.config.ts
import { defineConfig } from 'rolldown'
import { dts } from 'rollup-plugin-dts'

export default defineConfig([
  // JS 打包 - UMD 格式
  {
    input: './dist-temp/index.js',
    output: {
      format: 'umd',
      name: 'UtilsCalculator', // 全局变量名
      file: './dist/utils-calculator.min.js',
      minify: true
    }
  },
  // JS 打包 - IIFE 格式
  {
    input: './dist-temp/index.js',
    output: {
      format: 'iife',
      file: './dist/utils-calculator.iife.min.js',
      minify: true
    }
  },
  // 类型文件合并 - ESM 格式
  {
    input: './dist-temp/main.d.ts', // 以 main.d.ts 为入口
    plugins: [dts({
      // 自动合并所有依赖的 .d.ts 文件
      tsconfig: './tsconfig.json',
    })],
    output: {
      format: 'esm',
      file: './dist/utils-calculator.d.ts'
    }
  }
])