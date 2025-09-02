import { isObject, isString, getDecimalPlaces } from "../../utils/index"

describe.skip('isObject()', () => {
  it('isObject 识别基本类型', () => {
    expect(isObject(undefined)).toBe(false)
    expect(isObject(null)).toBe(false)
    expect(isObject(1)).toBe(false)
    expect(isObject('2')).toBe(false)
    expect(isObject(false)).toBe(false)
    expect(isObject(Symbol('3'))).toBe(false)
    expect(isObject(123456789012345678901234567890n)).toBe(false)
  })

  it('isObject 识别引用类型', () => {
    expect(isObject({})).toBe(true)
    expect(isObject([])).toBe(false)
    expect(isObject(new Date())).toBe(false)
    expect(isObject(() => {})).toBe(false)
    expect(isObject(new Set())).toBe(false)
    expect(isObject(new WeakSet())).toBe(false)
    expect(isObject(new Map())).toBe(false)
    expect(isObject(new WeakMap())).toBe(false)
  })
})

describe.skip('isString()', () => {
  it('isString 识别 null 为非对象', () => {
    expect(isString(null)).toBe(false)
    expect(isString(1)).toBe(false)
    expect(isString(true)).toBe(false)
    expect(isString('false')).toBe(true)
    expect(isString('{}')).toBe(true)
    expect(isString({})).toBe(false)
    expect(isString([])).toBe(false)
    expect(isString('[]')).toBe(true)
  })
})

describe('debugger', () => {
  it('科学计数法测试 > 处理大指数情况', () => { 
    // expect(getDecimalPlaces(1e-15)).toBe(15) 
    expect(getDecimalPlaces(2.1e-15)).toBe(15) 
    // expect(getDecimalPlaces("1e-12")).toBe(12) 
  })
})


describe.skip('getDecimalPlaces()', () => { 
  describe('正常功能测试', () => {
    it('基础小数位数识别', () => { 
      expect(getDecimalPlaces(3.14)).toBe(2)
      expect(getDecimalPlaces(2.71828)).toBe(5) 
    })
  
    it('整数返回0位小数', () => { 
      expect(getDecimalPlaces(100)).toBe(0) 
      expect(getDecimalPlaces("123")).toBe(0) 
    })
    
    it('科学计数法测试 > 处理e-指数形式', () => { 
      expect(getDecimalPlaces(2.5e-3)).toBe(4) // 0.0025
      expect(getDecimalPlaces(1.23e-5)).toBe(7) // 0.0000123
    })
  
    it('科学计数法测试 > 处理大指数情况', () => { 
      expect(getDecimalPlaces(1e-15)).toBe(15) 
      expect(getDecimalPlaces("1e-12")).toBe(12) 
    }) 
  })
  
  describe.skip('边界值测试', () => { 
    it('零值处理', () => { 
      expect(getDecimalPlaces(0)).toBe(0) 
      expect(getDecimalPlaces("0.00")).toBe(2) 
    })
  
    it('负数场景', () => { 
      expect(getDecimalPlaces(-3.1415)).toBe(4) 
      expect(getDecimalPlaces("-2.71828")).toBe(5) 
    })
  
    it('小数点边界情况', () => { 
      expect(getDecimalPlaces(5.1)).toBe(1) 
      expect(getDecimalPlaces("5.")).toBe(0) 
    }) 

    it('小数点后零值处理', () => { 
      expect(getDecimalPlaces(5.000)).toBe(0) // JS Number 类型 区分不了这样的小数位，要使用下面的 字符串数字
      expect(getDecimalPlaces("5.000")).toBe(3)
    })
  })
  
  describe.skip('异常输入处理', () => { 
    it('无效数字输入', () => { 
      expect(getDecimalPlaces("abc")).toBe(0) 
      expect(getDecimalPlaces(null as any)).toBe(0) 
    })
  
    it('特殊值处理', () => { 
      expect(getDecimalPlaces(undefined as any)).toBe(0) 
      expect(getDecimalPlaces(NaN)).toBe(0) 
    })
    
    it('混合类型处理', () => { 
      expect(getDecimalPlaces(true as any)).toBe(0) 
      expect(getDecimalPlaces({} as any)).toBe(0) 
    }) 

    it('数字与字符串一致性', () => { 
      expect(getDecimalPlaces(0.456)).toBe(getDecimalPlaces("0.456")) 
      expect(getDecimalPlaces(1.23e-4)).toBe(getDecimalPlaces("1.23e-4")) 
    })

    it('类型转换健壮性', () => { 
      expect(getDecimalPlaces("123abc" as any)).toBe(0) 
      expect(getDecimalPlaces("abc123" as any)).toBe(0) 
    }) 
  })
})
