import { CalcInst } from '../main'

/**
 * 主流程测试
 */
describe('Calculator Core Edge Cases', () => {
  beforeEach(() => {
      CalcInst.clearCache()
      CalcInst.setOption('precision', 2)
      CalcInst.setOption('taxRate', 0.1)
      CalcInst.setOption('rateType', 'incl_gst')
    })

  // 1. 测试precision边界值
  it('should handle precision edge cases', () => {
    // 精度0（禁用小数）
    CalcInst.setOption('precision', 0)
    expect(CalcInst.sum([1.111, 2.222])).toBe(3)
    expect(CalcInst.subtractMultiple(5, [2.5])).toBe(2)
    
    // 精度8（最高精度）
    CalcInst.setOption('precision', 8)
    const result = CalcInst.calcLinePrice({ quantity: 3, unitPrice: 3.33333333 })
    expect(result.linePrice).toBe(9.99999999)
  })

  // 2. 测试异常输入处理
  it('should handle invalid inputs correctly', () => {
    // 非数字数组元素处理
    expect(CalcInst.sum([1, '2' as any, true, undefined, null])).toBe(1)
    
    // 非数字减数处理
    expect(CalcInst.subtractMultiple(10, [3, '3' as any, null])).toBe(7)
    
    // 非数字参数处理
    expect(CalcInst.decimalToPercent('invalid' as any)).toBe(0)
    expect(CalcInst.percentToDecimal('invalid' as any)).toBeNull()
  })

  // 3. 测试缓存清除机制
  it('should clear specific cache types correctly', () => {
    // 设置不同缓存项
    CalcInst.sum([1,2])
    CalcInst.subtractMultiple(10, [3])
    
    // 单独清除sum缓存
    CalcInst.clearCache('sum')
    expect(CalcInst.getCache().sum.size).toBe(0)
    expect(CalcInst.getCache().subtractMultiple.size).toBe(1)
  })

  // 4. 测试税率类型边界
  it('should handle invalid rate types', () => {
    // 无效税率类型处理
    expect(() => {
      CalcInst.setOption('rateType', 'invalid' as unknown)
    }).toThrow('Invalid RateType')
    
    // 无效税率值处理
    expect(() => {
      CalcInst.setOption('taxRate', 1.5)
    }).toThrow('Tax rate must be a number between 0 and 1')
  })
})

/**
 * 特殊配置组合测试
 */
describe('Configuration Combinations', () => {
  beforeEach(() => {
    CalcInst.clearCache()
    CalcInst.setOption('precision', 2)
    CalcInst.setOption('taxRate', 0.1)
    CalcInst.setOption('rateType', 'incl_gst')
  })

  // 1. 验证全局配置覆盖
  it('should prioritize method-level config', () => {
    CalcInst.setOption('precision', 2)
    const result = CalcInst.sum([1.1111, 2.2222], { precision: 3 })
    expect(result).toBe(3.333)  // 方法级配置覆盖全局配置
  })

  // 2. 验证税率组合
  it('should handle tax rate combinations', () => {
    CalcInst.setOption('taxRate', 0.15)
    CalcInst.setOption('rateType', 'excl_gst')
    expect(CalcInst.computeRate(100)).toBe(15)
  })

  // 3. 验证税率类型组合
  it('should handle rate type combinations', () => {
    expect(CalcInst.computeRate(100, 0.1, 'excl_gst')).toBe(10)
    expect(CalcInst.computeRate(100, 0.1, 'gst_free')).toBe(0)
  })
})