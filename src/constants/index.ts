import Decimal from 'decimal.js'

export const defaultDecimalConfigs: Decimal.Config = {
  precision: 20, // 计算精度，参考 decimal.js 文档，可根据需求灵活调整
  rounding: Decimal.ROUND_HALF_UP, // 使用标准四舍五入 5进位 4舍去
  toExpNeg: -7,
  toExpPos: 21,
  maxE: 9e15,
  minE: -9e15,
  modulo: 1,
  crypto: false,
}