import { ShapeFlags } from "../shared/ShapeFlages";
import { isArray } from "../shared/shared";

/**
 * 初始化插槽
 * @instance 组件实例
 * @children 组件子元素
*/
export function initSlots (instance, children ) {

  const { vnode } = instance
  if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
    normalizeObjectSlots(children, instance.slots)
  }

}


function normalizeObjectSlots (children, slots) {

  for (const key in children) {

    const value = children[key]

    slots[key] = (props) => normalizeSlotValue(value(props))

  }
  
}


function normalizeSlotValue(value) {
  return isArray(value) ? value : [value];
}
