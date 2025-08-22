import { $number } from './utils'

/**
 * 默认基础配置项：小数点，税率，税种等
 */
const defaultBaseOptions: Partial<BaseOptions> = {
  precision: 2,
  taxRate: 0.1, // 折扣率 - 理解为 打九折
  rateType: 'incl_gst', // 重构前 为 RateType 这里命名更通用，一般用到了都是要计算税的，默认值取 incl_gst
}

const cacheFnList = ['all', 'sum', 'calcUnitPrice', 'calcLinePrice',
  'percentToDecimal', 'decimalToPercent', 'calculateDiscountedPrice', 'computeRate']

/**
 * @author: Fridolph
 * @description 基于 $number 计算的，把经常用到一些计算方法封装为一个工具类，也算是减少模版代码 W_W
 * @description 注意：为避免国际化带来的千分位及小数等问题，使用前请将传参都处理为通用的 Number 类型。类方法的输出都是基础数字类型
 * 处理边界情况：
 * 1. 不直接报错，允许用户传入 0 和 null
 * 2. 错误逻辑，如分母为0的情况，将输出处理为 null
 * 3. 计算结果为 0 时，输出为 0
 * @example 简单求和   CalcInst.sum([23.34, 34.67, 99.99]) -> 157.99
 * @example 小数转百分比 CalcInst.decimalToPercent(0.50549993) -> 50.56
 * @example 百分比转小数 CalcInst.decimalToPercent(0.50549993) -> 50.56
 */
export class Calculator {
  // 性能考量：使用单例模式
  private static instance: Calculator
  private baseOptions: Partial<BaseOptions>
  // 性能考虑：将每次的计算结果进行缓存，若有同类型的计算，可直接返回缓存结果
  private calculationCache: {
    sum: Map<string, number>
    subtractMultiple: Map<string, number>
    calcUnitPrice: Map<string, CalcBaseTotalParams>
    calcLinePrice: Map<string, CalcBaseTotalParams>
    percentToDecimal: Map<string, number | null>
    decimalToPercent: Map<string, number | null>
    calculateDiscountedPrice: Map<string, number | null>
    computeRate: Map<string, number>
  }

  private constructor() {
    this.calculationCache = {
      sum: new Map(),
      subtractMultiple: new Map(),
      calcUnitPrice: new Map(),
      calcLinePrice: new Map(),
      percentToDecimal: new Map(),
      decimalToPercent: new Map(),
      calculateDiscountedPrice: new Map(),
      computeRate: new Map(),
    }
    this.baseOptions = defaultBaseOptions
  }

  public setOptions(options: Partial<BaseOptions>): void {
    this.baseOptions = {
      ...this.getOptions(),
      ...options as Partial<BaseOptions>,
    }
  }

  public getOptions() {
    return this.baseOptions
  }

  /**
   * 获取单例实例：目前只有查看和清缓存两个用法
   */
  public static getInstance(): Calculator {
    if (!Calculator.instance) {
      Calculator.instance = new Calculator()
    }
    return Calculator.instance
  }

  /**
   * 增加一个可手动清除缓存的静态方法
   * @param cacheType
   */
  public clearCache(cacheType: CacheType = 'all') {
    // 吐槽：应付单元测试加的，都使用TS了真的还会乱传吗 Orz
    if (!cacheType) throw new Error('cacheType is required')
    if (cacheType === 'all' || cacheType === 'sum') {
      this.calculationCache.sum.clear()
    }
    if (cacheType === 'all' || cacheType === 'subtractMultiple') {
      this.calculationCache.subtractMultiple.clear()
    }
    if (cacheType === 'all' || cacheType === 'calcUnitPrice') {
      this.calculationCache.calcUnitPrice.clear()
    }
    if (cacheType === 'all' || cacheType === 'calcLinePrice') {
      this.calculationCache.calcLinePrice.clear()
    }
    if (cacheType === 'all' || cacheType === 'percentToDecimal') {
      this.calculationCache.percentToDecimal.clear()
    }
    if (cacheType === 'all' || cacheType === 'decimalToPercent') {
      this.calculationCache.decimalToPercent.clear()
    }
    if (cacheType === 'all' || cacheType === 'calculateDiscountedPrice') {
      this.calculationCache.calculateDiscountedPrice.clear()
    }
    if (cacheType === 'all' || cacheType === 'computeRate') {
      this.calculationCache.computeRate.clear()
    }
    if (!cacheFnList.includes(cacheType)) {
      console.warn(`Invalid cacheType: ${cacheType}`)
    }
  }

  /**
   * 查询缓存的统计信息
   * @param cacheType 可选参数，指定要查询的缓存类型，如'sum'等，不传则返回所有缓存类型统计信息
   * @returns 缓存统计信息对象
   */
  public queryCacheStat(cacheType: CacheType = 'all') {
    const cacheGroups = {
      sum: this.calculationCache.sum,
      
      calcUnitPrice: this.calculationCache.calcUnitPrice,
      calcLinePrice: this.calculationCache.calcLinePrice,
      percentToDecimal: this.calculationCache.percentToDecimal,
      decimalToPercent: this.calculationCache.decimalToPercent,
      calculateDiscountedPrice: this.calculationCache.calculateDiscountedPrice,
      computeRate: this.calculationCache.computeRate,
    }

    const result: { [key in CacheType]: number } = {
      all: 0,
      sum: 0,
      calcUnitPrice: 0,
      calcLinePrice: 0,
      percentToDecimal: 0,
      decimalToPercent: 0,
      calculateDiscountedPrice: 0,
      computeRate: 0,
    }

    const cacheKeys = cacheType === 'all' ? Object.keys(cacheGroups) : [cacheType as CacheType]

    cacheKeys.forEach((key) => {
      if (cacheGroups[key as keyof typeof cacheGroups]) {
        result[key as keyof typeof result] = cacheGroups[key as keyof typeof cacheGroups].size
        result.all += cacheGroups[key as keyof typeof cacheGroups].size
      }
    })

    return result
  }

  /**
   * 性能考量：生成数据的哈希值作为缓存键
   * @param data
   * @returns
   */
  private generateCacheKey(data: unknown): string {
    return JSON.stringify(data)
  }

  /**
   * 价格加总计算
   * @param data - 支持传入符合特定结构的对象或数组进行价格加总计算
   * @returns 加总后的结果，若出现错误情况则返回0
   */
  public sum(data: { [key: string]: number } | number[], userOptions?: BaseOptions): number {
    const mergedOptions = { ...this.getOptions(), ...userOptions }
    const cacheKey = this.generateCacheKey({ data, userOptions })
    if (this.calculationCache.sum.has(cacheKey)) {
      return this.calculationCache.sum.get(cacheKey)!
    }

    let total = 0
    let numbersToSum: number[] = []

    if (Array.isArray(data)) {
      numbersToSum = data.filter(num => typeof num === 'number' && !isNaN(num))
    }
    else if (typeof data === 'object') {
      // 处理为安全的数字类型（至少 要保证传入的都是数字类型 -> 下面这种处理好再传进来呀
      // 为避免认知混淆，一律不为数字的，如 '123', '$4.00' 都过滤掉）
      Object.values(data).filter((value: unknown): value is number => typeof value === 'number' && !isNaN(value))
    }

    if (numbersToSum.length > 0) {
      const sumResult = numbersToSum.reduce((acc: number, num: number) => {
        return $number(acc, { precision: mergedOptions.precision }).add(num).value
      }, 0)
      total = sumResult
    }

    this.calculationCache.sum.set(cacheKey, total)
    return total
  }


  /**
   * 从初始值中减去多个值
   * @param initialValue 初始值
   * @param subtractValues 要减去的值数组
   * @returns 减法运算后的结果
   * @example subtractMultiple(9.99, 8.88) -> 1.11
   * @example subtractMultiple(15, [1,2,3,4]) -> 5
   */
  public subtractMultiple(initialValue: number | null, subtractValues: number[]): number | null {
    // 如果第二个参数是数字，转换为数组
    const valueArray: number[] = typeof subtractValues === 'number' ? [subtractValues] : subtractValues

    if (initialValue === null || valueArray.some(value => typeof value !== 'number' || isNaN(value))) {
      return null
    }

    const cacheKey = this.generateCacheKey({ initialValue, subtractValues })
    if (this.calculationCache.sum.has(cacheKey)) {
      return this.calculationCache.sum.get(cacheKey)!
    }

    const validSubtractValues = subtractValues.filter(value => typeof value === 'number' && !isNaN(value))
    const result = validSubtractValues.reduce((acc, value) => {
      return $number(acc, { precision: this.baseOptions.precision }).subtract(value).value
    }, initialValue)
    this.calculationCache.sum.set(cacheKey, result)

    return result
  }

  /**
   * 基础公式: 单价 = 总价 / 数量
   * @param calcBaseTotalParams - { quantity, unitPrice, linePrice }
   * @returns
   */
  public calcUnitPrice(calcBaseTotalParams: CalcBaseTotalParams, userOptions?: BaseOptions): {
    quantity: number | null
    unitPrice: number | null
    linePrice: number | null
  } {
    const mergedOptions = { ...this.getOptions(), ...userOptions }
    const cacheKey = this.generateCacheKey({ calcBaseTotalParams, userOptions })
    if (this.calculationCache.calcUnitPrice.has(cacheKey)) {
      return this.calculationCache.calcUnitPrice.get(cacheKey)!
    }

    const { quantity, linePrice } = calcBaseTotalParams
    let { unitPrice } = calcBaseTotalParams

    // 如果总价和数量都为null，直接返回初始值
    if (quantity === null && linePrice === null) {
      return { quantity, unitPrice, linePrice }
    }

    // 联动逻辑：一般都会有数量，若确实没有数量，当作1来处理，则单价 = 总价
    if (quantity === null || quantity === 0) {
      return { quantity, unitPrice: linePrice, linePrice }
    }

    // 处理分母为0的情况
    if (quantity === 0) {
      unitPrice = null
    }
    // 通用计算逻辑 单价 = 总价 / 数量
    else {
      unitPrice = $number(linePrice || 0, { precision: mergedOptions.precision }).divide(quantity).value
    }

    const result = { quantity, unitPrice, linePrice }
    this.calculationCache.calcUnitPrice.set(cacheKey, result)
    return result
  }

  /**
   * 基础公式: 总价 = 数量 * 单价
   * @param calcBaseTotalParams - { quantity, unitPrice, linePrice }
   * @returns
   */
  public calcLinePrice(calcBaseTotalParams: CalcBaseTotalParams, userOptions?: BaseOptions): {
    quantity: number | null
    unitPrice: number | null
    linePrice: number | null
  } {
    const mergedOptions = { ...this.getOptions(), ...userOptions }
    const cacheKey = this.generateCacheKey({ calcBaseTotalParams, userOptions })
    if (this.calculationCache.calcLinePrice.has(cacheKey)) {
      return this.calculationCache.calcLinePrice.get(cacheKey)!
    }

    const { quantity, unitPrice } = calcBaseTotalParams
    let { linePrice } = calcBaseTotalParams

    // 明确边界处理逻辑，这里统一返回null
    if (quantity === null || unitPrice === null) {
      return { quantity, unitPrice, linePrice: null }
    }
    // 通用计算逻辑
    else {
      linePrice = $number(quantity, { precision: mergedOptions.precision }).multiply(unitPrice).value
    }

    const result = { quantity, unitPrice, linePrice }
    this.calculationCache.calcLinePrice.set(cacheKey, result)
    return result
  }

  /**
   * 将百分比数值转换为小数
   * @param originPercentage 比百分数值，例如 50.56
   * @param decimalPlaces 控制小数位数，默认保留2位
   * @returns 转换后的小数值，如果传入非法值返回 null
   * @example 默认使用 CalcInst.percentToDecimal(50.56) -> 0.5056
   * @example 控制位数 CalcInst.percentToDecimal(50.5678, 6) -> 0.5056
   */
  public percentToDecimal(originPercentage: number | null, decimalPlaces: number | null = 2): number | null {
    const cacheKey = this.generateCacheKey({ originPercentage, decimalPlaces })
    if (this.calculationCache.percentToDecimal.has(cacheKey)) {
      return this.calculationCache.percentToDecimal.get(cacheKey)!
    }
    // 边界情况：传 null 默认不处理
    if (originPercentage === null || isNaN(originPercentage)) return null

    const precision = decimalPlaces ? decimalPlaces + 2 : (this.baseOptions.precision as number) + 2
    const result = $number(originPercentage, { precision }).divide(100).value
    this.calculationCache.percentToDecimal.set(cacheKey, result)
    return result
  }

  /**
   * 将小数转换为百分比
   * @param originDecimal 小数值
   * @param decimalPlaces 控制小数位数，默认保留2位
   * @returns 转换后的百分比数值，如果传入非法值返回 null
   * @example 默认使用 CalcInst.percentToDecimal(50.56) -> 0.5056
   * @example 控制位数 CalcInst.percentToDecimal(50.567890, 4) -> 0.505679
   */
  public decimalToPercent(originDecimal: number | null, decimalPlaces: number | null = 2): number | null {
    const cacheKey = this.generateCacheKey({ originDecimal, decimalPlaces })
    if (this.calculationCache.decimalToPercent.has(cacheKey)) {
      return this.calculationCache.decimalToPercent.get(cacheKey)!
    }
    // 边界情况：传 null 默认不处理
    if (originDecimal === null || isNaN(originDecimal)) return null

    const precision = decimalPlaces ? decimalPlaces + 2 : (this.baseOptions.precision as number) + 2
    const result = $number(originDecimal, { precision }).multiply(100).value
    this.calculationCache.decimalToPercent.set(cacheKey, result)
    return result
  }

  /**
   * 计算折扣后的价格
   * @param originalPrice 原始价格
   * @param discountRate 折扣率，例如 0.8 代表 8 折
   * @description 折扣不能为0和1，但允许用户这样输，约定如下：
   * @description 0 为 不打折，返原始价格；1 为 白送，最终价格为为 0
   * @returns 折扣后的价格，如果输入不合法返回 null
   */
  public calculateDiscountedPrice(originalPrice: number | null, discountRate: number | null): number | null {
    const cacheKey = this.generateCacheKey({ originalPrice, discountRate })
    if (this.calculationCache.calculateDiscountedPrice.has(cacheKey)) {
      return this.calculationCache.calculateDiscountedPrice.get(cacheKey)!
    }
    // 边界1 输入价格或折扣为null，统一不处理
    if (originalPrice === null || discountRate === null || isNaN(originalPrice) || isNaN(discountRate)) {
      return null
    }
    // 边界2 折扣为0，直接返原价
    if (discountRate === 0) {
      return originalPrice
    }
    // 边界3 折扣为1，（打满折）最终价为0
    if (discountRate === 1) {
      return 0
    }

    const result = $number(originalPrice, { precision: this.baseOptions.precision }).multiply(discountRate).value
    this.calculationCache.calculateDiscountedPrice.set(cacheKey, result)
    return result
  }

  /**
   * @param originPrice 原始价格
   * @param userRate 小数，如 0.1，表示 打 9 折
   * @param userRateType 不填默认为 incl_gst
   * @description gst_free: 忽略计算;  excl_gst: 不含税;  incl_gst: 含税
   * @returns discountedPrice 折后价格
   */
  public computeRate(originPrice: number, userRate?: number, userRateType?: RateType): number {
    const cacheKey = this.generateCacheKey({ originPrice, userRate, userRateType })
    if (this.calculationCache.computeRate.has(cacheKey)) {
      return this.calculationCache.computeRate.get(cacheKey)!
    }

    let finalRatePrice = 0
    // 边界1 没有原价，或为0，要保证计算出来为Number 所以取0
    if (originPrice === null || originPrice === 0) return finalRatePrice

    const rate = (userRate !== null ? userRate : this.baseOptions.taxRate) as number
    const rateType = userRateType != null ? userRateType : this.baseOptions.rateType
    const precision = this.baseOptions.precision

    const addedRate = $number(1, { precision }).add(rate).value
    const rateCalculators: { [key in RateType]: (price: number) => number } = {
      gst_free: () => 0,
      incl_gst: price => $number(price, { precision }).divide(addedRate).multiply(rate).value,
      excl_gst: price => $number(price, { precision }).multiply(rate).value,
    }
    // 添加默认处理，防止访问不存在的键
    const calculator = rateCalculators[rateType as RateType]
    if (!calculator) {
      console.warn(`Invalid rateType: ${rateType}`)
      return finalRatePrice
    }
    finalRatePrice = calculator(originPrice)
    this.calculationCache.computeRate.set(cacheKey, finalRatePrice)
    return finalRatePrice
  }
}

// 导出单例实例
export const CalcInst = Calculator.getInstance()
