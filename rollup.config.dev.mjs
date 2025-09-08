import serve from 'rollup-plugin-serve'
import livereload from 'rollup-plugin-livereload'
import { baseConfig } from './rollup.config.base.mjs'
const packageName = 'rollupTsUtils'

const devConfig = {
  input: baseConfig.input,
  output: {
    file: 'dev/bundle.js',
    format: 'iife',
    name: packageName,
    sourcemap: true,
  },
  plugins: [
    ...baseConfig.plugins,
    serve({
      contentBase: ['dev'],
      open: true,
      port: 3000,
    }),
    livereload({
      watch: ['dev'],
    }),
  ],
}
export default devConfig
