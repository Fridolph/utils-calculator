[**utils-calculator**](../README.md)

***

[utils-calculator](../globals.md) / Calculator

# Class: Calculator

@author: Fridolph

## Description

基于 $number 计算的，把经常用到一些计算方法封装为一个工具类，也算是减少模版代码 W_W

## Description

注意：为避免国际化带来的千分位及小数等问题，使用前请将传参都处理为通用的 Number 类型。类方法的输出都是基础数字类型
处理边界情况：
1. 不直接报错，允许用户传入 0 和 null
2. 错误逻辑，如分母为0的情况，将输出处理为 null
3. 计算结果为 0 时，输出为 0

## Examples

```ts
简单求和   CalcInst.sum([23.34, 34.67, 99.99]) -> 157.99
```

```ts
小数转百分比 CalcInst.decimalToPercent(0.50549993) -> 50.56
```

```ts
百分比转小数 CalcInst.decimalToPercent(0.50549993) -> 50.56
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

{ quantity, unitPrice, linePrice }

##### userOptions?

`BaseOptions`

#### Returns

`CalcBaseTotalParams`

***

### calculateDiscountedPrice()

> **calculateDiscountedPrice**(`originalPrice`, `discountRate`, `userOptions?`): `null` \| `number`

计算折扣后的价格

#### Parameters

##### originalPrice

原始价格

`null` | `number`

##### discountRate

折扣率，例如 0.8 代表 8 折

`null` | `number`

##### userOptions?

`BaseOptions`

#### Returns

`null` \| `number`

折扣后的价格，如果输入不合法返回 null

#### Description

折扣不能为 0 和 1，但允许用户这样输，约定如下：

#### Description

0 为 不打折，返原始价格；1 为 白送，最终价格为为 0

***

### calcUnitPrice()

> **calcUnitPrice**(`calcBaseTotalParams`, `userOptions?`): `CalcBaseTotalParams`

基础公式: 单价 = 总价 / 数量

#### Parameters

##### calcBaseTotalParams

`Required`\<`Omit`\<`CalcBaseTotalParams`, `"unitPrice"`\>\>

{ quantity, unitPrice, linePrice }

##### userOptions?

`BaseOptions`

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

> **computeRate**(`originPrice`, `userRate?`, `userRateType?`, `userOptions?`): `number`

#### Parameters

##### originPrice

`number`

原始价格

##### userRate?

`number`

小数，如 0.1，表示 打 9 折

##### userRateType?

`RateType`

不填默认为 incl_gst

##### userOptions?

`BaseOptions`

#### Returns

`number`

discountedPrice 折后价格

#### Description

gst_free: 忽略计算;  excl_gst: 不含税;  incl_gst: 含税

***

### decimalToPercent()

> **decimalToPercent**(`originDecimal`, `decimalPlaces`): `number`

将小数转换为百分比

#### Parameters

##### originDecimal

小数值

`null` | `number`

##### decimalPlaces

`number` = `2`

控制小数位数，默认保留2位

#### Returns

`number`

转换后的百分比数值，如果传入非法值返回 null

#### Examples

```ts
默认使用 CalcInst.percentToDecimal(50.56) -> 0.5056
```

```ts
控制位数 CalcInst.percentToDecimal(50.567890, 4) -> 0.505679
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

比百分数值，例如 50.56

`null` | `number`

##### decimalPlaces?

`number`

控制小数位数，默认保留2位

#### Returns

`null` \| `number`

转换后的小数值，如果传入非法值返回 null

#### Examples

```ts
默认使用 CalcInst.percentToDecimal(50.56) -> 0.5056
```

```ts
控制位数 CalcInst.percentToDecimal(50.5678, 6) -> 0.5056
```

***

### queryCacheStat()

> **queryCacheStat**(`cacheType`): `object`

查询缓存的统计信息

#### Parameters

##### cacheType

`CacheType` = `'all'`

可选参数，指定要查询的缓存类型，如'sum'等，不传则返回所有缓存类型统计信息

#### Returns

`object`

缓存统计信息对象

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

***

### setOption()

> **setOption**(`option`, `value`): `void`

#### Parameters

##### option

`"precision"` | `"taxRate"` | `"rateType"`

##### value

`unknown`

#### Returns

`void`

***

### subtractMultiple()

> **subtractMultiple**(`initialValue`, `subtractValues`, `userOptions?`): `number`

从初始值中减去多个值

#### Parameters

##### initialValue

`number`

初始值

##### subtractValues

要减去的值数组

`number` | `number`[]

##### userOptions?

`Partial`\<`BaseOptions`\>

#### Returns

`number`

减法运算后的结果

#### Examples

```ts
subtractMultiple(9.99, 8.88) -> 1.11
```

```ts
subtractMultiple(15, [1,2,3,4]) -> 5
```

***

### sum()

> **sum**(`data`, `userOptions?`): `number`

价格加总计算

#### Parameters

##### data

支持传入符合特定结构的对象或数组进行价格加总计算

`number`[] | \{\[`key`: `string`\]: `number`; \}

##### userOptions?

`Partial`\<`BaseOptions`\>

#### Returns

`number`

加总后的结果，若出现错误情况则返回0

***

### getInstance()

> `static` **getInstance**(): `Calculator`

获取单例实例：目前只有查看和清缓存两个用法

#### Returns

`Calculator`
