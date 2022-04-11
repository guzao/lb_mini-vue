
/** 虚拟节点 */
export type VNode = {
  /** type 是sting 标识是dom元素 */
  type: string | object,
  /** 组件属性 或者 dom元素属性 */ 
  props?: {},
  /** 子元素 或者 组件类型 */ 
  children?: string | Array<VNode>
} 

