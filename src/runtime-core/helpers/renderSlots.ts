import { createVNode } from "../vnode";

/**
 * 渲染插槽
 * @slots 插槽
 * @slotNmae 插槽名称
*/
export function renderSlots (slots, slotNmae: string) {

  // 获取指定子元素
  const currentSlot = slots[slotNmae]
  
  return createVNode('div', {}, currentSlot)

}