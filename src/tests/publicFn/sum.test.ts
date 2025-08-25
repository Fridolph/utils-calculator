import { CalcInst } from '../../main'

// ----------------- 基础方法测试模板 -----------------
describe('sum()', () => {
  beforeEach(() => {
    CalcInst.clearCache()
    CalcInst.setOption('precision', 2)
    CalcInst.setOption('taxRate', 0.1)
    CalcInst.setOption('rateType', 'incl_gst')
  })

  it('should calculate sum of number array correctly', () => {
    // 测试数组求和
    expect(CalcInst.sum([1, 2, 3])).toBe(6)
    expect(CalcInst.sum([10, -5, 3.5])).toBe(8.5)
  })

  it('should handle object input with numeric values', () => {
    // 测试对象求和
    expect(CalcInst.sum({ a: 1, b: 2, c: 3 })).toBe(6)
    expect(CalcInst.sum({ x: 10, y: null as any, z: 5 })).toBe(15) // null值应被忽略
  })

  it('should filter out non-number values', () => {
    // 测试过滤非数值类型
    expect(CalcInst.sum([1, '2' as any, true, 3])).toBe(4) // 只计算数字类型
    expect(CalcInst.sum([null, undefined, 5, 'abc' as any])).toBe(5) // 过滤所有非数字
  })

  it('should respect custom precision configuration', () => {
    // 测试自定义精度对计算结果的影响
    CalcInst.setOption('precision', 3)

    // 验证4位精度数组求和，最后保留3位小数
    // expect(CalcInst.sum([1.1111, 2.2222, 3.3333])).toBe(6.667) // 无四舍五入 6.6666
    expect(CalcInst.sum([1.1111, 2.2222, 3.3333], { precision: 3 })).toBe(6.667) // 无四舍五入 6.6666
    // 验证需要四舍五入的场景
    expect(CalcInst.sum([1.11555, 2.22255])).toBe(3.338) // 1.11555 + 2.22255 = 3.3381 → 保留3位后为3.338

    // 测试方法级精度覆盖全局配置
    expect(
      CalcInst.sum(
        [1.1111, 2.2222],
        { precision: 1 } as BaseOptions, // 方法级配置优先级更高
      )
    ).toBe(3.3) // 1.1111+2.2222=3.3333 → 保留1位后为3.3

    // 测试负数与高精度组合
    expect(CalcInst.sum([10, -3.333])).toBe(6.667) // 10-3.333=6.667

    // 测试零值与高精度组合
    expect(CalcInst.sum([0.0005, 0.0005])).toBe(0.001) // 0.0005+0.0005=0.001

    // 恢复默认精度
    CalcInst.setOption('precision', 2)
  })

  it('should handle precision edge cases', () => {
    CalcInst.setOption('precision', 0)  // 禁用小数
    expect(CalcInst.sum([2.6, 3.5])).toBe(6)  // 2.6+3.5=6.1 → 保留0位小数后为6

    CalcInst.setOption('precision', 4)  // 高精度场景
    expect(CalcInst.sum([1.1111, 2.2222])).toBe(3.3333)  // 无四舍五入
    expect(CalcInst.sum([1.11111, 2.22222])).toBe(3.3333)  // 保留4位后为3.3333
    CalcInst.setOption('precision', 2) // 恢复默认值
  })

  it('should utilize cache mechanism correctly', () => {
    CalcInst.clearCache('all')

    // 第一次调用生成缓存
    CalcInst.sum([1,2,3,4,5])
    // 第二次相同输入应命中缓存
    CalcInst.sum([1,2,3,4,5])
    // 验证generateCacheKey调用次数
    expect(CalcInst.getCache().sum.size).toBe(1)

    CalcInst.sum({
      a: 1,
      b: 2,
      c: 3,
      d: 4,
      e: 5,
      f: 6,
    })
    CalcInst.sum({
      a: 1,
      b: 2,
      c: 3,
      d: 4,
      e: 5,
      f: 6,
    })
    // 结合上面的应该计算了 4 次，由于优化了缓存，只计算 2 次
    expect(CalcInst.getCache().sum.size).toBe(2)
  })
})
