import { render } from "./render"
import { createVNode } from "./vnode"


/**
 * 初始化应用 
 * @rootComponent 根组件
*/
export function createApp(rootComponent ) {

  return {
    
    /**
     * 挂载元素
     * @rootContainer 根容器
    */
    mount (rootContainer) {

      /**
       * 创建虚拟节点
      */
      const vnode = createVNode(rootComponent)
      
      /**
       * 基于虚拟节点创建元素
      */
      render(vnode, rootContainer)
      
    }

  }
} 

