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

export const getNumPrecision = (
  num: number | string,
  defaultKeep: number = 2
) => {
  return isNumber(num)
    ? num?.toString().split('.')[1]?.length || 0
    : defaultKeep
}

export const $number = (
  value: number | string,
  options?: NumberFormatOptions,
  isdisplay = false
) => {
  const v = isNumber(+value) ? Number(value) : value
  const precision = isdisplay
    ? Math.min(options?.precision ?? 2, getNumPrecision(v) ?? 2)
    : options?.precision ?? 2
  let finalOptions = { ...defaultOptions }
  if (typeof options === 'object' && Object.keys(options).length > 0) {
    finalOptions = {
      ...defaultOptions,
      ...options,
    }
  }
  finalOptions.precision = precision

  return Currency(value, finalOptions as Currency.Options)
}

export const formatNumber = (
  value: number | string,
  options?: NumberFormatOptions,
  keepOriginPrecision: boolean = false
) => {
  const baseOptions: NumberFormatOptions = {
    ...defaultOptions,
    format: isNumber(value) ? null : () => value,
  }
  let formatOptions = { ...baseOptions }
  if (typeof options === 'object' && Object.keys(options).length > 0) {
    formatOptions = {
      ...baseOptions,
      ...options,
    }
  }
  return $number(value, formatOptions, true).format()
}
