import { render } from "./render"
import { createVNode } from "./vnode"

export function createApp (rootComponent: any) {
  return {
    mount (rootContainer: Element) {
      // 
      const vnode = createVNode(rootComponent)

      // 
      render(vnode, rootContainer)
    }
  }
}




