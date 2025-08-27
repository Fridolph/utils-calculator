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
import Decimal from 'decimal.js'
import { isNumber, isObject } from './utils/type'

/**
 * 默认基础配置项：小数点，税率，税种等
 */
const defaultBaseOptions: BaseOptions = {
  precision: 2, // 默认计算保留2位小数 - 根据业务需求自行调整
  runtimePrecision: 10, // 不可修改, 计算时以10位小数来计算保留10位精度
  taxRate: 0.1, // 折扣率 - 理解为 打九折
  rateType: 'incl_gst', // 重构前 为 RateType 这里命名更通用，一般用到了都是要计算税的，默认值取 incl_gst
}

const defaultDecimalConfig: Decimal.Config = {
  precision: 10, // 暂时使用10位精度，可根据需求灵活调整
  rounding: 4, // 使用标准四舍五入 5进位 4舍去
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
  public baseOptions: BaseOptions
  // 性能考虑：将每次的计算结果进行缓存，若有同类型的计算，可直接返回缓存结果
  public calcCache: CacheStore

  private constructor() {
    this.calcCache = {
      sum: new Map(),
      subtractMultiple: new Map(),
      // calcUnitPrice: new Map(),
      // calcLinePrice: new Map(),
      // percentToDecimal: new Map(),
      // decimalToPercent: new Map(),
      // calculateDiscountedPrice: new Map(),
      // computeRate: new Map(),
    }
    this.baseOptions = defaultBaseOptions
  }

  /**
   * 动态设置计算器核心配置项
   * @description 用于调整运行时计算参数，支持链式调用
   *
   * @example 设置精度
   * ```ts
   * CalcInst.setOption('precision', 3) // 设置计算精度为3位小数
   * CalcInst.setOption('precision', 0) // 禁用小数计算
   * ```
   *
   * @example 设置税率
   * ```ts
   * CalcInst.setOption('taxRate', 0.15) // 设置15%税率
   * CalcInst.setOption('taxRate', 0) // 免税场景
   * ```
   *
   * @example 设置计税模式
   * ```ts
   * CalcInst.setOption('rateType', 'gst_free') // 税种无关计算
   * CalcInst.setOption('rateType', 'excl_gst') // 含税计算模式
   * ```
   *
   * @param option - 配置项名称，可选值：
   * - 'precision'：调整计算精度（0-8位小数）
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
   *   .setOption('precision', 3)
   *   .setOption('taxRate', 0.1)
   * ```
   */
  public setOption(
    option: keyof Omit<BaseOptions, 'runtimePrecision'>,
    value: unknown
  ): void {
    switch (option) {
      case 'precision':
        if (isNumber(value) && value >= 0 && value <= 8) {
          this.baseOptions.precision = value
        } else {
          throw new Error('Precision must be a number between 0 and 8')
        }
        break
      case 'taxRate':
        if (isNumber(value) && value >= 0 && value <= 1) {
          this.baseOptions.taxRate = value
        } else {
          throw new Error('Tax rate must be a number between 0 and 1')
        }
        break
      case 'rateType':
        if (['gst_free', 'incl_gst', 'excl_gst'].includes(value as string)) {
          this.baseOptions.rateType = value as RateType
        } else {
          throw new Error('Invalid RateType')
        }
        break
      default:
        throw new Error(`Invalid option: ${option}`)
    }
  }

  public getOptions(): BaseOptions {
    return this.baseOptions
  }

  public _getMergedOptions(userOptions?: Partial<BaseOptions>) {
    const curOptions = this.getOptions()
    if (isObject(userOptions)) {
      return {
        ...Object.assign({}, curOptions, userOptions),
        runtimePrecision: curOptions.runtimePrecision, // 确保 runtimePrecision 不被覆盖
      }  
    }
    else {
      return {
        precision: curOptions.precision,
        taxRate: curOptions.taxRate,
        rateType: curOptions.rateType,
        runtimePrecision: curOptions.runtimePrecision,
      }
    }
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
    // if (cacheType === 'all' || cacheType === 'calcUnitPrice') {
    //   this.calcCache.calcUnitPrice.clear()
    // }
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
   * 价格加总计算方法
   * @remarks
   * 支持数组和对象类型的数值聚合，提供高精度计算和缓存优化机制，适用于金融、电商等场景的金额汇总需求
   *
   * @param data - 待求和的数据源，支持以下格式：
   * - 数值数组：`[1, 2, 3]`
   * - 键值对象：`{ a: 1, b: 2, c: 3 }`
   * - 混合类型数组（会自动过滤非法值）：`[1, '2' as any, true, 3]`
   *
   * @param userOptions - 可选参数，用于配置计算行为：
   * - 最终结果保留的小数位数（0-8）
   * - 运行时计算精度（不可修改，预设为8）
   *
   * @returns 计算后的总和：
   * - 数组元素为null/NaN时自动忽略
   * - 对象值为null/NaN时自动忽略
   * - 所有元素非法时返回0
   * - 默认保留2位小数（可通过setOption修改全局配置）
   *
   * @example
   * ```ts
   * // 基础用法
   * CalcInst.sum([1, 2, 3]) // 6
   * CalcInst.sum([10, -5, 3.5]) // 8.5
   *
   * // 对象求和
   * CalcInst.sum({ a: 1, b: 2, c: 3 }) // 6
   * CalcInst.sum({ x: 10, y: null as any, z: 5 }) // 15
   *
   * // 精度控制
   * CalcInst.sum([1.1111, 2.2222, 3.3333], { precision: 3 }) // 6.667
   * CalcInst.sum([1.11555, 2.22255]) // 3.338（保留3位小数时四舍五入）
   *
   * // 边界值处理
   * CalcInst.sum([null, undefined, 5, 'abc' as any]) // 5
   * CalcInst.sum([0.0005, 0.0005]) // 0.001
   * ```
   *
   * @performance
   * 时间复杂度：O(n) 其中n为有效数值个数
   * 内部采用currency.js进行高精度计算，缓存机制避免重复计算
   *
   * @errorHandling
   * 自动处理以下异常情况：
   * - 空数组输入：返回0
   * - 数组元素全为null/NaN：返回0
   * - 对象值全为null/NaN：返回0
   * - 非数字类型自动过滤：'123'、true、null等非法值
   *
   * @caching
   * 缓存键生成策略：
   * - 基于数据内容和mergedOptions生成唯一键
   * - 相同输入保证缓存命中
   * - 缓存清理：`CalcInst.clearCache('sum')`
   *
   * @precision
   * 精度处理规则：
   * 1. 先应用方法级precision配置
   * 2. 无方法级配置时使用全局precision
   * 3. 运行时计算始终使用8位精度（runtimePrecision）
   * 4. 结果输出时根据precision配置四舍五入
   *
   * @see {@link CacheStore} - 缓存存储结构定义
   * @see {@link BaseOptions} - 配置项类型定义
   *
   * @testCases
   * ```ts
   * // 数值数组计算
   * expect(CalcInst.sum([1, 2, 3])).toBe(6)
   *
   * // 包含负数的数组
   * expect(CalcInst.sum([10, -5, 3.5])).toBe(8.5)
   *
   * // 对象求和（含null值）
   * expect(CalcInst.sum({ x: 10, y: null as any, z: 5 })).toBe(15)
   *
   * // 非数字值过滤
   * expect(CalcInst.sum([1, '2' as any, true, 3])).toBe(4)
   *
   * // 精度配置测试
   * expect(CalcInst.sum([1.1111, 2.2222, 3.3333], { precision: 3 })).toBe(6.667)
   *
   * // 缓存验证
   * const cacheSize = CalcInst.getCache().sum.size
   * CalcInst.sum([1,2,3,4,5])
   * expect(CalcInst.getCache().sum.size).toBe(cacheSize + 1)
   * ```
   */
  public sum(
    data: number[] | { [key: string]: number },
    userOptions?: Partial<BaseOptions>
  ): number {
    const mergedOptions = this._getMergedOptions(userOptions)
      // ✅ 修复点1：运行时使用高精度，不设置 precision
    const DecimalClone = Decimal.clone({
      ...defaultDecimalConfig,
      rounding: Decimal.ROUND_HALF_UP,
    })

    const cacheKey = this.generateCacheKey({ data, mergedOptions })
    if (this.calcCache.sum.has(cacheKey)) {
      return this.calcCache.sum.get(cacheKey) as number
    }

    let total = 0
    let numbersToSum: number[] = []

    if (Array.isArray(data)) {
      numbersToSum = data.filter((num) => isNumber(num) && !Number.isNaN(num))
    }
    else if (isObject(data)) {
      // 处理为安全的数字类型（至少 要保证传入的都是数字类型 -> 下面这种处理好再传进来呀
      // 为避免认知混淆，一律不为数字的，如 '123', '$4.00' 都过滤掉）
      numbersToSum = Object.values(data).filter(
        (value: unknown): value is number => isNumber(value) && !Number.isNaN(value)
      )
    }

    let totalDecimal
    if (numbersToSum.length > 0) {
    // 使用独立实例进行高精度计算
      totalDecimal = new DecimalClone(0)
      for (const num of numbersToSum) {
        totalDecimal = totalDecimal.add(new DecimalClone(num))
      }
    }
    // 使用 toDecimalPlaces(mergedOptions.precision) 控制小数位数
    total = totalDecimal?.toDecimalPlaces(mergedOptions.precision).toNumber() as number
    this.calcCache.sum.set(cacheKey, total)
    return total
  }

  /**
   * 从初始值中减去多个值
   * @remarks
   * 支持链式减法运算和缓存优化，适用于金融场景的金额计算
   *
   * @param initialValue - 初始值（被减数），支持以下处理：
   * - null/NaN：自动转为0继续计算
   * - 非数字类型：强制转为0（如字符串'abc'、布尔值等）
   *
   * @param subtractValues - 减数列表，支持以下格式：
   * - 单个数字：`8.88`（自动转为数组）
   * - 数值数组：`[1, 2, 3]`
   * - 混合类型数组（过滤非法值）：`[5, '10', true]`
   *
   * @param userOptions - 可选参数，用于配置计算行为：
   * - 最终结果保留的小数位数（0-8）
   * - 运行时计算精度（预设为8位）
   *
   * @returns 减法运算结果：
   * - 初始值非法时返回0（如'abc'、NaN等）
   * - 减数列表为空时返回初始值
   * - 非数字减数自动过滤
   * - 默认保留2位小数（可通过setOption修改全局配置）
   *
   * @example
   * ```ts
   * // 基础用法
   * CalcInst.subtractMultiple(9.99, [8.88]) // 1.11
   * CalcInst.subtractMultiple(15, [1,2,3,4]) // 5
   *
   * // 处理非数字减数
   * CalcInst.subtractMultiple(20, [5, '10', true]) // 15（过滤非法值）
   * CalcInst.subtractMultiple(30, [10, null]) // 20
   *
   * // 精度控制
   * CalcInst.setOption('precision', 3)
   * CalcInst.subtractMultiple(10, [3.333]) // 6.667
   * CalcInst.subtractMultiple(5, [1.111, 1.111]) // 2.778
   *
   * // 边界值处理
   * CalcInst.subtractMultiple(null, [5]) // -5（初始值非法转为0-5）
   * CalcInst.subtractMultiple(0, [0.0005]) // -0.001（保留3位小数时四舍五入）
   * ```
   *
   * @performance
   * 时间复杂度：O(n) 其中n为有效减数个数
   * 内部采用currency.js进行高精度计算，缓存机制避免重复计算
   *
   * @errorHandling
   * 自动处理以下异常情况：
   * - 初始值为null/NaN：转为0继续计算
   * - 减数列表包含非法值：自动过滤
   * - 空数组作为减数：返回初始值
   * - 非数字减数处理：转为0（如字符串'abc'）
   *
   * @caching
   * 缓存键生成策略：
   * - 基于initialValue和subtractValues生成唯一键
   * - 相同输入保证缓存命中
   * - 缓存清理：`CalcInst.clearCache('subtractMultiple')`
   *
   * @precision
   * 精度处理规则：
   * 1. 先应用方法级precision配置
   * 2. 无方法级配置时使用全局precision
   * 3. 运行时计算始终使用8位精度（runtimePrecision）
   * 4. 结果输出时根据precision配置四舍五入
   *
   * @see {@link CacheStore} - 缓存存储结构定义
   * @see {@link BaseOptions} - 配置项类型定义
   *
   * @testCases
   * ```ts
   * // 基本减法
   * expect(CalcInst.subtractMultiple(9.99, [8.88])).toBe(1.11)
   *
   * // 空减数数组
   * expect(CalcInst.subtractMultiple(50, [])).toBe(50)
   *
   * // 非数字值过滤
   * expect(CalcInst.subtractMultiple(20, [5, '10', true])).toBe(15)
   *
   * // 零值处理
   * expect(CalcInst.subtractMultiple(0, [5])).toBe(-5)
   *
   * // 缓存验证
   * const cacheSize = CalcInst.getCache().subtractMultiple.size
   * CalcInst.subtractMultiple(100, [10, 20, 30])
   * expect(CalcInst.getCache().subtractMultiple.size).toBe(cacheSize + 1)
   * ```
   */
  public subtractMultiple(
    initialValue: number,
    subtractValues: number[] | number,
    userOptions?: Partial<BaseOptions>
  ): number {
    const mergedOptions = this._getMergedOptions(userOptions)
    // 创建独立配置的 Decimal 实例
    const DecimalClone = Decimal.clone({
      ...defaultDecimalConfig,
      rounding: Decimal.ROUND_HALF_UP,
    })

    const cacheKey = this.generateCacheKey({
      initialValue,
      subtractValues,
      mergedOptions
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

    // 应用最终精度（保留 mergedOptions.precision 位小数）
    const total = totalDecimal.toDecimalPlaces(mergedOptions.precision).toNumber()
    this.calcCache.subtractMultiple.set(cacheKey, total)

    return total
  }

  /**
   * 基础公式: 单价 = 总价 / 数量
   * @remarks
   * 支持多种边界场景处理和高精度计算，适用于电商、金融等场景的单价计算需求
   *
   * @param calcBaseTotalParams - 计算参数对象，必须包含以下字段：
   * - quantity: 数量（可为null）
   * - linePrice: 总价（可为null）
   * - 注意：unitPrice字段会被忽略
   *
   * @param userOptions - 可选参数，用于配置计算行为：
   * - 最终结果保留的小数位数（0-8）
   * - 运行时计算精度（固定为8）
   *
   * @returns 包含完整计算结果的对象：
   * - quantity: 原样返回输入值
   * - unitPrice: 计算结果（可能为null）
   * - linePrice: 原样返回输入值
   *
   * @example
   * ```ts
   * // 基础用法
   * CalcInst.calcUnitPrice({ quantity: 4, linePrice: 20 }) // { quantity:4, unitPrice:5, linePrice:20 }
   *
   * // 浮点数计算
   * CalcInst.calcUnitPrice({ quantity: 3, linePrice: 9.99 }) // { quantity:3, unitPrice:3.33, linePrice:9.99 }
   *
   * // 自定义精度
   * CalcInst.setOption('precision', 3)
   * CalcInst.calcUnitPrice({ quantity: 3, linePrice: 10 }) // { quantity:3, unitPrice:3.333, linePrice:10 }
   *
   * // 边界处理
   * CalcInst.calcUnitPrice({ quantity: null, linePrice: 50 }) // { quantity:null, unitPrice:50, linePrice:50 }
   * CalcInst.calcUnitPrice({ quantity: 0, linePrice: 100 }) // { quantity:0, unitPrice:100, linePrice:100 }
   * ```
   *
   * @performance
   * 时间复杂度：O(1) 常量时间复杂度（无循环）
   * 内部采用currency.js进行高精度计算，缓存机制避免重复计算
   *
   * @errorHandling
   * 自动处理以下异常情况：
   * - quantity和linePrice同时为null：返回全null对象
   * - quantity为0时：强制unitPrice等于linePrice
   * - quantity为null时：unitPrice等于linePrice
   * - 非数字值传入：通过类型校验确保不会出现
   *
   * @caching
   * 缓存键生成策略：
   * - 基于calcBaseTotalParams和userOptions生成唯一键
   * - 相同输入保证缓存命中
   * - 缓存清理：`CalcInst.clearCache('calcUnitPrice')`
   *
   * @precision
   * 精度处理规则：
   * 1. 先应用方法级precision配置
   * 2. 无方法级配置时使用全局precision
   * 3. 运行时计算始终使用8位精度（runtimePrecision）
   * 4. 结果输出时根据precision配置四舍五入
   *
   * @see {@link CacheStore} - 缓存存储结构定义
   * @see {@link BaseOptions} - 配置项类型定义
   * @see {@link CalcBaseTotalParams} - 参数类型定义
   *
   * @testCases
   * ```ts
   * // 正常计算
   * expect(CalcInst.calcUnitPrice({ quantity: 4, linePrice: 20 })).toEqual({
   *   quantity: 4, unitPrice: 5, linePrice: 20
   * })
   *
   * // quantity为null的场景
   * expect(CalcInst.calcUnitPrice({ quantity: null, linePrice: 50 })).toEqual({
   *   quantity: null, unitPrice: 50, linePrice: 50
   * })
   *
   * // quantity为0的场景
   * expect(CalcInst.calcUnitPrice({ quantity: 0, linePrice: 100 })).toEqual({
   *   quantity: 0, unitPrice: 100, linePrice: 100
   * })
   *
   * // 高精度场景
   * expect(CalcInst.calcUnitPrice({ quantity: 3, linePrice: 10.0005 }, { precision: 3 })).toEqual({
   *   quantity: 3, unitPrice: 3.334, linePrice: 10.001
   * })
   *
   * // 缓存验证
   * const cacheSize = CalcInst.getCache().calcUnitPrice.size
   * CalcInst.calcUnitPrice({ quantity: 5, linePrice: 25 })
   * expect(CalcInst.getCache().calcUnitPrice.size).toBe(cacheSize + 1)
   * ```
   */
  // public calcUnitPrice(
  //   calcBaseTotalParams: Required<Omit<CalcBaseTotalParams, 'unitPrice'>>,
  //   userOptions?: BaseOptions
  // ): CalcBaseTotalParams {
  //   const { quantity, linePrice }: any = calcBaseTotalParams
  //   let finalUnitPrice: number = 0

  //   // 边界1 如果总价和数量都为null，直接返回初始值
  //   if (quantity === null && linePrice === null) {
  //     return { quantity: null, unitPrice: null, linePrice: null }
  //   }

  //   // 边界2 若确实没有数量，但传有总价，产品希望单价总价一致
  //   if (quantity === null) {
  //     return { quantity, unitPrice: linePrice, linePrice }
  //   }

  //   // 边界3 总价未传入的情况
  //   if (isNumber(quantity) && linePrice === null) {
  //     return { quantity, unitPrice: null, linePrice: null }
  //   }

  //   // 边界4 处理分母为0的情况
  //   if (quantity === 0 && isNumber(linePrice) && linePrice >= 0) {
  //     return { quantity: 0, unitPrice: linePrice, linePrice }
  //   }

  //   const mergedOptions = this._getMergedOptions(userOptions)
  //   const cacheKey = this.generateCacheKey({ calcBaseTotalParams, userOptions })
  //   if (this.calcCache.calcUnitPrice.has(cacheKey)) {
  //     return this.calcCache.calcUnitPrice.get(cacheKey) as {
  //       quantity: number | null
  //       unitPrice: number | null
  //       linePrice: number | null
  //     }
  //   }

  //   // 通用计算逻辑 单价 = 总价 / 数量
  //   finalUnitPrice = $number(linePrice || 0, {
  //     precision: mergedOptions.runtimePrecision,
  //   }).divide(quantity).value as number

  //   const result = {
  //     quantity,
  //     unitPrice: $number(finalUnitPrice as number, {
  //       precision: mergedOptions.precision,
  //     }).value,
  //     linePrice: $number(linePrice as number, {
  //       precision: mergedOptions.precision,
  //     }).value,
  //   }
  //   this.calcCache.calcUnitPrice.set(cacheKey, result)
  //   return result
  // }

  /**
   * 基础公式: 总价 = 数量 * 单价
   * @remarks
   * 支持多种边界场景处理和高精度计算，适用于电商、金融等场景的总价计算需求
   *
   * @param calcBaseTotalParams - 计算参数对象，必须包含以下字段：
   * - quantity: 数量（可为null）
   * - unitPrice: 单价（可为null）
   * - 注意：linePrice字段会被忽略
   *
   * @param userOptions - 可选参数，用于配置计算行为：
   * - 最终结果保留的小数位数（0-8）
   * - 运行时计算精度（固定为8）
   *
   * @returns 包含完整计算结果的对象：
   * - quantity: 原样返回输入值
   * - unitPrice: 原样返回输入值
   * - linePrice: 计算结果（可能为null）
   *
   * @example
   * ```ts
   * // 基础用法
   * CalcInst.calcLinePrice({ quantity: 4, unitPrice: 5 }) // { quantity:4, unitPrice:5, linePrice:20 }
   *
   * // 浮点数计算
   * CalcInst.calcLinePrice({ quantity: 3, unitPrice: 3.33 }) // { quantity:3, unitPrice:3.33, linePrice:9.99 }
   *
   * // 自定义精度
   * CalcInst.setOption('precision', 3)
   * CalcInst.calcLinePrice({ quantity: 3, unitPrice: 3.333 }) // { quantity:3, unitPrice:3.333, linePrice:9.999 }
   *
   * // 边界处理
   * CalcInst.calcLinePrice({ quantity: null, unitPrice: 50 }) // { quantity:null, unitPrice:50, linePrice:50 }
   * CalcInst.calcLinePrice({ quantity: 5, unitPrice: null }) // { quantity:5, unitPrice:null, linePrice:null }
   * ```
   *
   * @performance
   * 时间复杂度：O(1) 常量时间复杂度（无循环）
   * 内部采用currency.js进行高精度计算，缓存机制避免重复计算
   *
   * @errorHandling
   * 自动处理以下异常情况：
   * - quantity和unitPrice同时为null：返回全null对象
   * - quantity为null时：强制linePrice等于unitPrice
   * - unitPrice为null时：返回null总价
   * - 非数字值传入：通过类型校验确保不会出现
   *
   * @caching
   * 缓存键生成策略：
   * - 基于calcBaseTotalParams和userOptions生成唯一键
   * - 相同输入保证缓存命中
   * - 缓存清理：`CalcInst.clearCache('calcLinePrice')`
   *
   * @precision
   * 精度处理规则：
   * 1. 先应用方法级precision配置
   * 2. 无方法级配置时使用全局precision
   * 3. 运行时计算始终使用8位精度（runtimePrecision）
   * 4. 结果输出时根据precision配置四舍五入
   *
   * @see {@link CacheStore} - 缓存存储结构定义
   * @see {@link BaseOptions} - 配置项类型定义
   * @see {@link CalcBaseTotalParams} - 参数类型定义
   *
   * @testCases
   * ```ts
   * // 正常计算
   * expect(CalcInst.calcLinePrice({ quantity: 4, unitPrice: 5 })).toEqual({
   *   quantity: 4, unitPrice: 5, linePrice: 20
   * })
   *
   * // quantity为null的场景
   * expect(CalcInst.calcLinePrice({ quantity: null, unitPrice: 50 })).toEqual({
   *   quantity: null, unitPrice: 50, linePrice: 50
   * })
   *
   * // unitPrice为null的场景
   * expect(CalcInst.calcLinePrice({ quantity: 5, unitPrice: null })).toEqual({
   *   quantity: 5, unitPrice: null, linePrice: null
   * })
   *
   * // 高精度场景
   * expect(CalcInst.calcLinePrice({ quantity: 3, unitPrice: 3.3333 }, { precision: 4 })).toEqual({
   *   quantity: 3, unitPrice: 3.3333, linePrice: 9.9999
   * })
   *
   * // 缓存验证
   * const cacheSize = CalcInst.getCache().calcLinePrice.size
   * CalcInst.calcLinePrice({ quantity: 5, unitPrice: 20 })
   * expect(CalcInst.getCache().calcLinePrice.size).toBe(cacheSize + 1)
   * ```
   */
  // public calcLinePrice(
  //   calcBaseTotalParams: Required<Omit<CalcBaseTotalParams, 'linePrice'>>,
  //   userOptions?: BaseOptions
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

  //   const mergedOptions = this._getMergedOptions(userOptions)
  //   const cacheKey = this.generateCacheKey({ calcBaseTotalParams, userOptions })
  //   if (this.calcCache.calcLinePrice.has(cacheKey)) {
  //     return this.calcCache.calcLinePrice.get(cacheKey) as CalcBaseTotalParams
  //   }

  //   // 通用计算逻辑
  //   finalLinePrice = $number(unitPrice as number, {
  //     precision: mergedOptions.runtimePrecision,
  //   }).multiply(quantity as number).value

  //   const result = {
  //     quantity,
  //     unitPrice: $number(unitPrice as number, {
  //       precision: mergedOptions.precision,
  //     }).value,
  //     linePrice: $number(finalLinePrice, {
  //       precision: mergedOptions.precision,
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
   * 3. 运行时计算始终使用8位精度（runtimePrecision）
   * 4. 最终小数位数 = decimalPlaces + 2（当未指定decimalPlaces时）
   *
   * @see {@link CacheStore} - 缓存存储结构定义
   * @see {@link BaseOptions} - 配置项类型定义
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
   * CalcInst.setOption('precision', 3)
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
  //   if (originPercentage === null || Number.isNaN(originPercentage)) return null

  //   const mergedOptions = this._getMergedOptions({
  //     precision: decimalPlaces ?? this.getOptions().precision,
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
  //     handledPrecision = mergedOptions.precision + 2
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
   * @see {@link BaseOptions} - 配置项类型定义
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
   * CalcInst.setOption('precision', 3)
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
  //     Number.isNaN(originDecimal)
  //   )
  //     return 0
  //   if (!isNumber(decimalPlaces) || Number.isNaN(decimalPlaces)) {
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
  //   } else if (Number.isNaN(decimalPlaces)) {
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

  //   const mergedOptions = this._getMergedOptions({
  //     precision: decimalPlaces,
  //   })
  //   // 先检查缓存，命中则返回缓存值，未命中再生成 key 并计算
  //   // 如果decimalPlaces为null，直接使用runtimePrecision作为精度
  //   const result = $number(originDecimal as number, {
  //     precision: mergedOptions.runtimePrecision,
  //   }).multiply(100).value
  //   this.calcCache.decimalToPercent.set(cacheKey, result)
  //   return $number(result, { precision: mergedOptions.precision }).value
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
   * @see {@link BaseOptions} - 配置项类型定义
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
   * CalcInst.setOption('precision', 3)
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
  //   userOptions?: BaseOptions
  // ): number | null {
  //   const cacheKey = this.generateCacheKey({ originalPrice, discountRate })

  //   // 边界1 输入价格或折扣为null，统一不处理
  //   if (
  //     originalPrice === null ||
  //     discountRate === null ||
  //     Number.isNaN(originalPrice) ||
  //     Number.isNaN(discountRate)
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

  //   const mergedOptions = this._getMergedOptions(userOptions)
  //   const ratePrice = $number(originalPrice, {
  //     precision: mergedOptions.runtimePrecision,
  //   }).multiply(discountRate).value
  //   const finalPrice = $number(originalPrice, {
  //     precision: mergedOptions.runtimePrecision,
  //   }).subtract(ratePrice).value
  //   this.calcCache.calculateDiscountedPrice.set(cacheKey, finalPrice)
  //   return $number(finalPrice, { precision: mergedOptions.precision }).value
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
   * @see {@link BaseOptions} - 配置项类型定义
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
  //   userOptions?: BaseOptions
  // ): number {
  //   let finalRatePrice: number = 0
  //   // 边界处理：originPrice 为 null/0 返回 0
  //   if (originPrice === null || originPrice === 0 || !isNumber(originPrice) || Number.isNaN(originPrice)) {
  //     return 0
  //   }
  //   // 不处理 originPrice 为负的情况，价格应该为正
  //   if (isNumber(originPrice) && originPrice < 0) {
  //     console.error('应确保传入参数 originPrice 为一个正数')
  //     return originPrice
  //   }

  //   const curOptions = this._getMergedOptions(userOptions)
  //   /**
  //    * @remarks
  //    * 修改逻辑：不处理 userRate 如果未提供则使用全局配置 
  //    * [fix(issue-6)](https://github.com/Fridolph/utils-calculator/issues/6) 如果无效直接返回 originPrice
  //    */
  //   let curRate: number
  //   if (userRate === undefined) {
  //     curRate = curOptions.taxRate
  //   } else if (userRate === null || Number.isNaN(userRate) || typeof userRate !== 'number') {
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
