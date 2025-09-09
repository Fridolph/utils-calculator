import { getDecimalPlaces } from '../../utils/string';

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
      expect(getDecimalPlaces('0.00')).toBe(0)
      expect(getDecimalPlaces('0.00', 1)).toBe(1)
      expect(getDecimalPlaces('0.00', 2)).toBe(2)

      expect(getDecimalPlaces('0.000')).toBe(0)
      expect(getDecimalPlaces('0.000', 2)).toBe(2)
      expect(getDecimalPlaces('0.000', 3)).toBe(3)
    })

    it('应处理超长小数位输入', () => {
      const longDecimal = '0.' + '1'.repeat(15)
      expect(getDecimalPlaces(longDecimal)).toBe(15)
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
})