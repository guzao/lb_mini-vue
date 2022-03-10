export const enum ShapeFlags {

  /** element 元素  0001 */
  ELEMENT = 1,

  /** 组件类型 0010*/ 
  STATEFUL_COMPONENT = 1 << 1,

  /** 文本节点  0100*/ 
  TEXT_CHILDREN = 1 << 2,

  /** 数组节点  1000*/ 
  ARRAY_CHILDREN = 1 << 3, 

}