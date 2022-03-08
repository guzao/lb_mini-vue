import { render } from "./render"
import { createVNode } from "./vnode"

export function createdApp(rootComponent): any {
  return {
    mount (rootContainer) {

      const vnode = createVNode(rootComponent)
      
      render(vnode, rootContainer)
      
    }
  }
} 

