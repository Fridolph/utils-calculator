import { isObject } from './index'

export const assign = <X extends Record<string | symbol | number, any>>(
  initial: X,
  override: X
): X => {
  if (!initial || !override) {
    // 添加类型断言确保类型匹配
    return initial ?? override ?? {} as X
  }

  return Object.entries({ ...initial, ...override }).reduce(
    (acc, [key, value]) => {
      return {
        ...acc,
        [key]: (() => {
          if (isObject(initial[key])) return assign(initial[key], value)
          // if (isArray(value)) return value.map(x => assign)
          return value
        })()
      }
    },
    {} as X
  )
}