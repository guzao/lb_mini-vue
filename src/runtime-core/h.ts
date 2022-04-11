import { createVNode } from "./vnode";
export function h (type: any, props?: object, children?: any) {
  return createVNode(type, props, children)
}