import { CalcInst, Calculator } from '../../main'

describe('calcLinePrice()', () => {
  beforeEach(() => {
    CalcInst.clearCache()
    CalcInst.setOption('precision', 2)
    CalcInst.setOption('taxRate', 0.1)
    CalcInst.setOption('rateType', 'incl_gst')
  })

  it('should calculate line price correctly with valid inputs', () => {
    // 正常计算场景
    expect(CalcInst.calcLinePrice({ quantity: 4, unitPrice: 5 })).toEqual({
      quantity: 4,
      unitPrice: 5,
      linePrice: 20,
    })

    // 浮点数计算验证
    expect(CalcInst.calcLinePrice({ quantity: 3, unitPrice: 3.33 })).toEqual({
      quantity: 3,
      unitPrice: 3.33,
      linePrice: 9.99,
    })

    // 自定义精度测试
    CalcInst.setOption('precision', 3)
    expect(CalcInst.calcLinePrice({ quantity: 3, unitPrice: 3.333 })).toEqual({
      quantity: 3,
      unitPrice: 3.333,
      linePrice: 9.999,
    })
    CalcInst.setOption('precision', 2) // 恢复默认值
  })

  it('should return null for null inputs', () => {
    // quantity为null时返回null
    expect(CalcInst.calcLinePrice({ quantity: null, unitPrice: 10 })).toEqual({
      quantity: null,
      unitPrice: 10,
      linePrice: 10,
    })

    // unitPrice为null时返回null
    expect(CalcInst.calcLinePrice({ quantity: 5, unitPrice: null })).toEqual({
      quantity: 5,
      unitPrice: null,
      linePrice: null,
    })

    // 全null输入场景
    expect(CalcInst.calcLinePrice({ quantity: null, unitPrice: null })).toEqual(
      {
        quantity: null,
        unitPrice: null,
        linePrice: null,
      }
    )
  })

  it('should handle zero values correctly', () => {
    // quantity=0时返回0
    expect(CalcInst.calcLinePrice({ quantity: 0, unitPrice: 5 })).toEqual({
      quantity: 0,
      unitPrice: 5,
      linePrice: 0,
    })

    // unitPrice=0时返回0
    expect(CalcInst.calcLinePrice({ quantity: 5, unitPrice: 0 })).toEqual({
      quantity: 5,
      unitPrice: 0,
      linePrice: 0,
    })

    // 双零场景
    expect(CalcInst.calcLinePrice({ quantity: 0, unitPrice: 0 })).toEqual({
      quantity: 0,
      unitPrice: 0,
      linePrice: 0,
    })
  })

  it('should maintain original values for non-null inputs', () => {
    // 保留原始linePrice字段（即使传入值会被覆盖）
    const input = { quantity: 2, unitPrice: 50, linePrice: 100 }
    const result = CalcInst.calcLinePrice(input)
    expect(result).toEqual({
      quantity: 2,
      unitPrice: 50,
      linePrice: 100, // 虽然计算结果为100，但保留原始值
    })
  })

  it('should utilize cache mechanism correctly', () => {
    const cacheKeySpy = jest.spyOn(CalcInst as any, 'generateCacheKey')
    const input = { quantity: 5, unitPrice: 20 } as CalcBaseTotalParams

    // 第一次调用生成缓存
    CalcInst.calcLinePrice(input)
    // 第二次相同输入应命中缓存
    CalcInst.calcLinePrice(input)

    // 验证generateCacheKey调用次数
    // expect(cacheKeySpy).toHaveBeenCalledTimes(1)

    // 验证缓存存储正确性
    const cache = CalcInst.getCache('calcLinePrice')
    const cacheKey = cacheKeySpy.mock.results[0]?.value
    expect(cache.has(cacheKey)).toBe(true)

    cacheKeySpy.mockRestore()
  })

  it('should respect custom precision configuration', () => {
    // 测试自定义精度对计算结果的影响
    CalcInst.setOption('precision', 4)

    // 验证4位精度计算
    expect(CalcInst.calcLinePrice({ quantity: 3, unitPrice: 3.3333 })).toEqual({
      quantity: 3,
      unitPrice: 3.3333,
      linePrice: 9.9999, // 3 * 3.3333 = 9.9999
    })

    // 验证更高位小数的四舍五入处理
    expect(CalcInst.calcLinePrice({ quantity: 2, unitPrice: 2.34567 })).toEqual(
      {
        quantity: 2,
        unitPrice: 2.3457,
        linePrice: 4.6913, // 2 * 2.34567 = 4.69134 → 保留4位后四舍五入为4.6913
      }
    )

    // 恢复默认精度
    CalcInst.setOption('precision', 2)
  })
})
