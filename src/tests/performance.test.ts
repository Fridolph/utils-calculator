// 性能边界测试
import { CalcInst } from '../main'

describe('Performance Boundaries', () => {
  beforeEach(() => {
    CalcInst.clearCache()
    CalcInst.setOption('precision', 2)
    CalcInst.setOption('taxRate', 0.1)
    CalcInst.setOption('rateType', 'incl_gst')
  })

  // 1. 测试空数组处理
  it('should handle empty arrays', () => {
    expect(CalcInst.sum([])).toBe(0)
    expect(CalcInst.sum({})).toBe(0)
  })

  // 2. 测试大数相加
  it('should handle large numbers', () => {
    const largeNumber = 999999.999999
    const ret1 = CalcInst.sum([largeNumber, largeNumber])
    // 首先要明确 999999.999999 + 999999.999999 = 1999999.999998
    // 但在没指定精度的情况下，默认2位 -> 2000000.00
    expect(ret1).toBe(2000000)

    const ret2 = CalcInst.sum([largeNumber, largeNumber], { precision: 6 })
    expect(ret2).toBe(1999999.999998)
  })

  // 3. 测试极小数计算
  it('should handle tiny numbers', () => {
    const smallNumber1 = 0.000000001
    const smallNumber2 = 0.000000002
    const ret1 = CalcInst.sum([0.000000001, 0.000000002])
    // 首先要明确 0.000000001 + 0.000000002 = 0.000000003
    // 但在没指定精度的情况下，默认2位 -> 0.00
    expect(ret1).toBe(0)
    // 指定了计算精度后
    const ret2 = CalcInst.sum([smallNumber1, smallNumber2], { precision: 9 })
    expect(ret2).toBe(0.000000003)
  })
})