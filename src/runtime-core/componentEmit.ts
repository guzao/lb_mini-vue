import { camelize, capitalize, toHandlerKey } from "../shared/shared";

/**
 * emit
 * @ 组件实例通过bind函数已经将instance参数填充完成 调用时直接传入事件名称即可
*/
export function emit (instance, event, ...args: [any] /** 事件触发传入的参数 */){

  const { props } = instance

  const handlerName = toHandlerKey(camelize(event))

  const handler = props[handlerName]

  handler && handler(...args)

}
