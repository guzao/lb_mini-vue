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
  }
  return vnode
}