import { createVNode } from "./vnode";
import { Component, VnodeType } from "./vue.dt";

export function h (type: string | object, props?: string | Array<Component>, children?: string | Array<Component>): Component | VnodeType {
  return createVNode(type, props, children)
}