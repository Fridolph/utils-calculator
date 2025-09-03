import { CalcInst } from '../../main'

describe('Calculator.computeRate()', () => {
  beforeEach(() => {
    CalcInst.resetInstance()
  })
  
  describe('基础功能测试', () => {
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
      expect(CalcInst.computeRate(25, 0.1, 'EXCL')).toBe(2.5) // 25*0.1
      expect(CalcInst.computeRate(100, 0.15, 'EXCL')).toBe(15) // 100*0.15
    })
    
    // 免税场景
    it('gst_free场景返回0', () => {
      expect(CalcInst.computeRate(100, 0.1, 'FREE')).toBe(0)
      expect(CalcInst.computeRate(50, 0.2, 'FREE'))
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

  describe('computeRate() 参数组合测试', () => {
    it('应优先使用方法级 rateType 配置', () => {
      CalcInst.setUserOption('rateType', 'INCL')
      expect(CalcInst.computeRate(100, { rateType: 'EXCL' })).toBe(10) // 默认税率 0.1
    })

    it('FREE 类型应强制覆盖非零税率', () => {
      expect(CalcInst.computeRate(100, { rateType: 'FREE', taxRate: 0.2 })).toBe(0)
    })
  })
  
  describe('精度控制 与 精度校验', () => {
    beforeEach(() => {
      CalcInst.resetInstance()
    })
  
    // 精度控制
    it('keepResultPrecision为true时保留原始精度', () => {
      CalcInst.setUserOption('outputDecimalPlaces', 4)
      expect(CalcInst.computeRate(10, 0.1)).toBe(0.9091) // 0.9090909090909091
      CalcInst.setUserOption('outputDecimalPlaces', 5)
      expect(CalcInst.computeRate(100, 0.1)).toBe(9.09091) // 9.09091
      CalcInst.setUserOption('outputDecimalPlaces', -1)
    })

    // 高精度计算
    it('高精度计算验证 1', () => {
      expect(CalcInst.computeRate(0.01, 0.99999999999999)).toBe(0.004999999999999975)
    })

    it('keepResultPrecision为true时保留原始精度', () => {
      expect(CalcInst.computeRate(10, 0.1)).toBe(0.9090909090909091) // 原始计算结果
      expect(CalcInst.computeRate(100, 0.333333)).toBe(24.99998124999531) // 24.99998124999531
    })

    // 精度继承
    it('局部配置覆盖全局配置', () => {
      CalcInst.setUserOption('outputDecimalPlaces', 4)
      // 方法级配置覆盖全局配置
      expect(CalcInst.computeRate(200, { 
        outputDecimalPlaces: 2,
        taxRate: 0.3333,
        rateType: 'FREE'
      }))
        .toBe(0)

      CalcInst.setUserOption('outputDecimalPlaces', -1)
    })

    it('keepResultPrecision 为 false 时按 precision 四舍五入', () => {
      CalcInst.setUserOption('outputDecimalPlaces', 3)
      expect(CalcInst.computeRate(10, 0.1)).toBe(0.909) // 0.9090909 → 3位小数
      expect(CalcInst.computeRate(100, 0.333333)).toBe(25) // 24.99998124999531  ->  25.000
      expect(CalcInst.computeRate(100, { taxRate: 0.333333, outputDecimalPlaces: 5 })).toBe(24.99998) // 24.99998124999531  ->  24.99998
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
        rateType: 'INCL',
      })).toBe(13.54)
      // 13.54215209145857 -> 13.54
    })

    it('同样的参数，根据不同配置输出不同精度结果', () => {
      expect(CalcInst.computeRate(1010, 0.65555555555)).toBe(399.932885903993) // 399.932885903993
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

  describe('边界值 和 异常输入测试', () => {
    // 边界值处理
    it('边界值处理', () => {
      expect(CalcInst.computeRate(0, 0.1)).toBe(0) // 0元处理
      expect(CalcInst.computeRate(-50, { outputDecimalPlaces: 4, taxRate: 0.2211 })).toBe(-9.0533) // 负数处理
      expect(CalcInst.computeRate(100, NaN as any)).toBe(100) // NaN处理
    })

    it('gst_free 类型下负数价格返回 0', () => {
      expect(CalcInst.computeRate(-100, { rateType: 'FREE' })).toBe(0)
    })

    it('超大数值的税率计算', () => {
      const result = CalcInst.computeRate(1e15, { taxRate: 0.1, outputDecimalPlaces: 0 })
      // 1e15 -> 1000000000000000  16个0 计算后自身精度丢1 -> 15位 * 0.1 
      // 90909090909090.9 -> 由于 outputDecimalPlaces为0 四舍五入了  -> 90909090909091
      expect(result).toBe(90909090909091)
    })
  })

  describe('使用全局配置计算', () => { 
    // 全局配置影响
    it('使用全局配置计算', () => {
      CalcInst.setUserOption('taxRate', 0.15)
      CalcInst.setUserOption('rateType', 'EXCL')
      expect(CalcInst.computeRate(200)).toBe(30) // 200*0.15
    })
  })

  describe('缓存验证', () => {
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
      const key3 = CalcInst.generateCacheKey({ userRate: 0.2, originPrice: 100 })
      
      CalcInst.computeRate(100, 0.1)
      CalcInst.computeRate(100, 0.2)
      
      expect(key1).not.toBe(key2)
      expect(key2).toBe(key3)
    })
  })

})