import { CalcInst } from '../../main'

// describe('debugger', () => {
//   beforeEach(() => {
//     CalcInst.resetInstance()
//   })
  
//   it('应该使用方法级精度配置覆盖全局配置', () => {
//     expect(CalcInst.percentToDecimal(33.333333, { outputDecimalPlaces: 2 })).toBe(0.33) // 0.33333333
//     expect(CalcInst.percentToDecimal(33.333333, { outputDecimalPlaces: 4 })).toBe(
//       0.3333
//     )
//   })
// })

describe('percentToDecimal()', () => {
  beforeEach(() => {
    CalcInst.resetInstance()
  })

  describe('正常功能测试', () => {
    it('默认计算按传入值的实际结果返回', () => {
      expect(CalcInst.percentToDecimal(33.333333333333)).toBe(0.33333333333333)
    })

    it('应该正确将百分比转换为小数', () => {
      // 正常百分比转换场景
      expect(CalcInst.percentToDecimal(50)).toBe(0.5)
      expect(CalcInst.percentToDecimal(25)).toBe(0.25)
      expect(CalcInst.percentToDecimal(100)).toBe(1)
      expect(CalcInst.percentToDecimal(0)).toBe(0)
    })

    it('应该处理小数百分比', () => {
      // 小数百分比转换
      expect(CalcInst.percentToDecimal(33.33)).toBe(0.3333)
      expect(CalcInst.percentToDecimal(12.5)).toBe(0.125)
      expect(CalcInst.percentToDecimal(0.1)).toBe(0.001)
    })

    it('应该处理小数百分比', () => {
      // 小数百分比转换
      expect(CalcInst.percentToDecimal(33.33)).toBe(0.3333)
      expect(CalcInst.percentToDecimal(12.5)).toBe(0.125)
      expect(CalcInst.percentToDecimal(0.1)).toBe(0.001)
    })
  })

  describe('精度配置测试', () => {
    it('应该使用方法级精度配置覆盖全局配置', () => {
      expect(CalcInst.percentToDecimal(33.333333, { outputDecimalPlaces: 2 })).toBe(0.33) // 0.33333333
      expect(CalcInst.percentToDecimal(33.333333, { outputDecimalPlaces: 4 })).toBe(
        0.3333
      )
    })

    it('应该使用方法级精度配置覆盖全局配置 2 ', () => {
      expect(CalcInst.percentToDecimal(55.777888, { outputDecimalPlaces: 2 })).toBe(0.56) // 0.55666888
      expect(CalcInst.percentToDecimal(88.888999, { outputDecimalPlaces: 4 })).toBe(
        0.8889
      ) // 0.88888999
    })

    it('应该使用默认精度配置', () => {
      expect(CalcInst.percentToDecimal(33.333333)).toBe(0.33333333)
    })

    it('应该处理不同精度配置的结果', () => {
      const percentage = 66.666666

      expect(CalcInst.percentToDecimal(percentage, { outputDecimalPlaces: 0 })).toBe(1)
      expect(CalcInst.percentToDecimal(percentage, { outputDecimalPlaces: 1 })).toBe(0.7)
      expect(CalcInst.percentToDecimal(percentage, { outputDecimalPlaces: 2 })).toBe(0.67)
      expect(CalcInst.percentToDecimal(percentage, { outputDecimalPlaces: 3 })).toBe(
        0.667
      )
    })

    it('应该处理负百分比', () => {
      expect(CalcInst.percentToDecimal(-50)).toBe(-0.5)
      expect(CalcInst.percentToDecimal(-25.5)).toBe(-0.255)
    })
  })

  describe('边界值测试', () => {
    it('应该对无效输入返回 null', () => {
      // null 输入
      expect(CalcInst.percentToDecimal(null)).toBeNull()
      // 非数字类型
      expect(CalcInst.percentToDecimal('not a number' as any)).toBeNull()
      // NaN 输入
      expect(CalcInst.percentToDecimal(NaN)).toBeNull()
    })

    it('手动将输出位清 0 时，输出结果应为整数', () => {
      expect(CalcInst.percentToDecimal(33.333333333333, { outputDecimalPlaces: 0 })).toBe(
        0
      )
      expect(CalcInst.percentToDecimal(55.333333333333, { outputDecimalPlaces: 0 })).toBe(
        1
      )
    })

    it('保留 1 位小数输出的情况', () => {
      expect(CalcInst.percentToDecimal(33.3555, { outputDecimalPlaces: 1 })).toBe(0.3)
      expect(CalcInst.percentToDecimal(55.5666, { outputDecimalPlaces: 1 })).toBe(0.6)
    })

    it('应该处理极大数值', () => {
      expect(CalcInst.percentToDecimal(999999999)).toBe(9999999.99)
    })

    it('应该处理极小数值', () => {
      expect(CalcInst.percentToDecimal(0.0001)).toBe(0.000001)
    })

    it('应该处理负百分比', () => {
      expect(CalcInst.percentToDecimal(-100)).toBe(-1)
      expect(CalcInst.percentToDecimal(-50)).toBe(-0.5)
    })

    it('应该处理保留参数最大精度逻辑', () => {
      expect(CalcInst.percentToDecimal(33.333)).toBe(0.33333)

      expect(CalcInst.percentToDecimal(66.3333)).toBe(0.663333)
    })
  })

  describe('缓存机制验证', () => {
    it('应该正确利用缓存机制', () => {
      CalcInst.clearCache('percentToDecimal')

      // 第一次调用生成缓存
      CalcInst.percentToDecimal(50)
      // 第二次相同输入应命中缓存
      CalcInst.percentToDecimal(50)

      // 验证缓存命中
      expect(CalcInst.queryCacheStat().percentToDecimal).toBe(1)
    })

    it('应该为不同输入生成不同的缓存键', () => {
      CalcInst.clearCache('percentToDecimal')

      // 不同百分比值
      CalcInst.percentToDecimal(50)
      CalcInst.percentToDecimal(75)
      expect(CalcInst.getCache().percentToDecimal?.size).toBe(2)

      // 不同精度配置
      CalcInst.percentToDecimal(50, { outputDecimalPlaces: 2 })
      expect(CalcInst.getCache().percentToDecimal?.size).toBe(3)
    })

    it('应该确保相同输入命中缓存', () => {
      CalcInst.clearCache('percentToDecimal')

      // 第一次调用
      CalcInst.percentToDecimal(80)
      expect(CalcInst.queryCacheStat().percentToDecimal).toBe(1)

      // 第二次相同调用应该命中缓存
      CalcInst.percentToDecimal(80)
      expect(CalcInst.queryCacheStat().percentToDecimal).toBe(1)

      // 不同配置应生成新缓存
      CalcInst.percentToDecimal(80, { outputDecimalPlaces: 3 })
      expect(CalcInst.queryCacheStat().percentToDecimal).toBe(2)
    })
  })
})
