/**
 * 获取一个 Number | 类数字字符串的 小数位数
 * @param num 
 * @returns 
 */
export const getDecimalPlaces = (num: number | string) => {
  const numString = Number(num).toString()
  if (numString.includes('e-')) {
    return Number(numString.split('e-')?.[1])
  }
  else {
    const decimalPlaces = num?.toString().split('.')[1]?.length || 0
    return decimalPlaces <= 2 ? 2 : decimalPlaces
  }
}
