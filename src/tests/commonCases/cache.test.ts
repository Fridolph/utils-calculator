// src/tests/publicFn/cache.test.ts
import { CalcInst } from '../../main'

describe('缓存管理', () => {
  beforeEach(() => {
    CalcInst.resetInstance()
  })

  it('应清除特定缓存类型', () => {
    CalcInst.sum([1, 2])
    CalcInst.calcUnitPrice({ quantity: 3, linePrice: 10 })
    CalcInst.clearCache('sum')
    expect(CalcInst.getCache().sum.size).toBe(0)
    expect(CalcInst.getCache().calcUnitPrice.size).toBe(1)
  })

  it('应正确跟踪缓存大小', () => {
    CalcInst.sum([1, 2])
    CalcInst.sum([1, 2])
    CalcInst.sum([3, 4])
    expect(CalcInst.getCache().sum.size).toBe(2)
  })
})