import { CalcInst } from '../../main'

describe('calculateDiscountedPrice()', () => {
  beforeEach(() => {
    CalcInst.resetInstance()
  })

  it('应该在有效输入下正确计算折扣价格', () => {
    // 正常折扣计算场景
    expect(CalcInst.calculateDiscountedPrice(100, 0.2)).toBe(80)
    expect(CalcInst.calculateDiscountedPrice(50, 0.5)).toBe(25)

    // 折扣为0的场景
    expect(CalcInst.calculateDiscountedPrice(150, 0)).toBe(150)
  })

  it('应该处理负原始价格', () => {
    // 原始价格为负数的情况
    expect(CalcInst.calculateDiscountedPrice(-100, 0.2)).toBe(-100)
    expect(CalcInst.calculateDiscountedPrice(-50, 0.5)).toBe(-50)
  })

  it('应该处理负折扣率', () => {
    // 折扣率为负数的情况
    expect(CalcInst.calculateDiscountedPrice(100, -0.2)).toBe(100)
    expect(CalcInst.calculateDiscountedPrice(50, -0.5)).toBe(50)
  })

  it('应该对无效输入返回 null', () => {
    // 原始价格为null的情况
    expect(CalcInst.calculateDiscountedPrice(null, 0.2)).toBeNull()
    // 折扣率为null的情况
    expect(CalcInst.calculateDiscountedPrice(100, null)).toBeNull()
    // 原始价格和折扣率都为null的情况
    expect(CalcInst.calculateDiscountedPrice(null, null)).toBeNull()
    // 原始价格为非数字类型
    expect(CalcInst.calculateDiscountedPrice('not a number' as any, 0.2)).toBeNull()
    // 折扣率为非数字类型
    expect(CalcInst.calculateDiscountedPrice(100, 'not a discount' as any)).toBeNull()
  })

  it('应该正确利用缓存机制', () => {
    CalcInst.clearCache('calculateDiscountedPrice')
    const originalPrice = 100
    const discountRate = 0.2

    // 第一次调用生成缓存
    CalcInst.calculateDiscountedPrice(originalPrice, discountRate)
    // 第二次相同输入应命中缓存，所以只计算 1 次
    CalcInst.calculateDiscountedPrice(originalPrice, discountRate)

    // 验证缓存命中
    expect(CalcInst.queryCacheStat().calculateDiscountedPrice).toBe(1)
  })

  describe('精度配置测试', () => {
    it('应该使用默认精度配置', () => {
      expect(CalcInst.calculateDiscountedPrice(100.111, 0.1)).toBe(90.0999)
    })

    it('应该使用方法级精度配置覆盖全局配置', () => {
      expect(
        CalcInst.calculateDiscountedPrice(100.111, 0.1, { outputDecimalPlaces: 2 })
      ).toBe(90.1)
    })

    it('应该处理不同精度配置的结果', () => {
      const originalPrice = 99.999
      const discountRate = 0.3333

      expect(
        CalcInst.calculateDiscountedPrice(originalPrice, discountRate, {
          outputDecimalPlaces: 0,
        })
      ).toBe(67)
      expect(
        CalcInst.calculateDiscountedPrice(originalPrice, discountRate, {
          outputDecimalPlaces: 1,
        })
      ).toBe(66.7)
      expect(
        CalcInst.calculateDiscountedPrice(originalPrice, discountRate, {
          outputDecimalPlaces: 2,
        })
      ).toBe(66.67)

      // 99.999 * 0.3333 = 33.3296667 算出来应该是 7 位，这里符合预期
      // 7 位数最后用户要求展示 3 位 > 99.999 - 33.3296667 = 66.6693333
      expect(
        CalcInst.calculateDiscountedPrice(originalPrice, discountRate, {
          outputDecimalPlaces: 3,
        })
      ).toBe(66.669)

      expect(
        CalcInst.calculateDiscountedPrice(originalPrice, discountRate, {
          outputDecimalPlaces: 2,
        })
      ).toBe(66.67)
    })
  })

  describe('边界值测试', () => {
    it('应该处理折扣率为1的情况（免费）', () => {
      expect(CalcInst.calculateDiscountedPrice(100, 1)).toBe(0)
      expect(CalcInst.calculateDiscountedPrice(50.5, 1)).toBe(0)
    })

    it('应该处理原始价格为0的情况', () => {
      expect(CalcInst.calculateDiscountedPrice(0, 0.5)).toBe(0)
      expect(CalcInst.calculateDiscountedPrice(0, 0)).toBe(0)
    })

    it('应该处理极小数值', () => {
      expect(CalcInst.calculateDiscountedPrice(0.0001, 0.5)).toBe(0.00005)
    })

    it('应该处理极大数值', () => {
      expect(CalcInst.calculateDiscountedPrice(999999999, 0.1)).toBe(899999999.1)
    })
  })

  describe('缓存机制验证', () => {
    it('应该为不同输入生成不同的缓存键', () => {
      CalcInst.clearCache('calculateDiscountedPrice')

      // 不同原始价格
      CalcInst.calculateDiscountedPrice(100, 0.2)
      CalcInst.calculateDiscountedPrice(200, 0.2)
      expect(CalcInst.getCache().calculateDiscountedPrice.size).toBe(2)

      // 不同折扣率
      CalcInst.calculateDiscountedPrice(100, 0.3)
      expect(CalcInst.getCache().calculateDiscountedPrice.size).toBe(3)
    })

    it('应该确保相同输入命中缓存', () => {
      CalcInst.clearCache('calculateDiscountedPrice')

      // 第一次调用
      CalcInst.calculateDiscountedPrice(150, 0.25)
      expect(CalcInst.queryCacheStat().calculateDiscountedPrice).toBe(1)

      // 第二次相同调用应该命中缓存
      CalcInst.calculateDiscountedPrice(150, 0.25)
      expect(CalcInst.queryCacheStat().calculateDiscountedPrice).toBe(1)

      // 不同配置应生成新缓存
      CalcInst.calculateDiscountedPrice(150, 0.25, { outputDecimalPlaces: 3 })
      expect(CalcInst.queryCacheStat().calculateDiscountedPrice).toBe(2)
    })
  })
})
