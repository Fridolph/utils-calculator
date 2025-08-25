type CacheType = 'all' 
  | 'sum' | 'subtractMultiple'
  | 'calcUnitPrice' | 'calcLinePrice'
  | 'percentToDecimal' | 'decimalToPercent'
  | 'calculateDiscountedPrice' | 'computeRate'


type CalcBaseTotalParams = {
  quantity: number | null
  unitPrice: number | null
  linePrice: number | null
}

type BaseOptions = {
  precision: number
  taxRate: number
  rateType: RateType
  runtimePrecision: 10 // 常量不可修改
}

type RateType = 'excl_gst' | 'incl_gst' | 'gst_free'

interface NumberFormatOptions {
  symbol?: string
  separator?: string
  decimal?: string
  precision?: number
  pattern?: string
  negativePattern?: string
  format?: any
  errorOnInvalid?: boolean
  increment?: any
  useVedic?: boolean
  fromCents?: boolean
}

interface CacheStore {
  sum: Map<string, unknown>
  subtractMultiple: Map<string, unknown>
  calcUnitPrice: Map<string, unknown>
  calcLinePrice: Map<string, unknown>
  percentToDecimal: Map<string, unknown>
  decimalToPercent: Map<string, unknown>
  calculateDiscountedPrice: Map<string, unknown>
  computeRate: Map<string, unknown>
}
