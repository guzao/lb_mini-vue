import { render } from "./render"
import { createVNode } from "./vnode"
import { Component, RootElnemt } from "./vue.dt"


/**
 * 初始化应用
 * @rootComponent 根组件
*/
export function createApp (rootComponent: Component) {
  console.log('初始化应用')
  return {

    /** 挂载应用 */
    mount (rootContainer: RootElnemt) {
      console.log('挂载应用')
      /**
       * 虚拟节点
      */
      const vnode = createVNode(rootComponent)
      console.log(vnode, 'vnode, ========= 虚拟节点 ========')
      /**
       * 基于虚拟节点执行后续操作
      */
      render(vnode, rootContainer)

    }

  }
}


