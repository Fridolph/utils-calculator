import { CalcInst } from '../../main'

beforeEach(() => {
  CalcInst.resetInstance()
})

describe.skip('calcLinePrice()', () => {

  // describe('debugger >>> 精度配置测试', () => {

  // })

  describe('正常计算场景', () => {
    it('当quantity和unitPrice都不为null时，正常计算linePrice', () => {
      const params = { quantity: 2, unitPrice: 3 }
      const result = CalcInst.calcLinePrice(params)
      expect(result.linePrice).toBe(6)
    })
  })

  describe('边界值测试', () => {
    it('quantity和unitPrice都为null时，返回全null对象', () => {
      const params = { quantity: null, unitPrice: null }
      const result = CalcInst.calcLinePrice(params)
      expect(result.quantity).toBe(null)
      expect(result.unitPrice).toBe(null)
      expect(result.linePrice).toBe(null)
    })

    it('quantity为null时，unitPrice等于linePrice', () => {
      const params = { quantity: null, unitPrice: 5 }
      const result = CalcInst.calcLinePrice(params)
      expect(result.quantity).toBe(null)
      expect(result.unitPrice).toBe(5)
      expect(result.linePrice).toBe(5)
    })

    it('linePrice为null时，返回null总价', () => {
      const params = { quantity: 3, unitPrice: null }
      const result = CalcInst.calcLinePrice(params)
      expect(result.quantity).toBe(3)
      expect(result.unitPrice).toBe(null)
      expect(result.linePrice).toBe(null)
    })

    it('quantity为0时，强制unitPrice等于linePrice', () => {
      const params = { quantity: 0, unitPrice: 10 }
      const result = CalcInst.calcLinePrice(params)
      expect(result.quantity).toBe(0)
      expect(result.unitPrice).toBe(10)
      expect(result.linePrice).toBe(0)
    })
  })

  describe('异常输入处理', () => {
    it('处理quantity为非数字的情况', () => {
      const params = { quantity: 'two' as any, unitPrice: 5 }
      const result = CalcInst.calcLinePrice(params)
      expect(result.quantity).toBe(null)
      expect(result.unitPrice).toBe(5)
      expect(result.linePrice).toBe(5)
    })

    it('处理unitPrice为非数字的情况', () => {
      const params = { quantity: 2, unitPrice: 'five' as any }
      const result = CalcInst.calcLinePrice(params)
      expect(result.quantity).toBe(2)
      expect(result.unitPrice).toBe(null)
      expect(result.linePrice).toBe(null)
    })

    it('处理quantity和unitPrice都为非数字的情况', () => {
      const params = { quantity: 'three' as any, unitPrice: 'six' as any }
      const result = CalcInst.calcLinePrice(params)
      expect(result.quantity).toBe(null)
      expect(result.unitPrice).toBe(null)
      expect(result.linePrice).toBe(null)
    })
  })

  describe('精度配置测试', () => {
    it('检查默认精度下的计算结果', () => {
      const params = { quantity: 2.22, unitPrice: 3.33 }
      const result = CalcInst.calcLinePrice(params)
      expect(result.linePrice).toBeCloseTo(2.22 * 3.33)
    })

    it('精度为8时的极限小数计算', () => {
      const params = { quantity: 0.00000001, unitPrice: 0.00000001 }
      const result = CalcInst.calcLinePrice(params)
      expect(result.linePrice).toBe(0.0000000000000001)
    })

    it('配置不同精度的结果应符合预期', () => {
      const params = { quantity: 1.111, unitPrice: 2.222 }
      const result1 = CalcInst.calcLinePrice(params, { outputDecimalPlaces: 0 })
      const result2 = CalcInst.calcLinePrice(params, { outputDecimalPlaces: 1 })
      const result3 = CalcInst.calcLinePrice(params, { outputDecimalPlaces: 2 })

      expect(result1.linePrice).toBeCloseTo(1.111 * 2.222, 0)
      expect(result2.linePrice).toBeCloseTo(1.111 * 2.222, 1)
      expect(result3.linePrice).toBeCloseTo(1.111 * 2.222, 2)
    })
  })

  describe('缓存机制验证', () => {
    it('应该正确命中缓存，重复命中不会增加计算次数', () => {
      CalcInst.clearCache('all')

      // 第一次调用生成缓存
      const params1 = { quantity: 1, unitPrice: 2 }
      CalcInst.calcLinePrice(params1)

      // 第二次相同输入应命中缓存
      const params2 = { quantity: 1, unitPrice: 2 }
      CalcInst.calcLinePrice(params2)
      expect(CalcInst.getCache().calcLinePrice.size).toBe(1)

      // 新的计算，生成两条缓存记录
      const params3 = { quantity: 3, unitPrice: 4 }
      const params4 = { quantity: 3, unitPrice: 4 }
      CalcInst.calcLinePrice(params3)
      CalcInst.calcLinePrice(params4)
      expect(CalcInst.getCache().calcLinePrice.size).toBe(2)
      CalcInst.clearCache('all')
    })

    it('应确保不同配置，生成各自唯一的缓存键', () => {
      CalcInst.clearCache('all')
      const params1 = { quantity: 1, unitPrice: 2 }
      CalcInst.calcLinePrice(params1, { outputDecimalPlaces: 2 })
      expect(CalcInst.getCache().calcLinePrice.size).toBe(1)
      const params2 = { quantity: 1, unitPrice: 2 }
      CalcInst.calcLinePrice(params2, { outputDecimalPlaces: 3 })
      expect(CalcInst.getCache().calcLinePrice.size).toBe(2)
    })

    it('应确保对象属性顺序不影响缓存键一致性', () => {
      const params1 = { quantity: 1, unitPrice: 2 }
      const params2 = { unitPrice: 2, quantity: 1 }
      const key1 = CalcInst.generateCacheKey({ data: params1, mergedOptions: CalcInst._getUserOptions() })
      const key2 = CalcInst.generateCacheKey({ data: params2, mergedOptions: CalcInst._getUserOptions() })
      expect(key1).toBe(key2)
    })
  })
})