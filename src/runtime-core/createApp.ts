import { createVNode } from "./vnode"

export function createAppAPI (render) {
  return function createApp (rootComponent: any) {
    return {
      mount (rootContainer: Element) {

        const vnode = createVNode(rootComponent)
  
        render(vnode, rootContainer)
      }
    }
  }
}





