import { mutableHandlers, ReactiveFlags, readonlyHandlers } from "./baseHandler"


/**
 * @raw 原始数据 object类型
 * 响应式对象
*/
export function reactive (raw: any) {
  return creayeReactive(raw, mutableHandlers)
}
/** 检测是否是reactive 数据类型
 * @value 需要检查的数据
 */
export function isReactive (value) {
  return !!value[ReactiveFlags.IS_REACTIVE]
}

/**
 * @raw 原始数据 object类型
 * 只读对象
*/
export function readonly (raw: any): any {
  return creayeReactive(raw, readonlyHandlers)
}
/** 检测是否是 readonly 数据类型
 * @value 需要检查的数据
 */
export function isReadonly (value) {
  return !!value[ReactiveFlags.IS_READONLY]
}

/**
 * 初始化Proxy 代理对象
 * @raw 需要代理的数据
 * @mutableHandlers Proxy代理对象的 get set 处理函数
*/
function creayeReactive (raw: object, mutableHandlers) {
  return new Proxy(raw, mutableHandlers)
}
