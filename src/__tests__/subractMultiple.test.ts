import { CalcInst } from '../main'

// ----------------- 减法测试模板 -----------------
describe('subtractMultiple()', () => {
  beforeEach(() => {
    CalcInst.clearCache()
    CalcInst.setOption('precision', 2)
    CalcInst.setOption('taxRate', 0.1)
    CalcInst.setOption('rateType', 'incl_gst')
  })

  it('should subtract single value correctly', () => {
    // 测试基本减法运算
    expect(CalcInst.subtractMultiple(9.99, [8.88])).toBe(1.11)
    expect(CalcInst.subtractMultiple(15, [1, 2, 3, 4])).toBe(5)
    expect(CalcInst.subtractMultiple(100, [50.5, 20.25])).toBe(29.25)
  })

  it('should handle null initial value', () => {
    // 测试初始值为null的边界情况
    expect(CalcInst.subtractMultiple(null, [5])).toBeNull()
    expect(CalcInst.subtractMultiple(null, [1, 2, 3])).toBeNull()
  })

  it('should return null for invalid inputs', () => {
    // 数值参数非法
    expect(CalcInst.subtractMultiple(10, [null] as any[])).toBeNull()
    expect(CalcInst.subtractMultiple(10, ['abc'] as any[])).toBeNull()
    expect(CalcInst.subtractMultiple(NaN, [5] as any[])).toBeNull()
    expect(CalcInst.subtractMultiple(10, [NaN] as any[])).toBeNull()

    // 基础值参数非法
    expect(CalcInst.subtractMultiple(null as any, [5])).toBeNull()
    expect(CalcInst.subtractMultiple('abc' as any, [5])).toBeNull()
  })

  it('should filter out non-number values in subtract array', () => {
    // 测试非数字值过滤
    expect(CalcInst.subtractMultiple(20, [5, '10', true] as any[])).toBe(15)
    expect(CalcInst.subtractMultiple(30, [10, null] as any[])).toBe(20)
  })

  it('should utilize cache mechanism correctly', () => {
    // 验证缓存机制有效性
    const cacheKeySpy = jest.spyOn((CalcInst) as any, 'generateCacheKey')
    const initialValue = 100
    const subtractValues = [10, 20, 30]

    // 第一次调用生成缓存
    CalcInst.subtractMultiple(initialValue, subtractValues)
    // 第二次相同输入应命中缓存
    CalcInst.subtractMultiple(initialValue, subtractValues)

    // 验证generateCacheKey只调用一次
    expect(cacheKeySpy).toHaveBeenCalledTimes(1)
    // 验证缓存存储正确性
    const cache = CalcInst.getCache('subtractMultiple')
    // expect(cache.has(cacheKeySpy.mock.results[0]?.value)).toBe(true)
    expect(cache.has(cacheKeySpy.mock.results[0]?.value)).toBe(true)

    cacheKeySpy.mockRestore()
  })

  it('should respect precision configuration', () => {
    // 测试精度配置生效
    CalcInst.setOption('precision', 3)
    expect(CalcInst.subtractMultiple(10, [3.333])).toBe(6.667)
    expect(CalcInst.subtractMultiple(5, [1.111, 1.111])).toBe(2.778)
    CalcInst.setOption('precision', 2) // 恢复默认值
  })

  it('should work with empty subtract array', () => {
    // 测试空数组作为减数的情况
    expect(CalcInst.subtractMultiple(50, [])).toBe(50)
    expect(CalcInst.subtractMultiple(100, [])).toBe(100)
  })

  it('should handle zero values correctly', () => {
    // 测试零值处理
    expect(CalcInst.subtractMultiple(0, [5])).toBe(-5)
    expect(CalcInst.subtractMultiple(5, [0])).toBe(5)
    expect(CalcInst.subtractMultiple(0, [0])).toBe(0)
  })

  it('should respect custom precision configuration', () => {
    // 测试自定义精度对计算结果的影响
    CalcInst.setOption('precision', 3)

    // 验证3位精度计算
    expect(CalcInst.subtractMultiple(10, [3.333])).toBe(6.667) // 10-3.333=6.667

    // 验证更高位小数的四舍五入处理
    expect(CalcInst.subtractMultiple(5, [1.1115])).toBe(3.889) // 5-1.1115=3.8885 → 保留3位后四舍五入为3.889

    // 测试方法级精度覆盖全局配置
    expect(
      CalcInst.subtractMultiple(
        10,
        [3.3333],
        { precision: 1 } as BaseOptions, // 方法级配置优先级更高
      )
    ).toBe(6.7) // 10-3.3333=6.6667 → 保留1位小数后为6.7

    // 测试零值与高精度组合
    expect(CalcInst.subtractMultiple(0, [0.0005])).toBe(-0.001) // 0-0.0005=-0.0005 → 保留3位后为-0.001

    // 恢复默认精度
    CalcInst.setOption('precision', 2)
  })
})
