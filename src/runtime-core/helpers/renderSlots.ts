import { createVNode } from "../vnode";

/**
 * 渲染插槽
 * @slots 插槽
 * @slotNmae 插槽名称
 * @props 
*/
export function renderSlots (slots, slotNmae: string, props? ) {

  // 获取指定子元素
  const slot = slots[slotNmae]
  if (slot) {
    if (typeof slot == 'function') {
      return createVNode('div', {}, slot(props))
    }
  }

}