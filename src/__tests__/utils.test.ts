import { CalcInst, Calculator } from '../main'

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
