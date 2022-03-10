import { hasOwn } from "../shared/shared"

/**
 * 
*/
const publicPropertiesMap = {
  $el: (instance) => instance.vnode.el,
  $slots: (instance) => instance.slots,
}

/**
 * 组件代理处理函数
*/
export const PublicInstanceProxyHandlers = {
  get ({_: instance}, key: any) {

    const { setupState, props } = instance

    if (hasOwn(setupState, key)) {
      return setupState[key]
    } else if (hasOwn(props, key)) {
      return props[key]
    }

    const publicGetter = publicPropertiesMap[key];
    if (publicGetter) {
      return publicGetter(instance);
    }

  }
}