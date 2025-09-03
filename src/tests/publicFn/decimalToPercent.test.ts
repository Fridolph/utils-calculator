import { CalcInst } from '../../main'

describe('Calculator.decimalToPercent()', () => {
  beforeEach(() => {
    CalcInst.resetInstance()
  })

  describe('基础功能测试', () => {
    beforeEach(() => {
      CalcInst.resetInstance()
    })
    
    // 正常转换场景
    it('基础用法 - 正常小数转换', () => {
      expect(CalcInst.decimalToPercent(0.5)).toBe(50)
      expect(CalcInst.decimalToPercent(0.25)).toBe(25)
    })
  })

  describe('边界值测试', () => {
    beforeEach(() => {
      CalcInst.resetInstance()
    })
    // 边界值处理
    it('边界值处理 - null/0/NaN输入', () => {
      expect(CalcInst.decimalToPercent(null)).toBe(0)
      expect(CalcInst.decimalToPercent(0)).toBe(0)
      expect(CalcInst.decimalToPercent(NaN)).toBe(0)
    })


    it('科学计数法输入应正确处理', () => {
      expect(CalcInst.decimalToPercent(1e-5)).toBe(0.001)
    })
  })

  describe('异常输入', () => {
    beforeEach(() => {
      CalcInst.resetInstance()
    })
    // 异常值处理
    it('异常值处理 - 非数字输入', () => {
      expect(CalcInst.decimalToPercent('abc' as any)).toBe(0)
      expect(CalcInst.decimalToPercent(true as any)).toBe(0)
      expect(CalcInst.decimalToPercent(undefined as any)).toBe(0)
    })

    // 负数处理
    it('负数处理 - 返回负百分比', () => {
      expect(CalcInst.decimalToPercent(-0.5)).toBe(-50)
      expect(CalcInst.decimalToPercent(-0.333333, 3)).toBe(-33.333) // -33.3333
    })

    it('decimalPlaces 为负数时应使用默认配置', () => {
      CalcInst.setUserOption('outputDecimalPlaces', 2)
      expect(CalcInst.decimalToPercent(0.5555, -1)).toBe(55.55)
    })
  })

  describe('边界值，极值应该也能按预期工作', () => {
    beforeEach(() => {
      CalcInst.resetInstance()
    })
    // 零值边界处理
    it('零值边界处理', () => {
      expect(CalcInst.decimalToPercent(0.0)).toBe(0)
      expect(CalcInst.decimalToPercent(-0.0)).toBe(0)
    })

    // 高精度计算验证
    it('高精度计算验证', () => {
      // 测试计算链式操作的精度
      const result = CalcInst.decimalToPercent(0.1234567891011, 10)
      expect(result).toBe(12.3456789101)
    })
  })

  describe('传参校验 及 精度校验', () => {
    beforeEach(() => {
      CalcInst.resetInstance()
    })
    // 参数校验测试
    it('decimalPlaces参数校验', () => {
      // 小于0的处理
      // expect(CalcInst.decimalToPercent(0.5, -1)).toBe(50)

      // 大于10的处理
      // expect(CalcInst.decimalToPercent(0.5, 15)).toBe(50)
      // // 非数字参数处理
      expect(CalcInst.decimalToPercent(0.5, 'invalid' as any)).toBe(50)
  
    })

    it('极小值处理 - 保留精度', () => {
      expect(CalcInst.decimalToPercent(0.00000001)).toBe(0.000001)
      expect(CalcInst.decimalToPercent(0.00000001, 5)).toBe(0) // 0.000001 -> 0
      expect(CalcInst.decimalToPercent(0.0000009, 4)).toBe(0.0001) // 0.00009 -> 0.0001
    })

    // 多位小数处理
    it('多位小数计算验证', () => {
      expect(CalcInst.decimalToPercent(0.123456789, 5)).toBe(12.34568)
      expect(CalcInst.decimalToPercent(0.987654321, 3)).toBe(98.765)
    })

    // 自定义精度场景
    it('自定义精度 - 保留指定小数位数', () => {
      expect(CalcInst.decimalToPercent(0.333333, 3)).toBe(33.333)
      expect(CalcInst.decimalToPercent(0.66666666, 4)).toBe(66.6667)
    })
  })

  describe('缓存验证', () => { 
    beforeEach(() => {
      CalcInst.resetInstance()
    })
    // 缓存验证
    it('相同输入命中缓存', () => {
      const cacheSize = CalcInst.getCache().decimalToPercent.size
      const result1 = CalcInst.decimalToPercent(0.555555, 3) // 55.5555 -> 55.556
      const result2 = CalcInst.decimalToPercent(0.555555, 3)
      expect(result1).toBe(55.556)
      expect(result2).toBe(55.556)
      expect(CalcInst.getCache().decimalToPercent.size).toBe(1)
    })
  
    // 不同配置缓存隔离
    it('不同配置生成不同缓存键', () => {
      const result1 = CalcInst.decimalToPercent(0.5, 2)
      const result2 = CalcInst.decimalToPercent(0.5, 3)
      expect(result1).toBe(50)
      expect(result2).toBe(50.0)
    })

    // 缓存键生成验证
    it('不同参数生成不同缓存键', () => {
      CalcInst.decimalToPercent(0.5, 2)
      CalcInst.decimalToPercent(0.5, 3)

      const key1 = CalcInst.getCache('decimalToPercent').get(
        CalcInst.generateCacheKey({ originNumber: 0.5, decimalPlaces: 2 })
      )
      const key2 = CalcInst.getCache('decimalToPercent').get(
        CalcInst.generateCacheKey({ originNumber: 0.5, decimalPlaces: 3 })
      )
      expect(CalcInst.getCache('decimalToPercent').size).toBe(2)
    })

    // 全局配置影响
    it('全局配置覆盖局部配置', () => {
      CalcInst.setUserOption('outputDecimalPlaces', 4)
      expect(CalcInst.decimalToPercent(0.66666666)).toBe(66.6667)
    })
  })
})