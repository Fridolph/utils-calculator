import { CalcInst, Calculator } from '../main'

// ----------------- 单价/总价计算测试模板 -----------------
describe('calcUnitPrice()', () => {
  it('should calculate unit price correctly with valid inputs', () => {
    // 正常计算场景
    expect(CalcInst.calcUnitPrice({ quantity: 4, linePrice: 20 })).toEqual({
      quantity: 4,
      unitPrice: 5,
      linePrice: 20,
    })

    // 浮点数计算验证
    expect(CalcInst.calcUnitPrice({ quantity: 3, linePrice: 10 })).toEqual({
      quantity: 3,
      unitPrice: 3.33,
      linePrice: 10,
    })

    // 自定义精度测试
    CalcInst.setOption('precision', 3)
    expect(CalcInst.calcUnitPrice({ quantity: 3, linePrice: 10 })).toEqual({
      quantity: 3,
      unitPrice: 3.333,
      linePrice: 10,
    })
    CalcInst.setOption('precision', 2) // 恢复默认值
  })

  it('should handle null quantity with linePrice', () => {
    // quantity为null时透传linePrice作为unitPrice
    expect(CalcInst.calcUnitPrice({ quantity: null, linePrice: 50 })).toEqual({
      quantity: null,
      unitPrice: 50,
      linePrice: 50,
    })

    // quantity为null且linePrice为0的场景
    expect(CalcInst.calcUnitPrice({ quantity: null, linePrice: 0 })).toEqual({
      quantity: null,
      unitPrice: 0,
      linePrice: 0,
    })
  })

  it('should return null unitPrice when quantity is zero', () => {
    // quantity=0时强制unitPrice=null
    expect(CalcInst.calcUnitPrice({ quantity: 0, linePrice: 100 })).toEqual({
      quantity: 0,
      unitPrice: null,
      linePrice: 100,
    })

    // quantity=0且linePrice=null的组合
    expect(CalcInst.calcUnitPrice({ quantity: 0, linePrice: null })).toEqual({
      quantity: 0,
      unitPrice: null,
      linePrice: null,
    })
  })

  it('should maintain null inputs for quantity and linePrice', () => {
    // 全null输入透传场景
    expect(CalcInst.calcUnitPrice({ quantity: null, linePrice: null })).toEqual(
      {
        quantity: null,
        unitPrice: null,
        linePrice: null,
      }
    )

    // 保留原始unitPrice字段（即使传入值会被覆盖）
    const input = { quantity: null, unitPrice: 99, linePrice: null }
    const result = CalcInst.calcUnitPrice(input)
    expect(result).toEqual({
      quantity: null,
      unitPrice: null, // 虽然输入有unitPrice，但计算结果仍为null
      linePrice: null,
    })
  })

  it('should utilize cache mechanism correctly', () => {
    const cacheKeySpy = jest.spyOn((CalcInst) as any, 'generateCacheKey')
    const input = { quantity: 5, linePrice: 25 } as CalcBaseTotalParams

    // 第一次调用生成缓存
    CalcInst.calcUnitPrice(input)
    // 第二次相同输入应命中缓存
    CalcInst.calcUnitPrice(input)

    // 验证generateCacheKey调用次数
    expect(cacheKeySpy).toHaveBeenCalledTimes(1)

    // 验证缓存存储正确性
    const cache = CalcInst.getCache('calcUnitPrice')
    const cacheKey = cacheKeySpy.mock.results[0]?.value
    expect(cache.has(cacheKey)).toBe(true)

    cacheKeySpy.mockRestore()
  })

  it('should respect custom precision configuration', () => {
    // 测试自定义精度对计算结果的影响
    CalcInst.setOption('precision', 3)

    // 验证3位精度计算
    expect(CalcInst.calcUnitPrice({ quantity: 3, linePrice: 10 } as CalcBaseTotalParams)).toEqual({
      quantity: 3,
      unitPrice: 3.333,
      linePrice: 10,
    })

    // 验证更高位小数的四舍五入处理
    expect(CalcInst.calcUnitPrice({ quantity: 3, linePrice: 10.0005 } as CalcBaseTotalParams)).toEqual(
      {
        quantity: 3,
        unitPrice: 3.334, // 10.0005/3=3.3335 → 保留3位后四舍五入为3.334
        linePrice: 10.0005,
      }
    )

    // 测试方法级精度覆盖全局配置
    expect(
      CalcInst.calcUnitPrice(
        { quantity: 3, linePrice: 10 } as CalcBaseTotalParams,
        { precision: 1 } as BaseOptions, // 方法级配置优先级更高
      )
    ).toEqual({
      quantity: 3,
      unitPrice: 3.3,
      linePrice: 10,
    })

    // 恢复默认精度
    CalcInst.setOption('precision', 2)
  })

  it('should handle precision edge cases', () => {
    CalcInst.setOption('precision', 0) // 禁用小数
    expect(CalcInst.calcUnitPrice({ quantity: 3, linePrice: 10 } as CalcBaseTotalParams)).toEqual({
      quantity: 3,
      unitPrice: 3, // 10/3=3.333 → 保留0位小数后为3
      linePrice: 10,
    })

    CalcInst.setOption('precision', 3) // 高精度场景
    expect(CalcInst.calcUnitPrice({ quantity: 3, linePrice: 10 } as CalcBaseTotalParams)).toEqual({
      quantity: 3,
      unitPrice: 3.3333, // 10/3=3.333333... → 保留4位后为3.3333
      linePrice: 10,
    })
    CalcInst.setOption('precision', 2)
  })
})
