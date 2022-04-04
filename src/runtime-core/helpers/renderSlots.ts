import { createVNode } from "../vnode";
export function renderSlots (slots: any, name: string, props) {
  let slot = slots[name]
  if (slot) {
    if (typeof slot === 'function') {
      return createVNode('div', {}, slot(props))
    }
  }
}