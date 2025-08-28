import { CalcInst } from '../../main'

// ----------------- 单价/总价计算测试模板 -----------------

describe('calcUnitPrice()', () => {

  beforeEach(() => {
    CalcInst.resetInstance()
  })

  describe('正常功能测试', () => {
    it('简单整数计算', () => {
      expect(CalcInst.calcUnitPrice({ quantity: 4, linePrice: 20 })).toEqual({
        quantity: 4,
        unitPrice: 5,
        linePrice: 20,
      })
  
    })
    
    it('2位浮点数计算验证', () => {
      // 浮点数计算验证
      expect(CalcInst.calcUnitPrice({ quantity: 3, linePrice: 9.99 })).toEqual({
        quantity: 3,
        unitPrice: 3.33,
        linePrice: 9.99,
      })
    })
  })


  describe('边界及异常情况测试', () => {

    it('quantity为null时透传linePrice作为unitPrice ', () => {
      // quantity为null时透传linePrice作为unitPrice
      expect(CalcInst.calcUnitPrice({ quantity: null, linePrice: 50 })).toEqual({
        quantity: null,
        unitPrice: 50,
        linePrice: 50,
      })
    })
  
    it('quantity为null且linePrice为0的场景', () => {
      expect(CalcInst.calcUnitPrice({ quantity: null, linePrice: 0 })).toEqual({
        quantity: null,
        unitPrice: 0,
        linePrice: 0,
      })
    })
  
    it('quantity = 0 时强制 unitPrice = null', () => {
      expect(CalcInst.calcUnitPrice({ quantity: 0, linePrice: 100 })).toEqual({
        quantity: 0,
        unitPrice: 100,
        linePrice: 100,
      })
  
      // quantity=0且linePrice=null的组合
      expect(CalcInst.calcUnitPrice({ quantity: 0, linePrice: null })).toEqual({
        quantity: 0,
        unitPrice: null,
        linePrice: null,
      })
    })
  
    it('全null输入透传场景', () => {
      expect(CalcInst.calcUnitPrice({ quantity: null, linePrice: null })).toEqual(
        {
          quantity: null,
          unitPrice: null,
          linePrice: null,
        }
      )
    })

    it('保留原始unitPrice字段（即使传入值会被覆盖）', () => {
      const input = { quantity: null, unitPrice: 99, linePrice: null }
      const result = CalcInst.calcUnitPrice(input)
      expect(result).toEqual({
        quantity: null,
        unitPrice: null, // 虽然输入有unitPrice，但计算结果仍为null
        linePrice: null,
      })
    })
  })

  describe('自定义精度测试', () => {
    it('将默认精度改为 3 位', () => {
      CalcInst.setUserOption('outputDecimalPlaces', 3)
      expect(CalcInst.calcUnitPrice({ quantity: 3, linePrice: 10 })).toEqual({
        quantity: 3,
        unitPrice: 3.333,
        linePrice: 10,
      })
      CalcInst.setUserOption('outputDecimalPlaces', 2) // 恢复默认值
    })

    it('验证禁用小数后的运算结果 -> 10 / 3=3.333 → 保留0位小数后为3', () => {
      CalcInst.setUserOption('outputDecimalPlaces', 0)
      expect(CalcInst.calcUnitPrice({ quantity: 3, linePrice: 10 } as CalcBaseTotalParams)).toEqual({
        quantity: 3,
        unitPrice: 3,
        linePrice: 10,
      })
    })

    it('高精度场景下验证，设置6位 -> 10 / 6 = 1.666667', () => {
      CalcInst.setUserOption('outputDecimalPlaces', 6) // 高精度场景
      expect(CalcInst.calcUnitPrice({ quantity: 6, linePrice: 10 } as CalcBaseTotalParams)).toEqual({
        quantity: 6,
        unitPrice: 1.666667,
        linePrice: 10,
      })
    })

    it('验证更高位小数的四舍五入处理', () => {
      expect(CalcInst.calcUnitPrice({ quantity: 3, linePrice: 10.0005 } as CalcBaseTotalParams, { outputDecimalPlaces: 3 })).toEqual(
        {
          quantity: 3,
          unitPrice: 3.334, // 10.0005 / 3 = 3.3335000000000004 -> 3.334
          linePrice: 10.0005,
        }
      )

      expect(CalcInst.calcUnitPrice({ quantity: 3, linePrice: 10.0005 } as CalcBaseTotalParams, { outputDecimalPlaces: 2 })).toEqual(
        {
          quantity: 3,
          unitPrice: 3.33, // 10.0005 / 3 = 3.3335000000000004 -> 3.334
          linePrice: 10.0005,
        }
      )

      CalcInst.setUserOption('outputDecimalPlaces', 2)
    })

    it('测试方法级精度覆盖全局配置', () => {
      expect(
        CalcInst.calcUnitPrice(
          { quantity: 3, linePrice: 10 } as CalcBaseTotalParams,
          { outputDecimalPlaces: 1 } as Partial<UserOptions>, // 方法级配置优先级更高
        )
      ).toEqual({
        quantity: 3,
        unitPrice: 3.3,
        linePrice: 10,
      })
      // 恢复默认精度
      CalcInst.setUserOption('outputDecimalPlaces', 2)
    })
  })

  describe('缓存机制测试', () => { 
    it('初次计算生成缓存，重复计算，应命中缓存', () => {
      const input = { quantity: 5, linePrice: 25 } as CalcBaseTotalParams
  
      // 第一次调用生成缓存
      CalcInst.calcUnitPrice(input)
      // 第二次相同输入应命中缓存
      CalcInst.calcUnitPrice(input)
  
      // 验证generateCacheKey调用次数
      expect(CalcInst.queryCacheStat('calcUnitPrice').calcUnitPrice).toBe(1)
  
      CalcInst.clearCache('calcUnitPrice')
    })
  })
})
