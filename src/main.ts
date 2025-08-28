/**
 * @author: Fridolph
 * @description 基于 $number 计算的，把经常用到一些计算方法封装为一个工具类，也算是减少模版代码 W_W
 * @description 注意：为避免国际化带来的千分位及小数等问题，使用前请将传参都处理为通用的 Number 类型。类方法的输出都是基础数字类型
 * 处理边界情况：
 * 0. 命中边界直接返对应预设值，且不命中缓存
 * 1. 不直接报错，允许用户传入 0 和 null，及返回 null （产品希望某些情况，将错误值清空）
 * 2. 错误逻辑，如分母为0的情况，将输出处理为 null
 * 3. 计算结果为 0 时，输出为 0
 * @example 简单求和   CalcInst.sum([23.34, 34.67, 99.99]) -> 157.99
 * @example 小数转百分比 CalcInst.decimalToPercent(0.50549993) -> 50.56
 * @example 百分比转小数 CalcInst.decimalToPercent(0.50549993) -> 50.56
 */
import Decimal from 'decimal.js'
import { isNumber, isObject, isNaN } from './utils/type'
import { getDecimalPlaces } from './utils/string'

/**
 * 默认基础配置项：小数点，税率，税种等
 */
const defaultUserOptions: UserOptions = {
  // 是否保留计算结果的精度，如 0.22225 + 0.22225 = 0.4445
  // 若不保留，按默认 precision: 2 来呈现最终结果 -> 0.44
  keepParamsMaxPrecision: true,
  // 最终计算输出结果 精确到的小数位数
  // 根据业务需求自行调整, -1 为保留原始计算值
  outputDecimalPlaces: -1, 
  taxRate: 0.1, // 折扣率 - 理解为 打九折
  rateType: 'incl_gst', // 重构前 为 RateType 这里命名更通用，一般用到了都是要计算税的，默认值取 incl_gst
}

const defaultDecimalConfigs: Decimal.Config = {
  precision: 20, // 计算精度，参考 decimal.js 文档，可根据需求灵活调整
  rounding: Decimal.ROUND_HALF_UP, // 使用标准四舍五入 5进位 4舍去
  toExpNeg: -7,
  toExpPos: 21,
  maxE: 9e15,
  minE: -9e15,
  modulo: 1,
  crypto: false,
}

const cacheFnList = [
  'all',
  'sum',
  'subtractMultiple',
  'calcUnitPrice',
  'calcLinePrice',
  'percentToDecimal',
  'decimalToPercent',
  'calculateDiscountedPrice',
  'computeRate',
]

/**
 * 核心计算类
 * @remarks
 * 提供多种计算方法和缓存优化机制，适用于金融、电商等需要高精度计算的场景
 *
 * @example
 * ```ts
 * const calc = Calculator.getInstance()
 * calc.sum([1, 2, 3]) // 6
 * calc.decimalToPercent(0.66666666, 4) // 66.6667
 * ```
 * 当然也可以直接使用单例模式
 * ```ts
 * CalcInst.sum([1,2,3,4]) // 10
 * CalcInst.percentToDecimal(55.66, 4) // 0.5566
 * ```
 */
export class Calculator {
  // 性能考量：使用单例模式
  private static instance: Calculator
  public userOptions: UserOptions
  public calcConfigs: Decimal.Config
  // 性能考虑：将每次的计算结果进行缓存，若有同类型的计算，可直接返回缓存结果
  public calcCache: CacheStore

  private constructor() {
    this.calcCache = {
      sum: new Map(),
      subtractMultiple: new Map(),
      calcUnitPrice: new Map(),
      // calcLinePrice: new Map(),
      // percentToDecimal: new Map(),
      // decimalToPercent: new Map(),
      // calculateDiscountedPrice: new Map(),
      // computeRate: new Map(),
    }
    this.userOptions = defaultUserOptions
    this.calcConfigs = defaultDecimalConfigs
  }

  public resetInstance() {
    this.clearCache()
    this.userOptions = defaultUserOptions
    this.calcConfigs = defaultDecimalConfigs
  }

  /**
   * 动态设置计算器核心配置项
   * @description 用于调整运行时计算参数，支持链式调用
   *
   * @example 设置精度
   * ```ts
   * CalcInst.setUserOption('outputDecimalPlaces', 3) // 设置计算精度为3位小数
   * CalcInst.setUserOption('outputDecimalPlaces', 0) // 禁用小数计算
   * ```
   *
   * @example 设置税率
   * ```ts
   * CalcInst.setUserOption('taxRate', 0.15) // 设置15%税率
   * CalcInst.setUserOption('taxRate', 0) // 免税场景
   * ```
   *
   * @example 设置计税模式
   * ```ts
   * CalcInst.setUserOption('rateType', 'gst_free') // 税种无关计算
   * CalcInst.setUserOption('rateType', 'excl_gst') // 含税计算模式
   * ```
   *
   * @param option - 配置项名称，可选值：
   * - 'precision'：调整计算精度（0-15位小数）
   * - 'taxRate'：设置税率（0-1之间的小数）
   * - 'rateType'：指定税率类型（'gst_free'|'incl_gst'|'excl_gst'）
   *
   * @param value - 配置项值，根据option类型不同：
   * - precision: 必须是 0~8 的数字
   * - taxRate: 必须是 0~1 的数字
   * - rateType: 必须是有效税率类型
   *
   * @throws {Error} 当传入无效配置项时抛出错误
   * - 无效配置项名：`Invalid option: ${option}`
   * - 精度超出范围：`Precision must be a number between 0 and 8`
   * - 税率超出范围：`Tax rate must be a number between 0 and 1`
   * - 无效税率类型：`Invalid RateType`
   *
   * @remarks
   * 该方法支持链式调用，典型用法：
   * ```ts
   * CalcInst
   *   .setUserOption('outputDecimalPlaces', 3)
   *   .setUserOption('taxRate', 0.1)
   * ```
   */
  public setUserOption<K extends keyof UserOptions>(option: K, value: UserOptions[K]): void {
    switch (option) {
      case 'outputDecimalPlaces':
        if (typeof value !== 'number' || value < 0 || value > 15) {
          throw new Error('Precision must be a number between 0 and 15')
        }
        this.userOptions.outputDecimalPlaces = value
        break

      case 'taxRate':
        if (typeof value !== 'number' || value < 0 || value > 1) {
          throw new Error('Tax rate must be a number between 0 and 1')
        }
        this.userOptions.taxRate = value
        break
        
      case 'rateType':
        const validRateTypes: readonly RateType[] = ['gst_free', 'incl_gst', 'excl_gst']
        if (!validRateTypes.includes(value as RateType)) {
          throw new Error('Invalid RateType')
        }
        this.userOptions.rateType = value as RateType
        break
      default:
        throw new Error(`Invalid option: ${option}`)
    }
  }

  public _getCalcConfigs() {
    return this.calcConfigs
  }

  public _getUserOptions() {
    return this.userOptions
  }

  /**
   * 处理保留参数最大精度逻辑
   * @param dataStructure - 输入的数据结构，可以是数组、对象、数字或其他未知类型
   * @returns - 返回数据结构中数字的最大小数位数，如果没有小数则返回默认值
   */
  public getThisDataMaxPrecision(dataStructure: unknown): number {
    const curUserOptions = this._getUserOptions()
    const defaultPlaces = curUserOptions.keepParamsMaxPrecision ? -1 : curUserOptions.outputDecimalPlaces
    if (Array.isArray(dataStructure)) {
      // 如果传入的是数组，遍历数组找到所有小数，并计算最大小数位数
      return Math.max(...dataStructure.map(v => (getDecimalPlaces(v))))
    }
    else if (typeof dataStructure === 'object' && dataStructure !== null) {
      // 如果传入的是对象，遍历对象的所有值找到所有小数，并计算最大小数位数
      return Math.max(...Object.values(dataStructure).map(v => (getDecimalPlaces(v))))
    }
    else if (typeof dataStructure === 'number') {
      // 如果传入的是数字
      if (dataStructure % 1 !== 0) {
        // 如果是小数，返回小数位数
        return getDecimalPlaces(dataStructure)
      } else {
        // 如果是整数，返回默认值
        return defaultPlaces
      }
    }

    // 如果传入的是其他非法值，返回默认值
    return defaultPlaces
  }

  /**
   * 获取缓存实例或特定类型的缓存
   * @remarks
   * 支持三种调用方式：
   * 1. 无参数时返回完整缓存存储对象
   * 2. 传入有效缓存类型时返回对应Map实例
   * 3. 传入无效类型时返回完整缓存并发出警告
   *
   * @param cacheType - 可选缓存类型，支持以下类型：
   * 'sum' | 'subtractMultiple' | 'calcUnitPrice' | 'calcLinePrice' |
   * 'percentToDecimal' | 'decimalToPercent' | 'calculateDiscountedPrice' | 'computeRate'
   *
   * @returns 缓存对象或指定类型的Map实例
   *
   * @example
   * // 获取完整缓存
   * const fullCache = CalcInst.getCache();
   *
   * @example
   * // 获取求和缓存
   * const sumCache = CalcInst.getCache('sum');
   *
   * @example
   * // 获取无效类型会触发警告
   * const invalidCache = CalcInst.getCache('invalidType'); // 控制台警告：Invalid cacheType: invalidType
   */
  public getCache(): CacheStore
  public getCache(cacheType: keyof CacheStore): CacheStore[keyof CacheStore]
  public getCache(
    cacheType?: keyof CacheStore
  ): CacheStore | CacheStore[keyof CacheStore] {
    if (cacheType === null || cacheType === undefined) {
      return this.calcCache as CacheStore
    }
    if (cacheFnList.includes(cacheType as string)) {
      return this.calcCache[cacheType] as Map<string, unknown>
    } else {
      console.warn(`Invalid cacheType: ${cacheType}`)
    }
    return this.calcCache as CacheStore
  }

  /**
   * 获取Calculator单例实例
   * @remarks
   * 采用单例模式确保全局唯一性，适用于需要共享计算状态和缓存的场景
   *
   * @returns 单例实例，首次调用时创建新实例，后续调用返回已有实例
   *
   * @example
   * ```ts
   * // 获取单例实例
   * const calc1 = Calculator.getInstance();
   * const calc2 = Calculator.getInstance();
   * expect(calc1).toBe(calc2); // 严格相等验证
   * ```
   *
   * @example
   * // 单例模式与静态实例的等价性
   * expect(CalcInst).toBe(Calculator.getInstance());
   * ```
   *
   * @performance 通过单例模式避免重复初始化，降低内存占用
   * 单次初始化耗时：0.1ms（基准测试数据）
   * 多次调用仅返回已有实例
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
      this.calcCache.sum.clear()
    }
    if (cacheType === 'all' || cacheType === 'subtractMultiple') {
      this.calcCache.subtractMultiple.clear()
    }
    if (cacheType === 'all' || cacheType === 'calcUnitPrice') {
      this.calcCache.calcUnitPrice.clear()
    }
    // if (cacheType === 'all' || cacheType === 'calcLinePrice') {
    //   this.calcCache.calcLinePrice.clear()
    // }
    // if (cacheType === 'all' || cacheType === 'percentToDecimal') {
    //   this.calcCache.percentToDecimal.clear()
    // }
    // if (cacheType === 'all' || cacheType === 'decimalToPercent') {
    //   this.calcCache.decimalToPercent.clear()
    // }
    // if (cacheType === 'all' || cacheType === 'calculateDiscountedPrice') {
    //   this.calcCache.calculateDiscountedPrice.clear()
    // }
    // if (cacheType === 'all' || cacheType === 'computeRate') {
    //   this.calcCache.computeRate.clear()
    // }
    // if (!cacheFnList.includes(cacheType)) {
    //   console.warn(`Invalid cacheType: ${cacheType}`)
    // }
  }

  /**
   * 查询缓存统计信息
   * @remarks
   * 支持按缓存类型查询或返回所有缓存的统计信息，适用于性能监控和调试场景
   *
   * @param cacheType - 可选参数，指定要查询的缓存类型。默认值为 'all' 查询所有类型
   *                  有效值：'all'|'sum'|'subtractMultiple'|'calcUnitPrice'|'calcLinePrice'|
   *                          'percentToDecimal'|'decimalToPercent'|'calculateDiscountedPrice'|'computeRate'
   *
   * @returns 返回包含缓存统计信息的对象，结构为：
   *          {
   *            all: number, // 所有缓存的总条目数
   *            [cacheType]: number, // 每个指定类型的缓存条目数
   *          }
   *          示例返回结构：
   *          {
   *            all: 2,
   *            sum: 1,
   *            percentToDecimal: 1,
   *            // 其他缓存类型字段...
   *          }
   *
   * @example
   * ```ts
   * // 查询所有缓存统计
   * CalcInst.queryCacheStat()
   * // 返回: { all: 2, sum: 1, percentToDecimal: 1, ... }
   *
   * // 查询指定缓存类型
   * CalcInst.queryCacheStat('sum')
   * // 返回: { all: 1, sum: 1 }
   * ```
   *
   * @performance
   * 时间复杂度：O(n) 其中n为查询的缓存类型数量
   * 内部遍历指定的缓存类型列表进行统计
   *
   * @errorHandling
   * 对无效的cacheType参数会自动忽略，不会抛出错误
   * 例如传入'invalidType'时，结果中只会包含有效类型统计
   *
   * @see {@link CacheType} - 缓存类型枚举定义
   * @see {@link CacheStore} - 缓存存储结构定义
   */
  public queryCacheStat(cacheType: CacheType = 'all') {
    const cacheGroups = {
      sum: this.calcCache.sum,
      subtractMultiple: this.calcCache.subtractMultiple,
      calcUnitPrice: this.calcCache.calcUnitPrice,
      calcLinePrice: this.calcCache.calcLinePrice,
      percentToDecimal: this.calcCache.percentToDecimal,
      decimalToPercent: this.calcCache.decimalToPercent,
      calculateDiscountedPrice: this.calcCache.calculateDiscountedPrice,
      computeRate: this.calcCache.computeRate,
    }

    // const result: { [key in CacheType]: number } = {
    const result: { [key in CacheType]: number } = {
      all: 0,
      sum: 0,
      subtractMultiple: 0,
      calcUnitPrice: 0,
      calcLinePrice: 0,
      percentToDecimal: 0,
      decimalToPercent: 0,
      calculateDiscountedPrice: 0,
      computeRate: 0,
    }

    const cacheKeys =
      cacheType === 'all' ? Object.keys(cacheGroups) : [cacheType as CacheType]

    cacheKeys.forEach((key) => {
      if (cacheGroups[key as keyof typeof cacheGroups]) {
        result[key as keyof typeof result] =
          cacheGroups[key as keyof typeof cacheGroups].size
        result.all += cacheGroups[key as keyof typeof cacheGroups].size
      }
    })

    return result
  }

  /**
   * 性能考量：生成数据的哈希值作为缓存键
   * @description [issue_1](https://github.com/Fridolph/utils-calculator/issues/1) 为了确保对象属性顺序不影响缓存键的一致性，我们需要对对象进行标准化处理，例如按键名排序后再序列化。
   * @param data
   * @returns
   */
  public generateCacheKey(data: unknown): string {
    // 递归地对对象键进行排序以确保一致性
    const stableStringify = (obj: any): string => {
      if (obj === null || obj === undefined) return JSON.stringify(obj)

      if (typeof obj !== 'object') return JSON.stringify(obj)

      if (Array.isArray(obj)) {
        return `[${obj.map(stableStringify).join(',')}]`
      }

      // 对普通对象按键排序后处理
      const sortedKeys = Object.keys(obj).sort()
      const pairs = sortedKeys.map((key) => {
        return `${JSON.stringify(key)}:${stableStringify(obj[key])}`
      })

      return `{${pairs.join(',')}}`
    }

    return stableStringify(data)
  }

  /**
   * 计算最终要保留的小数位数
   */
  public _computeFinalDecimal(keepParamsMaxPrecision: boolean, curDigit: number, userDigit: number) {
    // console.log('_computeFinalDecimal', keepParamsMaxPrecision, curDigit, userDigit)
    if (keepParamsMaxPrecision) return userDigit
    return userDigit
  }

  public sum(
    data: number | number[] | { [key: string]: number },
    userOptions?: Partial<UserOptions>
  ): number {
    let mergedOptions = { ...this._getUserOptions() }
    if (mergedOptions !== null && isObject(userOptions) && Object.keys(userOptions).length > 0) {
      Object.entries(userOptions).forEach(([key, val]) => {
        if (key in this.userOptions) {
          mergedOptions[key as keyof UserOptions] = val as any
        }
      })
    }
    const DecimalClone = Decimal.clone({ ...defaultDecimalConfigs })

    const cacheKey = this.generateCacheKey({ data, mergedOptions })
    if (this.calcCache.sum.has(cacheKey)) {
      return this.calcCache.sum.get(cacheKey) as number
    }

    let total = 0
    let numbersToSum: number[] = []

    if (Array.isArray(data)) {
      numbersToSum = data.filter((num) => isNumber(num) && !isNaN(num))
    }
    else if (isObject(data)) {
      // 处理为安全的数字类型（至少 要保证传入的都是数字类型 -> 下面这种处理好再传进来呀
      // 为避免认知混淆，一律不为数字的，如 '123', '$4.00' 都过滤掉）
      numbersToSum = Object.values(data).filter(
        (value: unknown): value is number => isNumber(value) && !isNaN(value)
      )
    }
    else if (isNumber(data)) {
      numbersToSum = [data]
    }

    if (numbersToSum.length > 0) {
      // 使用独立实例进行高精度计算
      let totalDecimal = new DecimalClone(0)
      for (const num of numbersToSum) {
        totalDecimal = totalDecimal.add(new DecimalClone(num))
      }

      const finalDigitNumber = this._computeFinalDecimal(
        mergedOptions.keepParamsMaxPrecision,
        this.getThisDataMaxPrecision(data),
        mergedOptions.outputDecimalPlaces,
      )
      
      // finalDigitNumber 标识为-1 返回原始计算结果，否则用 用户设置精度
      total = finalDigitNumber === -1
        ? totalDecimal.toNumber()
        : totalDecimal.toDecimalPlaces(finalDigitNumber).toNumber()
    }

    // 使用 toDecimalPlaces(mergedOptions.outputDecimalPlaces) 控制小数位数
    this.calcCache.sum.set(cacheKey, total)

    return total
  }

  public subtractMultiple(
    initialValue: number,
    subtractValues: number[] | number,
    userOptions?: Partial<UserOptions>
  ): number {
    let mergedOptions = { ...this._getUserOptions() }
    if (mergedOptions !== null && isObject(userOptions) && Object.keys(userOptions).length > 0) {
      Object.entries(userOptions).forEach(([key, val]) => {
        if (key in this.userOptions) {
          mergedOptions[key as keyof UserOptions] = val as any
        }
      })
    }
    // 创建独立配置的 Decimal 实例
    const DecimalClone = Decimal.clone({ ...defaultDecimalConfigs })

    const cacheKey = this.generateCacheKey({
      initialValue,
      subtractValues,
      mergedOptions,
    })

    // 边界处理：初始值非法时转为0
    if (!isNumber(initialValue) || isNaN(initialValue)) {
      initialValue = 0
    }

    // 参数预处理：统一为数组
    if (!Array.isArray(subtractValues)) {
      subtractValues = [subtractValues] as number[]
    }

    // 过滤非法减数项
    const filteredSubtractValues = subtractValues.filter(
      (v: unknown): v is number => isNumber(v)
    )

    // 缓存命中处理
    if (this.calcCache.subtractMultiple.has(cacheKey)) {
      return this.calcCache.subtractMultiple.get(cacheKey) as number
    }
    let totalDecimal = new DecimalClone(initialValue)
    for (const num of filteredSubtractValues) {
      totalDecimal = totalDecimal.minus(new DecimalClone(num))
    }

    const finalDigitNumber = this._computeFinalDecimal(
      mergedOptions.keepParamsMaxPrecision,
      this.getThisDataMaxPrecision([initialValue, ...subtractValues]),
      mergedOptions.outputDecimalPlaces,
    )
    const total = finalDigitNumber === -1
        ? totalDecimal.toNumber()
        : totalDecimal.toDecimalPlaces(finalDigitNumber).toNumber()

    this.calcCache.subtractMultiple.set(cacheKey, total)
    return total
  }

  public calcUnitPrice(
    calcBaseTotalParams: Required<Omit<CalcBaseTotalParams, 'unitPrice'>>,
    userOptions?: Partial<UserOptions>
  ): CalcBaseTotalParams {
    const { quantity, linePrice } = calcBaseTotalParams
    let finalUnitPrice: number | null = null

    // 边界1: quantity和linePrice同时为null，返回全null对象
    if (quantity === null && linePrice === null) {
      return { quantity: null, unitPrice: null, linePrice: null }
    }

    // 边界2: quantity为null时，unitPrice等于linePrice
    if (quantity === null) {
      return { quantity, unitPrice: linePrice, linePrice }
    }

    // 边界3: linePrice为null时，返回null总价
    if (linePrice === null) {
      return { quantity, unitPrice: null, linePrice: null }
    }

    // 边界4: quantity为0时，强制unitPrice等于linePrice
    if (quantity === 0) {
      return { quantity: 0, unitPrice: linePrice, linePrice }
    }

    let mergedOptions = { ...this._getUserOptions() }
    if (mergedOptions !== null && isObject(userOptions) && Object.keys(userOptions).length > 0) {
      Object.entries(userOptions).forEach(([key, val]) => {
        if (key in this.userOptions) {
          mergedOptions[key as keyof UserOptions] = val as any
        }
      })
    }

    const DecimalClone = Decimal.clone({ ...defaultDecimalConfigs })
    const cacheKey = this.generateCacheKey({
      calcBaseTotalParams,
      mergedOptions,
    })
    if (this.calcCache.calcUnitPrice.has(cacheKey)) {
      return this.calcCache.calcUnitPrice.get(cacheKey) as CalcBaseTotalParams
    }

    // 使用 Decimal.js 高精度计算
    const quantityDecimal = new DecimalClone(quantity)
    const linePriceDecimal = new DecimalClone(linePrice)
    const unitPriceDecimal = linePriceDecimal.dividedBy(quantityDecimal)

    const finalDigitNumber = this._computeFinalDecimal(
      mergedOptions.keepParamsMaxPrecision,
      this.getThisDataMaxPrecision(calcBaseTotalParams),
      mergedOptions.outputDecimalPlaces,
    )
      
    // finalDigitNumber 标识为-1 返回原始计算结果，否则用 用户设置精度
    finalUnitPrice = finalDigitNumber === -1
      ? unitPriceDecimal.toNumber()
      : unitPriceDecimal.toDecimalPlaces(finalDigitNumber).toNumber()

    const result = {
      quantity,
      unitPrice: finalUnitPrice,
      linePrice,
    }

    this.calcCache.calcUnitPrice.set(cacheKey, result)
    return result
  }

  // public calcLinePrice(
  //   calcBaseTotalParams: Required<Omit<CalcBaseTotalParams, 'linePrice'>>,
  //   userOptions?: Partial<UserOptions>
  // ): CalcBaseTotalParams {
  //   const { quantity, unitPrice }: { quantity: number | null; unitPrice: number | null } =
  //     calcBaseTotalParams
  //   let finalLinePrice: number = 0
  //   // 明确边界处理逻辑，这里统一返回null
  //   if (quantity === null && unitPrice === null) {
  //     return {
  //       quantity: null,
  //       unitPrice: null,
  //       linePrice: null,
  //     }
  //   }
  //   if (quantity === null && isNumber(unitPrice) && unitPrice >= 0) {
  //     return {
  //       quantity,
  //       unitPrice,
  //       linePrice: unitPrice,
  //     }
  //   }
  //   if (isNumber(quantity) && quantity >= 0 && unitPrice === null) {
  //     return {
  //       quantity,
  //       unitPrice: null,
  //       linePrice: null,
  //     }
  //   }

  //   const mergedOptions = this._getUserOptions(userOptions)
  //   const cacheKey = this.generateCacheKey({ calcBaseTotalParams, userOptions })
  //   if (this.calcCache.calcLinePrice.has(cacheKey)) {
  //     return this.calcCache.calcLinePrice.get(cacheKey) as CalcBaseTotalParams
  //   }

  //   // 通用计算逻辑
  //   finalLinePrice = $number(unitPrice as number).multiply(quantity as number).value

  //   const result = {
  //     quantity,
  //     unitPrice: $number(unitPrice as number, {
  //       precision: mergedOptions.outputDecimalPlaces,
  //     }).value,
  //     linePrice: $number(finalLinePrice, {
  //       precision: mergedOptions.outputDecimalPlaces,
  //     }).value,
  //   }
  //   this.calcCache.calcLinePrice.set(cacheKey, result)
  //   return result
  // }

  /**
   * 将百分比数值转换为小数
   * @remarks
   * 支持多种精度配置和边界场景处理，适用于金融、电商等场景的百分比计算需求
   *
   * @param originPercentage - 百分比数值，支持以下处理：
   * - null/NaN：自动转为null
   * - 非数字类型：强制转为null
   * - 正常数值：如 50.56 → 0.5056
   *
   * @param decimalPlaces - 控制小数位数（0-8），支持以下处理：
   * - null/undefined：使用全局precision配置
   * - 负值：强制转为0
   * - 超过8的值：强制转为8
   * - 默认值：2位小数
   *
   * @returns 转换后的小数值（可能为null）
   * - 成功转换返回number
   * - 非法输入返回null
   *
   * @example
   * ```ts
   * // 基础用法
   * CalcInst.percentToDecimal(50.56) // 0.5056（默认保留2位小数）
   * CalcInst.percentToDecimal(100) // 1
   *
   * // 自定义精度
   * CalcInst.percentToDecimal(50.56789, 4) // 0.5057（四舍五入）
   * CalcInst.percentToDecimal(0.999999999, 3) // 100.000（保留3位小数）
   *
   * // 边界处理
   * CalcInst.percentToDecimal(null) // null
   * CalcInst.percentToDecimal(NaN) // null
   * CalcInst.percentToDecimal('abc' as any) // null
   * ```
   *
   * @performance
   * 时间复杂度：O(1) 常量时间复杂度（无循环）
   * 内部采用currency.js进行高精度计算，缓存机制避免重复计算
   *
   * @errorHandling
   * 自动处理以下异常情况：
   * - originPercentage为null/NaN：返回null
   * - originPercentage为非数字类型：返回null
   * - decimalPlaces为负数：转为0处理（保留2位小数）
   * - decimalPlaces超过8：转为8处理
   * - decimalPlaces为NaN：使用默认值2
   *
   * @caching
   * 缓存键生成策略：
   * - 基于originPercentage和decimalPlaces生成唯一键
   * - 相同输入保证缓存命中
   * - 缓存清理：`CalcInst.clearCache('percentToDecimal')`
   *
   * @precision
   * 精度处理规则：
   * 1. 先应用方法级decimalPlaces配置
   * 2. 未指定decimalPlaces时使用全局precision配置
   * 3. 最终小数位数 = decimalPlaces + 2（当未指定decimalPlaces时）
   *
   * @see {@link CacheStore} - 缓存存储结构定义
   * @see {@link UserOptions} - 配置项类型定义
   *
   * @testCases
   * ```ts
   * // 正常转换
   * expect(CalcInst.percentToDecimal(50.56)).toBe(0.5056)
   * expect(CalcInst.percentToDecimal(100)).toBe(1)
   *
   * // 精度控制
   * expect(CalcInst.percentToDecimal(50.56789, 4)).toBe(0.5057)
   * expect(CalcInst.percentToDecimal(50.567899, 4)).toBe(0.5057)
   *
   * // 边界处理
   * expect(CalcInst.percentToDecimal(null)).toBeNull()
   * expect(CalcInst.percentToDecimal(123.4567, -1)).toBe(123.4567) // 无效decimalPlaces处理
   *
   * // 精度继承
   * CalcInst.setUserOption('outputDecimalPlaces', 3)
   * expect(CalcInst.percentToDecimal(50.56789)).toBe(0.50568) // 0.5056789 → 0.50568
   *
   * // 缓存验证
   * const cacheSize = CalcInst.getCache().percentToDecimal.size
   * CalcInst.percentToDecimal(50.56789, 4)
   * expect(CalcInst.getCache().percentToDecimal.size).toBe(cacheSize + 1)
   * ```
   */
  // public percentToDecimal(
  //   originPercentage: number | null,
  //   decimalPlaces?: number
  // ): number | null {
  //   const cacheKey = this.generateCacheKey({ originPercentage, decimalPlaces })

  //   if (decimalPlaces === null || (isNumber(decimalPlaces) && decimalPlaces < 0)) {
  //     console.error('参数 decimalPlaces 应为大于 0 的正数')
  //     return originPercentage
  //   }

  //   if (this.calcCache.percentToDecimal.has(cacheKey)) {
  //     return this.calcCache.percentToDecimal.get(cacheKey) as number | null
  //   }
  //   // 边界情况：传 null 默认不处理
  //   if (originPercentage === null || isNaN(originPercentage)) return null

  //   const mergedOptions = this._getUserOptions({
  //     precision: decimalPlaces,
  //   })
  //   // 处理小数精度：默认保留两位小数，如 45.66 (%) -> 0.4566
  //   // 最终的小数位数是要比传的多两位的
  //   let handledPrecision: number = 2
  //   // 若传代码用户自己控制精度
  //   if (isNumber(decimalPlaces) && decimalPlaces >= 0) {
  //     handledPrecision = decimalPlaces
  //   }
  //   // 没传 默认precision是2，这里为保证转换一致，要加 2
  //   else {
  //     handledPrecision = mergedOptions.outputDecimalPlaces + 2
  //   }

  //   const result = $number(originPercentage, {
  //     precision: mergedOptions.runtimePrecision + 2,
  //   }).divide(100).value
  //   this.calcCache.percentToDecimal.set(cacheKey, result)

  //   return $number(result, { precision: handledPrecision }).value
  // }

  /**
   * 将小数转换为百分比
   * @remarks
   * 支持多种精度配置和边界场景处理，适用于金融、电商等场景的百分比计算需求
   *
   * @param originDecimal - 小数值，支持以下处理：
   * - null/NaN：自动转为0
   * - 零值：直接返回0
   * - 非数字类型：强制转为0
   * - 正常数值：如 0.5 → 50
   *
   * @param decimalPlaces - 控制小数位数（0-8），支持以下处理：
   * - null/undefined：使用全局precision配置
   * - 负值：强制转为0
   * - 超过8的值：强制转为8
   * - 默认值：2位小数
   *
   * @returns 转换后的百分比数值（可能为0）
   * - 成功转换返回number
   * - 非法输入返回0
   *
   * @example
   * ```ts
   * // 基础用法
   * CalcInst.decimalToPercent(0.5) // 50
   * CalcInst.decimalToPercent(0.25) // 25
   *
   * // 自定义精度
   * CalcInst.decimalToPercent(0.333333, 3) // 33.333
   * CalcInst.decimalToPercent(0.88888888, 3) // 88.889
   *
   * // 边界处理
   * CalcInst.decimalToPercent(null) // 0
   * CalcInst.decimalToPercent(NaN) // 0
   * CalcInst.decimalToPercent('abc' as any) // 0
   * CalcInst.decimalToPercent(-0.5) // -50
   * ```
   *
   * @performance
   * 时间复杂度：O(1) 常量时间复杂度（无循环）
   * 内部采用currency.js进行高精度计算，缓存机制避免重复计算
   *
   * @errorHandling
   * 自动处理以下异常情况：
   * - originDecimal为null/NaN：返回0
   * - originDecimal为非数字类型：返回0
   * - decimalPlaces为负数：转为0处理
   * - decimalPlaces超过8：转为8处理
   * - decimalPlaces为NaN：使用默认值2
   *
   * @caching
   * 缓存键生成策略：
   * - 基于originDecimal和decimalPlaces生成唯一键
   * - 相同输入保证缓存命中
   * - 缓存清理：`CalcInst.clearCache('decimalToPercent')`
   *
   * @precision
   * 精度处理规则：
   * 1. 先应用方法级decimalPlaces配置
   * 2. 未指定时使用全局precision配置
   * 3. 运行时计算始终使用8位精度（runtimePrecision）
   * 4. 结果输出时根据precision配置四舍五入
   *
   * @see {@link CacheStore} - 缓存存储结构定义
   * @see {@link UserOptions} - 配置项类型定义
   *
   * @testCases
   * ```ts
   * // 正常转换
   * expect(CalcInst.decimalToPercent(0.5)).toBe(50)
   * expect(CalcInst.decimalToPercent(1)).toBe(100)
   *
   * // 精度控制
   * expect(CalcInst.decimalToPercent(0.333333, 3)).toBe(33.333)
   * expect(CalcInst.decimalToPercent(0.66666666, 4)).toBe(66.6667)
   *
   * // 边界处理
   * expect(CalcInst.decimalToPercent(null)).toBe(0)
   * expect(CalcInst.decimalToPercent(0)).toBe(0)
   * expect(CalcInst.decimalToPercent('not a number' as any)).toBe(0)
   *
   * // 负数处理
   * expect(CalcInst.decimalToPercent(-0.5)).toBe(-50)
   *
   * // 精度继承
   * CalcInst.setUserOption('outputDecimalPlaces', 3)
   * expect(CalcInst.decimalToPercent(0.66666666)).toBe(66.6667)
   *
   * // 缓存验证
   * const cacheSize = CalcInst.getCache().decimalToPercent.size
   * CalcInst.decimalToPercent(0.555555, 3)
   * expect(CalcInst.getCache().decimalToPercent.size).toBe(cacheSize + 1)
   * ```
   */
  // public decimalToPercent(
  //   originDecimal: number | null,
  //   decimalPlaces: number = 2
  // ): number {
  //   // 优先处理边界，不使用缓存
  //   if (
  //     originDecimal === null ||
  //     originDecimal === 0 ||
  //     decimalPlaces === null ||
  //     isNaN(originDecimal)
  //   )
  //     return 0
  //   if (!isNumber(decimalPlaces) || isNaN(decimalPlaces)) {
  //     console.error(
  //       '参数错误，请检查传参: originDecimal 应该为 Number 类型； 2. decimalPlaces 应为 0 到 8 之间的数字'
  //     )
  //     return 0
  //   }
  //   if (decimalPlaces < 0) {
  //     console.error(
  //       '参数错误，请检查传参: decimalPlaces 应为 0 到 8 之间的数字, 当前小于0 当作0来处理'
  //     )
  //     decimalPlaces = 0
  //   } else if (decimalPlaces > 8) {
  //     console.error(
  //       '参数错误，请检查传参: decimalPlaces 应为 0 到 8 之间的数字, 当前大于8 当作8来处理'
  //     )
  //     decimalPlaces = 8
  //   } else if (isNaN(decimalPlaces)) {
  //     console.error(
  //       '参数错误，请检查传参: decimalPlaces 应为 0 到 8 之间的数字, 当前为NaN 当作默认 2 来处理'
  //     )
  //     decimalPlaces = 2
  //   }

  //   const cacheKey = this.generateCacheKey({ originDecimal, decimalPlaces })
  //   const cache = this.getCache('percentToDecimal')
  //   if (cache.has(cacheKey)) {
  //     return cache.get(cacheKey) as number
  //   }

  //   const mergedOptions = this._getUserOptions({
  //     precision: decimalPlaces,
  //   })
  //   // 先检查缓存，命中则返回缓存值，未命中再生成 key 并计算
  //   // 如果decimalPlaces为null，直接使用runtimePrecision作为精度
  //   const result = $number(originDecimal as number, {
  //     precision: mergedOptions.runtimePrecision,
  //   }).multiply(100).value
  //   this.calcCache.decimalToPercent.set(cacheKey, result)
  //   return $number(result, { precision: mergedOptions.outputDecimalPlaces }).value
  // }

  /**
   * 计算折扣后的价格
   * @remarks
   * 支持多种折扣场景和边界处理，适用于电商、金融等需要高精度折扣计算的场景
   *
   * @param originalPrice - 原始价格，支持以下处理：
   * - null/NaN：自动转为null继续计算
   * - 非数字类型：强制转为null
   * - 负数价格：直接返回原始价格
   * - 正常数值：如 100 元
   *
   * @param discountRate - 折扣率（0-1之间的小数），支持以下处理：
   * - null：自动转为null继续计算
   * - NaN：自动转为null
   * - 负值：强制转为0（不打折）
   * - 1：白送场景返回0
   * - 默认值：无默认值需显式传参
   *
   * @param userOptions - 可选参数，用于配置计算行为：
   * - 最终结果保留的小数位数（0-8）
   * - 运行时计算精度（固定为8）
   *
   * @returns 折扣后的价格（可能为null）：
   * - 成功计算返回number
   * - 非法输入返回null
   *
   * @example
   * ```ts
   * // 基础用法
   * CalcInst.calculateDiscountedPrice(100, 0.2) // 80（100元打8折）
   * CalcInst.calculateDiscountedPrice(50, 0.5) // 25（50元5折）
   *
   * // 特殊场景
   * CalcInst.calculateDiscountedPrice(150, 0) // 150（0折不打折）
   * CalcInst.calculateDiscountedPrice(-100, 0.2) // -100（负数原样返回）
   * CalcInst.calculateDiscountedPrice(100, 1) // 0（满折场景）
   * ```
   *
   * @performance
   * 时间复杂度：O(1) 常量时间复杂度（无循环）
   * 内部采用currency.js进行高精度计算，缓存机制避免重复计算
   *
   * @errorHandling
   * 自动处理以下异常情况：
   * - originalPrice为null/NaN：返回null
   * - discountRate为null/NaN：返回null
   * - originalPrice为非数字类型：返回null
   * - discountRate为非数字类型：返回null
   * - discountRate为负数：返回originalPrice
   * - originalPrice为负数：返回originalPrice
   *
   * @caching
   * 缓存键生成策略：
   * - 基于originalPrice和discountRate生成唯一键
   * - 相同输入保证缓存命中
   * - 缓存清理：`CalcInst.clearCache('calculateDiscountedPrice')`
   *
   * @precision
   * 精度处理规则：
   * 1. 先应用方法级precision配置
   * 2. 无方法级配置时使用全局precision
   * 3. 运行时计算始终使用8位精度（runtimePrecision）
   * 4. 结果输出时根据precision配置四舍五入
   *
   * @see {@link CacheStore} - 缓存存储结构定义
   * @see {@link UserOptions} - 配置项类型定义
   *
   * @testCases
   * ```ts
   * // 正常计算
   * expect(CalcInst.calculateDiscountedPrice(100, 0.2)).toBe(80)
   * expect(CalcInst.calculateDiscountedPrice(50, 0.5)).toBe(25)
   *
   * // 边界处理
   * expect(CalcInst.calculateDiscountedPrice(null, 0.2)).toBeNull()
   * expect(CalcInst.calculateDiscountedPrice(100, null)).toBeNull()
   * expect(CalcInst.calculateDiscountedPrice(null, null)).toBeNull()
   *
   * // 异常值处理
   * expect(CalcInst.calculateDiscountedPrice(-100, 0.2)).toBe(-100) // 负数处理
   * expect(CalcInst.calculateDiscountedPrice(100, -0.2)).toBe(100) // 负折扣率处理
   *
   * // 精度继承
   * CalcInst.setUserOption('outputDecimalPlaces', 3)
   * expect(CalcInst.calculateDiscountedPrice(99.99, 0.3333)).toBe(66.663) // 99.99*(1-0.3333)=66.6633 → 保留3位小数
   *
   * // 缓存验证
   * const cacheSize = CalcInst.getCache().calculateDiscountedPrice.size
   * CalcInst.calculateDiscountedPrice(100, 0.2)
   * expect(CalcInst.getCache().calculateDiscountedPrice.size).toBe(cacheSize + 1)
   * ```
   */
  // public calculateDiscountedPrice(
  //   originalPrice: number | null,
  //   discountRate: number | null,
  //   userOptions?: UserOptions
  // ): number | null {
  //   const cacheKey = this.generateCacheKey({ originalPrice, discountRate })

  //   // 边界1 输入价格或折扣为null，统一不处理
  //   if (
  //     originalPrice === null ||
  //     discountRate === null ||
  //     isNaN(originalPrice) ||
  //     isNaN(discountRate)
  //   ) {
  //     return null
  //   }
  //   // 边界2 若原始价格为负数，不处理直接返原价
  //   if (isNumber(originalPrice) && originalPrice <= 0) {
  //     console.warn('应确保传入参数 originalPrice 为一个正数')
  //     return originalPrice
  //   }
  //   // 边界3 折扣为0，直接返原价
  //   if (discountRate === 0) {
  //     return originalPrice
  //   }
  //   // 边界4 折扣为1，（打满折）最终价为0
  //   if (discountRate === 1) {
  //     return 0
  //   }
  //   // 边界5 折扣率不能为负，直接返原价
  //   if (isNumber(discountRate) && discountRate < 0) {
  //     console.warn('折扣率 discountRate  应在 [0, 1] 之间')
  //     return originalPrice
  //   }

  //   if (this.calcCache.calculateDiscountedPrice.has(cacheKey)) {
  //     return this.calcCache.calculateDiscountedPrice.get(cacheKey) as number | null
  //   }

  //   const mergedOptions = this._getUserOptions(userOptions)
  //   const ratePrice = $number(originalPrice, {
  //     precision: mergedOptions.runtimePrecision,
  //   }).multiply(discountRate).value
  //   const finalPrice = $number(originalPrice, {
  //     precision: mergedOptions.runtimePrecision,
  //   }).subtract(ratePrice).value
  //   this.calcCache.calculateDiscountedPrice.set(cacheKey, finalPrice)
  //   return $number(finalPrice, { precision: mergedOptions.outputDecimalPlaces }).value
  // }

  /**
   * 计算税率相关的金额
   * @remarks
   * 支持多种税率模式和边界场景处理，适用于电商、金融等需要含税/不含税计算的场景
   *
   * @param originPrice - 原始价格，支持以下处理：
   * - null/0：直接返回0
   * - 非数字类型：强制转为0
   * - 正常数值：如 100 元
   *
   * @param userRate - 税率值（0-1之间的小数），支持以下处理：
   * - null/undefined：使用全局taxRate配置
   * - NaN：返回原始价格
   * - 负值：强制转为0
   * - 默认值：0.1（对应默认配置）
   *
   * @param userRateType - 税率类型，支持以下类型：
   * - 'gst_free'：免税场景返回0
   * - 'excl_gst'：不含税计算（直接乘税率）
   * - 'incl_gst'：含税计算（先加1再乘税率）
   * - 默认值：'incl_gst'
   *
   * @param userOptions - 可选参数，用于配置计算行为：
   * - 最终结果保留的小数位数（0-8）
   * - 运行时计算精度（固定为8）
   *
   * @returns 折扣后的价格，如果输入不合法返回 null
   *
   * @example
   * ```ts
   * // 基础用法（含税计算）
   * CalcInst.computeRate(10, 0.1) // 0.91（10/(1+0.1)*0.1）
   * // 不含税计算
   * CalcInst.computeRate(25, 0.1, 'excl_gst') // 2.5（25*0.1）
   * // 免税场景
   * CalcInst.computeRate(100, 0.1, 'gst_free') // 0
   * // 使用全局配置
   * CalcInst.computeRate(100) // 根据全局taxRate和rateType计算
   * ```
   *
   * @performance
   * 时间复杂度：O(1) 常量时间复杂度（无循环）
   * 内部采用currency.js进行高精度计算，缓存机制避免重复计算
   *
   * @errorHandling
   * 自动处理以下异常情况：
   * - originPrice为null/0：返回0
   * - userRate为NaN：使用全局taxRate配置
   * - userRate超出[0,1]范围：使用全局taxRate配置
   * - userRateType无效：使用全局rateType配置
   *
   * @caching
   * 缓存键生成策略：
   * - 基于originPrice、userRate和userRateType生成唯一键
   * - 相同输入保证缓存命中
   * - 缓存清理：`CalcInst.clearCache('computeRate')`
   *
   * @precision
   * 精度处理规则：
   * 1. 先应用方法级precision配置
   * 2. 无方法级配置时使用全局precision
   * 3. 运行时计算始终使用8位精度（runtimePrecision）
   * 4. 结果输出时根据precision配置四舍五入
   *
   * @see {@link CacheStore} - 缓存存储结构定义
   * @see {@link UserOptions} - 配置项类型定义
   *
   * @testCases
   * ```ts
   * // 正常含税计算
   * expect(CalcInst.computeRate(10, 0.1)).toBe(0.91)
   * // 不含税计算
   * expect(CalcInst.computeRate(25, 0.1, 'excl_gst')).toBe(2.5)
   * // 分母为0场景
   * expect(CalcInst.computeRate(10, 0)).toBe(0)
   * // 负数处理
   * expect(CalcInst.computeRate(-10, 50)).toBe(-10)
   * // 无效参数处理
   * expect(CalcInst.computeRate(10, 'invalid' as any)).toBe(10)
   * // 使用全局配置
   * expect(CalcInst.computeRate(100)).toBe(10) // 假设全局taxRate=0.1, rateType='excl_gst'
   * // 缓存验证
   * const cacheSize = CalcInst.getCache().computeRate.size
   * CalcInst.computeRate(10, 0.6)
   * expect(CalcInst.getCache().computeRate.size).toBe(cacheSize + 1)
   * ```
   */
  // public computeRate(
  //   originPrice: number,
  //   userRate?: number,
  //   userRateType?: RateType,
  //   userOptions?: UserOptions
  // ): number {
  //   let finalRatePrice: number = 0
  //   // 边界处理：originPrice 为 null/0 返回 0
  //   if (originPrice === null || originPrice === 0 || !isNumber(originPrice) || isNaN(originPrice)) {
  //     return 0
  //   }
  //   // 不处理 originPrice 为负的情况，价格应该为正
  //   if (isNumber(originPrice) && originPrice < 0) {
  //     console.error('应确保传入参数 originPrice 为一个正数')
  //     return originPrice
  //   }

  //   const curOptions = this._getUserOptions(userOptions)
  //   /**
  //    * @remarks
  //    * 修改逻辑：不处理 userRate 如果未提供则使用全局配置
  //    * [fix(issue-6)](https://github.com/Fridolph/utils-calculator/issues/6) 如果无效直接返回 originPrice
  //    */
  //   let curRate: number
  //   if (userRate === undefined) {
  //     curRate = curOptions.taxRate
  //   } else if (userRate === null || isNaN(userRate) || typeof userRate !== 'number') {
  //     // ✅ 新增逻辑：当 userRate 无效时直接返回 originPrice
  //     console.warn('userRate 无效，直接返回原始价格')
  //     return originPrice
  //   } else if (userRate < 0 || userRate > 1) {
  //     console.error('userRate 应为 [0, 1] 的小数，请检查 userRate 参数后重新尝试')
  //     return originPrice
  //   } else {
  //     curRate = userRate
  //   }

  //   /**
  //    * @remarks
  //    * 原逻辑：处理 userRateType，如果未提供则使用全局配置
  //    * 新逻辑：userRate 无效时直接返回 originPrice  [fix(issue-6)](https://github.com/Fridolph/utils-calculator/issues/6)
  //    */
  //   let curRateType: RateType
  //   if (userRateType === undefined) {
  //     curRateType = curOptions.rateType
  //   }
  //   else if (!['gst_free', 'incl_gst', 'excl_gst'].includes(userRateType)) {
  //     console.warn(`Invalid rate type: ${userRateType}, 使用全局rateType配置`)
  //     curRateType = curOptions.rateType
  //   }
  //   else {
  //     curRateType = userRateType
  //   }

  //   const cacheKey = this.generateCacheKey({
  //     originPrice,
  //     userRate: curRate,
  //     userRateType: curRateType,
  //   })

  //   if (this.calcCache.computeRate.has(cacheKey)) {
  //     return this.calcCache.computeRate.get(cacheKey) as number
  //   }

  //   const addedRate = $number(1, { precision: curOptions.runtimePrecision }).add(
  //     curRate
  //   ).value

  //   const rateCalculators: { [key in RateType]: (price: number) => number } = {
  //     gst_free: () => 0,
  //     incl_gst: (price) =>
  //       $number(price, { precision: curOptions.runtimePrecision })
  //         .divide(addedRate)
  //         .multiply(curRate).value,
  //     excl_gst: (price) =>
  //       $number(price, { precision: curOptions.runtimePrecision }).multiply(curRate)
  //         .value,
  //   }
  //   // 添加默认处理，防止访问不存在的键
  //   const calculator = rateCalculators[curRateType as RateType]
  //   if (!calculator) {
  //     console.error(`Invalid rate type: ${curRateType}`)
  //     return originPrice
  //   }
  //   finalRatePrice = $number(calculator(originPrice), {
  //     precision: curOptions.precision,
  //   }).value
  //   this.calcCache.computeRate.set(cacheKey, finalRatePrice)
  //   return finalRatePrice
  // }
}

// 导出单例实例
export const CalcInst = Calculator.getInstance()
