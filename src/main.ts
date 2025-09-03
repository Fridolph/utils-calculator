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
import Decimal from 'decimal.js'
import { isNumber, isObject, isString, getDecimalPlaces } from './utils'
import { defaultDecimalConfigs } from './constants'

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

  /**
   * 计算输入数据的总和
   * @description 该方法可以处理多种类型的数据输入，包括数字、数字数组以及包含数值的对象，并根据用户配置的精度选项进行计算结果的处理。同时，该方法具备缓存机制，相同输入的计算结果将被缓存以提高性能。
   * 
   * @param {number | number[] | { [key: string]: number }} data - 输入的数据，可以是单个数字、数字数组或包含数值属性的对象。
   * 
   *  - **单个数字**：如 `5`，将直接计算该数字作为总和。
   *  - **数字数组**：例如 `[1, 2, 3]`，方法将计算数组中所有有效数字的总和。
   *  - **包含数值属性的对象**：例如 `{ a: 1, b: 2 }`，方法将计算对象中所有数值属性的总和。
   * 
   * @param {Partial<UserOptions>} [userOptions] - 用户自定义的配置选项（可选）。
   *  - **keepParamsMaxPrecision** ：布尔值，默认为 `true`。若为 `true`，将保留参数中的最大精度；若为 `false`，则按照 `outputDecimalPlaces` 配置输出结果。
   *  - **outputDecimalPlaces** ：数字类型，取值范围为 `-1` 到 `16`。 `-1` 表示保留原始计算值，不进行四舍五入处理；其他正值表示计算结果精确到的小数位数。
   *  - **taxRate** ：数字类型，取值范围为 `0` 到 `1`，表示税率，默认为 `0.1`。
   *  - **rateType** ：取值为 `'EXCL'`、`'INCL'`、`'FREE'` 之一，用于指定税率计算类型，默认为 `'INCL'`。
   * 
   * @returns {number} 计算结果，类型为基础数字类型。
   * 
   * @example
   * // 数组求和
   * CalcInst.sum([1, 2, 3]); // 6
   * 
   * @example
   * // 单个数字输入
   * CalcInst.sum(5); // 5
   * 
   * @example
   * // 对象求和
   * CalcInst.sum({ a: 1, b: 2 }); // 3
   * 
   * @example
   * // 使用自定义配置选项
   * CalcInst.sum([1.1, 2.2, 3.3], { outputDecimalPlaces: 1 }); // 6.6
   * 
   * @throws {Error} 当 `userOptions` 中的配置项不符合要求时，会抛出相应的错误。
   *  - 若 `keepParamsMaxPrecision` 不是布尔值，抛出 `参数 keepParamsMaxPrecision 应该为 Boolean 值`。
   *  - 若 `outputDecimalPlaces` 不是 `-1` 到 `16` 之间的数字，抛出 `参数 outputDecimalPlaces 应该为 [-1, 16] 间的数字`。
   *  - 若 `taxRate` 不是 `0` 到 `1` 之间的数字，抛出 `参数 taxRate 应该为 [0, 1] 间的数字`。
   *  - 若 `rateType` 不是 `'EXCL'`、`'INCL'`、`'FREE'` 之一，抛出 `请传入正确的 RateType 类型，应该为 'EXCL', 'INCL', 'FREE' 之一`。
   * 
   * @see {@link UserOptions} 用于查看用户配置选项的详细类型定义。
   * 
   * @description 
   *  - 该方法在计算过程中会过滤掉输入数据中的无效值（如非数字类型、`null`、`NaN` 等）。
   *  - 对于加法运算，会使用 `Decimal.js` 进行高精度计算，以确保计算结果的准确性。
   *  - 方法具备缓存机制，会根据输入数据和配置选项生成唯一的缓存键，相同输入的计算结果将直接从缓存中获取，避免重复计算，提高计算效率。
   */
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
      if (data.includes(Infinity) || data.includes(-Infinity)) {
        console.error('Infinity or -Infinity is not allowed in the array.')
      }
      
      numbersToSum = data.filter((num) => isNumber(num) && !Number.isNaN(num) && num !== Infinity && num !== -Infinity)
    }
    else if (isObject(data)) {
      // 处理为安全的数字类型（至少 要保证传入的都是数字类型 -> 下面这种处理好再传进来呀
      // 为避免认知混淆，一律不为数字的，如 '123', '$4.00' 都过滤掉）
      numbersToSum = Object.values(data).filter(
        (value: unknown): value is number => isNumber(value) && !Number.isNaN(value) && value !== Infinity && value !== -Infinity
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

  /**
   * 从初始值中依次减去多个减数，实现多次减法运算。
   * @description 该方法支持多种类型的参数输入，并对异常输入和边界情况进行了处理，同时支持用户自定义计算精度，还具备缓存机制以提高性能。
   * 
   * @param {number} initialValue - 初始值，作为减法运算的起始值。如果该值不是数字类型（包括 `null`、`NaN`、`undefined` 等），将会被转换为 `0` 后进行运算。
   * 
   * @param {number[] | number} subtractValues - 减数，可以是单个数字或数字数组。如果是单个数字，会将其转换为包含该数字的数组进行处理。数组中的无效值（如非数字类型）将被过滤掉，不参与运算。
   * 
   * @param {Partial<UserOptions>} [userOptions] - 用户自定义的配置选项（可选）。
   *  - **keepParamsMaxPrecision** ：布尔值，默认为 `true`。若为 `true`，将保留参数中的最大精度；若为 `false`，则按照 `outputDecimalPlaces` 配置输出结果。
   *  - **outputDecimalPlaces** ：数字类型，取值范围为 `-1` 到 `16`。 `-1` 表示保留原始计算值，不进行四舍五入处理；其他正值表示计算结果精确到的小数位数。
   *  - **taxRate** ：数字类型，取值范围为 `0` 到 `1`，表示税率，默认为 `0.1`。
   *  - **rateType** ：取值为 `'EXCL'`、`'INCL'`、`'FREE'` 之一，用于指定税率计算类型，默认为 `'INCL'`。
   * 
   * @returns {number} 减法运算的结果，类型为基础数字类型。
   * 
   * @example
   * // 初始值减去单个减数
   * CalcInst.subtractMultiple(10, 5); // 5
   * 
   * @example
   * // 初始值减去多个减数
   * CalcInst.subtractMultiple(20, [5, 3, 2]); // 10
   * 
   * @example
   * // 使用自定义配置选项
   * CalcInst.subtractMultiple(10.5, [3.2], { outputDecimalPlaces: 1 }); // 7.3
   * 
   * @throws {Error} 当 `userOptions` 中的配置项不符合要求时，会抛出相应的错误。
   *  - 若 `keepParamsMaxPrecision` 不是布尔值，抛出 `参数 keepParamsMaxPrecision 应该为 Boolean 值`。
   *  - 若 `outputDecimalPlaces` 不是 `-1` 到 `16` 之间的数字，抛出 `参数 outputDecimalPlaces 应该为 [-1, 16] 间的数字`。
   *  - 若 `taxRate` 不是 `0` 到 `1` 之间的数字，抛出 `参数 taxRate 应该为 [0, 1] 间的数字`。
   *  - 若 `rateType` 不是 `'EXCL'`、`'INCL'`、`'FREE'` 之一，抛出 `请传入正确的 RateType 类型，应该为 'EXCL', 'INCL', 'FREE' 之一`。
   * 
   * @see {@link UserOptions} 用于查看用户配置选项的详细类型定义。
   * 
   * @description 
   *  - 该方法会先对初始值和减数进行预处理，将无效的初始值转换为 `0`，将单个减数转换为数组形式，并过滤掉减数数组中的无效值。
   *  - 对于减法运算，会使用 `Decimal.js` 进行高精度计算，以确保计算结果的准确性。
   *  - 方法具备缓存机制，会根据输入数据（初始值、减数、配置选项）生成唯一的缓存键，相同输入的计算结果将直接从缓存中获取，避免重复计算，提高计算效率。
   */
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

  /**
   * 根据公式计算单价
   * @description `公式： 单价 = 总价 / 数量` 通过给定的数量（quantity）和总价（linePrice），按照一定规则计算出单价（unitPrice），并返回包含数量、单价和总价的对象。该方法考虑了多种边界条件、异常情况，支持用户自定义计算精度，同时具备缓存机制以提高性能。
   * 
   * @param {Required<Omit<CalcBaseTotalParams, 'unitPrice'>>} calcBaseTotalParams - 包含数量和总价信息的参数对象，但不包含单价。
   *  - **quantity** ：数字类型，表示商品的数量。可以是 `null`，不同值会有不同的计算逻辑。
   *  - **linePrice** ：数字类型，表示商品的总价。可以是 `null`，不同值会有不同的计算逻辑。
   * 
   * @param {Partial<UserOptions>} [userOptions] - 用户自定义的配置选项（可选）。
   *  - **keepParamsMaxPrecision** ：布尔值，默认为 `true`。若为 `true`，将保留参数中的最大精度；若为 `false`，则按照 `outputDecimalPlaces` 配置输出结果。
   *  - **outputDecimalPlaces** ：数字类型，取值范围为 `-1` 到 `16`。 `-1` 表示保留原始计算值，不进行四舍五入处理；其他正值表示计算结果精确到的小数位数。
   *  - **taxRate** ：数字类型，取值范围为 `0` 到 `1`，表示税率，默认为 `0.1`。
   *  - **rateType** ：取值为 `'EXCL'`、`'INCL'`、`'FREE'` 之一，用于指定税率计算类型，默认为 `'INCL'`。
   * 
   * @returns {CalcBaseTotalParams} 包含计算后的数量、单价和总价的对象。
   * 
   * @example
   * // 常规计算
   * CalcInst.calcUnitPrice({ quantity: 5, linePrice: 25 }); // { quantity: 5, unitPrice: 5, linePrice: 25 }
   * 
   * @example
   * // quantity 为 null 的情况
   * CalcInst.calcUnitPrice({ quantity: null, linePrice: 30 }); // { quantity: null, unitPrice: 30, linePrice: 30 }
   * 
   * @example
   * // quantity 为 0 的情况
   * CalcInst.calcUnitPrice({ quantity: 0, linePrice: 40 }); // { quantity: 0, unitPrice: 40, linePrice: 40 }
   * 
   * @example
   * // 使用自定义配置选项
   * CalcInst.calcUnitPrice({ quantity: 4, linePrice: 18 }, { outputDecimalPlaces: 1 }); // { quantity: 4, unitPrice: 4.5, linePrice: 18 }
   * 
   * @throws {Error} 当 `userOptions` 中的配置项不符合要求时，会抛出相应的错误。
   *  - 若 `keepParamsMaxPrecision` 不是布尔值，抛出 `参数 keepParamsMaxPrecision 应该为 Boolean 值`。
   *  - 若 `outputDecimalPlaces` 不是 `-1` 到 `16` 之间的数字，抛出 `参数 outputDecimalPlaces 应该为 [-1, 16] 间的数字`。
   *  - 若 `taxRate` 不是 `0` 到 `1` 之间的数字，抛出 `参数 taxRate 应该为 [0, 1] 间的数字`。
   *  - 若 `rateType` 不是 `'EXCL'`、`'INCL'`、`'FREE'` 之一，抛出 `请传入正确的 RateType 类型，应该为 'EXCL', 'INCL', 'FREE' 之一`。
   * 
   * @see {@link UserOptions} 用于查看用户配置选项的详细类型定义。
   * @see {@link CalcBaseTotalParams} 用于查看参数对象的详细类型定义。
   * 
   * @description 
   *  - 该方法会根据不同的边界条件进行不同的处理：
   *    - 当 `quantity` 和 `linePrice` 同时为 `null` 时，返回全 `null` 对象。
   *    - 当 `quantity` 为 `null` 时，`unitPrice` 等于 `linePrice`。
   *    - 当 `linePrice` 为 `null` 时，返回 `null` 总价。
   *    - 当 `quantity` 为 `0` 时，强制 `unitPrice` 等于 `linePrice`。
   *  - 对于单价的计算，会使用 `Decimal.js` 进行高精度计算，以确保计算结果的准确性。
   *  - 方法具备缓存机制，会根据输入数据（参数对象、配置选项）生成唯一的缓存键，相同输入的计算结果将直接从缓存中获取，避免重复计算，提高计算效率。
   */
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

  /**
   * 根据公式计算总价
   * @description `公式：总价 = 单价 * 数量`. 根据商品的数量（quantity）和单价（unitPrice）计算总价（linePrice），并返回包含数量、单价和总价的对象。此方法针对多种边界条件、异常输入进行了处理，并支持用户自定义计算精度，同时具备缓存机制以提高计算效率。
   * 
   * @param {Pick<CalcBaseTotalParams, 'quantity' | 'unitPrice'>} params - 包含数量和单价信息的参数对象。
   *  - **quantity** ：数字类型，表示商品的数量。如果不是数字类型，会根据不同情况进行处理，负数会被强制转为 `0`，非数字值会被视为 `null`。 
   *  - **unitPrice** ：数字类型，表示商品的单价。如果不是数字类型，会被视为 `null`。负数的单价将保留其负值。
   * 
   * @param {Partial<UserOptions>} [userOptions] - 用户自定义的配置选项（可选）。
   *  - **keepParamsMaxPrecision** ：布尔值，默认为 `true`。若为 `true`，将保留参数中的最大精度；若为 `false`，则按照 `outputDecimalPlaces` 配置输出结果。
   *  - **outputDecimalPlaces** ：数字类型，取值范围为 `-1` 到 `16`。 `-1` 表示保留原始计算值，不进行四舍五入处理；其他正值表示计算结果精确到的小数位数。此配置用于控制计算结果的精度。
   *  - **taxRate** ：数字类型，取值范围为 `0` 到 `1`，表示税率，默认为 `0.1`。
   *  - **rateType** ：取值为 `'EXCL'`、`'INCL'`、`'FREE'` 之一，用于指定税率计算类型，默认为 `'INCL'`。
   * 
   * @returns {CalcBaseTotalParams} 返回一个包含数量、单价和总价的对象。对于不同的输入情况有不同的返回值：
   *  - 当 `quantity` 和 `unitPrice` 都为 `null` 时，返回全 `null` 对象，即 `{ quantity: null, unitPrice: null, linePrice: null }`。
   *  - 当 `quantity` 为 `null` 时，`unitPrice` 等于 `linePrice`。
   *  - 当 `linePrice` 为 `null` 时，返回 `null` 总价。
   *  - 当 `quantity` 为 `0` 时，`unitPrice` 保持不变，`linePrice` 为 `0`。
   * 
   * @example
   * // 正常计算
   * const params = { quantity: 3, unitPrice: 4 };
   * const result = CalcInst.calcLinePrice(params);
   * expect(result.linePrice).toBe(12);
   * 
   * @example
   * // quantity 为 null 的情况
   * const params = { quantity: null, unitPrice: 5 };
   * const result = CalcInst.calcLinePrice(params);
   * expect(result.quantity).toBe(null),
   * expect(result.unitPrice).toBe(5),
   * expect(result.linePrice).toBe(5);
   * 
   * @example
   * // 使用自定义配置选项
   * const params = { quantity: 1.11, unitPrice: 2.22 };
   * const result = CalcInst.calcLinePrice(params, { outputDecimalPlaces: 1 });
   * expect(result.linePrice).toBeCloseTo(1.11 * 2.22, 1);
   * 
   * @throws {Error} 当 `userOptions` 中的配置项不符合要求时，会抛出相应的错误。
   *  - 若 `keepParamsMaxPrecision` 不是布尔值，抛出 `参数 keepParamsMaxPrecision 应该为 Boolean 值`。
   *  - 若 `outputDecimalPlaces` 不是 `-1` 到 `16` 之间的数字，抛出 `参数 outputDecimalPlaces 应该为 [-1, 16] 间的数字`。
   *  - 若 `taxRate` 不是 `0` 到 `1` 之间的数字，抛出 `参数 taxRate 应该为 [0, 1] 间的数字`。
   *  - 若 `rateType` 不是 `'EXCL'`、`'INCL'`、`'FREE'` 之一，抛出 `请传入正确的 RateType 类型，应该为 'EXCL', 'INCL', 'FREE' 之一`。
   * 
   * @see {@link UserOptions} 用于查看用户配置选项的详细类型定义。
   * @see {@link CalcBaseTotalParams} 用于查看返回对象的详细类型定义。
   * 
   * @description 
   *  - 在计算总价时，会根据传入的 `quantity` 和 `unitPrice` 值进行不同的处理。
   *  - 对于非数字类型的 `quantity` 或 `unitPrice`，会进行特定的转换和处理以确保计算的正确性。
   *  - 精度计算方面，使用内部机制确保计算结果符合用户指定的精度要求（通过 `outputDecimalPlaces` 配置）。
   *  - 缓存机制基于输入的参数对象和配置选项生成唯一的缓存键，相同输入的计算结果会从缓存中获取，避免重复计算。
   */
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

  /**
   * 计算折扣价.
   * @description `公式：折扣价 = 原价 - (原价 * 折扣率)`;  根据给定的原始价格和折扣率计算折扣后的价格。该方法支持多种边界值、异常情况处理，并具备精度配置和缓存机制功能。
   * 
   * @param {number | null} originalPrice - 商品的原始价格。如果输入为 `null` 或非数字类型，将返回 `null`；如果为负数，将按照特定规则处理。
   * 
   * @param {number | null} discountRate - 折扣率，取值范围理论上为 0 到 1 之间，但负数折扣率和非 `null` 非数字输入会有特殊处理。当值为 `null` 或非数字类型时，返回 `null`；当折扣率为 0 时，返回原始价格；当折扣率为 1 时，返回 0（免费）。
   * 
   * @param {Partial<UserOptions>} [userOptions] - 用户自定义的配置选项（可选）。
   *  - **keepParamsMaxPrecision** ：布尔值，默认为 `true`。若为 `true`，将保留参数中的最大精度；若为 `false`，则按照 `outputDecimalPlaces` 配置输出结果。
   *  - **outputDecimalPlaces** ：数字类型，取值范围为 `-1` 到 `16`。 `-1` 表示保留原始计算值，不进行四舍五入处理；其他正值表示计算结果精确到的小数位数。此参数用于配置计算结果的精度。
   *  - **taxRate** ：数字类型，取值范围为 `0` 到 `1`，表示税率，默认为 `0.1`。
   *  - **rateType** ：取值为 `'EXCL'`、`'INCL'`、`'FREE'` 之一，用于指定税率计算类型，默认为 `'INCL'`。
   * 
   * @returns {number | null} - 返回折扣后的价格，如果输入无效（如原始价格或折扣率为 `null` 或非数字类型），则返回 `null`。
   * 
   * @example
   * // 正常折扣计算
   * const discountedPrice = CalcInst.calculateDiscountedPrice(100, 0.1);
   * expect(discountedPrice).toBe(90);
   * 
   * @example
   * // 折扣率为0
   * const noDiscountPrice = CalcInst.calculateDiscountedPrice(50, 0);
   * expect(noDiscountPrice).toBe(50);
   * 
   * @example
   * // 使用自定义精度配置
   * const discountedPriceWithPrecision = CalcInst.calculateDiscountedPrice(100.111, 0.1, { outputDecimalPlaces: 2 });
   * expect(discountedPriceWithPrecision).toBe(90.1);
   * 
   * @throws {Error} - 当 `userOptions` 中的配置项不符合要求时，会抛出相应的错误。
   *  - 若 `keepParamsMaxPrecision` 不是布尔值，抛出 `参数 keepParamsMaxPrecision 应该为 Boolean 值`。
   *  - 若 `outputDecimalPlaces` 不是 `-1` 到 `16` 之间的数字，抛出 `参数 outputDecimalPlaces 应该为 [-1, 16] 间的数字`。
   *  - 若 `taxRate` 不是 `0` 到 `1` 之间的数字，抛出 `参数 taxRate 应该为 [0, 1] 间的数字`。
   *  - 若 `rateType` 不是 `'EXCL'`、`'INCL'`、`'FREE'` 之一，抛出 `请传入正确的 RateType 类型，应该为 'EXCL', 'INCL', 'FREE' 之一`。
   * 
   * @see {@link UserOptions} - 用于查看用户配置选项的详细类型定义。
   * 
   * @description
   *  - 该方法对于有效输入，通过公式 `原始价格 * (1 - 折扣率)` 来计算折扣价格，并根据 `outputDecimalPlaces` 配置进行精度处理。
   *  - 在边界值处理上：
   *    - 折扣率为 0 时，返回原始价格；折扣率为 1 时，返回 0（免费）。
   *    - 原始价格为 0 时，无论折扣率如何，返回 0。
   *    - 处理极小数值和极大数值确保计算准确。
   *  - 异常情况处理：
   *    - 当原始价格或折扣率为 `null` 或非数字类型时，返回 `null`。
   *    - 对于负原始价格和负折扣率，按特定规则返回原始价格。
   *  - 缓存机制：
   *    - 根据输入的原始价格、折扣率和配置选项生成唯一缓存键。
   *    - 相同输入的计算结果会命中缓存，减少计算次数，提高性能。
   */
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

  /**
   * 将百分比值转换为小数值 
   * @description `公式: 小数 = 原始值(%) / 100;`  该方法支持自定义精度配置，能处理多种边界值情况和异常输入，并具备缓存机制以提高计算效率。
   * 
   * @param {number | null | NaN} percentage - 要转换的百分比值。如果传入 `null`、非数字类型或 `NaN`，将返回 `null`。
   * 
   * @param {Partial<UserOptions>} [userOptions] - 用户自定义的配置选项（可选）。
   *  - **keepParamsMaxPrecision** ：布尔值，默认为 `true`。若为 `true`，将保留参数中的最大精度；若为 `false`，则按照 `outputDecimalPlaces` 配置输出结果。
   *  - **outputDecimalPlaces** ：数字类型，取值范围为 `-1` 到 `16`。 `-1` 表示保留原始计算值，不进行四舍五入处理；其他正值表示计算结果精确到的小数位数。此参数用于控制转换后的小数精度。
   *  - **taxRate** ：数字类型，取值范围为 `0` 到 `1`，表示税率，默认为 `0.1`。
   *  - **rateType** ：取值为 `'EXCL'`、`'INCL'`、`'FREE'` 之一，用于指定税率计算类型，默认为 `'INCL'`。
   * 
   * @returns {number | null} - 返回转换后的小数值。如果输入无效（如 `null`、非数字类型或 `NaN`），则返回 `null`。
   * 
   * @example
   * // 正常百分比转换
   * const decimalValue = CalcInst.percentToDecimal(20);
   * expect(decimalValue).toBe(0.2);
   * 
   * @example
   * // 使用自定义精度配置
   * const decimalValueWithPrecision = CalcInst.percentToDecimal(33.333, { outputDecimalPlaces: 2 });
   * expect(decimalValueWithPrecision).toBe(0.33);
   * 
   * @throws {Error} - 当 `userOptions` 中的配置项不符合要求时，会抛出相应的错误。
   *  - 若 `keepParamsMaxPrecision` 不是布尔值，抛出 `参数 keepParamsMaxPrecision 应该为 Boolean 值`。
   *  - 若 `outputDecimalPlaces` 不是 `-1` 到 `16` 之间的数字，抛出 `参数 outputDecimalPlaces 应该为 [-1, 16] 间的数字`。
   *  - 若 `taxRate` 不是 `0` 到 `1` 之间的数字，抛出 `参数 taxRate 应该为 [0, 1] 间的数字`。
   *  - 若 `rateType` 不是 `'EXCL'`、`'INCL'`、`'FREE'` 之一，抛出 `请传入正确的 RateType 类型，应该为 'EXCL', 'INCL', 'FREE' 之一`。
   * 
   * @see {@link UserOptions} - 用于查看用户配置选项的详细类型定义。
   * 
   * @description
   *  - 对于有效的百分比输入，通过将百分比值除以 100 来进行转换。例如，50% 转换为 0.5，100% 转换为 1。
   *  - 精度配置方面：
   *    - 根据 `outputDecimalPlaces` 的值对转换结果进行四舍五入处理。例如，`outputDecimalPlaces` 为 2 时，33.333 将转换为 0.33。
   *    - 当 `outputDecimalPlaces` 为 `-1` 时，返回原始计算值，不进行四舍五入。
   *  - 边界值处理：
   *    - 处理极大值和极小值，确保正确转换。例如，999999999 转换为 9999999.99，0.0001 转换为 0.000001。
   *    - 对于负百分比，同样进行正确转换。例如，-100 转换为 -1，-50 转换为 -0.5。
   *  - 异常输入处理：
   *    - 当输入为 `null`、非数字类型（如字符串）或 `NaN` 时，返回 `null`。
   *  - 缓存机制：
   *    - 该方法会根据输入的百分比值和配置选项生成唯一的缓存键。
   *    - 相同输入的转换结果会命中缓存，减少重复计算，提高性能。
   */
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

  /**
   * 将小数值转换为百分比值
   * @description `公式: 百分比 = 原始值 * 100;` 支持对转换结果进行精度控制. 此方法能处理多种输入情况，包括边界值、异常值，同时具备缓存机制以提高性能。
   * @description 注：% 号没有加，可以用另一个 Formatter 继续处理
   * 
   * @param {number | null | boolean | string | undefined | NaN} originNumber - 需要转换的小数值。可以为 `null`、布尔值、字符串、`undefined` 或 `NaN` 等无效值，这些无效值都将被处理并返回指定的默认结果。
   * 
   * @param {number | string} [decimalPlaces] - 用于指定转换后的百分比值要保留的小数位数（可选）。
   *   - 如果此参数为负数或非数字类型，将使用全局配置 `outputDecimalPlaces` 中的值，如果全局配置未设置，则使用默认精度处理。
   *   - 如果此参数超过10，转换结果会按超出部分进行四舍五入。
   * 
   * @returns {number} - 返回转换后的百分比值。对于无效输入，或转换结果小于0.000001 时，可能返回特定的默认值。
   * 
   * @example
   * // 正常小数转换
   * const percentValue = CalcInst.decimalToPercent(0.2);
   * expect(percentValue).toBe(20);
   * 
   * @example
   * // 自定义小数位数
   * const customPercentValue = CalcInst.decimalToPercent(0.33333, 3);
   * expect(customPercentValue).toBe(33.333);
   * 
   * @description
   *  - 正常转换逻辑：将输入的小数值乘以 100 并根据 `decimalPlaces` 参数进行精度处理后返回作为百分比的值。例如，0.5 转换为 50。
   *  - 边界值处理：
   *    - 输入为 `null`、`0`、`NaN` 时，返回 0。
   *    - 输入为科学计数法表示的极小值，如 1e - 5，能正确转换为对应的百分比 0.001。
   *  - 异常值处理：
   *    - 非数字类型输入如字符串、布尔值、`undefined` 等，均返回 0。
   *    - 负数输入正确转换为对应的负百分比，如 - 0.5 转换为 - 50。
   *  - 精度控制：
   *    - 根据 `decimalPlaces` 参数确定转换后的百分比值要保留的小数位数。如果该参数不合法（小于 0 或者非数字类型），则采用全局配置 `outputDecimalPlaces` 的值进行处理。
   *    - 对极小值如 0.00000001 能按照期望保留精度。对多位小数输入如 0.123456789 能根据指定的 `decimalPlaces` 正确保留小数位数。
   *  - 缓存机制：
   *    - 该方法会根据输入的 `originNumber` 和 `decimalPlaces` 参数生成唯一的缓存键。相同输入情况下，会命中缓存，直接返回缓存中的结果，提高计算效率。
   *    - 不同配置（不同的 `decimalPlaces` 值）会生成不同的缓存键，以确保不同配置下的结果独立性。
   * 
   * @see {outputDecimalPlaces} 全局配置. 当 `decimalPlaces` 参数不符合要求时，会使用全局配置的 `outputDecimalPlaces` 进行处理。
   */
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

  // 重载1: 只传初始价格
  public computeRate(originPrice: number): number
  // 重载2: 使用2个参数 originPrice, userRate
  public computeRate(originPrice: number, userRate: number): number
  // 重载3: 传 2 个参数, 第二个传参为配置对象
  public computeRate(originPrice: number, userOptions: Partial<UserOptions>): number
  // 重载4  显式传参（originPrice, userRate, userRateType）
  public computeRate(originPrice: number, userRate: number, userRateType: RateType): number
  /**
   * 根据给定的价格、税率和税率计算类型，计算相应的税额
   * @description 此方法支持多种精度配置、参数组合设定，并能处理各种边界值和异常输入情况，同时具备缓存机制以提高计算效率。
   * 
   * @param {number | any} originPrice - 商品的原始价格。可以是数字类型，也可能接受其他类型输入，但对于非数字等无效输入有相应处理方式。当输入为 `NaN`、非数字类型（如字符串）时，会按照特定规则返回结果（如 `NaN` 价格返回 0，非数字价格返回 0）。
   * 
   * @param {number | object | any} userRate - 税率相关参数。可以是单纯的税率数字，也可以是包含多个配置项的对象。如果传入对象，可包含 `taxRate`（税率）、`outputDecimalPlaces`（输出小数位数）、`rateType`（税率计算类型）等配置项。若传入非数字类型，对于价格计算会当做无效税率处理（此时按特定规则处理）。
   * 
   * @param {string} [rateType] - 税率计算类型（可选）。取值为 `'EXCL'`（不含税）、`'INCL'`（含税）、`'FREE'`（免税）之一。用于指定计算税额的方式，默认为全局配置中的 `rateType`，若全局未设置则使用默认类型 `'INCL'`。若同时存在方法级和全局的 `rateType` 配置，方法级配置优先。
   * 
   * @returns {number} - 返回计算得出的税额。如果输入无效或遭遇特殊场景（如 `FREE` 免税场景），将返回特定结果（如免税时返回 0）。
   * 
   * @example
   * // 含税计算示例
   * const taxAmount1 = CalcInst.computeRate(100, { taxRate: 0.1, outputDecimalPlaces: 2 });
   * expect(taxAmount1).toBe(9.09);
   * 
   * @example
   * // 不含税计算示例
   * const taxAmount2 = CalcInst.computeRate(200, 0.15, 'EXCL');
   * expect(taxAmount2).toBe(30);
   * 
   * @example
   * // 免税场景示例
   * const taxAmount3 = CalcInst.computeRate(150, 0.2, 'FREE');
   * expect(taxAmount3).toBe(0);
   * 
   * @description
   *  - 计算逻辑：
   *    - 根据 `rateType` 的值确定计算方式。`'EXCL'` 类型下，税额 = 原始价格 * 税率；`'INCL'` 类型下，税额 = 原始价格 / (1 + 税率) * 税率。`'FREE'` 类型下，无论价格和税率是多少，税额直接返回 0 且此类型优先级最高，会强制覆盖非零税率配置。
   *  - 精度配置：
   *    - 支持两种精度控制方式。当 `keepResultPrecision` 为 `true` 时，保留原始计算精度；当 `keepResultPrecision` 为 `false` 时，结果会根据 `outputDecimalPlaces` 的值进行四舍五入。若方法级设置了 `outputDecimalPlaces`，则会覆盖全局配置的 `outputDecimalPlaces`。
   *  - 边界值处理：
   *    - 处理 0 价格情况，无论税率如何，税额返回 0。
   *    - 处理负数价格，按正常计算逻辑得出负数税额（但在 `FREE` 类型下负数价格返回 0）。
   *    - 能处理超大数值的税率计算，并按要求的精度配置（如 `outputDecimalPlaces`）输出结果。
   *  - 异常输入处理：
   *    - 对于价格输入为 `NaN` 或非数字类型，以及税率输入为非数字类型的情况，都会按照特定规则进行处理并返回相应结果。
   *  - 缓存机制：
   *    - 根据输入的 `originPrice`、`userRate` 和 `rateType` 参数生成唯一的缓存键。相同输入情况下，会命中缓存，直接返回缓存中的结果，避免重复计算，提高性能。不同参数组合会生成不同的缓存键，确保不同计算情况的结果独立性。
   * 
   * @see [全局配置相关参数] - 方法会参考全局配置的 `taxRate`、`outputDecimalPlaces`、`rateType`、`keepResultPrecision` 等参数，当方法级未提供某些配置时，会使用全局配置值进行计算，同时方法级配置优先于全局配置。
   */
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

// 导出单例实例
export const CalcInst = Calculator.getInstance()

export default Calculator