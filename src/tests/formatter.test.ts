import { formatterInst } from '../formatter'

describe('Class Formatter', () => {
  describe('format 功能测试', () => {
    it('不配置，简单使用', () => {
      expect(formatterInst.format(123456789.123456789)).toBe('123456789.12')
    })
    
    it('使用配置', () => {
      expect(formatterInst.format(123456789.123456789, { thousandSeparator: ',' })).toBe('123,456,789.12')
      expect(formatterInst.format(123.0035, { decimalDigits: 4 })).toBe('123.0035')
      expect(formatterInst.format(123.0035, { decimalDigits: 3 })).toBe('123.004')
    })
  })
})
