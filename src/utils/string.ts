/**
 * 获取一个 Number | 类数字字符串的 小数位数
 * @param num
 * @returns
 */
/**
 * 获取一个 `Number` | 类数字字符串的小数位数
 *
 * @param num 输入的数字或类数字字符串
 * @returns 返回小数位数，若小数位数小于等于2，则返回2
 *
 * @description
 * 此函数用于确定给定输入的小数位数。输入可以是数字或是可以被解析为数字的字符串。
 * 函数首先将输入转换为数字字符串，然后根据字符串是否包含科学计数法的 `e-` 进行不同的处理。
 * 处理科学计数法时，会考虑系数部分的小数位数与指数部分表示的缩放，以得到准确的小数位数。
 * 对于非科学计数法的数字字符串，直接提取小数点后的部分长度作为小数位数。
 */
export const getDecimalPlaces = (num: number | string, defaultPlaces = 0): number => {
  const numString = Number(num).toString()
  // console.log('num: ', num, '\nnumString: ', numString)

  if (numString.includes('e-')) {
    // 处理科学计数法
    const [coefficient, exponentStr] = numString.split('e-')
    const exponent = Number(exponentStr)
    // 将系数部分转换为普通数字形式
    const coefficientPart = Number(coefficient)
    const coefficientStr = coefficientPart.toFixed(0).replace(/^0+(?!$)/, '')
    const coefficientDecimalPlaces =
      coefficientPart.toString().split('.')[1]?.length || 0
    // 计算总的小数位数
    const totalDecimalPlaces = coefficientDecimalPlaces + exponent
    return totalDecimalPlaces
  } else {
    // 处理非科学计数法
    const decimalPart = numString.split('.')[1]
    const decimalPlaces = decimalPart?.length || 0
    // 如果小数位数小于等于2，则返回2
    return decimalPlaces <= defaultPlaces ? defaultPlaces : decimalPlaces
  }
}
