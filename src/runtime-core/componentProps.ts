
const publicPropertiesMap = {
  $el: (i) => i.vnode.el,
};


/**
 * 组件代理设置
*/
export const PublicInstanceProxyHandlers = {
  get ({ _: instance }, key) {
    const { setupState, el } = instance
    if (key in setupState) {
      return setupState[key]
    }
    const publicPropertiesKey = publicPropertiesMap[key]
    if (publicPropertiesKey) {
      return publicPropertiesKey(instance)
    }
  }
}