import { CalcInst, Calculator } from '../main'

describe('Calculator Static Methods and Constructor', () => {
  beforeEach(() => {
    CalcInst.clearCache()
    CalcInst.setOption('precision', 2)
    CalcInst.setOption('taxRate', 0.1)
    CalcInst.setOption('rateType', 'incl_gst')
  })

  // 测试 constructor
  it('should initialize Calculator instance correctly', () => {
    const instance = Calculator.getInstance()
    expect(instance.calcCache).toHaveProperty('sum')
    expect(instance.calcCache).toHaveProperty('subtractMultiple')
    expect(instance.getOptions()).toHaveProperty('precision')
  })

  // 测试 getInstance
  it('should return the same instance using getInstance', () => {
    const instance1 = Calculator.getInstance()
    const instance2 = Calculator.getInstance()
    expect(instance1).toBe(instance2)
  })
})

describe('Index Module Coverage', () => {
  // 1. 验证导出模块
  it('should export required modules', () => {
    expect(Calculator).toBeDefined()
    expect(CalcInst).toBeDefined()
  })

  // 2. 验证单例模式
  it('should maintain singleton pattern', () => {
    const instance1 = Calculator.getInstance()
    const instance2 = Calculator.getInstance()
    expect(instance1).toBe(instance2)
  })

  // 3. 验证模块导出
  it('should export correct type definitions', () => {
    // 通过类型推断验证
    const options: BaseOptions = {
      precision: 2,
      runtimePrecision: 10,
      taxRate: 0.1,
      rateType: 'incl_gst'
    }
    expect(options).toBeDefined()
  })
})