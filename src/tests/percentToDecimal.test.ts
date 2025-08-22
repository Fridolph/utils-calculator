import { CalcInst, Calculator } from '../main'

describe('percentToDecimal()', () => {
  it('should convert percentage to decimal correctly with default decimal places', () => {
    // 标准转换（默认保留2位小数 → 实际保留4位）
    expect(CalcInst.percentToDecimal(50.56)).toBe(0.5056)
    expect(CalcInst.percentToDecimal(100)).toBe(1.0)
    expect(CalcInst.percentToDecimal(0)).toBe(0.0)

    // 浮点数转换验证
    expect(CalcInst.percentToDecimal(75.123456)).toBe(0.75123456)
  })

  it('should handle custom decimal places correctly', () => {
    // 指定小数位数（4位 → 保留6位）
    expect(CalcInst.percentToDecimal(50.56789, 4)).toBe(0.5056789)

    // 验证四舍五入（保留4位小数 → 6位精度）
    expect(CalcInst.percentToDecimal(50.567899, 4)).toBe(0.505679)

    // 恢复默认配置
    CalcInst.setOption('precision', 2)
  })

  it('should use global precision when decimalPlaces is null', () => {
    // 全局precision = 3 → 保留5位小数（3 + 2）
    CalcInst.setOption('precision', 3)
    expect(CalcInst.percentToDecimal(50.56789)).toBe(0.5056789)
    CalcInst.setOption('precision', 2)
  })

  it('should return null for invalid inputs', () => {
    // null/NaN/undefined处理
    expect(CalcInst.percentToDecimal(null)).toBeNull()
    expect(CalcInst.percentToDecimal(NaN)).toBeNull()
    expect(CalcInst.percentToDecimal(undefined as any)).toBeNull()

    // 非数字值处理
    expect(CalcInst.percentToDecimal('abc' as any)).toBeNull()
  })

  it('should handle zero decimalPlaces correctly', () => {
    // decimalPlaces = 0 → 保留2位小数（0 + 2）
    expect(CalcInst.percentToDecimal(50.5, 0)).toBe(0.505)
    expect(CalcInst.percentToDecimal(25.4, 0)).toBe(0.254)
  })

  it('should handle negative percentages', () => {
    // 负数转换验证
    expect(CalcInst.percentToDecimal(-50)).toBe(-0.5)
    expect(CalcInst.percentToDecimal(-50.56, 2)).toBe(-0.5056)

    // 负数与高精度组合
    expect(CalcInst.percentToDecimal(-33.333333, 5)).toBe(-0.33333333)
  })

  it('should utilize cache mechanism correctly', () => {
    const cacheKeySpy = jest.spyOn((CalcInst) as any, 'generateCacheKey')
    const originPercent = 50.56

    // 第一次调用生成缓存
    CalcInst.percentToDecimal(originPercent, 2)
    // 第二次相同输入应命中缓存
    CalcInst.percentToDecimal(originPercent, 2)

    // 验证generateCacheKey调用次数
    expect(cacheKeySpy).toHaveBeenCalledTimes(1)

    // 验证缓存存储正确性
    const cache = CalcInst.getCache('percentToDecimal')
    const cacheKey = cacheKeySpy.mock.results[0]?.value
    expect(cache.has(cacheKey)).toBe(true)

    cacheKeySpy.mockRestore()
  })

  it('should respect method-level decimalPlaces over global precision', () => {
    // 全局precision = 3，但方法级decimalPlaces = 2 → 保留4位精度
    CalcInst.setOption('precision', 3)
    expect(CalcInst.percentToDecimal(50, 2)).toBe(0.5)
    CalcInst.setOption('precision', 2)
  })

  it('should handle edge cases for decimalPlaces', () => {
    // decimalPlaces为null时使用全局配置
    expect(CalcInst.percentToDecimal(33.333333, null as any)).toBe(0.33333333)

    // decimalPlaces为负数的处理（特殊场景）
    expect(CalcInst.percentToDecimal(123.456, -1)).toBe(1.2346)
  })
})
