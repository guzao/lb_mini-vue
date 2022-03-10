import { createVNode } from "../vnode";
/**
 * 渲染插槽
 * @slots 插槽
*/
export function renderSlots (slots) {
  return createVNode('div', {}, slots)
}