import { CalcInst, Calculator } from '../main'

describe('calculateDiscountedPrice()', () => {
  it('should calculate discounted price correctly with valid inputs', () => {
    // 正常折扣计算场景
    expect(CalcInst.calculateDiscountedPrice(100, 0.2)).toBe(80)
    expect(CalcInst.calculateDiscountedPrice(50, 0.5)).toBe(25)

    // 折扣为0的场景
    expect(CalcInst.calculateDiscountedPrice(150, 0)).toBe(150)
  })

  it('should handle negative original price', () => {
    // 原始价格为负数的情况
    expect(CalcInst.calculateDiscountedPrice(-100, 0.2)).toBe(-80)
    expect(CalcInst.calculateDiscountedPrice(-50, 0.5)).toBe(-25)
  })

  it('should handle negative discount rate', () => {
    // 折扣率为负数的情况
    expect(CalcInst.calculateDiscountedPrice(100, -0.2)).toBe(120)
    expect(CalcInst.calculateDiscountedPrice(50, -0.5)).toBe(75)
  })

  it('should return null for invalid inputs', () => {
    // 原始价格为null的情况
    expect(CalcInst.calculateDiscountedPrice(null, 0.2)).toBeNull()
    // 折扣率为null的情况
    expect(CalcInst.calculateDiscountedPrice(100, null)).toBeNull()
    // 原始价格和折扣率都为null的情况
    expect(CalcInst.calculateDiscountedPrice(null, null)).toBeNull()
    // 原始价格为非数字类型
    expect(
      CalcInst.calculateDiscountedPrice('not a number' as any, 0.2)
    ).toBeNull()
    // 折扣率为非数字类型
    expect(
      CalcInst.calculateDiscountedPrice(100, 'not a discount' as any)
    ).toBeNull()
  })

  // it('should utilize cache mechanism correctly', () => {
  //   const cacheKeySpy = jest.spyOn((CalcInst) as any, 'generateCacheKey')
  //   const originalPrice = 100
  //   const discountRate = 0.2

  //   // 第一次调用生成缓存
  //   CalcInst.calculateDiscountedPrice(originalPrice, discountRate)
  //   // 第二次相同输入应命中缓存
  //   CalcInst.calculateDiscountedPrice(originalPrice, discountRate)

  //   // 验证generateCacheKey调用次数
  //   expect(cacheKeySpy).toHaveBeenCalledTimes(1)

  //   // 验证缓存存储正确性
  //   const cache = CalcInst.getCache('calculateDiscountedPrice')
  //   const cacheKey = cacheKeySpy.mock.results[0]?.value
  //   expect(cache.has(cacheKey)).toBe(true)

  //   cacheKeySpy.mockRestore()
  // })
})
