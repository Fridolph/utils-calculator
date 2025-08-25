**utils-calculator**

***

# utils-calculator 🧮

[![Tests](https://img.shields.io/badge/tests-passing-brightgreen)](https://github.com/Fridolph/utils-calculator)
[![npm version](https://img.shields.io/npm/v/utils-calculator)](https://www.npmjs.com/package/utils-calculator)
[![License](https://img.shields.io/npm/l/utils-calculator)](https://github.com/Fridolph/utils-calculator/blob/main/LICENSE)

基于TypeScript的高性能计算工具库，提供多种计算方法和缓存优化机制，适用于金融、电商等需要高精度计算的场景。

## 特性 ✨

- **单例模式**：避免重复实例化开销
- **缓存机制**：自动缓存计算结果，提升重复计算性能
- **精度控制**：支持运行时动态调整计算精度（最高8位）
- **类型安全**：完整的TypeScript类型定义
- **多计算场景**：支持加减、百分比转换、税率计算等常用场景

## 安装 📦

```bash
npm install utils-calculator
```

## 使用示例 🚀

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

## API 文档 📚

完整API文档请查看：中文文档 | English Docs

贡献指南 🤝
欢迎贡献！请阅读我们的贡献指南了解如何参与开发。

许可证 📄
MIT License，详情见 LICENSE 文件
