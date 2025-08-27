import Decimal from 'decimal.js'

export const defaultOptions: NumberFormatOptions = {
  symbol: '',
  separator: ',',
  decimal: '.',
  precision: 2,
  pattern: '!#',
  negativePattern: '-!#',
}

const defaultDecimalConfig: Decimal.Config = {
  precision: 2,
  rounding: 0,
  toExpNeg: 0,
  toExpPos: 0,
  minE: 0,
  maxE: 0,
  crypto: 0,
  modulo: 0,
  defaults: 0,
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

/**
 * 适配器模式：用于兼容其他底层计算库
 */
export const $number = (value: number | string, userOptions?: NumberFormatOptions) => {
  const finalOptions = Object.assign({}, defaultOptions, userOptions)
  return Decimal(value)
}
