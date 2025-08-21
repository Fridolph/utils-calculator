type CacheType = 'all' | 'sum' | 'calcUnitPrice' | 'calcLinePrice' |
  'percentToDecimal' | 'decimalToPercent' | 'calculateDiscountedPrice' | 'computeRate'

type CalcBaseTotalParams = {
  quantity: number | null
  unitPrice: number | null
  linePrice: number | null
}

type BaseOptions = {
  precision?: number
  taxRate?: number
  rateType?: RateType
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
