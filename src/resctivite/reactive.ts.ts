import { mutableHandlers, readonlyHandlers } from "./baseHandler"



/**
 * @raw 原始数据 object类型
 * 响应式对象
*/
export function reactive (raw: any) {
  return new Proxy(raw, mutableHandlers)
}

/**
 * @raw 原始数据 object类型
 * 只读对象
*/
export function readonly (raw: any): any {
  return new Proxy(raw, readonlyHandlers)
}
