export function initProps(instance: any, rawProps: any) {
  // 将组件的虚拟节点的props添加到 组件实力上的props 如果组件的虚拟节点的props不存在就添加一个默认值
  instance.props = rawProps || {}
}