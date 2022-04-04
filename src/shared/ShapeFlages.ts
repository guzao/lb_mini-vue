export const enum ShapeFlages {
  /** 元素类型 */
  ELEMENT = 1,
  /** 组件类型 */
  STATEFUL_COMPONENT = 1 << 1 ,
  /** children 是string类型 */
  TEXT_CHILDREN = 1 << 2,
  /** children 数组类型 */
  ARRAY_CHILDREN = 1 << 3,
  /** 插槽 */
  SLOTS_CHILDREN = 1 << 4
}

