import { createVNode } from "./vnode"

export function createdApp(rootComponent): any {
  return {
    mount (rootContainer) {
      createVNode(rootComponent)
    }
  }
} 

