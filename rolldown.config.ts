import { defineConfig } from 'rolldown'

export default defineConfig([
  {
    input: './.temp/index.js',
    output: {
      format: 'cjs',
      file: './dist/utils-calculator.min.js',
    },
  },
  {
    input: './.temp/index.js',
    output: {
      format: 'esm',
      file: './dist/utils-calculator.esm.min.js',
    },
  }
])
