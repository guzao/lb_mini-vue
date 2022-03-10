/** 组件 */
export type Component = {
  /** type 是sting 标识是dom元素 */
  type: string | object,
  /** 组件属性 或者 dom元素属性 */ 
  props?: {},
  /** 子元素 或者 组件类型 */ 
  children?: string | Array<Component>
} 

/** 虚拟节点 */
export type VnodeType = {
  /** type 是sting 标识是dom元素 */
  type: string | object,
  /** 组件属性 或者 dom元素属性 */ 
  props?: {},
  /** 子元素 或者 组件类型 */ 
  children?: string | Array<Component>
} 

/** 虚拟节点挂载的容器 */
export type RootElnemt = Element | string