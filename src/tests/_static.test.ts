import { CalcInst, Calculator } from '../main'

describe('Calculator Static Methods and Constructor', () => {
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
