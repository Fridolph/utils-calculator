// 异常输入处理测试
import { CalcInst } from '../main'

describe('Error Handling Coverage', () => {
  beforeEach(() => {
    CalcInst.clearCache()
    CalcInst.setOption('precision', 2)
    CalcInst.setOption('taxRate', 0.1)
    CalcInst.setOption('rateType', 'incl_gst')
  })
  
  // 1. 验证空输入处理
  it('should handle empty inputs', () => {
    expect(CalcInst.sum([])).toBe(0)
    expect(CalcInst.sum({} as any)).toBe(0)
  })

  // 2. 验证错误参数处理
  it('should handle invalid parameters', () => {
    // 无效参数组合
    expect(CalcInst.sum([NaN, 5])).toBe(5)
    expect(CalcInst.sum([undefined as any, 5])).toBe(5)
    
    // 无效减数
    expect(CalcInst.subtractMultiple(10, [NaN])).toBe(10)
    expect(CalcInst.subtractMultiple(10, [undefined as any])).toBe(10)
  })

  // 3. 验证负值处理
  it('should handle negative values', () => {
    // 负数加法
    expect(CalcInst.sum([-1, -2])).toBe(-3)
    
    // 负数减法
    expect(CalcInst.subtractMultiple(0, [-5])).toBe(5)
    
    // 负数百分比
    expect(CalcInst.decimalToPercent(-0.5)).toBe(-50)
  })
})