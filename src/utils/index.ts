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
  precision: 20, // 暂时使用20位精度，同 Decimal 默认配置。可根据需求灵活调整
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
 * @param {GetDecimalPlacesOptions} [options] - 配置选项（可选）
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

  // 科学计数法处理
  // 添加了对e0的处理逻辑，修改了科学计数法e-中底数部分小数位数计算逻辑
  if (numString.includes('e')) {
    if (numString.includes('e0')) {
      const newNum = eval(numString)
      return getDecimalPlaces(newNum, options)
    }
    else if (numString.includes('e-')) {
      const [frontPart, exponentPart] = numString.split('e-')
      const exponent = parseInt(exponentPart, 10)
      if (exponent === 0) return 0
      const baseDecimalPart = frontPart.split('.')[1] || ''
      const baseDecimalLength = baseDecimalPart.length
      let decimalPlaces: number
      if (frontPart === '1' && exponent > 0) {
        decimalPlaces = exponent
      } else {
        decimalPlaces = exponent + baseDecimalLength
      }
      // 新增逻辑：判断经过指数运算后是否为整数
      const numAfterExponent = parseFloat(frontPart) * Math.pow(10, -exponent)
      if (Number.isInteger(numAfterExponent)) {
        decimalPlaces = 0
      }
      return Math.min(decimalPlaces, maxDecimal)
    }
  }
  // 常规展示小数，如 3.645 这样的处理 -> 3
  // 添加了对纯零小数且长度大于最大小数位数限制时返回0的处理
  const decimalPart = numString.split('.')[1]
  const decimalPlaces = decimalPart?.length || defaultDecimal
  if (
    decimalPart &&
    decimalPart.split('').every((digit) => digit === '0') &&
    decimalPlaces > maxDecimal
  ) {
    return 0
  }
  // 最小有效位处理
  return decimalPlaces > maxDecimal ? maxDecimal : decimalPlaces
}
