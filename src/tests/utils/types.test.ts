import { isObject } from "../../utils/type"

describe.skip('isObject', () => {
  it('isObject 识别 null 为非对象', () => {
    expect(isObject(null)).toBe(false)
  })
})
