import { CalcInst } from '../../main'

describe('精度截断测试', () => {
  beforeEach(() => {
    CalcInst.setUserOption('keepParamsMaxPrecision', false)
    CalcInst.setUserOption('outputDecimalPlaces', 2)
  })

  it('sum() 应按配置截断精度', () => {
    expect(CalcInst.sum([1.111, 2.222])).toBe(3.33)
  })

  it('calcUnitPrice() 应按配置截断精度', () => {
    const result = CalcInst.calcUnitPrice({ quantity: 3, linePrice: 10 })
    expect(result.unitPrice).toBe(3.33)
  })
})