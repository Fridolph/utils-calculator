import { CalcInst } from '../../main'
import Decimal from 'decimal.js'

describe.skip('精度截断测试', () => {
  beforeEach(() => {
    CalcInst.resetInstance()
  })

  it('sum() 应按配置截断精度', () => {
    expect(CalcInst.sum([1.111, 2.222])).toBe(3.33)
  })

  it('calcUnitPrice() 应按配置截断精度', () => {
    const result = CalcInst.calcUnitPrice({ quantity: 3, linePrice: 10 })
    expect(result.unitPrice).toBe(3.33)
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
