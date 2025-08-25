import { CalcInst, Calculator } from '../main'

describe('decimalToPercent()', () => {
  beforeEach(() => {
    CalcInst.clearCache()
    CalcInst.setOption('precision', 2)
    CalcInst.setOption('taxRate', 0.1)
    CalcInst.setOption('rateType', 'incl_gst')
  })

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
    expect(CalcInst.decimalToPercent(null)).toBe(0)

    expect(CalcInst.decimalToPercent(null, null as any)).toBe(0)
  })

  it('should handle non - numeric input', () => {
    // 输入为非数字类型的场景
    expect(CalcInst.decimalToPercent(NaN)).toBe(0)
    expect(CalcInst.decimalToPercent('not a number' as any)).toBe(0)
  })

  it('should respect custom precision configuration', () => {
    // 设置自定义精度
    expect(CalcInst.decimalToPercent(0.333333, 3)).toEqual(33.333) // 33.3333 -> 33.333
    expect(CalcInst.decimalToPercent(0.88888888, 3)).toEqual(88.889) // 88.888888 -> 88.889
    expect(CalcInst.decimalToPercent(0.999999999, 3)).toEqual(100.000) // 99.9999999 -> 100.000
    // 系统小数最多存10位，所以最大支持8位精度的百分比
    expect(CalcInst.decimalToPercent(0.6666666666, 4)).toEqual(66.6667) // 66.66666666 -> 66.6667
    expect(CalcInst.decimalToPercent(0.6666666666, 5)).toEqual(66.66667) // 66.66666666 -> 66.66667
    expect(CalcInst.decimalToPercent(0.6666666666, 6)).toEqual(66.666667) // 66.66666666 -> 66.666667

    // 测试方法级精度覆盖全局配置
    expect(CalcInst.decimalToPercent(0.3333, 1)).toEqual(33.3) // 33.33 -> 33.3

    // 恢复默认精度
    CalcInst.setOption('precision', 2)
  })

  it('should handle precision edge cases', () => {
    // 高精度场景
    expect(CalcInst.decimalToPercent(0.333333, 5)).toEqual(33.33330)

    // 禁用小数场景
    expect(CalcInst.decimalToPercent(0.333333, 0)).toEqual(33)
    CalcInst.setOption('precision', 2)
  })

  it('should utilize cache mechanism correctly', () => {
    CalcInst.clearCache('all')

    // 第一次调用生成缓存
    CalcInst.decimalToPercent(0.555555)
    // 第二次相同输入应命中缓存
    CalcInst.decimalToPercent(0.555555)
    // 验证generateCacheKey调用次数
    expect(CalcInst.getCache().decimalToPercent.size).toBe(1)

    // 新的计算，生成两条计算记录
    CalcInst.decimalToPercent(0.66666666, 4)
    // 命名缓存，实际计算2次
    CalcInst.decimalToPercent(0.66666666, 4)
    expect(CalcInst.getCache().decimalToPercent.size).toBe(2)
  })
})
