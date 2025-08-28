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

type UserOptions = {
  /**
   * @remarks
   * 是否以传参的 小数精度最为最后的计算结果精度，如 0.22225 + 0.22225 = 0.44450
   * 若不保留，按默认 precision: 2 来呈现最终结果 -> 0.44
   */
  keepParamsMaxPrecision: boolean 
  outputDecimalPlaces: number
  taxRate: number
  rateType: RateType
}

type RateType = 'excl_gst' | 'incl_gst' | 'gst_free'

interface NumberFormatOptions {
  symbol?: string
  separator?: string
  decimal?: string
  precision?: number
  pattern?: string
  negativePattern?: string
  format?: unknown
  errorOnInvalid?: boolean
  increment?: unknown
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
