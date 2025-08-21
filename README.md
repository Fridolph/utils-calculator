# utils-calculator 

`utils-calculator` 是一个强大的实用工具库，旨在通过智能缓存机制简化数值计算并提升性能。本库提供了全面的 `Calculator` 类，具备多个计算和缓存功能，以满足各种应用需求。 

## 功能特点
- **丰富计算方法**：`Calculator` 类包含广泛的计算方法，适用于不同类型的运算。从基本算术运算到更复杂的计算，本库都能满足您的需求。 
- **高效缓存机制**：内置的缓存功能确保频繁计算的值被存储和检索，显著减少冗余计算。这不仅加速了计算过程，还优化了资源利用。 
- **灵活缓存查询**：`queryCacheStat` 方法允许开发者获取关于缓存的详细统计信息，便于更好地管理缓存和优化性能。 

> 不得不说现在 AI 辅助工具是真的强大，就当自娱自乐了。

## 安装 
通过 npm 安装 `utils-calculator`： 
```bash 

npm install utils-calculator 

``` 

## 使用示例 

以下是在项目中使用 `utils-calculator` 的简单示例： 

### JavaScript 示例 
```javascript 
const Calculator = require('utils-calculator'); 

// 创建 Calculator 实例 
const calculator = new Calculator(); 

// 执行计算并使用缓存功能 
// 例如，使用求和计算方法和缓存 
const result = calculator.sum([1, 2, 3]); 

// 查询缓存统计信息 
const cacheStats = calculator.queryCacheStat(); 
console.log(cacheStats); 
``` 

### TypeScript 示例 
```typescript 
import Calculator from 'utils-calculator'; 

// 创建 Calculator 实例 
const calculator: Calculator = new Calculator(); 

// 执行计算并使用缓存功能 
// 例如，使用求和计算方法和缓存 
const result: number = calculator.sum([1, 2, 3]); 

// 查询缓存统计信息 
const cacheStats = calculator.queryCacheStat(); 
console.log(cacheStats); 
``` 

## API 参考 
### `Calculator` 类 
`utils-calculator` 库的核心。 

#### 方法 
- **`sum(numbers: number[])`**：计算数字数组的总和。此方法还利用内部缓存来提高重复计算的性能。 
- **`calcUnitPrice(totalPrice: number, quantity: number)`**：根据总价和数量计算单价。会应用缓存以实现高效复用。 
- **`calcLinePrice(unitPrice: number, quantity: number)`**：根据单价和数量确定行价格。缓存机制可优化性能。 
- **`percentToDecimal(percent: number)`**：将百分比值转换为小数。缓存结果可加快计算速度。 
- **`decimalToPercent(decimal: number)`**：将小数值转换为百分比。缓存功能可提升重复转换的性能。 
- **`calculateDiscountedPrice(originalPrice: number, discountRate: number)`**：根据原价和折扣率计算折扣价格。使用缓存以避免冗余计算。 
- **`computeRate(part: number, whole: number)`**：计算部分相对于整体的比率。使用缓存值快速检索结果。 
- **`queryCacheStat(cacheType?: 'all' |'sum' | 'calcUnitPrice' | 'calcLinePrice' | 'percentToDecimal' | 'decimalToPercent' | 'calculateDiscountedPrice' | 'computeRate')`**：获取缓存的统计信息。 
  - 如果未提供 `cacheType` 或 `cacheType === 'all'`，它将返回所有缓存类型的大小。 
  - 如果提供了特定的 `cacheType`，它将返回该特定缓存的大小。 

### 类型 
本库附带完整的 TypeScript 类型定义。如果在项目中使用 TypeScript，它将提供准确的类型信息，以确保更可靠的开发体验。 

## 贡献指南 
欢迎为 `utils-calculator` 做出贡献！ 如果您发现错误、有改进的想法或想要贡献代码，请遵循以下步骤： 
1. 派生仓库。 
2. 为您的功能或错误修复创建新分支（`git checkout -b your-feature-or-fix`）。 
3. 进行更改并确保它们经过适当测试。 
4. 使用描述性的提交消息提交更改（`git commit -m '添加新功能或修复某个问题'`）。 
5. 将您的分支推送到派生的仓库（`git push origin your-feature-or-fix`）。 
6. 在原始仓库中打开拉取请求，详细描述您的更改。 

## 许可 
本项目遵循 MIT 许可 - 详情请参阅 [LICENSE](LICENSE) 文件。 

## 技术支持 
如果您在使用 `utils-calculator` 过程中遇到任何问题或有疑问，请随时在 [GitHub 仓库](https://github.com/your - repository - url) 上提出问题。 

希望这个库能丰富您的开发体验并简化您的计算需求！  
