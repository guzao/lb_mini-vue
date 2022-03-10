
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

/***
 * 检测属性是否存在在当前对象上
 * @value object
 * @key   属性
*/
export const hasOwn = (value, key: string) =>  Object.prototype.hasOwnProperty.call(value, key)

/**
 * 属性是否是以on开头
 * @key 属性key'
*/
export function isON (key: string) {
  return /^on[A-Z]/.test(key)
}


/**
 * 对象合并
*/
export const extend =  Object.assign

/**
 * 是否是数组
*/
export const isArray = Array.isArray
