import { CalcInst, Calculator } from '../main'

describe('percentToDecimal()', () => {
  beforeEach(() => {
    CalcInst.clearCache()
    CalcInst.setOption('precision', 2)
    CalcInst.setOption('taxRate', 0.1)
    CalcInst.setOption('rateType', 'incl_gst')
  })

  it('should convert percentage to decimal correctly with default decimal places', () => {
    // 标准转换（默认保留2位小数 → 实际保留4位）
    expect(CalcInst.percentToDecimal(50.56)).toBe(0.5056)
    expect(CalcInst.percentToDecimal(100)).toBe(1)
    expect(CalcInst.percentToDecimal(0)).toBe(0)

    // 浮点数转换验证
    expect(CalcInst.percentToDecimal(75.123456)).toBe(0.7512)
  })

  it('should handle custom decimal places correctly', () => {
    // 指定小数位数（4位）现在与预期保持一致
    expect(CalcInst.percentToDecimal(50.56789, 4)).toBe(0.5057)

    // 验证四舍五入
    expect(CalcInst.percentToDecimal(50.567899, 4)).toBe(0.5057)

    // 恢复默认配置
    CalcInst.setOption('precision', 2)
  })

  it('should use global precision when decimalPlaces is null', () => {
    // 全局precision = 3 → 保留5位小数（3 + 2）
    CalcInst.setOption('precision', 3)
    expect(CalcInst.percentToDecimal(50.56789)).toBe(0.50568) // 0.5056789 -> 0.50568
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
    expect(CalcInst.percentToDecimal(50.5, 0)).toBe(1) // 0.505 -> 1
    expect(CalcInst.percentToDecimal(50.5, 2)).toBe(0.51) // 0.505 -> 0.51
    expect(CalcInst.percentToDecimal(25.423, 0)).toBe(0) // 0.25423 -> 0
    expect(CalcInst.percentToDecimal(25.466, 3)).toBe(0.255) // 0.25466 -> 0.255
  })

  it('should handle negative percentages', () => {
    // 负数转换验证
    expect(CalcInst.percentToDecimal(-50)).toBe(-0.5) // -0.5
    expect(CalcInst.percentToDecimal(-50.56, 2)).toBe(-0.51)
    expect(CalcInst.percentToDecimal(-50.56, 3)).toBe(-0.506)

    // 负数与高精度组合
    expect(CalcInst.percentToDecimal(-33.333333, 5)).toBe(-0.33333)
  })

  it('should respect method-level decimalPlaces over global precision', () => {
    // 全局precision = 3，但方法级decimalPlaces = 2 → 保留4位精度
    CalcInst.setOption('precision', 3)
    expect(CalcInst.percentToDecimal(50, 2)).toBe(0.5)
    CalcInst.setOption('precision', 2)
  })

  it('should handle edge cases for decimalPlaces', () => {
    // decimalPlaces为null时使用全局配置
    expect(CalcInst.percentToDecimal(33.333333, null as any)).toBe(33.333333) // 传值不规范返原值

    // decimalPlaces为负数的处理（特殊场景）
    expect(CalcInst.percentToDecimal(123.4567, -1)).toBe(123.4567) // 传值不规范返原值
  })
})
