import { ShapeFlags } from "../shared/ShapeFlages"
import { Component,  VnodeType } from "./vue.dt"
/**
 * 创建虚拟节点
 * @type  类型
 * @props 属性
 * @children 子元素
*/
export function createVNode(type: string | object, props?, children?: string | Array<Component| VnodeType>): Component | VnodeType {
  console.log('创建虚拟节点')
  const vnode = {
    type,
    props,
    children,
    el: null,
    /** 标识组件类型  */
    shapeFlag: getShapeFlag(type)
  }

  /** 标识子元素类型 */
  if (typeof children === "string") {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
  } else if (Array.isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  }

  return vnode
  
}

function getShapeFlag(type) {
  return typeof type === 'string' 
  ? ShapeFlags.ELEMENT
  : ShapeFlags.STATEFUL_COMPONENT
}
