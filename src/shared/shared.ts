
/**
 * 数据是否是对象
 * @data 数据源
*/
export function isObject (data) {
  return typeof data == 'object' && data !== null
}
/**
 * 数据是否发生变化
 * @value 旧值
 * @newValue 新值
*/
export function hasChanged (value: any, newValue: any): boolean {
  return !Object.is(value, newValue)
}

/**
 * 对象合并
*/
export const extend =  Object.assign

/**
 * 是否是数组
*/
export const isArray = Array.isArray