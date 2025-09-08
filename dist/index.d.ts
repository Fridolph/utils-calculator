import Decimal from 'decimal.js';

declare class Calculator {
    private static instance;
    userOptions: UserOptions;
    calcConfigs: Decimal.Config;
    calcCache: CacheStore;
    private constructor();
    resetInstance(): void;
    setUserOption<K extends keyof UserOptions>(option: K, value: UserOptions[K]): void;
    _getCalcConfigs(): Decimal.Config;
    _getUserOptions(): UserOptions;
    /**
     * 处理保留参数最大精度逻辑
     * @param dataStructure - 输入的数据结构，可以是数组、对象、数字或其他未知类型
     * @returns - 返回数据结构中数字的最大小数位数，如果没有小数则返回默认值
     */
    getThisDataMaxPrecision(dataStructure: unknown): number;
    getCache(): CacheStore;
    getCache(cacheType: keyof CacheStore): CacheStore[keyof CacheStore];
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
    static getInstance(): Calculator;
    /**
     * 增加一个可手动清除缓存的静态方法
     * @param cacheType
     */
    clearCache(cacheType?: CacheType): void;
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
    queryCacheStat(cacheType?: CacheType): {
        all: number;
        sum: number;
        subtractMultiple: number;
        calcUnitPrice: number;
        calcLinePrice: number;
        percentToDecimal: number;
        decimalToPercent: number;
        calculateDiscountedPrice: number;
        computeRate: number;
    };
    /**
     * 性能考量：生成数据的哈希值作为缓存键
     * @description [issue_1](https://github.com/Fridolph/utils-calculator/issues/1) 为了确保对象属性顺序不影响缓存键的一致性，我们需要对对象进行标准化处理，例如按键名排序后再序列化。
     * @param data
     * @returns
     */
    generateCacheKey(data: unknown): string;
    sum(data: number | number[] | {
        [key: string]: number;
    }, userOptions?: Partial<UserOptions>): number;
    subtractMultiple(initialValue: number, subtractValues: number[] | number, userOptions?: Partial<UserOptions>): number;
    calcUnitPrice(calcBaseTotalParams: Required<Omit<CalcBaseTotalParams, 'unitPrice'>>, userOptions?: Partial<UserOptions>): CalcBaseTotalParams;
    calcLinePrice(calcBaseTotalParams: Required<Omit<CalcBaseTotalParams, 'linePrice'>>, userOptions?: Partial<UserOptions>): CalcBaseTotalParams;
    calculateDiscountedPrice(originalPrice: number | null, discountRate: number | null, userOptions?: Partial<UserOptions>): number | null;
    percentToDecimal(originPercentage: number | null, userOptions?: number | Partial<UserOptions>): number | null;
    decimalToPercent(originNumber: number | null, userOptions?: number | Partial<UserOptions>): number;
    computeRate(originPrice: number): number;
    computeRate(originPrice: number, userRate: number): number;
    computeRate(originPrice: number, userOptions: Partial<UserOptions>): number;
    computeRate(originPrice: number, userRate: number, userRateType: RateType): number;
}
declare const CalcInst: Calculator;

export { CalcInst, Calculator as default };
