import { CalcInst } from '../../main'

describe('Calculator.computeRate()', () => {
  
  // describe('debugger >>>', () => {
  //   beforeEach(() => {
  //     CalcInst.clearCache('computeRate')
  //   })
    
  // })
  
  
  describe.skip('基础功能测试', () => {
    // 基础用法
    it('基础税率计算 - incl_gst', () => {
      expect(CalcInst.computeRate(100, { taxRate: 0.222, outputDecimalPlaces: 3 })).toBe(18.167) // 18.16693944353519
    })
    
    it('传配置项 计算', () => {
      expect(CalcInst.computeRate(10, { taxRate: 0.111, outputDecimalPlaces: 4 })).toBe(0.9991)
    })
    
    it('基础税率计算 - incl_gst', () => {
      // expect(CalcInst.computeRate(10, { outputDecimalPlaces: 2, taxRate: 0.1 })).toBe(0.91) // 10/(1+0.1)*0.1
      expect(CalcInst.computeRate(100, { outputDecimalPlaces: 2 })).toBe(9.09) // 100/(1+0.1)*0.1
    })
    
    it('基础税率计算 - incl_gst', () => {
      CalcInst.setUserOption('keepParamsMaxPrecision', false)
      CalcInst.setUserOption('outputDecimalPlaces', 4)
      
      // console.log(CalcInst._getUserOptions())
      expect(CalcInst.computeRate(10)).toBe(0.9091) // 10/(1+0.1)*0.1
      expect(CalcInst.computeRate(100, { outputDecimalPlaces: 2})).toBe(9.09) // 100/(1+0.1)*0.1
      
      CalcInst.clearCache('computeRate')
    })
    
    // 不含税计算
    it('不含税计算 - excl_gst', () => {
      expect(CalcInst.computeRate(25, 0.1, 'excl_gst')).toBe(2.5) // 25*0.1
      expect(CalcInst.computeRate(100, 0.15, 'excl_gst')).toBe(15) // 100*0.15
    })
    
    // 免税场景
    it('gst_free场景返回0', () => {
      expect(CalcInst.computeRate(100, 0.1, 'gst_free')).toBe(0)
      expect(CalcInst.computeRate(50, 0.2, 'gst_free'))
      .toBe(0) // 优先使用gst_free
    })
    
    it('高精度计算验证 2', () => {
      CalcInst.setUserOption('outputDecimalPlaces', 4)
      expect(CalcInst.computeRate(100, 0.333333)).toBe(25) // 24.99998124999531
      CalcInst.setUserOption('outputDecimalPlaces', 5)
      expect(CalcInst.computeRate(100, 0.333333)).toBe(24.99998) // 24.99998124999531
      CalcInst.setUserOption('outputDecimalPlaces', 6)
      expect(CalcInst.computeRate(100, 0.333333)).toBe(24.999981) // 24.99998124999531
    })
  })
  
  describe('精度控制 与 精度校验', () => {
    beforeEach(() => {
      CalcInst.clearCache('computeRate')
    })
    
    // 精度控制
    it('keepResultPrecision为true时保留原始精度', () => {
      expect(CalcInst.computeRate(10, 0.1)).toBe(0.9090909090909091) // 原始计算结果
      expect(CalcInst.computeRate(100, 0.1)).toBe(9.090909090909092)
    })
    // 精度配置
    it('keepResultPrecision为false时按precision四舍五入', () => {
      CalcInst.setUserOption('outputDecimalPlaces', 3)
      expect(CalcInst.computeRate(10, 0.1)).toBe(0.909) // 0.9090909 → 3位小数
      expect(CalcInst.computeRate(100, 0.333333)).toBe(33.333) // 33.3333 → 3位小数
    })

    // 高精度计算
    it('高精度计算验证 1', () => {
      CalcInst.clearCache('computeRate')
      expect(CalcInst.computeRate(0.01, 0.9999999999)).toBe(0.00499999999975)
    })

    it('keepResultPrecision为true时保留原始精度', () => {
      expect(CalcInst.computeRate(10, 0.1)).toBe(0.9090909090909091) // 原始计算结果
      expect(CalcInst.computeRate(100, 0.333333)).toBe(24.99998124999531) // 24.99998124999531
    })

    // 精度继承
    it('局部配置覆盖全局配置', () => {
      CalcInst.setUserOption('outputDecimalPlaces', 4)
      
      // 方法级配置覆盖全局配置
      expect(CalcInst.computeRate(100, { 
        outputDecimalPlaces: 2,
        taxRate: 0.3333,
        rateType: 'incl_gst',
      }))
        .toBe(24.99) // 100/(1+0.3333)*0.3333 ≈ 24.9975 → 2位小数
    })

    // 非法参数处理
    it('非法参数处理', () => {
      expect(CalcInst.computeRate(NaN as any, 0.1)).toBe(0) // NaN价格
      expect(CalcInst.computeRate('invalid' as any, 0.1)).toBe(0) // 非数字价格
      expect(CalcInst.computeRate(100, 'invalid' as any)).toBe(100) // 非数字税率
    })

    // 精度配置优先级
    it('配置优先级验证', () => {
      expect(CalcInst.computeRate(100, {
        outputDecimalPlaces: 2,
        taxRate: 0.156633,
        rateType: 'incl_gst',
      })).toBe(9.09)
    })

    it('同样的参数，根据不同配置输出不同精度结果', () => {
      expect(CalcInst.computeRate(100, 0.65555555555)).toBe(39.59731543603892) // 39.59731543603892
      expect(CalcInst.computeRate(100, { taxRate: 0.65555555555, outputDecimalPlaces: 2 })).toBe(39.60) // 39.59731543603892
      expect(CalcInst.computeRate(100, { taxRate: 0.65555555555, outputDecimalPlaces: 4 })).toBe(39.5973) // 39.59731543603892  
    })

    it('修改全局 taxRate 后，没传参，应该用 修改后的税率计算结果', () => {
      CalcInst.setUserOption('taxRate', 0.2225)
      expect(CalcInst.computeRate(150)).toBe(27.30061349693252) // 原始计算结果
      expect(CalcInst.computeRate(150, { outputDecimalPlaces: 2 })).toBe(27.30) // 原始计算结果
      expect(CalcInst.computeRate(150, { outputDecimalPlaces: 3 })).toBe(27.301) // 原始计算结果
      expect(CalcInst.computeRate(150, { outputDecimalPlaces: 4 })).toBe(27.3006) // 原始计算结果
      CalcInst.clearCache('computeRate')
    })
  })

  describe.skip('边界值 和 异常输入测试', () => {
    // 边界值处理
    it('边界值处理', () => {
      expect(CalcInst.computeRate(0, 0.1)).toBe(0) // 0元处理
      expect(CalcInst.computeRate(-50, 0.1)).toBe(-50) // 负数处理
      expect(CalcInst.computeRate(100, NaN as any)).toBe(10) // NaN处理
    })

    // 参数校验
    it('参数校验', () => {
      const consoleWarn = jest.spyOn(console, 'warn').mockImplementation()
      
      // 无效税率类型
      expect(CalcInst.computeRate(100, 0.1, 'invalid_type' as any)).toBe(10)
      expect(consoleWarn).toHaveBeenCalledWith(
        'Invalid rate type: invalid_type, 使用全局rateType配置'
      )
      
      // 无效税率值
      expect(CalcInst.computeRate(100, 1.5)).toBe(10) // 1.5→使用全局0.1
      expect(consoleWarn).toHaveBeenCalledWith(
        'userRate 应为 [0, 1] 的小数，请检查 userRate 参数后重新尝试'
      )
      
      consoleWarn.mockRestore()
    })
  })

  describe.skip('使用全局配置计算', () => { 
    // 全局配置影响
    it('使用全局配置计算', () => {
      CalcInst.setUserOption('taxRate', 0.15)
      CalcInst.setUserOption('rateType', 'excl_gst')
      expect(CalcInst.computeRate(200)).toBe(30) // 200*0.15
    })
  })

  describe.skip('缓存验证', () => {
    it('缓存命中验证', () => {
      const cacheSize = CalcInst.getCache().computeRate.size
      CalcInst.computeRate(10, 0.1)
      CalcInst.computeRate(10, 0.1)
      expect(CalcInst.getCache().computeRate.size).toBe(cacheSize + 1)
    })
    // 缓存键生成验证
    it('不同参数生成不同缓存键', () => {
      const cache = CalcInst.getCache('computeRate')
      const key1 = CalcInst.generateCacheKey({ originPrice: 100, userRate: 0.1 })
      const key2 = CalcInst.generateCacheKey({ originPrice: 100, userRate: 0.2 })
      
      CalcInst.computeRate(100, 0.1)
      CalcInst.computeRate(100, 0.2)
      
      expect(cache.get(key1)).not.toBe(cache.get(key2))
    })
  })

})