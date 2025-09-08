[**utils-calculator v2.0.0-beta.0**](../README.md)

***

[utils-calculator](../README.md) / Calculator

# Class: Calculator

## Properties

### calcCache

> **calcCache**: `CacheStore`

***

### calcConfigs

> **calcConfigs**: `Config`

***

### userOptions

> **userOptions**: `UserOptions`

## Methods

### \_getCalcConfigs()

> **\_getCalcConfigs**(): `Config`

#### Returns

`Config`

***

### \_getUserOptions()

> **\_getUserOptions**(): `UserOptions`

#### Returns

`UserOptions`

***

### calcLinePrice()

> **calcLinePrice**(`calcBaseTotalParams`, `userOptions?`): `CalcBaseTotalParams`

#### Parameters

##### calcBaseTotalParams

`Required`\<`Omit`\<`CalcBaseTotalParams`, `"linePrice"`\>\>

##### userOptions?

`Partial`\<`UserOptions`\>

#### Returns

`CalcBaseTotalParams`

***

### calculateDiscountedPrice()

> **calculateDiscountedPrice**(`originalPrice`, `discountRate`, `userOptions?`): `number`

#### Parameters

##### originalPrice

`number`

##### discountRate

`number`

##### userOptions?

`Partial`\<`UserOptions`\>

#### Returns

`number`

***

### calcUnitPrice()

> **calcUnitPrice**(`calcBaseTotalParams`, `userOptions?`): `CalcBaseTotalParams`

#### Parameters

##### calcBaseTotalParams

`Required`\<`Omit`\<`CalcBaseTotalParams`, `"unitPrice"`\>\>

##### userOptions?

`Partial`\<`UserOptions`\>

#### Returns

`CalcBaseTotalParams`

***

### clearCache()

> **clearCache**(`cacheType`): `void`

增加一个可手动清除缓存的静态方法

#### Parameters

##### cacheType

`CacheType` = `'all'`

#### Returns

`void`

***

### computeRate()

#### Call Signature

> **computeRate**(`originPrice`): `number`

##### Parameters

###### originPrice

`number`

##### Returns

`number`

#### Call Signature

> **computeRate**(`originPrice`, `userRate`): `number`

##### Parameters

###### originPrice

`number`

###### userRate

`number`

##### Returns

`number`

#### Call Signature

> **computeRate**(`originPrice`, `userOptions`): `number`

##### Parameters

###### originPrice

`number`

###### userOptions

`Partial`\<`UserOptions`\>

##### Returns

`number`

#### Call Signature

> **computeRate**(`originPrice`, `userRate`, `userRateType`): `number`

##### Parameters

###### originPrice

`number`

###### userRate

`number`

###### userRateType

`RateType`

##### Returns

`number`

***

### decimalToPercent()

> **decimalToPercent**(`originNumber`, `userOptions?`): `number`

#### Parameters

##### originNumber

`number`

##### userOptions?

`number` | `Partial`\<`UserOptions`\>

#### Returns

`number`

***

### generateCacheKey()

> **generateCacheKey**(`data`): `string`

性能考量：生成数据的哈希值作为缓存键

#### Parameters

##### data

`unknown`

#### Returns

`string`

#### Description

[issue_1](https://github.com/Fridolph/utils-calculator/issues/1) 为了确保对象属性顺序不影响缓存键的一致性，我们需要对对象进行标准化处理，例如按键名排序后再序列化。

***

### getCache()

#### Call Signature

> **getCache**(): `CacheStore`

##### Returns

`CacheStore`

#### Call Signature

> **getCache**(`cacheType`): `Map`\<`string`, `unknown`\>

##### Parameters

###### cacheType

keyof `CacheStore`

##### Returns

`Map`\<`string`, `unknown`\>

***

### getThisDataMaxPrecision()

> **getThisDataMaxPrecision**(`dataStructure`): `number`

处理保留参数最大精度逻辑

#### Parameters

##### dataStructure

`unknown`

输入的数据结构，可以是数组、对象、数字或其他未知类型

#### Returns

`number`

- 返回数据结构中数字的最大小数位数，如果没有小数则返回默认值

***

### percentToDecimal()

> **percentToDecimal**(`originPercentage`, `userOptions?`): `number`

#### Parameters

##### originPercentage

`number`

##### userOptions?

`number` | `Partial`\<`UserOptions`\>

#### Returns

`number`

***

### queryCacheStat()

> **queryCacheStat**(`cacheType`): `object`

查询缓存统计信息

#### Parameters

##### cacheType

`CacheType` = `'all'`

可选参数，指定要查询的缓存类型。默认值为 'all' 查询所有类型
                 有效值：'all'|'sum'|'subtractMultiple'|'calcUnitPrice'|'calcLinePrice'|
                         'percentToDecimal'|'decimalToPercent'|'calculateDiscountedPrice'|'computeRate'

#### Returns

`object`

返回包含缓存统计信息的对象，结构为：
         {
           all: number, // 所有缓存的总条目数
           [cacheType]: number, // 每个指定类型的缓存条目数
         }
         示例返回结构：
         {
           all: 2,
           sum: 1,
           percentToDecimal: 1,
           // 其他缓存类型字段...
         }

##### all

> **all**: `number`

##### calcLinePrice

> **calcLinePrice**: `number`

##### calculateDiscountedPrice

> **calculateDiscountedPrice**: `number`

##### calcUnitPrice

> **calcUnitPrice**: `number`

##### computeRate

> **computeRate**: `number`

##### decimalToPercent

> **decimalToPercent**: `number`

##### percentToDecimal

> **percentToDecimal**: `number`

##### subtractMultiple

> **subtractMultiple**: `number`

##### sum

> **sum**: `number`

#### Remarks

支持按缓存类型查询或返回所有缓存的统计信息，适用于性能监控和调试场景

#### Example

```ts
// 查询所有缓存统计
CalcInst.queryCacheStat()
// 返回: { all: 2, sum: 1, percentToDecimal: 1, ... }

// 查询指定缓存类型
CalcInst.queryCacheStat('sum')
// 返回: { all: 1, sum: 1 }
```

#### Performance

时间复杂度：O(n) 其中n为查询的缓存类型数量
内部遍历指定的缓存类型列表进行统计

#### Error Handling

对无效的cacheType参数会自动忽略，不会抛出错误
例如传入'invalidType'时，结果中只会包含有效类型统计

#### See

 - CacheType - 缓存类型枚举定义
 - CacheStore - 缓存存储结构定义

***

### resetInstance()

> **resetInstance**(): `void`

#### Returns

`void`

***

### setUserOption()

> **setUserOption**\<`K`\>(`option`, `value`): `void`

#### Type Parameters

##### K

`K` *extends* keyof `UserOptions`

#### Parameters

##### option

`K`

##### value

`UserOptions`\[`K`\]

#### Returns

`void`

***

### subtractMultiple()

> **subtractMultiple**(`initialValue`, `subtractValues`, `userOptions?`): `number`

#### Parameters

##### initialValue

`number`

##### subtractValues

`number` | `number`[]

##### userOptions?

`Partial`\<`UserOptions`\>

#### Returns

`number`

***

### sum()

> **sum**(`data`, `userOptions?`): `number`

#### Parameters

##### data

`number` | `number`[] | \{\[`key`: `string`\]: `number`; \}

##### userOptions?

`Partial`\<`UserOptions`\>

#### Returns

`number`

***

### getInstance()

> `static` **getInstance**(): `Calculator`

获取Calculator单例实例

#### Returns

`Calculator`

单例实例，首次调用时创建新实例，后续调用返回已有实例

#### Remarks

采用单例模式确保全局唯一性，适用于需要共享计算状态和缓存的场景

#### Examples

```ts
// 获取单例实例
const calc1 = Calculator.getInstance();
const calc2 = Calculator.getInstance();
expect(calc1).toBe(calc2); // 严格相等验证
```

```ts
// 单例模式与静态实例的等价性
expect(CalcInst).toBe(Calculator.getInstance());
```

#### Performance

通过单例模式避免重复初始化，降低内存占用
单次初始化耗时：0.1ms（基准测试数据）
多次调用仅返回已有实例
