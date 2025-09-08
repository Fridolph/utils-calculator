---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "utils-calculator"
  text: "Efficient computing tool library, intelligent cache acceleration"
  tagline: Simplifying complex calculations
  actions:
    - theme: brand
      text: Markdown Examples
      link: /markdown-examples
    - theme: alt
      text: API Examples
      link: /api-examples

features:
  - title: Calculator
    details: 可以创建类实例，使用实例进行计算
  - title: CalcInst
    details: 推荐使用单例模式，避免重复实例化开销
---


# utils-calculator 🧮

[![Tests](https://img.shields.io/badge/tests-100%25-green)](https://github.com/Fridolph/utils-calculator)
[![npm version](https://img.shields.io/npm/v/utils-calculator)](https://www.npmjs.com/package/utils-calculator)
[![License](https://img.shields.io/npm/l/utils-calculator)](https://github.com/Fridolph/utils-calculator/blob/main/LICENSE)
[![Coverage](https://img.shields.io/badge/coverage-91%25-yellow)](https://github.com/Fridolph/utils-calculator)
[![Downloads](https://img.shields.io/npm/dm/utils-calculator)](https://www.npmjs.com/package/utils-calculator)

基于 TypeScript 的高性能计算工具库，提供多种计算方法和缓存优化机制，适用于金融、电商等需要高精度计算的场景。

## 🌟 特性

- **单例模式**：避免重复实例化开销
- **缓存机制**：自动缓存计算结果，提升重复计算性能
- **精度控制**：支持运行时动态调整计算精度（最高 10 位）
- **类型安全**：完整的 TypeScript 类型定义
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
CalcInst.setUserOption('outputDecimalPlaces', 3)
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

✅ 目前 90.75% 测试覆盖率，会尽量优化提升到 100%

| File    | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s |
| ------- | ------- | -------- | ------- | ------- | ----------------- |
| main.ts | 90.75   | 91.55    | 100.00     | 90.75   |

💯 所有方法均通过以下验证：

- 边界值处理
- 精度控制
- 异常输入处理
- 缓存命中验证

## 📊 性能特性

| 特性       | 指标                |
| ---------- | ------------------- |
| 精度       | 最高支持 10 位小数  |
| 缓存       | 自动缓存提升性能    |
| 时间复杂度 | O(1) 常量时间复杂度 |
| 初始化耗时 | 0.1ms (基准测试)    |
| 内存占用   | 单例模式优化内存    |

## 🤝 贡献指南

欢迎贡献！请查看我们的贡献指南了解如何参与开发。

## 📄 许可证

Apache License，详情见 [LICENSE](./LICENSE) 文件
