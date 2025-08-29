export const isNumber = (value: unknown): value is number => {
  try {
    return Number(value) === value
  } catch {
    return false
  }
}

export const isString = (value: unknown): value is string => {
  return typeof value === 'string'
}

export const isObject = (value: unknown): value is object => {
  return !!value && value.constructor === Object
}
