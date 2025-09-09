import { CalcInst } from '../../main'
import { isNumber } from '../../utils/type'
// import Decimal from 'decimal.js'
// import { defaultUserOptions, defaultDecimalConfigs } from '../../main'

// src/tests/publicFn/calcUnitPrice.test.ts

describe('通用测试 > 补充测试用例', () => {
  beforeEach(() => {
    CalcInst.resetInstance()
  })
  
  it('如未提供任何选项，应使用默认用户选项', () => {
    expect(CalcInst._getUserOptions()).toEqual({
      keepParamsMaxPrecision: true,
      outputDecimalPlaces: -1,
      taxRate: 0.1,
      rateType: 'INCL'
    })
  })

  it('应正确合并部分用户选项', () => {
    CalcInst.setUserOption('taxRate', 0.15)
    expect(CalcInst._getUserOptions()).toMatchObject({
      taxRate: 0.15,
      rateType: 'INCL'
    })
  })

  it('方法级配置应覆盖全局配置', () => {
    CalcInst.setUserOption('outputDecimalPlaces', 2)
    const result = CalcInst.sum([1.1111, 2.2222], { outputDecimalPlaces: 3 })
    expect(result).toBe(3.333)
  })

  it('应重置为默认配置', () => {
    CalcInst.setUserOption('outputDecimalPlaces', 5)
    CalcInst.setUserOption('outputDecimalPlaces', -1)
    expect(CalcInst.sum([1.1111, 2.2222])).toBe(3.3333)
  })

})