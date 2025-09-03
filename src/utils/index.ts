import type Decimal from 'decimal.js'
import { defaultDecimalConfigs } from '../constants'

export const isNumber = (value: unknown): value is number => {
  return Number(value) === value
}

export const isString = (value: unknown): value is string => {
  return typeof value === 'string'
}

export const isObject = (value: unknown): value is object => {
  return !!value && value.constructor === Object
}

/**
 * @remarks
 * 官方使用的默认项参考 
 * Decimal.set({
    precision: 20,
    rounding: 4,
    toExpNeg: -7,
    toExpPos: 21,
    maxE: 9e15,
    minE: -9e15,
    modulo: 1,
    crypto: false
  })
 */
export const defaultDecimalConfig: Decimal.Config = {
  precision: 16, // 暂时使用16位精度，可根据需求灵活调整
  rounding: 4, // 使用标准四舍五入 5进位 4舍去
  toExpNeg: -7,
  toExpPos: 21,
  maxE: 9e15,
  minE: -9e15,
  modulo: 1,
  crypto: false,
}

/**
 * 适配器模式：用于兼容其他底层计算库
 */
// export const $number = (value: number, userOptions?: Decimal.Config) => {
//   const mergedOptions = Object.assign({}, defaultDecimalConfig, userOptions)
//   const DecInst = Decimal.clone(mergedOptions)
//   return DecInst(value)
// }

type GetDecimalPlacesOptions = {
  // 若没取到使用的小数位数，默认为 0
  defaultDecimal: number
  // 运算时的最大精度，defaultDecimalConfigs 的 precision，参考 decimal.js 文档
  maxDecimal: number
}

/**
 * 获取一个数字的小数位数。   支持通过配置选项来调整默认小数位数和最大小数位数的限制
 * @example
 * getDecimalPlaces(3.14) // 2
 * getDecimalPlaces(2.5e-3) // 4
 * getDecimalPlaces(100) // 0
 * getDecimalPlaces("1.23") // 2
 *
 * @param {Number} originNumber - 原始数值，传入Number或String类型的数字，如 12.43, '54.32'
 * @param {GetDecimalPlacesOptions} [options] - 配置选项（可选） 原始数值，传入Number或String类型的数字，如 12.43, '54.32'
 * @returns {number} 返回经过处理和校验后的小数位数，若输入无效则返回默认小数位数
 */
export const getDecimalPlaces = (
  originNumber: number | string,
  options?: GetDecimalPlacesOptions
): number => {
  const defaultDecimal = options?.defaultDecimal || 0
  const maxDecimal = isNumber(options?.maxDecimal)
    ? options.maxDecimal
    : (defaultDecimalConfigs.precision as number)

  // 输入有效性验证
  if (
    (typeof originNumber !== 'number' && typeof originNumber !== 'string') ||
    Number.isNaN(originNumber as any)
  ) {
    console.warn('请传入正确的数据类型，应为 Number 或 String 类型的数字')
    return defaultDecimal
  }

  const numString = isNumber(originNumber)
    ? Number(originNumber).toString()
    : originNumber

  // console.log(originNumber, ' >>> numString', numString)
  // 科学计数法处理
  if (numString.includes('e-')) {
    const [frontPart, exponentPart] = numString.split('e-')
    // 直接分析科学计数法字符串
    const frontDigits = frontPart.replace('.', '')
    const exponent = parseInt(exponentPart, 10)
    let decimalPlaces: number
    // 对于底数为 1 的情况，如 1e - n，小数位数直接等于指数 n
    if (frontDigits === '1' && exponent > 0) {
      decimalPlaces = exponent
    }
    // 对于底数不为 1 的情况，小数位数是指数加上前导数字部分长度再减 1
    // 这是因为底数部分的第一个数字不是额外增加的小数
    else {
      decimalPlaces =
        exponent + frontDigits.length - (frontPart.includes('.') ? 1 : 0)
    }
    return Math.min(decimalPlaces, maxDecimal)
  }
  // 常规展示小数，如 3.645 这样的处理 -> 3
  const decimalPart = numString.split('.')[1]
  const decimalPlaces = decimalPart?.length || defaultDecimal

  // 最小有效位处理
  return decimalPlaces > maxDecimal ? maxDecimal : decimalPlaces
}
