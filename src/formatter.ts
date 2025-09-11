import { assign } from './utils/assign'

// 定义配置类型
interface FormatterOptions {
  prefix?: string
  suffix?: string
  decimalDigits?: number
  decimalSeparator?: string
  thousandSeparator?: string
}

interface MoneyFormatConfig extends FormatterOptions {
  currencySymbol?: string
}

const defaultFormatConfig: FormatterOptions = {
  prefix: '',
  suffix: '',
  decimalDigits: 2,
  decimalSeparator: '.',
  thousandSeparator: '',
}
Object.seal(defaultFormatConfig)

export class Formatter {
  private static instance: Formatter
  public options: FormatterOptions
  constructor() {
    this.options = { ...defaultFormatConfig }
  }
  public resetInstance() {
    this.options = { ...defaultFormatConfig }
  }
  public setOption<K extends keyof FormatterOptions>(option: K, value: UserOptions[K]) {
    switch (option) {
      case 'decimalDigits':
        this.options.decimalDigits = value as number
        break
      case 'decimalSeparator':
        this.options.decimalSeparator = value as string
        break
      case 'prefix':
        this.options.prefix = value as string
        break
      case 'suffix':
        this.options.suffix = value as string
        break
      case 'thousandSeparator':
        this.options.thousandSeparator = value as string
        break
      default:
        throw new Error(`请查看文档，传入正确的 key , ${option} 字段不存在, 请检查后重试`)
    }
  }

  public getOptions() {
    return this.options
  }

  public static getInstance(): Formatter {
    if (!Formatter.instance) {
      Formatter.instance = new Formatter()
    }
    return Formatter.instance
  }
  /**
   * 根据配置将数字转为特定格式的字符串
   * @param {  Number | String } origin 要格式化的数字
   * @param { FormatterOptions } userOptions 配置参数
   * @returns 格式化后的字符串
   */
  public format(origin: number | string, userOptions?: FormatterOptions): string {
    const mergedOptions = assign(defaultFormatConfig, userOptions)

    let numberStr = Number(origin).toFixed(mergedOptions.decimalDigits)
    const parts = numberStr.split('.')
    let integerPart = parts[0]
    let decimalPart = parts.length > 1 ? parts[1] : ''

    if (mergedOptions.thousandSeparator) {
      integerPart = integerPart.replace(
        /(\d)(?=(\d{3})+(?!\d))/g,
        `$1${mergedOptions.thousandSeparator}`
      )
    }

    numberStr = [integerPart, decimalPart]
      .filter((part) => part)
      .join(mergedOptions.decimalSeparator)

    return `${mergedOptions.prefix}${numberStr}${mergedOptions.suffix}`
  }


  /**
   * 将数字格式化为货币字符串
   * @param numberToFormat 要格式化的数字
   * @param configs 货币配置参数
   * @returns 格式化后的货币字符串
   */
  public formatMoney(originNumber: number | string): string
  public formatMoney(originNumber: number | string, configs?: MoneyFormatConfig): string
  public formatMoney(originNumber: number | string, currencySymbol?: string, locale?: string): string
  public formatMoney(originNumber: number, configsOrSymbol: MoneyFormatConfig, locale: string): string {
    let args = Array.from(arguments)
    let userConfigs = { ...defaultFormatConfig }
    if (args.length === 1) {
      userConfigs.prefix = '$ '
      userConfigs.thousandSeparator = ','
      return this.format(originNumber, userConfigs)
    }
    else if (args.length === 2 && typeof configsOrSymbol === 'object') {
      userConfigs = assign(defaultFormatConfig, configsOrSymbol)
      return this.format(originNumber, userConfigs)
    }
    else if (args.length === 3 && typeof configsOrSymbol === 'string' && typeof locale === 'string') {
      // TODO 处理 symbol 和 locale 逻辑
      return this.format(originNumber)
    }
    else {
      throw new Error('参数错误，请检查参数重试')
    }
  }

  /**
   * 将数字转换为包含多种格式化信息的对象
   * @param numberToFormat 要格式化的数字
   * @param configs 配置参数
   * @returns 包含格式化信息的对象
   */
  public transObject(
    numberToFormat: number,
    configs: FormatterOptions = {}
  ): {
    origin: number
    value: number
    prefix: string
    suffix: string
    decimalDigits: number
    decimalSeparator: string
    thousandSeparator: string
  } {
    const {
      prefix = '',
      suffix = '',
      decimalDigits = 0,
      decimalSeparator = '.',
      thousandSeparator = ',',
    } = configs

    const value = +numberToFormat.toFixed(decimalDigits)

    return {
      origin: numberToFormat,
      value,
      prefix,
      suffix,
      decimalDigits,
      decimalSeparator,
      thousandSeparator,
    }
  }
}

// 使用示例
export const formatterInst = Formatter.getInstance()