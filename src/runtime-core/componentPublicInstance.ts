import { hasOwn } from "../shared/shared"

const publicPropertiesMap = {
  $el: (instance) => instance.vnode.el,
  $slots: (instance)=> instance.slots
}

export const PublicInstanceProxyHandlers = {

  get ({ _: instance }: any, key: any) {

    const { setupState ,props } = instance
    if (hasOwn(setupState, key)) {
      return setupState[key] 
    } else if (hasOwn(props, key)) {
      return props[key] 
    } 

    const publicGetter = publicPropertiesMap[key]
    if (publicGetter) {
      return publicGetter(instance)
    }

  }
  
}