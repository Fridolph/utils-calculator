import Decimal from 'decimal.js'

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
  precision: 10, // 暂时使用10位精度，可根据需求灵活调整
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
