/**
 *初始化属性
 *@instance 组件实例
 *@rawProps  组件Props
*/
export function initProps(instance: any, rawProps: any) {
  instance.props = rawProps || {}
}