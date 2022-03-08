/**
 * 生成虚拟节点
 * @type      组件
 * @props     属性
 * @children  子元素
*/
export function createVNode(type, props?, children?) {
  const vnode = {
    type,
    props,
    children
  }
  return vnode
}
