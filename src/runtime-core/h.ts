import { createVNode } from "./vnode";

/**
 * 生成虚拟节点
 * @type      组件
 * @props     属性
 * @children  子元素
*/
export function h (type, props?, children?) {
  return createVNode(type, props, children)
}
