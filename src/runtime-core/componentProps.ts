
const publicPropertiesMap = {
  $el: (instance) => instance.vnode.el,
};

/**
 * 组件代理设置
*/
export const PublicInstanceProxyHandlers = {
  get ({ _: instance }, key) {
    const { setupState, props } = instance
    if (key in setupState) {
      return setupState[key]
    } else if (key in props) {
      return props[key]
    }
    /**
     * 如果访问的key存在在publicPropertiesMap对象中 就是获取publicPropertiesMap[key]的值并且执行返回组件上属性的值
    */
    const publicGetter = publicPropertiesMap[key]
    if (publicGetter) {
      return publicGetter(instance)
    }

  }
}