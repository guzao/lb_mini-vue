import { Component,  VnodeType } from "./vue.dt"

/**
 * 创建虚拟节点
 * @type  类型
 * @props 属性
 * @children 子元素
*/
export function createVNode(type: string | object, props?: string | Array<Component>, children?: string | Array<Component| VnodeType>): Component | VnodeType {
  console.log('创建虚拟节点')
  const vnode = {
    type,
    props,
    children,
  }
  return vnode
}
