import { CalcInst, Calculator } from '../main'

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
    expect(CalcInst.computeRate(10, 0)).toBeNaN()
  })

  // it('should handle negative values', () => {
  //   // 分子为负数
  //   expect(CalcInst.computeRate(-10, 50)).toBe(-0.2)
  //   // 分母为负数
  //   expect(CalcInst.computeRate(10, -50)).toBe(-0.2)
  //   // 分子分母都为负数
  //   expect(CalcInst.computeRate(-10, -50)).toBe(0.2)
  // })

  // it('should return null for invalid inputs', () => {
  //   // 分子为null
  //   expect(CalcInst.computeRate(null as any, 50)).toBeNull()
  //   // 分母为null
  //   expect(CalcInst.computeRate(10, null as any)).toBeNull()
  //   // 分子分母都为null
  //   expect(CalcInst.computeRate(null as any, null as any)).toBeNull()
  //   // 分子为非数字类型
  //   expect(CalcInst.computeRate('not a number' as any, 50)).toBeNull()
  //   // 分母为非数字类型
  //   expect(CalcInst.computeRate(10, ('not a number') as any)).toBeNull()
  // })

  // it('should utilize cache mechanism correctly', () => {
  //   const cacheKeySpy = jest.spyOn((CalcInst) as any, 'generateCacheKey')
  //   const numerator = 10
  //   const denominator = 50

  //   // 第一次调用生成缓存
  //   CalcInst.computeRate(numerator, denominator)
  //   // 第二次相同输入应命中缓存
  //   CalcInst.computeRate(numerator, denominator)

  //   // 验证generateCacheKey调用次数
  //   expect(cacheKeySpy).toHaveBeenCalledTimes(1)

  //   // 验证缓存存储正确性
  //   const cache = CalcInst.getCache('computeRate')
  //   const cacheKey = cacheKeySpy.mock.results[0]?.value
  //   expect(cache.has(cacheKey)).toBe(true)

  //   cacheKeySpy.mockRestore()
  // })
})
