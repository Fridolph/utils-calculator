import { CalcInst } from '../../main'
import Decimal from 'decimal.js'
import { defaultUserOptions, defaultDecimalConfigs } from '../../main'

describe('默认配置符合预期', () => {
  it('defaultUserOptions', () => {
    expect(defaultUserOptions).toEqual({
      keepParamsMaxPrecision: true,
      outputDecimalPlaces: -1,
      taxRate: 0.1,
      rateType: 'INCL'
    })
  })

  it('defaultDecimalConfigs', () => {
    expect(defaultDecimalConfigs).toEqual({
      precision: 20, // 计算精度，参考 decimal.js 文档，可根据需求灵活调整
      rounding: Decimal.ROUND_HALF_UP, // 使用标准四舍五入 5进位 4舍去
      toExpNeg: -7,
      toExpPos: 21,
      maxE: 9e15,
      minE: -9e15,
      modulo: 1,
      crypto: false,
    })
  })
})

describe('精度截断测试', () => {
  beforeEach(() => {
    CalcInst.resetInstance()
  })

  it('sum() 默认保留精度，不会截断精度', () => {
    expect(CalcInst.sum([1.111, 2.222])).toBe(3.333)
  })

  it('calcUnitPrice() -> 保留精度不会截断，可用 calc 处理为 Decimal 实例继续进行运算 ', () => {
    const result = CalcInst.calcUnitPrice({ quantity: 3, linePrice: 10 })
    expect(CalcInst.calc(result.unitPrice).toFixed(2)).toBe('3.33')
  })
})

describe('测试 calc 方法', () => {
  beforeEach(() => {
    CalcInst.resetInstance()
  })

  it('calc() 返一个 Decemal 实例，并可用于计算', () => {
    const calc = CalcInst.calc(123)
    expect(calc).toBeInstanceOf(Decimal)
    expect(calc.plus(1).toNumber()).toBe(124)
  })
})
