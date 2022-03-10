import { isArray } from "../shared/shared";

/**
 * 初始化插槽
 * @instance 组件实例
 * @children 组件子元素
*/
export function initSlots (instance, children) {
  instance.slots = isArray(children) ? children : [ children ]
}