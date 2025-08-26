import Currency from 'currency.js'

export const defaultOptions: NumberFormatOptions = {
  symbol: '',
  separator: ',',
  decimal: '.',
  precision: 2,
  pattern: '!#',
  negativePattern: '-!#',
}

export const isNumber = (value: unknown): value is number => {
  try {
    return Number(value) === value
  } catch {
    return false
  }
}

export const isObject = (value: unknown): value is object => {
  return !!value && value.constructor === Object
}

export const $number = (value: number | string, options?: NumberFormatOptions) => {
  const finalOptions = Object.assign({}, defaultOptions, options)
  return Currency(value, finalOptions as Currency.Options)
}
