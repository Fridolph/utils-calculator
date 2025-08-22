import { CalcInst, Calculator } from '../main'

// ----------------- 基础方法测试模板 -----------------
describe('sum()', () => {
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
    CalcInst.setOption('precision', 2)

    // 验证3位精度数组求和
    expect(CalcInst.sum([1.111, 2.222, 3.333])).toBe(6.666) // 无四舍五入

    // 验证需要四舍五入的场景
    expect(CalcInst.sum([1.1115, 2.2225])).toBe(3.334) // 1.1115+2.2225=3.334 → 保留3位后为3.334

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
  });

  it('should utilize cache mechanism', () => {
    // 测试缓存命中情况
    const cacheKeySpy = jest.spyOn((CalcInst) as any, 'generateCacheKey')
    const input = [1, 2, 3]

    // 第一次调用生成缓存
    CalcInst.sum(input)
    // 第二次相同输入应命中缓存
    CalcInst.sum(input)

    // 验证generateCacheKey只调用一次（缓存命中）
    expect(cacheKeySpy).toHaveBeenCalledTimes(1)

    // 清理mock
    cacheKeySpy.mockRestore()
  })
})
