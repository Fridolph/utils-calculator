import { CalcInst } from '../../main'

// ----------------- 减法测试模板 -----------------
describe('subtractMultiple()', () => {
  beforeEach(() => {
    CalcInst.resetInstance()
  })

  describe('正常减法运算', () => {
    it('能够按顺序进行减法运算，得到预期结果', () => {
      expect(CalcInst.subtractMultiple(9.99, [8.88])).toBe(1.11)
      expect(CalcInst.subtractMultiple(15, [1, 2, 3, 4])).toBe(5)
      expect(CalcInst.subtractMultiple(100, [50.5, 20.25])).toBe(29.25)
    })
  })

  describe('传参异常及边界处理', () => {
    it('应使用精度覆盖来处理空输入', () => {
      expect(CalcInst.subtractMultiple(null as any, [], { outputDecimalPlaces: 3 })).toBe(0)
    })

    it('应处理包含NaN值的数组', () => {
      expect(CalcInst.subtractMultiple(10, [NaN, 5] as any[])).toBe(5)
    })
    
    it('应处理 null 和 NaN 初始值', () => {
      expect(CalcInst.subtractMultiple(null as any, [5])).toBe(-5)
      expect(CalcInst.subtractMultiple('abc' as any, [6])).toBe(-6)
      expect(CalcInst.subtractMultiple(NaN, [5] as any[])).toBe(-5)
      expect(CalcInst.subtractMultiple(undefined as any, [NaN, '', NaN] as any[])).toBe(0)
    })

    it('当被减数组为空时，应返回初始值', () => {
      expect(CalcInst.subtractMultiple(50, [])).toBe(50)
      expect(CalcInst.subtractMultiple(100, [])).toBe(100)
    })

    it('当被减值无效时，应返回初始值', () => {
      expect(CalcInst.subtractMultiple(10, [null] as any[])).toBe(10)
      expect(CalcInst.subtractMultiple(20, ['abc'] as any[])).toBe(20)
    })

    it('当被减数组中包含非数字时，过滤掉非数字再进行运算', () => {
      expect(CalcInst.subtractMultiple(20, [5, '10', true] as any[])).toBe(15)
      expect(CalcInst.subtractMultiple(30, [10, null] as any[])).toBe(20)
    })

    it('should handle zero value correctly', () => {
      expect(CalcInst.subtractMultiple(0, [5])).toBe(-5)
      expect(CalcInst.subtractMultiple(5, [0])).toBe(5)
      expect(CalcInst.subtractMultiple(0, [0])).toBe(0)
    })

    it('处理负数初始值与负数减数', () => {
      expect(CalcInst.subtractMultiple(-10, [-3, -2])).toBe(-5) // -10 - (-3) - (-2) = -5
    })
  })

  describe('精度配置验证', () => {
    it('应使用方法级精度重写返回正确的值', () => {
      expect(CalcInst.subtractMultiple(10, [3.333], { outputDecimalPlaces: 0 })).toBe(7)
      expect(CalcInst.subtractMultiple(10, [3.3333], { outputDecimalPlaces: 1 })).toBe(
        6.7
      )
    })

    it('应按自身精度来返回正确的计算值', () => {
      expect(CalcInst.subtractMultiple(5, [1.1115])).toBe(3.8885)
      expect(CalcInst.subtractMultiple(1, 0.1115, { outputDecimalPlaces: 3 })).toBe(0.889)
    })

    it('当 0 作为被减数，进行一些高精度计算时，应返回正确的结果', () => {
      expect(CalcInst.subtractMultiple(0, [0.0005], { outputDecimalPlaces: 3 })).toBe(
        -0.001
      )
      expect(CalcInst.subtractMultiple(0, 0.1115)).toBe(-0.1115)
      expect(CalcInst.subtractMultiple(0, 0.1115, { outputDecimalPlaces: 3 })).toBe(
        -0.112
      )
    })
  })

  describe('缓存机制验证', () => {
    it('should utilize cache mechanism correctly', () => {
      CalcInst.clearCache('all')

      // 第一次调用生成缓存
      CalcInst.subtractMultiple(100, [10, 20, 30])
      // 第二次相同输入应命中缓存
      CalcInst.subtractMultiple(100, [10, 20, 30])
      expect(CalcInst.getCache().subtractMultiple.size).toBe(1)

      // 新的计算，生成两条缓存记录
      CalcInst.subtractMultiple(200, [10.1, 20.2, 30.3])
      CalcInst.subtractMultiple(200, [10.1, 20.2, 30.3])
      expect(CalcInst.getCache().subtractMultiple.size).toBe(2)
    })
  })
})
