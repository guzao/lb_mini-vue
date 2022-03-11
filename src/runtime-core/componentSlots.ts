import { isArray } from "../shared/shared";

/**
 * 初始化插槽
 * @instance 组件实例
 * @children 组件子元素
*/
export function initSlots (instance, children, ) {

  const slots = {}

  for (const key in children) {

    const value = children[key]

    slots[key] = (props) => normalizeSlotValue(value(props))

  }

  instance.slots = slots

}


function normalizeSlotValue(value) {
  return Array.isArray(value) ? value : [value];
}
