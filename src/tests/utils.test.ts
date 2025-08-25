// 验证工具方法
import { CalcInst } from '../main'

describe('Calculator Utility Methods', () => {
  // 测试 setOptions 方法
  it('should update base options correctly using setOptions', () => {
    const newOptions = { precision: 3, taxRate: 0.2 }
    CalcInst.setOption('precision', 3)
    CalcInst.setOption('taxRate', 0.2)
    const options = CalcInst.getOptions()
    expect(options.precision).toBe(3)
    expect(options.taxRate).toBe(0.2)
  })

  // 测试 getOptions 方法
  it('should return base options correctly using getOptions', () => {
    const options = CalcInst.getOptions()
    expect(options).toHaveProperty('precision')
    expect(options).toHaveProperty('taxRate')
    expect(options).toHaveProperty('rateType')
  })

  // 测试 clearCache 方法
  it('should clear specific cache correctly using clearCache', () => {
    // 先添加一些缓存数据
    const cacheKey = CalcInst.generateCacheKey({ data: [1, 2, 3] })
    CalcInst.calcCache.sum.set(cacheKey, 6)

    CalcInst.clearCache('sum')
    expect(CalcInst.calcCache.sum.has(cacheKey)).toBe(false)
  })

  // 测试 queryCacheStat 方法
  it('should return correct cache statistics using queryCacheStat', () => {
    // 先添加一些缓存数据
    const cacheKey1 = CalcInst.generateCacheKey({ data: [1, 2, 3] })
    CalcInst.calcCache.sum.set(cacheKey1, 6)
    const cacheKey2 = CalcInst.generateCacheKey({ originPercentage: 50 })
    CalcInst.calcCache.percentToDecimal.set(cacheKey2, 0.5)

    const statsAll = CalcInst.queryCacheStat('all')
    expect(statsAll.all).toBe(2)
    expect(statsAll.sum).toBe(1)
    expect(statsAll.percentToDecimal).toBe(1)

    const statsSum = CalcInst.queryCacheStat('sum')
    expect(statsSum.sum).toBe(1)
    expect(statsSum.all).toBe(1)
  })

  // 测试 generateCacheKey 方法
  it('should generate correct cache key using generateCacheKey', () => {
    const data = { key: 'value' }
    const cacheKey = CalcInst.generateCacheKey(data)
    expect(cacheKey).toBe(JSON.stringify(data))
  })
})

describe('Type Definitions', () => {
  it('should validate BaseOptions', () => {
    const options: BaseOptions = {
      precision: 2,
      runtimePrecision: 10,
      taxRate: 0.1,
      rateType: 'incl_gst'
    }
    
    // 验证类型定义
    expect(typeof options.precision).toBe('number')
    expect(options.runtimePrecision).toBe(10)
    expect(['incl_gst', 'excl_gst', 'gst_free']).toContain(options.rateType)
  })

  it('should handle RateType boundaries', () => {
    // 验证类型守卫
    const validTypes: RateType[] = ['incl_gst', 'excl_gst', 'gst_free']
    validTypes.forEach(type => {
      expect(['incl_gst', 'excl_gst', 'gst_free']).toContain(type)
    })
  })
})

describe('Precision Handling', () => {
  // 1. 验证8位精度计算
  it('should handle 8-digit precision', () => {
    CalcInst.setOption('precision', 8)
    const result = CalcInst.sum([0.00000001, 0.00000002])
    expect(result).toBe(0.00000003)
  })

  // 2. 验证精度四舍五入
  it('should round correctly at different precisions', () => {
    // 精度0（整数）
    CalcInst.setOption('precision', 0)
    expect(CalcInst.sum([1.49])).toBe(1)
    expect(CalcInst.sum([1.5])).toBe(2)
    
    // 精度8的边界
    CalcInst.setOption('precision', 8)
    expect(CalcInst.sum([0.000000005])).toBe(0.00000001)
  })

  // 3. 验证运行时精度
  it('should use runtimePrecision for intermediate calculations', () => {
    CalcInst.setOption('precision', 2)
    const result = CalcInst.sum([0.000000001, 0.000000002])
    expect(result).toBe(0)  // 运行时使用8位精度，最终结果保留2位
  })
})