[**utils-calculator v2.0.0**](../README.md)

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

根据公式计算总价

#### Parameters

##### calcBaseTotalParams

`Required`\<`Omit`\<`CalcBaseTotalParams`, `"linePrice"`\>\>

##### userOptions?

`Partial`\<`UserOptions`\>

用户自定义的配置选项（可选）。
 - **keepParamsMaxPrecision** ：布尔值，默认为 `true`。若为 `true`，将保留参数中的最大精度；若为 `false`，则按照 `outputDecimalPlaces` 配置输出结果。
 - **outputDecimalPlaces** ：数字类型，取值范围为 `-1` 到 `16`。 `-1` 表示保留原始计算值，不进行四舍五入处理；其他正值表示计算结果精确到的小数位数。此配置用于控制计算结果的精度。
 - **taxRate** ：数字类型，取值范围为 `0` 到 `1`，表示税率，默认为 `0.1`。
 - **rateType** ：取值为 `'EXCL'`、`'INCL'`、`'FREE'` 之一，用于指定税率计算类型，默认为 `'INCL'`。

#### Returns

`CalcBaseTotalParams`

返回一个包含数量、单价和总价的对象。对于不同的输入情况有不同的返回值：
 - 当 `quantity` 和 `unitPrice` 都为 `null` 时，返回全 `null` 对象，即 `{ quantity: null, unitPrice: null, linePrice: null }`。
 - 当 `quantity` 为 `null` 时，`unitPrice` 等于 `linePrice`。
 - 当 `linePrice` 为 `null` 时，返回 `null` 总价。
 - 当 `quantity` 为 `0` 时，`unitPrice` 保持不变，`linePrice` 为 `0`。

#### Description

`公式：总价 = 单价 * 数量`. 根据商品的数量（quantity）和单价（unitPrice）计算总价（linePrice），并返回包含数量、单价和总价的对象。此方法针对多种边界条件、异常输入进行了处理，并支持用户自定义计算精度，同时具备缓存机制以提高计算效率。

#### Examples

```ts
// 正常计算
const params = { quantity: 3, unitPrice: 4 };
const result = CalcInst.calcLinePrice(params);
expect(result.linePrice).toBe(12);
```

```ts
// quantity 为 null 的情况
const params = { quantity: null, unitPrice: 5 };
const result = CalcInst.calcLinePrice(params);
expect(result.quantity).toBe(null),
expect(result.unitPrice).toBe(5),
expect(result.linePrice).toBe(5);
```

```ts
// 使用自定义配置选项
const params = { quantity: 1.11, unitPrice: 2.22 };
const result = CalcInst.calcLinePrice(params, { outputDecimalPlaces: 1 });
expect(result.linePrice).toBeCloseTo(1.11 * 2.22, 1);
```

#### Throws

当 `userOptions` 中的配置项不符合要求时，会抛出相应的错误。
 - 若 `keepParamsMaxPrecision` 不是布尔值，抛出 `参数 keepParamsMaxPrecision 应该为 Boolean 值`。
 - 若 `outputDecimalPlaces` 不是 `-1` 到 `16` 之间的数字，抛出 `参数 outputDecimalPlaces 应该为 [-1, 16] 间的数字`。
 - 若 `taxRate` 不是 `0` 到 `1` 之间的数字，抛出 `参数 taxRate 应该为 [0, 1] 间的数字`。
 - 若 `rateType` 不是 `'EXCL'`、`'INCL'`、`'FREE'` 之一，抛出 `请传入正确的 RateType 类型，应该为 'EXCL', 'INCL', 'FREE' 之一`。

#### See

 - UserOptions 用于查看用户配置选项的详细类型定义。
 - CalcBaseTotalParams 用于查看返回对象的详细类型定义。

#### Description

- 在计算总价时，会根据传入的 `quantity` 和 `unitPrice` 值进行不同的处理。
 - 对于非数字类型的 `quantity` 或 `unitPrice`，会进行特定的转换和处理以确保计算的正确性。
 - 精度计算方面，使用内部机制确保计算结果符合用户指定的精度要求（通过 `outputDecimalPlaces` 配置）。
 - 缓存机制基于输入的参数对象和配置选项生成唯一的缓存键，相同输入的计算结果会从缓存中获取，避免重复计算。

***

### calculateDiscountedPrice()

> **calculateDiscountedPrice**(`originalPrice`, `discountRate`, `userOptions?`): `null` \| `number`

计算折扣价.

#### Parameters

##### originalPrice

商品的原始价格。如果输入为 `null` 或非数字类型，将返回 `null`；如果为负数，将按照特定规则处理。

`null` | `number`

##### discountRate

折扣率，取值范围理论上为 0 到 1 之间，但负数折扣率和非 `null` 非数字输入会有特殊处理。当值为 `null` 或非数字类型时，返回 `null`；当折扣率为 0 时，返回原始价格；当折扣率为 1 时，返回 0（免费）。

`null` | `number`

##### userOptions?

`Partial`\<`UserOptions`\>

用户自定义的配置选项（可选）。
 - **keepParamsMaxPrecision** ：布尔值，默认为 `true`。若为 `true`，将保留参数中的最大精度；若为 `false`，则按照 `outputDecimalPlaces` 配置输出结果。
 - **outputDecimalPlaces** ：数字类型，取值范围为 `-1` 到 `16`。 `-1` 表示保留原始计算值，不进行四舍五入处理；其他正值表示计算结果精确到的小数位数。此参数用于配置计算结果的精度。
 - **taxRate** ：数字类型，取值范围为 `0` 到 `1`，表示税率，默认为 `0.1`。
 - **rateType** ：取值为 `'EXCL'`、`'INCL'`、`'FREE'` 之一，用于指定税率计算类型，默认为 `'INCL'`。

#### Returns

`null` \| `number`

- 返回折扣后的价格，如果输入无效（如原始价格或折扣率为 `null` 或非数字类型），则返回 `null`。

#### Description

`公式：折扣价 = 原价 - (原价 * 折扣率)`;  根据给定的原始价格和折扣率计算折扣后的价格。该方法支持多种边界值、异常情况处理，并具备精度配置和缓存机制功能。

#### Examples

```ts
// 正常折扣计算
const discountedPrice = CalcInst.calculateDiscountedPrice(100, 0.1);
expect(discountedPrice).toBe(90);
```

```ts
// 折扣率为0
const noDiscountPrice = CalcInst.calculateDiscountedPrice(50, 0);
expect(noDiscountPrice).toBe(50);
```

```ts
// 使用自定义精度配置
const discountedPriceWithPrecision = CalcInst.calculateDiscountedPrice(100.111, 0.1, { outputDecimalPlaces: 2 });
expect(discountedPriceWithPrecision).toBe(90.1);
```

#### Throws

- 当 `userOptions` 中的配置项不符合要求时，会抛出相应的错误。
 - 若 `keepParamsMaxPrecision` 不是布尔值，抛出 `参数 keepParamsMaxPrecision 应该为 Boolean 值`。
 - 若 `outputDecimalPlaces` 不是 `-1` 到 `16` 之间的数字，抛出 `参数 outputDecimalPlaces 应该为 [-1, 16] 间的数字`。
 - 若 `taxRate` 不是 `0` 到 `1` 之间的数字，抛出 `参数 taxRate 应该为 [0, 1] 间的数字`。
 - 若 `rateType` 不是 `'EXCL'`、`'INCL'`、`'FREE'` 之一，抛出 `请传入正确的 RateType 类型，应该为 'EXCL', 'INCL', 'FREE' 之一`。

#### See

UserOptions - 用于查看用户配置选项的详细类型定义。

#### Description

- 该方法对于有效输入，通过公式 `原始价格 * (1 - 折扣率)` 来计算折扣价格，并根据 `outputDecimalPlaces` 配置进行精度处理。
 - 在边界值处理上：
   - 折扣率为 0 时，返回原始价格；折扣率为 1 时，返回 0（免费）。
   - 原始价格为 0 时，无论折扣率如何，返回 0。
   - 处理极小数值和极大数值确保计算准确。
 - 异常情况处理：
   - 当原始价格或折扣率为 `null` 或非数字类型时，返回 `null`。
   - 对于负原始价格和负折扣率，按特定规则返回原始价格。
 - 缓存机制：
   - 根据输入的原始价格、折扣率和配置选项生成唯一缓存键。
   - 相同输入的计算结果会命中缓存，减少计算次数，提高性能。

***

### calcUnitPrice()

> **calcUnitPrice**(`calcBaseTotalParams`, `userOptions?`): `CalcBaseTotalParams`

根据公式计算单价

#### Parameters

##### calcBaseTotalParams

`Required`\<`Omit`\<`CalcBaseTotalParams`, `"unitPrice"`\>\>

包含数量和总价信息的参数对象，但不包含单价。
 - **quantity** ：数字类型，表示商品的数量。可以是 `null`，不同值会有不同的计算逻辑。
 - **linePrice** ：数字类型，表示商品的总价。可以是 `null`，不同值会有不同的计算逻辑。

##### userOptions?

`Partial`\<`UserOptions`\>

用户自定义的配置选项（可选）。
 - **keepParamsMaxPrecision** ：布尔值，默认为 `true`。若为 `true`，将保留参数中的最大精度；若为 `false`，则按照 `outputDecimalPlaces` 配置输出结果。
 - **outputDecimalPlaces** ：数字类型，取值范围为 `-1` 到 `16`。 `-1` 表示保留原始计算值，不进行四舍五入处理；其他正值表示计算结果精确到的小数位数。
 - **taxRate** ：数字类型，取值范围为 `0` 到 `1`，表示税率，默认为 `0.1`。
 - **rateType** ：取值为 `'EXCL'`、`'INCL'`、`'FREE'` 之一，用于指定税率计算类型，默认为 `'INCL'`。

#### Returns

`CalcBaseTotalParams`

包含计算后的数量、单价和总价的对象。

#### Description

`公式： 单价 = 总价 / 数量` 通过给定的数量（quantity）和总价（linePrice），按照一定规则计算出单价（unitPrice），并返回包含数量、单价和总价的对象。该方法考虑了多种边界条件、异常情况，支持用户自定义计算精度，同时具备缓存机制以提高性能。

#### Examples

```ts
// 常规计算
CalcInst.calcUnitPrice({ quantity: 5, linePrice: 25 }); // { quantity: 5, unitPrice: 5, linePrice: 25 }
```

```ts
// quantity 为 null 的情况
CalcInst.calcUnitPrice({ quantity: null, linePrice: 30 }); // { quantity: null, unitPrice: 30, linePrice: 30 }
```

```ts
// quantity 为 0 的情况
CalcInst.calcUnitPrice({ quantity: 0, linePrice: 40 }); // { quantity: 0, unitPrice: 40, linePrice: 40 }
```

```ts
// 使用自定义配置选项
CalcInst.calcUnitPrice({ quantity: 4, linePrice: 18 }, { outputDecimalPlaces: 1 }); // { quantity: 4, unitPrice: 4.5, linePrice: 18 }
```

#### Throws

当 `userOptions` 中的配置项不符合要求时，会抛出相应的错误。
 - 若 `keepParamsMaxPrecision` 不是布尔值，抛出 `参数 keepParamsMaxPrecision 应该为 Boolean 值`。
 - 若 `outputDecimalPlaces` 不是 `-1` 到 `16` 之间的数字，抛出 `参数 outputDecimalPlaces 应该为 [-1, 16] 间的数字`。
 - 若 `taxRate` 不是 `0` 到 `1` 之间的数字，抛出 `参数 taxRate 应该为 [0, 1] 间的数字`。
 - 若 `rateType` 不是 `'EXCL'`、`'INCL'`、`'FREE'` 之一，抛出 `请传入正确的 RateType 类型，应该为 'EXCL', 'INCL', 'FREE' 之一`。

#### See

 - UserOptions 用于查看用户配置选项的详细类型定义。
 - CalcBaseTotalParams 用于查看参数对象的详细类型定义。

#### Description

- 该方法会根据不同的边界条件进行不同的处理：
   - 当 `quantity` 和 `linePrice` 同时为 `null` 时，返回全 `null` 对象。
   - 当 `quantity` 为 `null` 时，`unitPrice` 等于 `linePrice`。
   - 当 `linePrice` 为 `null` 时，返回 `null` 总价。
   - 当 `quantity` 为 `0` 时，强制 `unitPrice` 等于 `linePrice`。
 - 对于单价的计算，会使用 `Decimal.js` 进行高精度计算，以确保计算结果的准确性。
 - 方法具备缓存机制，会根据输入数据（参数对象、配置选项）生成唯一的缓存键，相同输入的计算结果将直接从缓存中获取，避免重复计算，提高计算效率。

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

根据给定的价格、税率和税率计算类型，计算相应的税额

#### Description

此方法支持多种精度配置、参数组合设定，并能处理各种边界值和异常输入情况，同时具备缓存机制以提高计算效率。

#### Param

商品的原始价格。可以是数字类型，也可能接受其他类型输入，但对于非数字等无效输入有相应处理方式。当输入为 `NaN`、非数字类型（如字符串）时，会按照特定规则返回结果（如 `NaN` 价格返回 0，非数字价格返回 0）。

#### Param

税率相关参数。可以是单纯的税率数字，也可以是包含多个配置项的对象。如果传入对象，可包含 `taxRate`（税率）、`outputDecimalPlaces`（输出小数位数）、`rateType`（税率计算类型）等配置项。若传入非数字类型，对于价格计算会当做无效税率处理（此时按特定规则处理）。

#### Param

税率计算类型（可选）。取值为 `'EXCL'`（不含税）、`'INCL'`（含税）、`'FREE'`（免税）之一。用于指定计算税额的方式，默认为全局配置中的 `rateType`，若全局未设置则使用默认类型 `'INCL'`。若同时存在方法级和全局的 `rateType` 配置，方法级配置优先。

#### Examples

```ts
// 含税计算示例
const taxAmount1 = CalcInst.computeRate(100, { taxRate: 0.1, outputDecimalPlaces: 2 });
expect(taxAmount1).toBe(9.09);
```

```ts
// 不含税计算示例
const taxAmount2 = CalcInst.computeRate(200, 0.15, 'EXCL');
expect(taxAmount2).toBe(30);
```

```ts
// 免税场景示例
const taxAmount3 = CalcInst.computeRate(150, 0.2, 'FREE');
expect(taxAmount3).toBe(0);
```

#### Description

- 计算逻辑：
   - 根据 `rateType` 的值确定计算方式。`'EXCL'` 类型下，税额 = 原始价格 * 税率；`'INCL'` 类型下，税额 = 原始价格 / (1 + 税率) * 税率。`'FREE'` 类型下，无论价格和税率是多少，税额直接返回 0 且此类型优先级最高，会强制覆盖非零税率配置。
 - 精度配置：
   - 支持两种精度控制方式。当 `keepResultPrecision` 为 `true` 时，保留原始计算精度；当 `keepResultPrecision` 为 `false` 时，结果会根据 `outputDecimalPlaces` 的值进行四舍五入。若方法级设置了 `outputDecimalPlaces`，则会覆盖全局配置的 `outputDecimalPlaces`。
 - 边界值处理：
   - 处理 0 价格情况，无论税率如何，税额返回 0。
   - 处理负数价格，按正常计算逻辑得出负数税额（但在 `FREE` 类型下负数价格返回 0）。
   - 能处理超大数值的税率计算，并按要求的精度配置（如 `outputDecimalPlaces`）输出结果。
 - 异常输入处理：
   - 对于价格输入为 `NaN` 或非数字类型，以及税率输入为非数字类型的情况，都会按照特定规则进行处理并返回相应结果。
 - 缓存机制：
   - 根据输入的 `originPrice`、`userRate` 和 `rateType` 参数生成唯一的缓存键。相同输入情况下，会命中缓存，直接返回缓存中的结果，避免重复计算，提高性能。不同参数组合会生成不同的缓存键，确保不同计算情况的结果独立性。

#### See

[全局配置相关参数] - 方法会参考全局配置的 `taxRate`、`outputDecimalPlaces`、`rateType`、`keepResultPrecision` 等参数，当方法级未提供某些配置时，会使用全局配置值进行计算，同时方法级配置优先于全局配置。

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

将小数值转换为百分比值

#### Parameters

##### originNumber

需要转换的小数值。可以为 `null`、布尔值、字符串、`undefined` 或 `NaN` 等无效值，这些无效值都将被处理并返回指定的默认结果。

`null` | `number`

##### userOptions?

`number` | `Partial`\<`UserOptions`\>

#### Returns

`number`

- 返回转换后的百分比值。对于无效输入，或转换结果小于0.000001 时，可能返回特定的默认值。

#### Description

`公式: 百分比 = 原始值 * 100;` 支持对转换结果进行精度控制. 此方法能处理多种输入情况，包括边界值、异常值，同时具备缓存机制以提高性能。

#### Description

注：% 号没有加，可以用另一个 Formatter 继续处理

#### Examples

```ts
// 正常小数转换
const percentValue = CalcInst.decimalToPercent(0.2);
expect(percentValue).toBe(20);
```

```ts
// 自定义小数位数
const customPercentValue = CalcInst.decimalToPercent(0.33333, 3);
expect(customPercentValue).toBe(33.333);
```

#### Description

- 正常转换逻辑：将输入的小数值乘以 100 并根据 `decimalPlaces` 参数进行精度处理后返回作为百分比的值。例如，0.5 转换为 50。
 - 边界值处理：
   - 输入为 `null`、`0`、`NaN` 时，返回 0。
   - 输入为科学计数法表示的极小值，如 1e - 5，能正确转换为对应的百分比 0.001。
 - 异常值处理：
   - 非数字类型输入如字符串、布尔值、`undefined` 等，均返回 0。
   - 负数输入正确转换为对应的负百分比，如 - 0.5 转换为 - 50。
 - 精度控制：
   - 根据 `decimalPlaces` 参数确定转换后的百分比值要保留的小数位数。如果该参数不合法（小于 0 或者非数字类型），则采用全局配置 `outputDecimalPlaces` 的值进行处理。
   - 对极小值如 0.00000001 能按照期望保留精度。对多位小数输入如 0.123456789 能根据指定的 `decimalPlaces` 正确保留小数位数。
 - 缓存机制：
   - 该方法会根据输入的 `originNumber` 和 `decimalPlaces` 参数生成唯一的缓存键。相同输入情况下，会命中缓存，直接返回缓存中的结果，提高计算效率。
   - 不同配置（不同的 `decimalPlaces` 值）会生成不同的缓存键，以确保不同配置下的结果独立性。

#### See

全局配置. 当 `decimalPlaces` 参数不符合要求时，会使用全局配置的 `outputDecimalPlaces` 进行处理。

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

> **percentToDecimal**(`originPercentage`, `userOptions?`): `null` \| `number`

将百分比值转换为小数值

#### Parameters

##### originPercentage

`null` | `number`

##### userOptions?

用户自定义的配置选项（可选）。
 - **keepParamsMaxPrecision** ：布尔值，默认为 `true`。若为 `true`，将保留参数中的最大精度；若为 `false`，则按照 `outputDecimalPlaces` 配置输出结果。
 - **outputDecimalPlaces** ：数字类型，取值范围为 `-1` 到 `16`。 `-1` 表示保留原始计算值，不进行四舍五入处理；其他正值表示计算结果精确到的小数位数。此参数用于控制转换后的小数精度。
 - **taxRate** ：数字类型，取值范围为 `0` 到 `1`，表示税率，默认为 `0.1`。
 - **rateType** ：取值为 `'EXCL'`、`'INCL'`、`'FREE'` 之一，用于指定税率计算类型，默认为 `'INCL'`。

`number` | `Partial`\<`UserOptions`\>

#### Returns

`null` \| `number`

- 返回转换后的小数值。如果输入无效（如 `null`、非数字类型或 `NaN`），则返回 `null`。

#### Description

`公式: 小数 = 原始值(%) / 100;`  该方法支持自定义精度配置，能处理多种边界值情况和异常输入，并具备缓存机制以提高计算效率。

#### Examples

```ts
// 正常百分比转换
const decimalValue = CalcInst.percentToDecimal(20);
expect(decimalValue).toBe(0.2);
```

```ts
// 使用自定义精度配置
const decimalValueWithPrecision = CalcInst.percentToDecimal(33.333, { outputDecimalPlaces: 2 });
expect(decimalValueWithPrecision).toBe(0.33);
```

#### Throws

- 当 `userOptions` 中的配置项不符合要求时，会抛出相应的错误。
 - 若 `keepParamsMaxPrecision` 不是布尔值，抛出 `参数 keepParamsMaxPrecision 应该为 Boolean 值`。
 - 若 `outputDecimalPlaces` 不是 `-1` 到 `16` 之间的数字，抛出 `参数 outputDecimalPlaces 应该为 [-1, 16] 间的数字`。
 - 若 `taxRate` 不是 `0` 到 `1` 之间的数字，抛出 `参数 taxRate 应该为 [0, 1] 间的数字`。
 - 若 `rateType` 不是 `'EXCL'`、`'INCL'`、`'FREE'` 之一，抛出 `请传入正确的 RateType 类型，应该为 'EXCL', 'INCL', 'FREE' 之一`。

#### See

UserOptions - 用于查看用户配置选项的详细类型定义。

#### Description

- 对于有效的百分比输入，通过将百分比值除以 100 来进行转换。例如，50% 转换为 0.5，100% 转换为 1。
 - 精度配置方面：
   - 根据 `outputDecimalPlaces` 的值对转换结果进行四舍五入处理。例如，`outputDecimalPlaces` 为 2 时，33.333 将转换为 0.33。
   - 当 `outputDecimalPlaces` 为 `-1` 时，返回原始计算值，不进行四舍五入。
 - 边界值处理：
   - 处理极大值和极小值，确保正确转换。例如，999999999 转换为 9999999.99，0.0001 转换为 0.000001。
   - 对于负百分比，同样进行正确转换。例如，-100 转换为 -1，-50 转换为 -0.5。
 - 异常输入处理：
   - 当输入为 `null`、非数字类型（如字符串）或 `NaN` 时，返回 `null`。
 - 缓存机制：
   - 该方法会根据输入的百分比值和配置选项生成唯一的缓存键。
   - 相同输入的转换结果会命中缓存，减少重复计算，提高性能。

***

### queryCacheStat()

> **queryCacheStat**(`cacheType`): `object`

#### Parameters

##### cacheType

`CacheType` = `'all'`

#### Returns

`object`

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

从初始值中依次减去多个减数，实现多次减法运算。

#### Parameters

##### initialValue

`number`

初始值，作为减法运算的起始值。如果该值不是数字类型（包括 `null`、`NaN`、`undefined` 等），将会被转换为 `0` 后进行运算。

##### subtractValues

减数，可以是单个数字或数字数组。如果是单个数字，会将其转换为包含该数字的数组进行处理。数组中的无效值（如非数字类型）将被过滤掉，不参与运算。

`number` | `number`[]

##### userOptions?

`Partial`\<`UserOptions`\>

用户自定义的配置选项（可选）。
 - **keepParamsMaxPrecision** ：布尔值，默认为 `true`。若为 `true`，将保留参数中的最大精度；若为 `false`，则按照 `outputDecimalPlaces` 配置输出结果。
 - **outputDecimalPlaces** ：数字类型，取值范围为 `-1` 到 `16`。 `-1` 表示保留原始计算值，不进行四舍五入处理；其他正值表示计算结果精确到的小数位数。
 - **taxRate** ：数字类型，取值范围为 `0` 到 `1`，表示税率，默认为 `0.1`。
 - **rateType** ：取值为 `'EXCL'`、`'INCL'`、`'FREE'` 之一，用于指定税率计算类型，默认为 `'INCL'`。

#### Returns

`number`

减法运算的结果，类型为基础数字类型。

#### Description

该方法支持多种类型的参数输入，并对异常输入和边界情况进行了处理，同时支持用户自定义计算精度，还具备缓存机制以提高性能。

#### Examples

```ts
// 初始值减去单个减数
CalcInst.subtractMultiple(10, 5); // 5
```

```ts
// 初始值减去多个减数
CalcInst.subtractMultiple(20, [5, 3, 2]); // 10
```

```ts
// 使用自定义配置选项
CalcInst.subtractMultiple(10.5, [3.2], { outputDecimalPlaces: 1 }); // 7.3
```

#### Throws

当 `userOptions` 中的配置项不符合要求时，会抛出相应的错误。
 - 若 `keepParamsMaxPrecision` 不是布尔值，抛出 `参数 keepParamsMaxPrecision 应该为 Boolean 值`。
 - 若 `outputDecimalPlaces` 不是 `-1` 到 `16` 之间的数字，抛出 `参数 outputDecimalPlaces 应该为 [-1, 16] 间的数字`。
 - 若 `taxRate` 不是 `0` 到 `1` 之间的数字，抛出 `参数 taxRate 应该为 [0, 1] 间的数字`。
 - 若 `rateType` 不是 `'EXCL'`、`'INCL'`、`'FREE'` 之一，抛出 `请传入正确的 RateType 类型，应该为 'EXCL', 'INCL', 'FREE' 之一`。

#### See

UserOptions 用于查看用户配置选项的详细类型定义。

#### Description

- 该方法会先对初始值和减数进行预处理，将无效的初始值转换为 `0`，将单个减数转换为数组形式，并过滤掉减数数组中的无效值。
 - 对于减法运算，会使用 `Decimal.js` 进行高精度计算，以确保计算结果的准确性。
 - 方法具备缓存机制，会根据输入数据（初始值、减数、配置选项）生成唯一的缓存键，相同输入的计算结果将直接从缓存中获取，避免重复计算，提高计算效率。

***

### sum()

> **sum**(`data`, `userOptions?`): `number`

计算输入数据的总和

#### Parameters

##### data

输入的数据，可以是单个数字、数字数组或包含数值属性的对象。

 - **单个数字**：如 `5`，将直接计算该数字作为总和。
 - **数字数组**：例如 `[1, 2, 3]`，方法将计算数组中所有有效数字的总和。
 - **包含数值属性的对象**：例如 `{ a: 1, b: 2 }`，方法将计算对象中所有数值属性的总和。

`number` | `number`[] | \{\[`key`: `string`\]: `number`; \}

##### userOptions?

`Partial`\<`UserOptions`\>

用户自定义的配置选项（可选）。
 - **keepParamsMaxPrecision** ：布尔值，默认为 `true`。若为 `true`，将保留参数中的最大精度；若为 `false`，则按照 `outputDecimalPlaces` 配置输出结果。
 - **outputDecimalPlaces** ：数字类型，取值范围为 `-1` 到 `16`。 `-1` 表示保留原始计算值，不进行四舍五入处理；其他正值表示计算结果精确到的小数位数。
 - **taxRate** ：数字类型，取值范围为 `0` 到 `1`，表示税率，默认为 `0.1`。
 - **rateType** ：取值为 `'EXCL'`、`'INCL'`、`'FREE'` 之一，用于指定税率计算类型，默认为 `'INCL'`。

#### Returns

`number`

计算结果，类型为基础数字类型。

#### Description

该方法可以处理多种类型的数据输入，包括数字、数字数组以及包含数值的对象，并根据用户配置的精度选项进行计算结果的处理。同时，该方法具备缓存机制，相同输入的计算结果将被缓存以提高性能。

#### Examples

```ts
// 数组求和
CalcInst.sum([1, 2, 3]); // 6
```

```ts
// 单个数字输入
CalcInst.sum(5); // 5
```

```ts
// 对象求和
CalcInst.sum({ a: 1, b: 2 }); // 3
```

```ts
// 使用自定义配置选项
CalcInst.sum([1.1, 2.2, 3.3], { outputDecimalPlaces: 1 }); // 6.6
```

#### Throws

当 `userOptions` 中的配置项不符合要求时，会抛出相应的错误。
 - 若 `keepParamsMaxPrecision` 不是布尔值，抛出 `参数 keepParamsMaxPrecision 应该为 Boolean 值`。
 - 若 `outputDecimalPlaces` 不是 `-1` 到 `16` 之间的数字，抛出 `参数 outputDecimalPlaces 应该为 [-1, 16] 间的数字`。
 - 若 `taxRate` 不是 `0` 到 `1` 之间的数字，抛出 `参数 taxRate 应该为 [0, 1] 间的数字`。
 - 若 `rateType` 不是 `'EXCL'`、`'INCL'`、`'FREE'` 之一，抛出 `请传入正确的 RateType 类型，应该为 'EXCL', 'INCL', 'FREE' 之一`。

#### See

UserOptions 用于查看用户配置选项的详细类型定义。

#### Description

- 该方法在计算过程中会过滤掉输入数据中的无效值（如非数字类型、`null`、`NaN` 等）。
 - 对于加法运算，会使用 `Decimal.js` 进行高精度计算，以确保计算结果的准确性。
 - 方法具备缓存机制，会根据输入数据和配置选项生成唯一的缓存键，相同输入的计算结果将直接从缓存中获取，避免重复计算，提高计算效率。

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
