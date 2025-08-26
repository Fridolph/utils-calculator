import { CalcInst, Calculator } from '../../main'

describe('computeRate()', () => {
  beforeEach(() => {
    CalcInst.clearCache()
    CalcInst.setOption('precision', 2)
    CalcInst.setOption('taxRate', 0.1)
    CalcInst.setOption('rateType', 'incl_gst')
  })

  it('should compute rate correctly with valid inputs', () => {
    // 简单有效输入示例
    expect(CalcInst.computeRate(10, 0.1)).toBe(0.91)
    expect(CalcInst.computeRate(25, 0.1)).toBe(2.27)
  })

  it('should handle zero denominator', () => {
    // 分母为0的情况
    expect(CalcInst.computeRate(10, 0)).toBe(0)
  })

  it('should handle negative values', () => {
    // 分子为负数
    expect(CalcInst.computeRate(-10, 5)).toBe(-10)
    // 分母为负数
    expect(CalcInst.computeRate(10, -50)).toBe(10)
    // 分子分母都为负数
    expect(CalcInst.computeRate(-10, -0.5)).toBe(-10)

    expect(CalcInst.computeRate(-10, 0.5)).toBe(-10)
  })

  it('should return originPrice for invalid Param: userRate', () => {
    // 分母为null
    expect(CalcInst.computeRate(10, null as any)).toBe(10)
    // 分子为非数字类型
    expect(CalcInst.computeRate('not a number' as any, 50)).toBe(0)
  })

  it('should return 0 for invalid inputs', () => {
    // 分子为null
    expect(CalcInst.computeRate(null as any, 50)).toBe(0)
    // 分子分母都为null
    expect(CalcInst.computeRate(null as any, null as any)).toBe(0)
    // 分母为非数字类型
    expect(CalcInst.computeRate(10, ('not a number') as any)).toBe(10)
  })

  it('should utilize cache mechanism correctly', () => {
    CalcInst.clearCache('all')
    const numerator = 10
    const denominator = 0.6

    // 第一次调用生成缓存
    CalcInst.computeRate(numerator, denominator)
    // 第二次相同输入应命中缓存
    CalcInst.computeRate(numerator, denominator)

    // 验证generateCacheKey调用次数
    expect(CalcInst.getCache().computeRate.size).toBe(1)
  })
})
