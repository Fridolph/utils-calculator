/**
 * @author: Fridolph
 * @description 基于 $number 计算的，把经常用到一些计算方法封装为一个工具类，也算是减少模版代码 W_W
 * @description 注意：为避免国际化带来的千分位及小数等问题，使用前请将传参都处理为通用的 Number 类型。类方法的输出都是基础数字类型
 * @description 约定
 * 1. 使用本类时，请务必在调用方法时传入参数，并确保参数类型正确，否则可能会导致计算错误或异常
 * 2. 为避免认知错误，计算方法只返原始计算结果的 Number 类型，若需 四舍五入 等处理，参考 API 设位，或用本仓库的一个 Format 转换
 * 3. 不直接报错，允许用户传入 0 和 null，及返回 null （产品希望某些情况，将错误值清空）
 * 4. 错误逻辑，如分母为 0 的情况，将输出处理为 null
 * 5. 一些大边界 Infinity 等不做特殊处理
 */
import { isNumber, isObject, isString } from './utils/type'
import { getDecimalPlaces } from './utils/string'
import Decimal from 'decimal.js'

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
  rateType: 'INCL', // 重构前 为 RateType 这里命名更通用，一般用到了都是要计算税的，默认值取 INCL
}
Object.seal(defaultUserOptions)

const defaultDecimalConfigs: Decimal.Config = {
  precision: 16, // 计算精度，参考 decimal.js 文档，可根据需求灵活调整
  rounding: Decimal.ROUND_HALF_UP, // 使用标准四舍五入 5进位 4舍去
  toExpNeg: -7,
  toExpPos: 21,
  maxE: 9e15,
  minE: -9e15,
  modulo: 1,
  crypto: false,
}
Object.seal(defaultDecimalConfigs)

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
      calcLinePrice: new Map(),
      percentToDecimal: new Map(),
      decimalToPercent: new Map(),
      calculateDiscountedPrice: new Map(),
      computeRate: new Map(),
    }
    this.userOptions = { ...defaultUserOptions }
    this.calcConfigs = { ...defaultDecimalConfigs }
  }

  public resetInstance() {
    this.clearCache()
    this.userOptions = { ...defaultUserOptions }
    this.calcConfigs = { ...defaultDecimalConfigs }
  }

  public setUserOption<K extends keyof UserOptions>(
    option: K,
    value: UserOptions[K]
  ): void {
    switch (option) {
      case 'keepParamsMaxPrecision':
        if (typeof value !== 'boolean') {
          throw new Error('参数 keepParamsMaxPrecision 应该为 Boolean 值')
        }
        this.userOptions.keepParamsMaxPrecision = value as boolean
        break
      case 'outputDecimalPlaces':
        if (typeof value !== 'number' || value > 16 || (value < 0 && value !== -1)) {
          throw new Error('参数 outputDecimalPlaces 应该为 [0, 16] 间的数字，或者 -1 表示不进行四舍五入直接返回原始值')
        }
        this.userOptions.outputDecimalPlaces = value
        break

      case 'taxRate':
        if (typeof value !== 'number' || value < 0 || value > 1) {
          throw new Error('参数 taxRate 应该为 [0, 1] 间的数字')
        }
        this.userOptions.taxRate = value
        break

      case 'rateType': {
        const validRateTypes: readonly RateType[] = ['EXCL', 'INCL', 'FREE']
        if (!validRateTypes.includes(value as RateType)) {
          throw new Error(`请传入正确的 RateType 类型，应该为 'EXCL', 'INCL', 'FREE' 之一`)
        }
        this.userOptions.rateType = value as RateType
        break
      }
      default:
        throw new Error(`配置项错误 ${option} , 请检查后重试`)
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
    const defaultPlaces = curUserOptions.keepParamsMaxPrecision
      ? -1
      : curUserOptions.outputDecimalPlaces
    if (Array.isArray(dataStructure)) {
      // 如果传入的是数组，遍历数组找到所有小数，并计算最大小数位数
      return Math.max(...dataStructure.map((v) => getDecimalPlaces(v)))
    } else if (typeof dataStructure === 'object' && dataStructure !== null) {
      // 如果传入的是对象，遍历对象的所有值找到所有小数，并计算最大小数位数
      return Math.max(...Object.values(dataStructure).map((v) => getDecimalPlaces(v)))
    } else if (typeof dataStructure === 'number') {
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
   * ```ts
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
    if (cacheType === 'all' || cacheType === 'calcLinePrice') {
      this.calcCache.calcLinePrice.clear()
    }
    if (cacheType === 'all' || cacheType === 'percentToDecimal') {
      this.calcCache.percentToDecimal.clear()
    }
    if (cacheType === 'all' || cacheType === 'decimalToPercent') {
      this.calcCache.decimalToPercent.clear()
    }
    if (cacheType === 'all' || cacheType === 'calculateDiscountedPrice') {
      this.calcCache.calculateDiscountedPrice.clear()
    }
    if (cacheType === 'all' || cacheType === 'computeRate') {
      this.calcCache.computeRate.clear()
    }
    if (!cacheFnList.includes(cacheType)) {
      console.warn(`Invalid cacheType: ${cacheType}`)
    }
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
      if (!isObject(obj)) return JSON.stringify(obj)
      if (Array.isArray(obj)) {
        return `[${obj.map(stableStringify).join(',')}]`
      }

      // fix 递归处理每个值，确保嵌套对象、数组等结构的键顺序也被排序
      const sortedKeys = Object.keys(obj).sort();
      const pairs = sortedKeys.map((key) => {
        return `${JSON.stringify(key)}:${stableStringify((obj as Record<string, any>)[key])}`
      })

      return `{${pairs.join(',')}}`
    }

    return stableStringify(data)
  }

  public sum(
    data: number | number[] | { [key: string]: number },
    userOptions?: Partial<UserOptions>
  ): number {
    const mergedOptions = { ...this._getUserOptions() }
    if (
      mergedOptions !== null &&
      isObject(userOptions) &&
      Object.keys(userOptions).length > 0
    ) {
      Object.entries(userOptions).forEach(([key, val]) => {
        if (key in this.userOptions) {
          mergedOptions[key as keyof UserOptions] = val as any
        }
      })
    }
    const DecimalClone = Decimal.clone({ ...defaultDecimalConfigs })

    const cacheKey = this.generateCacheKey({ 
      data, 
      mergedOptions,
    })
    if (this.calcCache.sum.has(cacheKey)) {
      return this.calcCache.sum.get(cacheKey) as number
    }

    let total = 0
    let numbersToSum: number[] = []

    if (Array.isArray(data)) {
      numbersToSum = data.filter((num) => isNumber(num) && !Number.isNaN(num))
    } else if (isObject(data)) {
      // 处理为安全的数字类型（至少 要保证传入的都是数字类型 -> 下面这种处理好再传进来呀
      // 为避免认知混淆，一律不为数字的，如 '123', '$4.00' 都过滤掉）
      numbersToSum = Object.values(data).filter(
        (value: unknown): value is number => isNumber(value) && !Number.isNaN(value)
      )
    } else if (isNumber(data)) {
      numbersToSum = [data]
    }

    if (numbersToSum.length > 0) {
      // 使用独立实例进行高精度计算
      let totalDecimal = new DecimalClone(0)
      for (const num of numbersToSum) {
        totalDecimal = totalDecimal.add(new DecimalClone(num))
      }
      const finalDigitNumber = mergedOptions.outputDecimalPlaces === -1 
        ? -1 : mergedOptions.outputDecimalPlaces
        // finalDigitNumber 标识为-1 返回原始计算结果，否则用 用户设置精度

      total =
        finalDigitNumber === -1
          ? totalDecimal.toNumber()
          : totalDecimal.toDP(finalDigitNumber).toNumber()
    }

    // 使用 toDP(mergedOptions.outputDecimalPlaces) 控制小数位数
    this.calcCache.sum.set(cacheKey, total)

    return total
  }

  public subtractMultiple(
    initialValue: number,
    subtractValues: number[] | number,
    userOptions?: Partial<UserOptions>
  ): number {
    const mergedOptions = { ...this._getUserOptions() }
    if (
      mergedOptions !== null &&
      isObject(userOptions) &&
      Object.keys(userOptions).length > 0
    ) {
      Object.entries(userOptions).forEach(([key, val]) => {
        if (key in mergedOptions) {
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
    if (!isNumber(initialValue) || Number.isNaN(initialValue)) {
      initialValue = 0
    }

    // 参数预处理：统一为数组
    if (!Array.isArray(subtractValues)) {
      subtractValues = [subtractValues] as number[]
    }

    // 过滤非法减数项
    const filteredSubtractValues = subtractValues.filter((v: unknown): v is number =>
      isNumber(v)
    )

    // 缓存命中处理
    if (this.calcCache.subtractMultiple.has(cacheKey)) {
      return this.calcCache.subtractMultiple.get(cacheKey) as number
    }
    let totalDecimal = new DecimalClone(initialValue)
    for (const num of filteredSubtractValues) {
      totalDecimal = totalDecimal.minus(new DecimalClone(num))
    }
    const finalDigitNumber =
      mergedOptions.outputDecimalPlaces === -1 ? -1 : mergedOptions.outputDecimalPlaces

    const total =
      finalDigitNumber === -1
        ? totalDecimal.toNumber()
        : totalDecimal.toDP(finalDigitNumber).toNumber()

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

    const mergedOptions = { ...this._getUserOptions() }
    if (
      mergedOptions !== null &&
      isObject(userOptions) &&
      Object.keys(userOptions).length > 0
    ) {
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

    const finalDigitNumber =
      mergedOptions.outputDecimalPlaces === -1 ? -1 : mergedOptions.outputDecimalPlaces

    // finalDigitNumber 标识为-1 返回原始计算结果，否则用 用户设置精度
    finalUnitPrice =
      finalDigitNumber === -1
        ? unitPriceDecimal.toNumber()
        : unitPriceDecimal.toDP(finalDigitNumber).toNumber()

    const result = {
      quantity,
      unitPrice: finalUnitPrice,
      linePrice,
    }

    this.calcCache.calcUnitPrice.set(cacheKey, result)
    return result
  }

  public calcLinePrice(
    calcBaseTotalParams: Required<Omit<CalcBaseTotalParams, 'linePrice'>>,
    userOptions?: Partial<UserOptions>
  ): CalcBaseTotalParams {
    let { quantity, unitPrice }: { quantity: number | null; unitPrice: number | null } =
      calcBaseTotalParams
    let finalLinePrice: number = 0
    // 明确边界处理逻辑，这里统一返回null
    if (!isNumber(quantity) || Number.isNaN(quantity)) quantity = null
    if (!isNumber(unitPrice) || Number.isNaN(unitPrice)) unitPrice = null
    if (isNumber(quantity) && quantity <= 0) {
      console.warn('参数错误, quantity 必须大于等于 0。这里按 0 处理来处理')
      quantity = 0
    }
    if (quantity === null && isNumber(unitPrice) && unitPrice >= 0) {
      return {
        quantity,
        unitPrice,
        linePrice: unitPrice,
      }
    }
    if (isNumber(quantity) && quantity >= 0 && unitPrice === null) {
      return {
        quantity,
        unitPrice: null,
        linePrice: null,
      }
    }
    if (quantity === null && unitPrice === null)
      return { quantity, unitPrice: null, linePrice: null }

    const mergedOptions = { ...this._getUserOptions() }
    if (
      mergedOptions !== null &&
      isObject(userOptions) &&
      Object.keys(userOptions).length > 0
    ) {
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
    if (this.calcCache.calcLinePrice.has(cacheKey)) {
      return this.calcCache.calcLinePrice.get(cacheKey) as CalcBaseTotalParams
    }

    // 通用计算逻辑
    const quantityDecimal = new DecimalClone(quantity || 0)
    const unitPriceDecimal = new DecimalClone(unitPrice || 0)
    const linePriceDecimal = quantityDecimal.mul(unitPriceDecimal)

    const finalDigitNumber =
      mergedOptions.outputDecimalPlaces === -1 ? -1 : mergedOptions.outputDecimalPlaces

    finalLinePrice =
      finalDigitNumber === -1
        ? linePriceDecimal.toNumber()
        : linePriceDecimal.toDP(finalDigitNumber).toNumber()

    const result = {
      quantity,
      unitPrice,
      linePrice: finalLinePrice,
    }
    this.calcCache.calcLinePrice.set(cacheKey, result)
    return result
  }

  public calculateDiscountedPrice(
    originalPrice: number | null,
    discountRate: number | null,
    userOptions?: Partial<UserOptions>
  ): number | null {
    // 边界1 输入价格或折扣为null，统一不处理
    if (
      originalPrice === null ||
      discountRate === null ||
      !isNumber(originalPrice) ||
      Number.isNaN(originalPrice) ||
      !isNumber(discountRate) ||
      Number.isNaN(discountRate)
    )
      return null

    // 边界2 若原始价格为负数，不处理直接返原价
    if (isNumber(originalPrice) && originalPrice < 0) {
      console.error('参数 originalPrice 应该为大于 0 的数值')
      return originalPrice
    }
    // 边界3 折扣为0，直接返原价
    if (discountRate === 0) {
      return originalPrice
    }
    // 边界4 折扣为1，（打满折）相当于免费
    if (discountRate === 1) {
      return 0
    }
    // 边界5 折扣率不能为负，直接返原价
    if (isNumber(discountRate) && discountRate < 0) {
      console.error(
        '请确保传参 discountRate(折扣率) 在 [0, 1] 之间。 若确认传入是百分比，你可以先使用 percentToDecimal 方法将百分比转换为小数再进行计算。'
      )
      return originalPrice
    }

    const mergedOptions = { ...this._getUserOptions() }
    if (
      mergedOptions !== null &&
      isObject(userOptions) &&
      Object.keys(userOptions).length > 0
    ) {
      Object.entries(userOptions).forEach(([key, val]) => {
        if (key in this.userOptions) {
          mergedOptions[key as keyof UserOptions] = val
        }
      })
    }
    // 创建独立配置的 Decimal 实例
    const DecimalClone = Decimal.clone({ ...defaultDecimalConfigs })

    const cacheKey = this.generateCacheKey({
      originalPrice,
      discountRate,
      mergedOptions,
    })

    if (this.calcCache.calculateDiscountedPrice.has(cacheKey)) {
      return this.calcCache.calculateDiscountedPrice.get(cacheKey) as number | null
    }

    const originDecimal = new DecimalClone(originalPrice)
    const finalDigitNumber =
      mergedOptions.outputDecimalPlaces === -1 ? -1 : mergedOptions.outputDecimalPlaces

    const ratePrice = originDecimal.mul(discountRate)
    // console.log('ratePrice', ratePrice)

    const finalDiscountedPrice =
      finalDigitNumber === -1
        ? originDecimal.sub(ratePrice).toNumber()
        : originDecimal.sub(ratePrice).toDP(finalDigitNumber).toNumber()

    this.calcCache.calculateDiscountedPrice.set(cacheKey, finalDiscountedPrice)
    return finalDiscountedPrice
  }

  public percentToDecimal(
    originPercentage: number | null,
    userOptions?: number | Partial<UserOptions>
  ): number | null {
    const curUserOptions = { ...this._getUserOptions() }
    if (userOptions === undefined) {
      userOptions = curUserOptions
    }
    else if (!isObject(userOptions) && !isNumber(userOptions)) {
      // console.error('非法参数 userOptions', '请传入正确的参数，第二个参数应该为 0 - 10位 Number 类型, 非法参数按预设处理')
      userOptions = curUserOptions
    }
    else if (isNumber(userOptions)) {
      const tempNum = Number.isNaN(userOptions) ? userOptions : -1
      userOptions = { outputDecimalPlaces: tempNum }
    }
    // console.log('curUserOptions', curUserOptions)
    
    if (isObject(userOptions)) {
      Object.entries(userOptions).forEach(([key, val]) => {
        curUserOptions[key] = val
      })
    }

    // 边界情况：传 null 默认不处理
    if (
      originPercentage === null ||
      !isNumber(originPercentage) ||
      Number.isNaN(originPercentage)
    ) {
      return null
    }

    const DecimalClone = Decimal.clone({ ...defaultDecimalConfigs })
    const cacheKey = this.generateCacheKey({
      originPercentage,
      curUserOptions,
    })

    if (this.calcCache.percentToDecimal?.has(cacheKey)) {
      return this.calcCache.percentToDecimal.get(cacheKey) as number | null
    }

    // 使用 Decimal.js 高精度计算
    const percentageDecimal = new DecimalClone(originPercentage)
    const hundredDecimal = new DecimalClone(100)
    const resultDecimal = percentageDecimal.dividedBy(hundredDecimal)
    const finalDigitNumber =
      curUserOptions.outputDecimalPlaces === -1 ? -1 : curUserOptions.outputDecimalPlaces
    // console.log('curUserOptions.outputDecimalPlaces', curUserOptions.outputDecimalPlaces)
    // console.log('finalDigitNumber', finalDigitNumber)

    const result =
      finalDigitNumber === -1
        ? resultDecimal.toNumber()
        : resultDecimal.toDP(finalDigitNumber).toNumber()

    // console.log('result', result)

    this.calcCache.percentToDecimal.set(cacheKey, result)
    return result
  }

  public decimalToPercent(
    originNumber: number | null,
    userOptions?: number | Partial<UserOptions>
    // decimalPlaces: number = 2
  ): number {
    // 处理参数
    const curUserOptions = { ...this._getUserOptions() }
    if (userOptions === undefined) {
      userOptions = curUserOptions
    }
    else if (!isObject(userOptions) && !isNumber(userOptions)) {
      console.error('非法参数 userOptions, 请传入正确的参数，第二个参数应该为 0 - 10位 Number 类型, 非法参数按预设处理')
      userOptions = curUserOptions
    }
    else if (isNumber(userOptions)) {
      const tempNum = userOptions > -1 ? userOptions : -1
      userOptions = { outputDecimalPlaces: tempNum }
    }
    
    if (isObject(userOptions)) {
      Object.entries(userOptions).forEach(([key, val]) => {
        curUserOptions[key] = val
      })
    }
    // console.log('userOptions', userOptions)
    // console.log('curUserOptions', curUserOptions)

    if (
      originNumber === null || originNumber === 0 ||
      !isNumber(originNumber) || Number.isNaN(originNumber)
    ) return 0


    if (!isNumber(userOptions?.outputDecimalPlaces) || Number.isNaN(userOptions?.outputDecimalPlaces)) {
      console.error('参数错误，请检查传参: \n1. originNumber 应该为 Number 类型；\n2. 第二个参数保留小数位数 应为 0 到 10 之间的数字')
      return originNumber
    }

    if (userOptions.outputDecimalPlaces > 10) {
      console.error(
        '参数错误，请检查传参: 第二个参数保留小数位数应为 0 到 10 之间的数字, 当前大于 10 当作 10 来处理'
      )
      userOptions.outputDecimalPlaces = 10
    }

    // 缓存命中直接返回结果
    const cacheKey = this.generateCacheKey({ originNumber, userOptions })
    const cache = this.getCache('decimalToPercent')
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey) as number
    }
    
    const finalDigitNumber =
    userOptions.outputDecimalPlaces === -1 ? -1 : userOptions.outputDecimalPlaces
    
    const DecimalClone = Decimal.clone({ ...defaultDecimalConfigs })
    const resultTemp = DecimalClone(originNumber).mul(100)

    // console.log('走到这里了 >> resultTemp', finalDigitNumber, resultTemp)

    // 精度处理逻辑
    const finalResult = finalDigitNumber === -1
      ? resultTemp.toNumber()
      : resultTemp.toDP(userOptions.outputDecimalPlaces).toNumber()

    // 存储到缓存
    this.calcCache.decimalToPercent.set(cacheKey, finalResult)
    return finalResult
  }

  // 只传初始价格
  public computeRate(originPrice: number): number
  // 使用2个参数: originPrice, userRate
  public computeRate(originPrice: number, userRate: number): number
  // 传 2 个参数，第二个传参为配置对象
  public computeRate(originPrice: number, userOptions: Partial<UserOptions>): number
  // 重载签名 3：显式传参（originPrice, userRate, userRateType）
  public computeRate(originPrice: number, userRate: number, userRateType: RateType): number
  public computeRate(
    originPrice: number,
    param2?: number | Partial<UserOptions>,
    param3?: RateType,
  ): number {
    // 解析参数
    const args = [originPrice, param2, param3].filter(arg => arg !== undefined)
    const curUserOptions = { ...this._getUserOptions() }
    let userRateType: RateType = curUserOptions.rateType
    let userOptions = {} as UserOptions
    let userRate: number = curUserOptions.taxRate
    
    // 边界处理：originPrice 为 null/0 返回 0
    if (originPrice === null || originPrice === 0 || !isNumber(originPrice) || Number.isNaN(originPrice)) {
      return 0
    }

    if (args.length === 1 && isNumber(args[0])) {
      userRate = curUserOptions.taxRate
      userRateType = curUserOptions.rateType
      userOptions = { ...curUserOptions }
    }
    else if (args.length === 2 && isNumber(param2)) {
      userRate = param2
      userRateType = curUserOptions.rateType
      userOptions = {
        ...curUserOptions,
        rateType: curUserOptions.rateType,
        taxRate: param2,
      }
    }
    else if (args.length === 2 && isObject(param2)) {
      if (param2.taxRate !== undefined) userRate = param2.taxRate
      if (param2.rateType !== undefined) userRateType = param2.rateType
      userOptions = {
      ...curUserOptions,
      ...param2,
    }
    }
    else if (args.length === 2 && (!isNumber(param2) || !isObject(param2))) {
      console.error('param2 传参异常。请参考API文档传入正确的配置项')
      return originPrice
    }
    // 显式传参 - 重载2
    else if (args.length === 3 && isNumber(param2) && isString(param3)) {
      userRate = param2
      userRateType = param3
      userOptions = {
        ...curUserOptions,
        taxRate: param2,
        rateType: param3,
      }

    }


    if (isObject(userOptions)) {
      Object.entries(userOptions).forEach(([key, val]) => {
        curUserOptions[key] = val
      })
    }

    // console.log('🚀 ~ 传参 args >>> ', args, originPrice, curUserOptions)
    const finalDigitNumber = userOptions.outputDecimalPlaces === -1 
      ? -1 
      : userOptions.outputDecimalPlaces


    if (userRate === null || Number.isNaN(userRate) || typeof userRate !== 'number') {
      console.warn('参数 Rate 无效，直接返回原始价格')
      return originPrice
    }
    else if (userRate < 0) {
      console.warn(`参数 Rate 应大于0。当前参数错误, 使用默认税率 ${ curUserOptions.taxRate }`)
      userRate = curUserOptions.taxRate // ✅ 使用默认税率而非直接返回
    }

    const cacheKey = this.generateCacheKey({ originPrice, userOptions, finalDigitNumber })

    if (this.calcCache.computeRate.has(cacheKey)) {
      return this.calcCache.computeRate.get(cacheKey) as number
    }

    const DecimalClone = Decimal.clone({ ...defaultDecimalConfigs })
    const addedRate = DecimalClone(1).add(userOptions.taxRate).toNumber()
    const rateCalculators: { [key in RateType]: (price: number) => Decimal } = {
      FREE: () => DecimalClone(0),
      INCL: (price) => DecimalClone(price).div(addedRate).mul(userOptions.taxRate),
      EXCL: (price) =>
        DecimalClone(price).mul(userOptions.taxRate),
    }

    
    // 添加默认处理，防止访问不存在的键
    const calculator = rateCalculators[userOptions.rateType]
    if (!calculator) {
      console.error(`参数 ${userOptions.rateType} 类型错误`)
      return originPrice
    }
    
    // 精度处理逻辑
    const finalResult = finalDigitNumber === -1
      ? calculator(originPrice).toNumber()
      : calculator(originPrice).toDP(finalDigitNumber).toNumber()

    // console.log(calculator(originPrice), '>>> finalResult >>> ', finalResult)

    this.calcCache.computeRate.set(cacheKey, finalResult)
    return finalResult
  }
}

export const CalcInst = Calculator.getInstance()
export * as Decimal from 'decimal.js'
