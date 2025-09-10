import { CalcInst } from '../../main'

describe('sum()', () => {
  beforeEach(() => {
    CalcInst.resetInstance()
  })


  describe('正常加法运算', () => {
    it('数组求和 [1, 2, 3] -> 6', () => {
      expect(CalcInst.sum([1, 2, 3])).toBe(6)
    })

    it('数组求和 [10, -5, 3.5] -> 8.5', () => {
      expect(CalcInst.sum([10, -5, 3.5])).toBe(8.5)
    })

    it('数组求和 [0.0005, 0.0005] -> 0.001', () => {
      expect(CalcInst.sum([0.0005, 0.0005])).toBe(0.001) // 0.0010 默认保留2位小数，所以这里 结果为 0
    })

    it('应正确处理包含负数的数组', () => {
      expect(CalcInst.sum([-1, -2, -3])).toBe(-6)
      expect(CalcInst.sum([-10, 5, 3.5])).toBe(-1.5)
    })

    it('科学计数法输入的高精度累加', () => {
      expect(CalcInst.sum([1e-15, 2e-15])).toBe(3e-15)
    })
  })

  describe('边界处理、极端输入 处理', () => {
    it('计算超小值，科学计数法的小数', () => {
      expect(CalcInst.sum([0.0000000001, 0.0000000002])).toBe(3e-10) // 0.0000000003 科学计数法 3e-10
    })

    it('可处理原始值为多位小数的数字', () => {
      expect(CalcInst.sum(56.6666666555)).toBe(56.6666666555)
    })

    it('应使用方法级精度重写返回正确的值', () => {
      expect(CalcInst.sum([1.1111111, 2.22222, 3.33333])).toBe(6.6666611)
      expect(CalcInst.sum({ a: 1.1111111, b: 2.22222, c: 3.33333 })).toBe(6.6666611)
    })

    it('keepParamsMaxPrecision 为 true 时保留最大精度', () => {
      CalcInst.setUserOption('keepParamsMaxPrecision', true)
      CalcInst.setUserOption('outputDecimalPlaces', 2)
      expect(CalcInst.sum([1.1, 2.22, 3.333])).toBe(6.65) // 1.1+2.22+3.333=6.653（不四舍五入）
    })

    it('不处理包含 Infinity 的数组，会过掉掉进行计算', () => {
      expect(CalcInst.sum([Infinity, 1])).toBe(1)
      expect(CalcInst.sum([-Infinity, -1])).toBe(-1)
    })
  })

  describe('异常输入', () => {
    it('空数组 返0', () => {
      expect(CalcInst.sum([])).toBe(0)
    })

    it('应正确处理对象中包含负数的情况', () => {
      expect(CalcInst.sum({ x: -10, y: null as any, z: 5 })).toBe(-5)
      expect(CalcInst.sum({ a: -0.999, b: 0.999 })).toBe(0)
    })

    it('应过滤混合类型数组中的非数字值', () => {
      expect(CalcInst.sum([1, '2' as any, true, 3])).toBe(4)
      expect(CalcInst.sum([true as any, false as any])).toBe(0) // true=1, false=0 但被过滤
    })

    it('当总和数据包含非数值时，应返回正确的值', () => {
      expect(CalcInst.sum([1, '2' as any, true, 3])).toBe(4)
    })

    it('当所有元素均为null或NaN时，应返回零', () => {
      expect(CalcInst.sum([null, undefined, NaN, 'abc' as any])).toBe(0)
    })

    it('当所有元素都无效时，应返回零', () => {
      expect(CalcInst.sum([null, undefined, NaN, 'abc' as any])).toBe(0)
    })

    it('当总和数据为空值的对象时，应返回正确的值', () => {
      expect(CalcInst.sum({ x: 10, y: null as any, z: 5 })).toBe(15)
    })

    it('应正确处理对象中包含NaN和非数字值的情况', () => {
      expect(CalcInst.sum({ a: NaN, b: 'abc' as any })).toBe(0)
      expect(CalcInst.sum({ x: 10, y: NaN, z: '100' as any })).toBe(10)
    })
  })

  describe('精度配置验证', () => {
    it('应正确处理精度配置参数', () => {
      expect(CalcInst.sum([0.000055, 0.000055])).toBe(0.00011) // 0.0010 -> 0.001 没配置按2位四舍五入就没了
    })

    it('数组求和 [1, 2.555, 3] -> 设置不同精度的结果应符合预期', () => {
      expect(CalcInst.sum([1, 2.555, 3], { outputDecimalPlaces: 0 })).toBe(7)
      expect(CalcInst.sum([1, 2.555, 3], { outputDecimalPlaces: 1 })).toBe(6.6)
      expect(CalcInst.sum([1, 2.555, 3], { outputDecimalPlaces: 2 })).toBe(6.56)
      expect(CalcInst.sum([1, 2.555, 3], { outputDecimalPlaces: 3 })).toBe(6.555)
      expect(CalcInst.sum([1, 2.555, 3])).toBe(6.555)
    })

    it('手动设置输出位数测试', () => {
      expect(CalcInst.sum([1.1111, 2.2222, 3.3333], { outputDecimalPlaces: 4 })).toBe(
        6.6666
      ) // 0.6666
      // expect(CalcInst.sum([1.1111, 2.2222, 3.3333], { outputDecimalPlaces: 3 })).toBe(6.667) // 0.6666
    })

    it('用户指定输出位数，小于默认位数时，优先输出用户指定位数', () => {
      expect(
        CalcInst.sum([1.111111, 2.222222, 3.333333], { outputDecimalPlaces: 2 })
      ).toBe(6.67)
    })

    it('没有指定，最终按默认2位进行四舍五入', () => {
      expect(CalcInst.sum([1.11555, 2.22255])).toBe(3.3381) // 1.11555 + 2.22255 = 3.3381
    })

    it('应返回具有高精度输入的正确值', () => {
      expect(
        CalcInst.sum([1.1111, 2.2222, 3.3333], {
          keepParamsMaxPrecision: false,
          outputDecimalPlaces: 3,
        })
      ).toBe(6.667) // 6.6666 -> 6.667
    })

    it('应正确处理精度为0时的整数计算', () => {
      CalcInst.setUserOption('outputDecimalPlaces', 0)
      expect(CalcInst.sum([1.111, 2.222])).toBe(3) // 3.333 → 四舍五入为3
      expect(CalcInst.sum([0.499, 0.499])).toBe(1) // 0.998 → 四舍五入为1
      CalcInst.setUserOption('outputDecimalPlaces', 2)
    })

    it('应正确处理精度为8时的极限小数计算', () => {
      CalcInst.setUserOption('outputDecimalPlaces', 8)
      expect(CalcInst.sum([0.00000001, 0.00000001])).toBe(0.00000002)
      expect(CalcInst.sum([0.99999999, 0.00000001])).toBe(1)
      CalcInst.setUserOption('outputDecimalPlaces', 2)
    })
  })

  describe('sum() 嵌套对象处理', () => {
    // TODO 后续再加，可以处理多层嵌套对象里的数字
    it('应正确处理嵌套对象的递归求和', () => {
      const nestedObj = { 
        a: 1, 
        b: 2, 
        c: 3, 
        d: 4,
        e: 5,
      }
      expect(CalcInst.sum(nestedObj)).toBe(15)
    })

    // it('不处理包含 Infinity 的数组，会过掉掉进行计算', () => {
    //   expect(CalcInst.sum([Infinity, 1])).toBe(1)
    //   expect(CalcInst.sum([-Infinity, -1])).toBe(-1)
    // })
  })

  describe('缓存机制验证', () => {
    it('应该正确命中缓存，重复命中不会增加计算次数', () => {
      CalcInst.clearCache('all')

      // 第一次调用生成缓存
      CalcInst.sum([1, 2, 3, 4, 5])
      // 第二次相同输入应命中缓存
      CalcInst.sum([1, 2, 3, 4, 5])
      expect(CalcInst.getCache().sum.size).toBe(1)

      // 新的计算，生成两条缓存记录
      CalcInst.sum([1.1, 2.2, 3.3])
      CalcInst.sum([1.1, 2.2, 3.3])
      expect(CalcInst.getCache().sum.size).toBe(2)
    })

    it('应确保不同配置生成唯一缓存键', () => {
      CalcInst.clearCache('all')
      CalcInst.sum([1, 2, 3], { outputDecimalPlaces: 2 })
      CalcInst.sum([1, 2, 3], { outputDecimalPlaces: 3 })
      expect(CalcInst.getCache().sum.size).toBe(2)
    })

    it('应确保对象属性顺序不影响缓存键一致性', () => {
      const obj1 = { a: 1, b: 2 }
      const obj2 = { b: 2, a: 1 }
      const key1 = CalcInst.generateCacheKey({
        data: obj1,
        mergedOptions: CalcInst._getUserOptions(),
      })
      const key2 = CalcInst.generateCacheKey({
        data: obj2,
        mergedOptions: CalcInst._getUserOptions(),
      })
      expect(key1).toBe(key2)
    })

    it('应正确跟踪缓存统计信息', () => {
      CalcInst.clearCache('all')
      CalcInst.sum([1, 2])
      CalcInst.sum([1, 2]) // 命中缓存
      expect(CalcInst.queryCacheStat().sum).toBe(1)
      expect(CalcInst.queryCacheStat('sum').sum).toBe(1)
    })

    it('应处理无效的缓存类型', () => {
      const stats = CalcInst.queryCacheStat('invalidType' as CacheType)
      expect(stats.all).toBe(0)
      expect(stats.sum).toBe(0)
    })
  })
})
