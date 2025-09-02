import Decimal from 'decimal.js'

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
export const $number = (value: number, userOptions?: Decimal.Config) => {
  const mergedOptions = Object.assign({}, defaultDecimalConfig, userOptions)

  const DecInst = Decimal.clone(mergedOptions)
  return DecInst(value)
}

/**
 * 获取一个 Number | 类数字字符串的 小数位数
 * @param num 
 * @returns 
 */
export const getDecimalPlaces = (num: number | string, defaultDecimal = 0, maxDecimal = 16): number => {
  // 输入有效性验证
  if (
    (typeof num !== 'number' && typeof num !== 'string')
    || isNaN(num as any)
  ) {
    console.warn('请传入正确的数据类型，应为 Number 或 String 类型的数字')
    return defaultDecimal
  }
  const numString = isNumber(num) ? Number(num).toString() : num
  // console.log(num, ' >>> numString', numString)
  // 科学计数法处理
  if (numString.includes('e-')) {
    const waitHandleArr = numString.split('e-')
    console.log(num, '>>> numString', waitHandleArr, waitHandleArr[0].split('.'))
    // 如果数字有小数点，继续处理
    const leftDecimal = waitHandleArr[0].split('.')?.length > 1 ? waitHandleArr[0].split('.')?.length : 0
    const rightDecimal = Number(waitHandleArr[1]) ?? 0
    
    // console.log(leftDecimal, rightDecimal)
    const finalNum = leftDecimal + rightDecimal
    return finalNum > maxDecimal ? maxDecimal : finalNum
  }
  // 常规小数处理
  const decimalPart = numString.split('.')[1]
  const decimalPlaces = decimalPart?.length || defaultDecimal

  // 最小有效位处理
  return decimalPlaces
}