import { CalcInst, Calculator } from '../main'

describe('decimalToPercent()', () => {
  it('should convert valid decimals to percentages correctly', () => {
    // 正常转换场景
    expect(CalcInst.decimalToPercent(0.5)).toEqual(50)
    expect(CalcInst.decimalToPercent(0.25)).toEqual(25)
    expect(CalcInst.decimalToPercent(1)).toEqual(100)

    // 边界值测试
    expect(CalcInst.decimalToPercent(0)).toEqual(0)
    expect(CalcInst.decimalToPercent(-0.5)).toEqual(-50)
  })

  it('should handle null input', () => {
    // 输入为null的场景
    expect(CalcInst.decimalToPercent(null)).toBeNull()
  })

  it('should handle non - numeric input', () => {
    // 输入为非数字类型的场景
    expect(CalcInst.decimalToPercent(NaN)).toBeNull()
    expect(CalcInst.decimalToPercent('not a number' as any)).toBeNull()
  })

  it('should respect custom precision configuration', () => {
    // 设置自定义精度
    CalcInst.setOption('precision', 3)
    expect(CalcInst.decimalToPercent(0.3333)).toEqual(33.333)
    expect(CalcInst.decimalToPercent(0.3339)).toEqual(33.339)

    // 测试方法级精度覆盖全局配置
    expect(CalcInst.decimalToPercent(0.3333, 1)).toEqual(33.3)

    // 恢复默认精度
    CalcInst.setOption('precision', 2)
  })

  it('should handle precision edge cases', () => {
    // 高精度场景
    CalcInst.setOption('precision', 5)
    expect(CalcInst.decimalToPercent(0.333333)).toEqual(33.33333)

    // 禁用小数场景
    CalcInst.setOption('precision', 0)
    expect(CalcInst.decimalToPercent(0.333333)).toEqual(33)

    CalcInst.setOption('precision', 2)
  })

  it('should utilize cache mechanism correctly', () => {
    const cacheKeySpy = jest.spyOn((CalcInst) as any, 'generateCacheKey')
    const input = 0.5

    // 第一次调用生成缓存
    CalcInst.decimalToPercent(input)
    // 第二次相同输入应命中缓存
    CalcInst.decimalToPercent(input)

    // 验证generateCacheKey调用次数
    expect(cacheKeySpy).toHaveBeenCalledTimes(1)

    // 验证缓存存储正确性
    const cache = CalcInst.getCache('decimalToPercent')
    const cacheKey = cacheKeySpy.mock.results[0]?.value
    expect(cache.has(cacheKey)).toBe(true)

    cacheKeySpy.mockRestore()
  })
})
