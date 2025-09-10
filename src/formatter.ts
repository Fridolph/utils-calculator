import { assign } from './utils/assign'

// 定义配置类型
interface FormatConfig {
  prefix?: string
  suffix?: string
  decimalDigits?: number
  decimalSeparator?: string
  thousandSeparator?: string
}

interface MoneyFormatConfig extends FormatConfig {
  currencySymbol?: string
}

const defaultFormatConfig: FormatConfig = {
  prefix: '',
  suffix: '',
  decimalDigits: 2,
  decimalSeparator: '.',
  thousandSeparator: '',
}

export class Formatter {
  /**
   * 根据配置将数字转为特定格式的字符串
   * @param {  Number | String } origin 要格式化的数字
   * @param { FormatConfig } userOptions 配置参数
   * @returns 格式化后的字符串
   */
  public format(origin: number | string, userOptions?: FormatConfig): string {
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
  public formatMoney(numberToFormat: number, configs: MoneyFormatConfig = {}): string {
    const {
      currencySymbol = '$',
      decimalDigits = 2,
      decimalSeparator = '.',
      thousandSeparator = ',',
    } = configs

    let numberStr = numberToFormat.toFixed(decimalDigits)
    const parts = numberStr.split('.')
    let integerPart = parts[0]
    let decimalPart = parts.length > 1 ? parts[1] : ''

    if (thousandSeparator) {
      integerPart = integerPart.replace(
        /(\d)(?=(\d{3})+(?!\d))/g,
        `$1${thousandSeparator}`
      )
    }

    numberStr = [integerPart, decimalPart]
      .filter((part) => part)
      .join(decimalSeparator)

    return `${currencySymbol} ${numberStr}`
  }

  /**
   * 将数字转换为包含多种格式化信息的对象
   * @param numberToFormat 要格式化的数字
   * @param configs 配置参数
   * @returns 包含格式化信息的对象
   */
  public transObject(
    numberToFormat: number,
    configs: FormatConfig = {}
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
export const formatterInst = new Formatter()