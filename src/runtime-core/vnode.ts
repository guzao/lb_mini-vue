import { ShapeFlages } from "../shared/ShapeFlages"
import { isArray } from "../shared/shared"
import { h } from "./h"
export const Fragment  = Symbol('Fragment')
export const Text  = Symbol('Text')

export function createVNode(type: any, props?: object, children?){
  const vnode = {
    /**根据这个值判断 这个虚拟节点是组件还是 elemnt 类型 */
    type: type,
    /** 属性 */
    props,
    /** 子元素 */
    children,
    /** 虚拟节点挂载的元素 */
    el: null,
    shapeflag: getShapeFlag(type)
  }

  // 继续判断children 是数组类型 还是 string 类型 设置shapeflag
  updateVnodeShapeFlag(vnode, children)
  return vnode
}

function getShapeFlag(type: any) {
  return typeof type === 'string' ?  ShapeFlages.ELEMENT : ShapeFlages.STATEFUL_COMPONENT
}

function updateVnodeShapeFlag (vnode, children) {
  if (typeof children === 'string') {
    vnode.shapeflag |= ShapeFlages.TEXT_CHILDREN
  } else if (isArray(children)) {
    vnode.shapeflag |= ShapeFlages.ARRAY_CHILDREN
  }
  // 1 节点需要是组件类型 
  // 2 CHILDREN 是一个对象类型
  if (vnode.shapeflag & ShapeFlages.STATEFUL_COMPONENT) {
    if (typeof children === 'object') {
      vnode.shapeflag |= ShapeFlages.SLOTS_CHILDREN
    }
  }
}

/** 创建文本虚拟节点 */
export function createTextVNode (children: string) {
  return h(Text, {}, children)
}
