import { CalcInst } from '../main'

/**
 * 缓存相关测试
 */
describe('Cache Mechanism', () => {
  beforeEach(() => {
    CalcInst.clearCache()
    CalcInst.setOption('precision', 2)
    CalcInst.setOption('taxRate', 0.1)
    CalcInst.setOption('rateType', 'incl_gst')
  })

  // 1. 验证缓存键生成
  it('should generate consistent cache keys', () => {
    const key1 = CalcInst.generateCacheKey({ a: 1, b: [2, 3] })
    const key2 = CalcInst.generateCacheKey({ b: [2, 3], a: 1 })
    expect(key1).toBe(key2)
  })

  // 2. 验证多级缓存
  it('should handle multiple cache types', () => {
    // 设置不同缓存项
    CalcInst.sum([1,2])
    CalcInst.subtractMultiple(10, [3])
    
    // 验证统计
    const stats = CalcInst.queryCacheStat('all')
    expect(stats.sum).toBe(1)
    expect(stats.subtractMultiple).toBe(1)
  })

  // 3. 验证缓存清理
  it('should clear cache correctly', () => {
    // 设置多个缓存项
    CalcInst.sum([1,2])
    CalcInst.sum([3,4])
    
    // 清除特定缓存
    CalcInst.clearCache('sum')
    expect(CalcInst.getCache().sum.size).toBe(0)
  })
})