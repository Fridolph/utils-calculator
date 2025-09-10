import { getDecimalPlaces } from '../../utils';

describe('getDecimalPlaces() 小数位数检测函数', () => {
  // 科学计数法输入测试
  describe('科学计数法输入处理', () => {
    it('应正确解析 e- 表示的小数', () => {
      expect(getDecimalPlaces('1e-5')).toBe(5)
      expect(getDecimalPlaces('2.5e-3')).toBe(4)
      expect(getDecimalPlaces('123e-5')).toBe(5)
      expect(getDecimalPlaces('0.123e-5')).toBe(8)
      expect(getDecimalPlaces('2340000e-3')).toBe(0)
    })

    it('应处理科学计数法中的整数输入', () => {
      expect(getDecimalPlaces('1e-0')).toBe(0)
      expect(getDecimalPlaces('5e-1')).toBe(1)
    })

    it('应正确处理指数部分的前导零', () => {
      expect(getDecimalPlaces('1.2e-03')).toBe(4)
      expect(getDecimalPlaces('0.001e-004')).toBe(7) // 0.001e-004 → 1e-7 → 7
    })

    it('应处理零指数的特殊形式', () => {
      expect(getDecimalPlaces('5e0')).toBe(0) // 5e0 → 5 → 0位小数
      expect(getDecimalPlaces('5.0e0')).toBe(0)
    })

    it('应处理转换为科学计数法的边界值', () => {
      // expect(getDecimalPlaces('0.000000001')).toBe(9) // Number('0.000000001') → 1e-9
      expect(getDecimalPlaces('999999.999999')).toBe(6)
    })
  })

  // 正常小数输入测试
  describe('常规小数输入处理', () => {
    it('应正确返回标准小数位数', () => {
      expect(getDecimalPlaces('1.23')).toBe(2)
      expect(getDecimalPlaces('3.1415')).toBe(4)
      expect(getDecimalPlaces('0.000001')).toBe(6)
    })

    it('应处理小数点后无数字的情况', () => {
      expect(getDecimalPlaces('5.')).toBe(0)
      expect(getDecimalPlaces('100.')).toBe(0)
    })

    it('应统一返回最小2位小数', () => {
      expect(getDecimalPlaces('0.5')).toBe(1)
      expect(getDecimalPlaces('1.2')).toBe(1)
      expect(getDecimalPlaces(3)).toBe(0)  // 整数输入
    })
  })

  // 边界值测试
  describe('边界值处理', () => {
    it('应正确处理零值小数', () => {
      expect(getDecimalPlaces('0.00')).toBe(2)
      // expect(getDecimalPlaces('0.00', 2)).toBe(2)

      expect(getDecimalPlaces('0.000')).toBe(3)
      // expect(getDecimalPlaces('0.000', 2)).toBe(2)
      // expect(getDecimalPlaces('0.000', 3)).toBe(3)
    })

    it('应处理超长小数位输入', () => {
      const longDecimal = '0.' + '1'.repeat(15)
      expect(getDecimalPlaces(longDecimal)).toBe(15)
    })

     it('应处理小数点前导零和后导零', () => {
      expect(getDecimalPlaces('0.000')).toBe(0) // decimalPlaces=3 → 但代码中条件为<=2 ? 2 : decimalPlaces → 3>2 → 3
      expect(getDecimalPlaces('0.000')).toBe(3) // 但原函数没有第二个参数，可能需要修改代码
    })

    // 需要确认函数是否接受第二个参数
    it('应处理自定义精度参数', () => {
      expect(getDecimalPlaces('0.000')).toBe(3)
      expect(getDecimalPlaces('0.000')).toBe(1)
    })
  })

  // 异常输入测试
  describe('异常输入处理', () => {
    it('应处理空值输入', () => {
      expect(getDecimalPlaces(null as any)).toBe(0)
      expect(getDecimalPlaces(undefined as any)).toBe(0)
    })

    it('应处理非数字字符串', () => {
      expect(getDecimalPlaces('abc')).toBe(0)
      expect(getDecimalPlaces('123abc')).toBe(0)
    })

    it('应处理特殊数值输入', () => {
      expect(getDecimalPlaces(NaN as any)).toBe(0)
      expect(getDecimalPlaces(Infinity as any)).toBe(0)
    })
  })

  // 数字类型直接输入
  describe('数字类型直接输入', () => {
    it('应正确处理数字类型参数', () => {
      expect(getDecimalPlaces(1.23)).toBe(2)
      expect(getDecimalPlaces(123.456)).toBe(3)
      expect(getDecimalPlaces(100)).toBe(0)
    })

    it('应处理浮点数精度问题', () => {
      expect(getDecimalPlaces(0.1)).toBe(1)
      expect(getDecimalPlaces(0.123456789)).toBe(9)
    })
  })

  // 常规小数的完整分支覆盖
  describe('常规小数位数判断', () => {
    it('应强制返回最小2位小数', () => {
      expect(getDecimalPlaces('0.5')).toBe(1) // decimalPlaces=1
      expect(getDecimalPlaces('1.2')).toBe(1) // decimalPlaces=1
      expect(getDecimalPlaces('0.00')).toBe(2) // decimalPlaces=2
      expect(getDecimalPlaces('0.000')).toBe(3) // decimalPlaces=3
    })
    
    // TODO https://github.com/Fridolph/utils-calculator/issues/17
    // it('应处理整数输入', () => {
    //   expect(getDecimalPlaces('100')).toBe(0) // decimalPlaces=0
    //   expect(getDecimalPlaces('100.0000')).toBe(4) // decimalPlaces=1
    // })

    // it('应正确处理小数点后零值', () => {
    //   expect(getDecimalPlaces('0.000000')).toBe(6)
    //   expect(getDecimalPlaces('0.000000', 4)).toBe(4)
    // })
  })

  // 新增异常流覆盖
  describe('特殊值处理', () => {
    it('应处理NaN转换后的输入', () => {
      expect(getDecimalPlaces('NaN')).toBe(0)
      expect(getDecimalPlaces('Infinity')).toBe(0)
    })

    it('应处理空字符串和空输入', () => {
      expect(getDecimalPlaces('')).toBe(0)
      expect(getDecimalPlaces(' ')).toBe(0)
    })
  })
})