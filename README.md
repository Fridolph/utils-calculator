# utils-calculator 🧮
[![Tests](https://img.shields.io/badge/tests-100%25-green)](https://github.com/Fridolph/utils-calculator)
[![npm version](https://img.shields.io/npm/v/utils-calculator)](https://www.npmjs.com/package/utils-calculator)
[![License](https://img.shields.io/npm/l/utils-calculator)](https://github.com/Fridolph/utils-calculator/blob/main/LICENSE)
[![Coverage](https://img.shields.io/badge/coverage-100%25-green)](https://github.com/Fridolph/utils-calculator)
[![Downloads](https://img.shields.io/npm/dm/utils-calculator)](https://www.npmjs.com/package/utils-calculator)

基于TypeScript的高性能计算工具库，提供多种计算方法和缓存优化机制，适用于金融、电商等需要高精度计算的场景。

## 🌟 特性
- **单例模式**：避免重复实例化开销
- **缓存机制**：自动缓存计算结果，提升重复计算性能
- **精度控制**：支持运行时动态调整计算精度（最高8位）
- **类型安全**：完整的TypeScript类型定义
- **多计算场景**：支持加减、百分比转换、税率计算等常用场景

## 📦 安装
```bash
npm install utils-calculator
```

## 🔥 快速使用

```ts
import { CalcInst } from 'utils-calculator'

// 基础计算
CalcInst.sum([1.1, 2.2, 3.3]) // 6.6

// 设置全局精度
CalcInst.setOption('precision', 3)
CalcInst.subtractMultiple(10, [3.333]) // 6.667

// 百分比计算
CalcInst.percentToDecimal(50) // 0.5
CalcInst.decimalToPercent(0.25) // 25

// 折扣计算
CalcInst.calculateDiscountedPrice(100, 0.2) // 80
```

## 📚 核心功能

### 🧮 核心计算类 Calculator

提供多种高精度计算方法，支持自动缓存和动态配置

单例模式

```ts
const calc = Calculator.getInstance()
```

#### 📈 主要方法

1. calcLinePrice() - 价格计算

公式：总价 = 数量 × 单价

```ts
CalcInst.calcLinePrice({ quantity: 3, unitPrice: 3.333 }) 
// { quantity:3, unitPrice:3.333, linePrice:9.999 }
```

2. calculateDiscountedPrice() - 折扣计算

```ts
CalcInst.calculateDiscountedPrice(150, 0) // 150
CalcInst.calculateDiscountedPrice(100, 1) // 0
```

3. computeRate() - 税率计算

```ts
CalcInst.computeRate(10, 0.1) // 0.91（含税计算）
CalcInst.computeRate(25, 0.1, 'excl_gst') // 2.5（不含税计算）
```

4. sum() - 高精度加法

```ts
CalcInst.computeRate(10, 0.1) // 0.91（含税计算）
CalcInst.computeRate(25, 0.1, 'excl_gst') // 2.5（不含税计算）
```

5. subtractMultiple() - 链式减法

```ts
CalcInst.subtractMultiple(10, [3.333], { precision: 3 }) // 6.667
```

6. decimalToPercent() - 百分比转换

```ts
CalcInst.decimalToPercent(0.5) // 50
CalcInst.decimalToPercent(0.333333, 3) // 33.333
```

7. percentToDecimal() - 百分比转小数

```ts
CalcInst.percentToDecimal(50.56) // 0.5056
CalcInst.percentToDecimal(50.56789, 4) // 0.5057
```

## 🧪 测试覆盖率

✅ 100% 测试覆盖率 | 💯 所有方法均通过以下验证：

- 边界值处理
- 精度控制
- 异常输入处理
- 缓存命中验证


## 📊 性能特性

|特性|指标|
|----|---|
|精度|最高支持8位小数|
|缓存|自动缓存提升性能|
|时间复杂度|	O(1) 常量时间复杂度|
|初始化耗时|	0.1ms (基准测试)|
|内存占用|	单例模式优化内存|


## 📑 API 文档

[**utils-calculator**](../README.md)

***

[utils-calculator](../globals.md) / Calculator

# Class: Calculator

核心计算类

## Remarks

提供多种计算方法和缓存优化机制，适用于金融、电商等需要高精度计算的场景

## Example

```ts
const calc = Calculator.getInstance()
calc.sum([1, 2, 3]) // 6
calc.decimalToPercent(0.66666666, 4) // 66.6667
```
当然也可以直接使用单例模式
```ts
CalcInst.sum([1,2,3,4]) // 10
CalcInst.percentToDecimal(55.66, 4) // 0.5566
```

## Properties

### baseOptions

> **baseOptions**: `BaseOptions`

***

### calcCache

> **calcCache**: `CacheStore`

## Methods

### \_getMergedOptions()

> **\_getMergedOptions**(`userOptions?`): `object`

#### Parameters

##### userOptions?

`Partial`\<`BaseOptions`\>

#### Returns

`object`

##### precision

> **precision**: `number`

##### rateType

> **rateType**: `RateType`

##### runtimePrecision

> **runtimePrecision**: `8` = `curOptions.runtimePrecision`

##### taxRate

> **taxRate**: `number`

***

### calcLinePrice()

> **calcLinePrice**(`calcBaseTotalParams`, `userOptions?`): `CalcBaseTotalParams`

基础公式: 总价 = 数量 * 单价

#### Parameters

##### calcBaseTotalParams

`Required`\<`Omit`\<`CalcBaseTotalParams`, `"linePrice"`\>\>

计算参数对象，必须包含以下字段：
- quantity: 数量（可为null）
- unitPrice: 单价（可为null）
- 注意：linePrice字段会被忽略

##### userOptions?

`BaseOptions`

可选参数，用于配置计算行为：
- 最终结果保留的小数位数（0-8）
- 运行时计算精度（固定为8）

#### Returns

`CalcBaseTotalParams`

包含完整计算结果的对象：
- quantity: 原样返回输入值
- unitPrice: 原样返回输入值
- linePrice: 计算结果（可能为null）

#### Remarks

支持多种边界场景处理和高精度计算，适用于电商、金融等场景的总价计算需求

#### Example

```ts
// 基础用法
CalcInst.calcLinePrice({ quantity: 4, unitPrice: 5 }) // { quantity:4, unitPrice:5, linePrice:20 }

// 浮点数计算
CalcInst.calcLinePrice({ quantity: 3, unitPrice: 3.33 }) // { quantity:3, unitPrice:3.33, linePrice:9.99 }

// 自定义精度
CalcInst.setOption('precision', 3)
CalcInst.calcLinePrice({ quantity: 3, unitPrice: 3.333 }) // { quantity:3, unitPrice:3.333, linePrice:9.999 }

// 边界处理
CalcInst.calcLinePrice({ quantity: null, unitPrice: 50 }) // { quantity:null, unitPrice:50, linePrice:50 }
CalcInst.calcLinePrice({ quantity: 5, unitPrice: null }) // { quantity:5, unitPrice:null, linePrice:null }
```

#### Performance

时间复杂度：O(1) 常量时间复杂度（无循环）
内部采用currency.js进行高精度计算，缓存机制避免重复计算

#### Error Handling

自动处理以下异常情况：
- quantity和unitPrice同时为null：返回全null对象
- quantity为null时：强制linePrice等于unitPrice
- unitPrice为null时：返回null总价
- 非数字值传入：通过类型校验确保不会出现

#### Caching

缓存键生成策略：
- 基于calcBaseTotalParams和userOptions生成唯一键
- 相同输入保证缓存命中
- 缓存清理：`CalcInst.clearCache('calcLinePrice')`

#### Precision

精度处理规则：
1. 先应用方法级precision配置
2. 无方法级配置时使用全局precision
3. 运行时计算始终使用8位精度（runtimePrecision）
4. 结果输出时根据precision配置四舍五入

#### See

 - CacheStore - 缓存存储结构定义
 - BaseOptions - 配置项类型定义
 - CalcBaseTotalParams - 参数类型定义

#### Test Cases

```ts
// 正常计算
expect(CalcInst.calcLinePrice({ quantity: 4, unitPrice: 5 })).toEqual({
  quantity: 4, unitPrice: 5, linePrice: 20
})

// quantity为null的场景
expect(CalcInst.calcLinePrice({ quantity: null, unitPrice: 50 })).toEqual({
  quantity: null, unitPrice: 50, linePrice: 50
})

// unitPrice为null的场景
expect(CalcInst.calcLinePrice({ quantity: 5, unitPrice: null })).toEqual({
  quantity: 5, unitPrice: null, linePrice: null
})

// 高精度场景
expect(CalcInst.calcLinePrice({ quantity: 3, unitPrice: 3.3333 }, { precision: 4 })).toEqual({
  quantity: 3, unitPrice: 3.3333, linePrice: 9.9999
})

// 缓存验证
const cacheSize = CalcInst.getCache().calcLinePrice.size
CalcInst.calcLinePrice({ quantity: 5, unitPrice: 20 })
expect(CalcInst.getCache().calcLinePrice.size).toBe(cacheSize + 1)
```

***

### calculateDiscountedPrice()

> **calculateDiscountedPrice**(`originalPrice`, `discountRate`, `userOptions?`): `null` \| `number`

计算折扣后的价格

#### Parameters

##### originalPrice

原始价格，支持以下处理：
- null/NaN：自动转为null继续计算
- 非数字类型：强制转为null
- 负数价格：直接返回原始价格
- 正常数值：如 100 元

`null` | `number`

##### discountRate

折扣率（0-1之间的小数），支持以下处理：
- null：自动转为null继续计算
- NaN：自动转为null
- 负值：强制转为0（不打折）
- 1：白送场景返回0
- 默认值：无默认值需显式传参

`null` | `number`

##### userOptions?

`BaseOptions`

可选参数，用于配置计算行为：
- 最终结果保留的小数位数（0-8）
- 运行时计算精度（固定为8）

#### Returns

`null` \| `number`

折扣后的价格（可能为null）：
- 成功计算返回number
- 非法输入返回null

#### Remarks

支持多种折扣场景和边界处理，适用于电商、金融等需要高精度折扣计算的场景

#### Example

```ts
// 基础用法
CalcInst.calculateDiscountedPrice(100, 0.2) // 80（100元打8折）
CalcInst.calculateDiscountedPrice(50, 0.5) // 25（50元5折）

// 特殊场景
CalcInst.calculateDiscountedPrice(150, 0) // 150（0折不打折）
CalcInst.calculateDiscountedPrice(-100, 0.2) // -100（负数原样返回）
CalcInst.calculateDiscountedPrice(100, 1) // 0（满折场景）
```

#### Performance

时间复杂度：O(1) 常量时间复杂度（无循环）
内部采用currency.js进行高精度计算，缓存机制避免重复计算

#### Error Handling

自动处理以下异常情况：
- originalPrice为null/NaN：返回null
- discountRate为null/NaN：返回null
- originalPrice为非数字类型：返回null
- discountRate为非数字类型：返回null
- discountRate为负数：返回originalPrice
- originalPrice为负数：返回originalPrice

#### Caching

缓存键生成策略：
- 基于originalPrice和discountRate生成唯一键
- 相同输入保证缓存命中
- 缓存清理：`CalcInst.clearCache('calculateDiscountedPrice')`

#### Precision

精度处理规则：
1. 先应用方法级precision配置
2. 无方法级配置时使用全局precision
3. 运行时计算始终使用8位精度（runtimePrecision）
4. 结果输出时根据precision配置四舍五入

#### See

 - CacheStore - 缓存存储结构定义
 - BaseOptions - 配置项类型定义

#### Test Cases

```ts
// 正常计算
expect(CalcInst.calculateDiscountedPrice(100, 0.2)).toBe(80)
expect(CalcInst.calculateDiscountedPrice(50, 0.5)).toBe(25)

// 边界处理
expect(CalcInst.calculateDiscountedPrice(null, 0.2)).toBeNull()
expect(CalcInst.calculateDiscountedPrice(100, null)).toBeNull()
expect(CalcInst.calculateDiscountedPrice(null, null)).toBeNull()

// 异常值处理
expect(CalcInst.calculateDiscountedPrice(-100, 0.2)).toBe(-100) // 负数处理
expect(CalcInst.calculateDiscountedPrice(100, -0.2)).toBe(100) // 负折扣率处理

// 精度继承
CalcInst.setOption('precision', 3)
expect(CalcInst.calculateDiscountedPrice(99.99, 0.3333)).toBe(66.663) // 99.99*(1-0.3333)=66.6633 → 保留3位小数

// 缓存验证
const cacheSize = CalcInst.getCache().calculateDiscountedPrice.size
CalcInst.calculateDiscountedPrice(100, 0.2)
expect(CalcInst.getCache().calculateDiscountedPrice.size).toBe(cacheSize + 1)
```

***

### calcUnitPrice()

> **calcUnitPrice**(`calcBaseTotalParams`, `userOptions?`): `CalcBaseTotalParams`

基础公式: 单价 = 总价 / 数量

#### Parameters

##### calcBaseTotalParams

`Required`\<`Omit`\<`CalcBaseTotalParams`, `"unitPrice"`\>\>

计算参数对象，必须包含以下字段：
- quantity: 数量（可为null）
- linePrice: 总价（可为null）
- 注意：unitPrice字段会被忽略

##### userOptions?

`BaseOptions`

可选参数，用于配置计算行为：
- 最终结果保留的小数位数（0-8）
- 运行时计算精度（固定为8）

#### Returns

`CalcBaseTotalParams`

包含完整计算结果的对象：
- quantity: 原样返回输入值
- unitPrice: 计算结果（可能为null）
- linePrice: 原样返回输入值

#### Remarks

支持多种边界场景处理和高精度计算，适用于电商、金融等场景的单价计算需求

#### Example

```ts
// 基础用法
CalcInst.calcUnitPrice({ quantity: 4, linePrice: 20 }) // { quantity:4, unitPrice:5, linePrice:20 }

// 浮点数计算
CalcInst.calcUnitPrice({ quantity: 3, linePrice: 9.99 }) // { quantity:3, unitPrice:3.33, linePrice:9.99 }

// 自定义精度
CalcInst.setOption('precision', 3)
CalcInst.calcUnitPrice({ quantity: 3, linePrice: 10 }) // { quantity:3, unitPrice:3.333, linePrice:10 }

// 边界处理
CalcInst.calcUnitPrice({ quantity: null, linePrice: 50 }) // { quantity:null, unitPrice:50, linePrice:50 }
CalcInst.calcUnitPrice({ quantity: 0, linePrice: 100 }) // { quantity:0, unitPrice:100, linePrice:100 }
```

#### Performance

时间复杂度：O(1) 常量时间复杂度（无循环）
内部采用currency.js进行高精度计算，缓存机制避免重复计算

#### Error Handling

自动处理以下异常情况：
- quantity和linePrice同时为null：返回全null对象
- quantity为0时：强制unitPrice等于linePrice
- quantity为null时：unitPrice等于linePrice
- 非数字值传入：通过类型校验确保不会出现

#### Caching

缓存键生成策略：
- 基于calcBaseTotalParams和userOptions生成唯一键
- 相同输入保证缓存命中
- 缓存清理：`CalcInst.clearCache('calcUnitPrice')`

#### Precision

精度处理规则：
1. 先应用方法级precision配置
2. 无方法级配置时使用全局precision
3. 运行时计算始终使用8位精度（runtimePrecision）
4. 结果输出时根据precision配置四舍五入

#### See

 - CacheStore - 缓存存储结构定义
 - BaseOptions - 配置项类型定义
 - CalcBaseTotalParams - 参数类型定义

#### Test Cases

```ts
// 正常计算
expect(CalcInst.calcUnitPrice({ quantity: 4, linePrice: 20 })).toEqual({
  quantity: 4, unitPrice: 5, linePrice: 20
})

// quantity为null的场景
expect(CalcInst.calcUnitPrice({ quantity: null, linePrice: 50 })).toEqual({
  quantity: null, unitPrice: 50, linePrice: 50
})

// quantity为0的场景
expect(CalcInst.calcUnitPrice({ quantity: 0, linePrice: 100 })).toEqual({
  quantity: 0, unitPrice: 100, linePrice: 100
})

// 高精度场景
expect(CalcInst.calcUnitPrice({ quantity: 3, linePrice: 10.0005 }, { precision: 3 })).toEqual({
  quantity: 3, unitPrice: 3.334, linePrice: 10.001
})

// 缓存验证
const cacheSize = CalcInst.getCache().calcUnitPrice.size
CalcInst.calcUnitPrice({ quantity: 5, linePrice: 25 })
expect(CalcInst.getCache().calcUnitPrice.size).toBe(cacheSize + 1)
```

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

> **computeRate**(`originPrice`, `userRate?`, `userRateType?`, `userOptions?`): `number`

计算税率相关的金额

#### Parameters

##### originPrice

`number`

原始价格，支持以下处理：
- null/0：直接返回0
- 非数字类型：强制转为0
- 正常数值：如 100 元

##### userRate?

`number`

税率值（0-1之间的小数），支持以下处理：
- null：使用全局taxRate配置
- NaN：返回原始价格
- 负值：强制转为0
- 默认值：0.1（对应默认配置）

##### userRateType?

`RateType`

税率类型，支持以下类型：
- 'gst_free'：免税场景返回0
- 'excl_gst'：不含税计算（直接乘税率）
- 'incl_gst'：含税计算（先加1再乘税率）
- 默认值：'incl_gst'

##### userOptions?

`BaseOptions`

可选参数，用于配置计算行为：
- 最终结果保留的小数位数（0-8）
- 运行时计算精度（固定为8）

#### Returns

`number`

折扣后的价格，如果输入不合法返回 null

#### Remarks

支持多种税率模式和边界场景处理，适用于电商、金融等需要含税/不含税计算的场景

#### Example

```ts
// 基础用法（含税计算）
CalcInst.computeRate(10, 0.1) // 0.91（10/(1+0.1)*0.1）
// 不含税计算
CalcInst.computeRate(25, 0.1, 'excl_gst') // 2.5（25*0.1）
// 免税场景
CalcInst.computeRate(100, 0.1, 'gst_free') // 0
```

#### Performance

时间复杂度：O(1) 常量时间复杂度（无循环）
内部采用currency.js进行高精度计算，缓存机制避免重复计算

#### Error Handling

自动处理以下异常情况：
- originPrice为null/0：返回0
- userRate为null/NaN：使用全局taxRate配置
- userRateType无效：返回0
- userRate超出[0,1]范围：返回原始价格

#### Caching

缓存键生成策略：
- 基于originPrice、userRate和userRateType生成唯一键
- 相同输入保证缓存命中
- 缓存清理：`CalcInst.clearCache('computeRate')`

#### Precision

精度处理规则：
1. 先应用方法级precision配置
2. 无方法级配置时使用全局precision
3. 运行时计算始终使用8位精度（runtimePrecision）
4. 结果输出时根据precision配置四舍五入

#### See

 - CacheStore - 缓存存储结构定义
 - BaseOptions - 配置项类型定义

#### Test Cases

```ts
// 正常含税计算
expect(CalcInst.computeRate(10, 0.1)).toBe(0.91)
// 不含税计算
expect(CalcInst.computeRate(25, 0.1, 'excl_gst')).toBe(2.5)
// 分母为0场景
expect(CalcInst.computeRate(10, 0)).toBe(0)
// 负数处理
expect(CalcInst.computeRate(-10, 50)).toBe(-10)
// 无效参数处理
expect(CalcInst.computeRate(10, 'invalid' as any)).toBe(10)
// 缓存验证
const cacheSize = CalcInst.getCache().computeRate.size
CalcInst.computeRate(10, 0.6)
expect(CalcInst.getCache().computeRate.size).toBe(cacheSize + 1)
```

***

### decimalToPercent()

> **decimalToPercent**(`originDecimal`, `decimalPlaces`): `number`

将小数转换为百分比

#### Parameters

##### originDecimal

小数值，支持以下处理：
- null/NaN：自动转为0
- 零值：直接返回0
- 非数字类型：强制转为0
- 正常数值：如 0.5 → 50

`null` | `number`

##### decimalPlaces

`number` = `2`

控制小数位数（0-8），支持以下处理：
- null/undefined：使用全局precision配置
- 负值：强制转为0
- 超过8的值：强制转为8
- 默认值：2位小数

#### Returns

`number`

转换后的百分比数值（可能为0）
- 成功转换返回number
- 非法输入返回0

#### Remarks

支持多种精度配置和边界场景处理，适用于金融、电商等场景的百分比计算需求

#### Example

```ts
// 基础用法
CalcInst.decimalToPercent(0.5) // 50
CalcInst.decimalToPercent(0.25) // 25

// 自定义精度
CalcInst.decimalToPercent(0.333333, 3) // 33.333
CalcInst.decimalToPercent(0.88888888, 3) // 88.889

// 边界处理
CalcInst.decimalToPercent(null) // 0
CalcInst.decimalToPercent(NaN) // 0
CalcInst.decimalToPercent('abc' as any) // 0
CalcInst.decimalToPercent(-0.5) // -50
```

#### Performance

时间复杂度：O(1) 常量时间复杂度（无循环）
内部采用currency.js进行高精度计算，缓存机制避免重复计算

#### Error Handling

自动处理以下异常情况：
- originDecimal为null/NaN：返回0
- originDecimal为非数字类型：返回0
- decimalPlaces为负数：转为0处理
- decimalPlaces超过8：转为8处理
- decimalPlaces为NaN：使用默认值2

#### Caching

缓存键生成策略：
- 基于originDecimal和decimalPlaces生成唯一键
- 相同输入保证缓存命中
- 缓存清理：`CalcInst.clearCache('decimalToPercent')`

#### Precision

精度处理规则：
1. 先应用方法级decimalPlaces配置
2. 未指定时使用全局precision配置
3. 运行时计算始终使用8位精度（runtimePrecision）
4. 结果输出时根据precision配置四舍五入

#### See

 - CacheStore - 缓存存储结构定义
 - BaseOptions - 配置项类型定义

#### Test Cases

```ts
// 正常转换
expect(CalcInst.decimalToPercent(0.5)).toBe(50)
expect(CalcInst.decimalToPercent(1)).toBe(100)

// 精度控制
expect(CalcInst.decimalToPercent(0.333333, 3)).toBe(33.333)
expect(CalcInst.decimalToPercent(0.66666666, 4)).toBe(66.6667)

// 边界处理
expect(CalcInst.decimalToPercent(null)).toBe(0)
expect(CalcInst.decimalToPercent(0)).toBe(0)
expect(CalcInst.decimalToPercent('not a number' as any)).toBe(0)

// 负数处理
expect(CalcInst.decimalToPercent(-0.5)).toBe(-50)

// 精度继承
CalcInst.setOption('precision', 3)
expect(CalcInst.decimalToPercent(0.66666666)).toBe(66.6667)

// 缓存验证
const cacheSize = CalcInst.getCache().decimalToPercent.size
CalcInst.decimalToPercent(0.555555, 3)
expect(CalcInst.getCache().decimalToPercent.size).toBe(cacheSize + 1)
```

***

### generateCacheKey()

> **generateCacheKey**(`data`): `string`

性能考量：生成数据的哈希值作为缓存键

#### Parameters

##### data

`unknown`

#### Returns

`string`

***

### getCache()

#### Call Signature

> **getCache**(): `CacheStore`

获取缓存实例或特定类型的缓存

##### Returns

`CacheStore`

缓存对象或指定类型的Map实例

##### Remarks

支持三种调用方式：
1. 无参数时返回完整缓存存储对象
2. 传入有效缓存类型时返回对应Map实例
3. 传入无效类型时返回完整缓存并发出警告

##### Examples

```ts
// 获取完整缓存
const fullCache = CalcInst.getCache();
```

```ts
// 获取求和缓存
const sumCache = CalcInst.getCache('sum');
```

```ts
// 获取无效类型会触发警告
const invalidCache = CalcInst.getCache('invalidType'); // 控制台警告：Invalid cacheType: invalidType
```

#### Call Signature

> **getCache**(`cacheType`): `Map`\<`string`, `unknown`\>

获取缓存实例或特定类型的缓存

##### Parameters

###### cacheType

keyof `CacheStore`

可选缓存类型，支持以下类型：
'sum' | 'subtractMultiple' | 'calcUnitPrice' | 'calcLinePrice' | 
'percentToDecimal' | 'decimalToPercent' | 'calculateDiscountedPrice' | 'computeRate'

##### Returns

`Map`\<`string`, `unknown`\>

缓存对象或指定类型的Map实例

##### Remarks

支持三种调用方式：
1. 无参数时返回完整缓存存储对象
2. 传入有效缓存类型时返回对应Map实例
3. 传入无效类型时返回完整缓存并发出警告

##### Examples

```ts
// 获取完整缓存
const fullCache = CalcInst.getCache();
```

```ts
// 获取求和缓存
const sumCache = CalcInst.getCache('sum');
```

```ts
// 获取无效类型会触发警告
const invalidCache = CalcInst.getCache('invalidType'); // 控制台警告：Invalid cacheType: invalidType
```

***

### getOptions()

> **getOptions**(): `BaseOptions`

#### Returns

`BaseOptions`

***

### percentToDecimal()

> **percentToDecimal**(`originPercentage`, `decimalPlaces?`): `null` \| `number`

将百分比数值转换为小数

#### Parameters

##### originPercentage

百分比数值，支持以下处理：
- null/NaN：自动转为null
- 非数字类型：强制转为null
- 正常数值：如 50.56 → 0.5056

`null` | `number`

##### decimalPlaces?

`number`

控制小数位数（0-8），支持以下处理：
- null/undefined：使用全局precision配置
- 负值：强制转为0
- 超过8的值：强制转为8
- 默认值：2位小数

#### Returns

`null` \| `number`

转换后的小数值（可能为null）
- 成功转换返回number
- 非法输入返回null

#### Remarks

支持多种精度配置和边界场景处理，适用于金融、电商等场景的百分比计算需求

#### Example

```ts
// 基础用法
CalcInst.percentToDecimal(50.56) // 0.5056（默认保留2位小数）
CalcInst.percentToDecimal(100) // 1

// 自定义精度
CalcInst.percentToDecimal(50.56789, 4) // 0.5057（四舍五入）
CalcInst.percentToDecimal(0.999999999, 3) // 100.000（保留3位小数）

// 边界处理
CalcInst.percentToDecimal(null) // null
CalcInst.percentToDecimal(NaN) // null
CalcInst.percentToDecimal('abc' as any) // null
```

#### Performance

时间复杂度：O(1) 常量时间复杂度（无循环）
内部采用currency.js进行高精度计算，缓存机制避免重复计算

#### Error Handling

自动处理以下异常情况：
- originPercentage为null/NaN：返回null
- originPercentage为非数字类型：返回null
- decimalPlaces为负数：转为0处理（保留2位小数）
- decimalPlaces超过8：转为8处理
- decimalPlaces为NaN：使用默认值2

#### Caching

缓存键生成策略：
- 基于originPercentage和decimalPlaces生成唯一键
- 相同输入保证缓存命中
- 缓存清理：`CalcInst.clearCache('percentToDecimal')`

#### Precision

精度处理规则：
1. 先应用方法级decimalPlaces配置
2. 未指定decimalPlaces时使用全局precision配置
3. 运行时计算始终使用8位精度（runtimePrecision）
4. 最终小数位数 = decimalPlaces + 2（当未指定decimalPlaces时）

#### See

 - CacheStore - 缓存存储结构定义
 - BaseOptions - 配置项类型定义

#### Test Cases

```ts
// 正常转换
expect(CalcInst.percentToDecimal(50.56)).toBe(0.5056)
expect(CalcInst.percentToDecimal(100)).toBe(1)

// 精度控制
expect(CalcInst.percentToDecimal(50.56789, 4)).toBe(0.5057)
expect(CalcInst.percentToDecimal(50.567899, 4)).toBe(0.5057)

// 边界处理
expect(CalcInst.percentToDecimal(null)).toBeNull()
expect(CalcInst.percentToDecimal(123.4567, -1)).toBe(123.4567) // 无效decimalPlaces处理

// 精度继承
CalcInst.setOption('precision', 3)
expect(CalcInst.percentToDecimal(50.56789)).toBe(0.50568) // 0.5056789 → 0.50568

// 缓存验证
const cacheSize = CalcInst.getCache().percentToDecimal.size
CalcInst.percentToDecimal(50.56789, 4)
expect(CalcInst.getCache().percentToDecimal.size).toBe(cacheSize + 1)
```

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

### setOption()

> **setOption**(`option`, `value`): `void`

动态设置计算器核心配置项

#### Parameters

##### option

配置项名称，可选值：
- 'precision'：调整计算精度（0-8位小数）
- 'taxRate'：设置税率（0-1之间的小数）
- 'rateType'：指定税率类型（'gst_free'|'incl_gst'|'excl_gst'）

`"precision"` | `"taxRate"` | `"rateType"`

##### value

`unknown`

配置项值，根据option类型不同：
- precision: 必须是 0~8 的数字
- taxRate: 必须是 0~1 的数字
- rateType: 必须是有效税率类型

#### Returns

`void`

#### Description

用于调整运行时计算参数，支持链式调用

#### Examples

```ts
CalcInst.setOption('precision', 3) // 设置计算精度为3位小数
CalcInst.setOption('precision', 0) // 禁用小数计算
```

```ts
CalcInst.setOption('taxRate', 0.15) // 设置15%税率
CalcInst.setOption('taxRate', 0) // 免税场景
```

```ts
CalcInst.setOption('rateType', 'gst_free') // 税种无关计算
CalcInst.setOption('rateType', 'excl_gst') // 含税计算模式
```

#### Throws

当传入无效配置项时抛出错误
- 无效配置项名：`Invalid option: ${option}`
- 精度超出范围：`Precision must be a number between 0 and 8`
- 税率超出范围：`Tax rate must be a number between 0 and 1`
- 无效税率类型：`Invalid RateType`

#### Remarks

该方法支持链式调用，典型用法：
```ts
CalcInst
  .setOption('precision', 3)
  .setOption('taxRate', 0.1)
```

***

### subtractMultiple()

> **subtractMultiple**(`initialValue`, `subtractValues`, `userOptions?`): `number`

从初始值中减去多个值

#### Parameters

##### initialValue

`number`

初始值（被减数），支持以下处理：
- null/NaN：自动转为0继续计算
- 非数字类型：强制转为0（如字符串'abc'、布尔值等）

##### subtractValues

减数列表，支持以下格式：
- 单个数字：`8.88`（自动转为数组）
- 数值数组：`[1, 2, 3]`
- 混合类型数组（过滤非法值）：`[5, '10', true]`

`number` | `number`[]

##### userOptions?

`Partial`\<`BaseOptions`\>

可选参数，用于配置计算行为：
- 最终结果保留的小数位数（0-8）
- 运行时计算精度（预设为8位）

#### Returns

`number`

减法运算结果：
- 初始值非法时返回0（如'abc'、NaN等）
- 减数列表为空时返回初始值
- 非数字减数自动过滤
- 默认保留2位小数（可通过setOption修改全局配置）

#### Remarks

支持链式减法运算和缓存优化，适用于金融场景的金额计算

#### Example

```ts
// 基础用法
CalcInst.subtractMultiple(9.99, [8.88]) // 1.11
CalcInst.subtractMultiple(15, [1,2,3,4]) // 5

// 处理非数字减数
CalcInst.subtractMultiple(20, [5, '10', true]) // 15（过滤非法值）
CalcInst.subtractMultiple(30, [10, null]) // 20

// 精度控制
CalcInst.setOption('precision', 3)
CalcInst.subtractMultiple(10, [3.333]) // 6.667
CalcInst.subtractMultiple(5, [1.111, 1.111]) // 2.778

// 边界值处理
CalcInst.subtractMultiple(null, [5]) // -5（初始值非法转为0-5）
CalcInst.subtractMultiple(0, [0.0005]) // -0.001（保留3位小数时四舍五入）
```

#### Performance

时间复杂度：O(n) 其中n为有效减数个数
内部采用currency.js进行高精度计算，缓存机制避免重复计算

#### Error Handling

自动处理以下异常情况：
- 初始值为null/NaN：转为0继续计算
- 减数列表包含非法值：自动过滤
- 空数组作为减数：返回初始值
- 非数字减数处理：转为0（如字符串'abc'）

#### Caching

缓存键生成策略：
- 基于initialValue和subtractValues生成唯一键
- 相同输入保证缓存命中
- 缓存清理：`CalcInst.clearCache('subtractMultiple')`

#### Precision

精度处理规则：
1. 先应用方法级precision配置
2. 无方法级配置时使用全局precision
3. 运行时计算始终使用8位精度（runtimePrecision）
4. 结果输出时根据precision配置四舍五入

#### See

 - CacheStore - 缓存存储结构定义
 - BaseOptions - 配置项类型定义

#### Test Cases

```ts
// 基本减法
expect(CalcInst.subtractMultiple(9.99, [8.88])).toBe(1.11)

// 空减数数组
expect(CalcInst.subtractMultiple(50, [])).toBe(50)

// 非数字值过滤
expect(CalcInst.subtractMultiple(20, [5, '10', true])).toBe(15)

// 零值处理
expect(CalcInst.subtractMultiple(0, [5])).toBe(-5)

// 缓存验证
const cacheSize = CalcInst.getCache().subtractMultiple.size
CalcInst.subtractMultiple(100, [10, 20, 30])
expect(CalcInst.getCache().subtractMultiple.size).toBe(cacheSize + 1)
```

***

### sum()

> **sum**(`data`, `userOptions?`): `number`

价格加总计算方法

#### Parameters

##### data

待求和的数据源，支持以下格式：
- 数值数组：`[1, 2, 3]`
- 键值对象：`{ a: 1, b: 2, c: 3 }`
- 混合类型数组（会自动过滤非法值）：`[1, '2' as any, true, 3]`

`number`[] | \{\[`key`: `string`\]: `number`; \}

##### userOptions?

`Partial`\<`BaseOptions`\>

可选参数，用于配置计算行为：
- 最终结果保留的小数位数（0-8）
- 运行时计算精度（不可修改，预设为8）

#### Returns

`number`

计算后的总和：
- 数组元素为null/NaN时自动忽略
- 对象值为null/NaN时自动忽略
- 所有元素非法时返回0
- 默认保留2位小数（可通过setOption修改全局配置）

#### Remarks

支持数组和对象类型的数值聚合，提供高精度计算和缓存优化机制，适用于金融、电商等场景的金额汇总需求

#### Example

```ts
// 基础用法
CalcInst.sum([1, 2, 3]) // 6
CalcInst.sum([10, -5, 3.5]) // 8.5

// 对象求和
CalcInst.sum({ a: 1, b: 2, c: 3 }) // 6
CalcInst.sum({ x: 10, y: null as any, z: 5 }) // 15

// 精度控制
CalcInst.sum([1.1111, 2.2222, 3.3333], { precision: 3 }) // 6.667
CalcInst.sum([1.11555, 2.22255]) // 3.338（保留3位小数时四舍五入）

// 边界值处理
CalcInst.sum([null, undefined, 5, 'abc' as any]) // 5
CalcInst.sum([0.0005, 0.0005]) // 0.001
```

#### Performance

时间复杂度：O(n) 其中n为有效数值个数
内部采用currency.js进行高精度计算，缓存机制避免重复计算

#### Error Handling

自动处理以下异常情况：
- 空数组输入：返回0
- 数组元素全为null/NaN：返回0
- 对象值全为null/NaN：返回0
- 非数字类型自动过滤：'123'、true、null等非法值

#### Caching

缓存键生成策略：
- 基于数据内容和mergedOptions生成唯一键
- 相同输入保证缓存命中
- 缓存清理：`CalcInst.clearCache('sum')`

#### Precision

精度处理规则：
1. 先应用方法级precision配置
2. 无方法级配置时使用全局precision
3. 运行时计算始终使用8位精度（runtimePrecision）
4. 结果输出时根据precision配置四舍五入

#### See

 - CacheStore - 缓存存储结构定义
 - BaseOptions - 配置项类型定义

#### Test Cases

```ts
// 数值数组计算
expect(CalcInst.sum([1, 2, 3])).toBe(6)

// 包含负数的数组
expect(CalcInst.sum([10, -5, 3.5])).toBe(8.5)

// 对象求和（含null值）
expect(CalcInst.sum({ x: 10, y: null as any, z: 5 })).toBe(15)

// 非数字值过滤
expect(CalcInst.sum([1, '2' as any, true, 3])).toBe(4)

// 精度配置测试
expect(CalcInst.sum([1.1111, 2.2222, 3.3333], { precision: 3 })).toBe(6.667)

// 缓存验证
const cacheSize = CalcInst.getCache().sum.size
CalcInst.sum([1,2,3,4,5])
expect(CalcInst.getCache().sum.size).toBe(cacheSize + 1)
```

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

// 单例模式与静态实例的等价性
expect(CalcInst).toBe(Calculator.getInstance());
```

@performance 通过单例模式避免重复初始化，降低内存占用
单次初始化耗时：0.1ms（基准测试数据）
多次调用仅返回已有实例


## 🤝 贡献指南

欢迎贡献！请查看我们的贡献指南了解如何参与开发。

## 📄 许可证

Apache License，详情见 [LICENSE](./LICENSE) 文件