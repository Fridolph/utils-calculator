# 🧮 utils-calculator

`utils-calculator` 是一个相对高效的 JavaScript/TypeScript 工具库，专注于数值计算和智能缓存优化。
通过内置的缓存机制和丰富的计算方法，它能够显著提升计算密集型任务的性能。✨
目前在我的项目中运行良好，欢迎提PR。

---

## 🌟 功能亮点

- **📊 丰富的计算方法**：支持求和、单价/总价计算、百分比转换、折扣计算等。
- **⚡ 智能缓存机制**：自动缓存计算结果，避免重复计算，提升性能。
- **📈 缓存统计查询**：支持按类型查询缓存使用情况，便于性能优化。
- **🛠️ 高度可配置**：支持自定义精度、税率、缓存策略等。
- **🔍 TypeScript 支持**：完整的类型定义，提供更好的开发体验。

---

## 🚀 快速开始

### 安装

通过 npm 安装：

```bash
npm install utils-calculator
```

### 使用示例

#### JavaScript

```javascript
const { CalcInst } = require('utils-calculator');

// 计算数组总和
const total = CalcInst.sum([1, 2, 3]); // 6

// 计算折扣价
const discountedPrice = CalcInst.calculateDiscountedPrice(100, 0.8); // 80

// 查询缓存统计
const cacheStats = CalcInst.queryCacheStat();
console.log(cacheStats); // { all: 2, sum: 1, calculateDiscountedPrice: 1, ... }
```

#### TypeScript

```typescript
import { CalcInst } from 'utils-calculator';

// 计算单价
const { unitPrice } = CalcInst.calcUnitPrice({ quantity: 2, linePrice: 200 }); // 100

// 百分比转小数
const decimal = CalcInst.percentToDecimal(50.56); // 0.5056

// 清空缓存
CalcInst.clearCache('all');
```

---

## 📖 API 文档

### `Calculator` 类

#### 核心方法

| 方法名                       | 功能描述                                                                 | 示例                                                                 |
|------------------------------|--------------------------------------------------------------------------|----------------------------------------------------------------------|
| `sum(data)`                  | 计算数组或对象中数值的总和。                                              | `CalcInst.sum([1, 2, 3])` → `6`                                     |
| `calcUnitPrice(params)`       | 根据数量和总价计算单价。                                                  | `CalcInst.calcUnitPrice({ quantity: 2, linePrice: 200 })` → `100`   |
| `calcLinePrice(params)`       | 根据数量和单价计算总价。                                                  | `CalcInst.calcLinePrice({ quantity: 2, unitPrice: 100 })` → `200`   |
| `percentToDecimal(percent)`   | 将百分比转换为小数。                                                      | `CalcInst.percentToDecimal(50.56)` → `0.5056`                        |
| `decimalToPercent(decimal)`   | 将小数转换为百分比。                                                      | `CalcInst.decimalToPercent(0.5056)` → `50.56`                        |
| `calculateDiscountedPrice()`  | 计算折扣后的价格。                                                        | `CalcInst.calculateDiscountedPrice(100, 0.8)` → `80`                |
| `computeRate()`              | 根据税率类型计算价格（含税/不含税）。                                      | `CalcInst.computeRate(100, 0.1, 'incl_gst')` → `9.09`               |

#### 缓存管理

| 方法名               | 功能描述                                                                 |
|----------------------|--------------------------------------------------------------------------|
| `queryCacheStat()`   | 查询缓存统计信息（支持按类型查询）。                                      |
| `clearCache()`       | 清空指定类型的缓存（默认清空所有缓存）。                                   |

---

## 🛠️ 配置选项

通过 `setOptions` 方法可以自定义以下配置：

```typescript
CalcInst.setOptions({
  precision: 4,       // 计算精度（默认：2）
  taxRate: 0.15,      // 默认税率（默认：0.1）
  rateType: 'excl_gst' // 默认税率类型（默认：'incl_gst'）
});
```

---

## 🤝 贡献指南

欢迎贡献代码或提出建议！以下是参与步骤：

1. **Fork 仓库** 🍴
2. **创建分支** `git checkout -b feature/your-feature`
3. **提交代码** `git commit -m "feat: add your feature"`
4. **推送分支** `git push origin feature/your-feature`
5. **提交 PR** 📦

---

## 📜 许可证

Apache License 请遵循开源守则

---

## ❓ 问题反馈

遇到问题？请在 [GitHub Issues](https://github.com/Fridolph/utils-calculator/issues) 中提问，我会尽快回复！💬

---

希望这个工具库能为你的项目带来便利！🎉
