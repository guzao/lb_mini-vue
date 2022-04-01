const publicPropertiesMap = {
  $el: (instance) => instance.vnode.el
}

export const PublicInstanceProxyHandlers = {
  get ({ _: instance }: any, key: any) {
    const { setupState, vnode } = instance
    if (key in setupState) {
      return setupState[key] 
    }

    const publicGetter = publicPropertiesMap[key]
    if (publicGetter) {
      return publicGetter(instance)
    }
  }
}