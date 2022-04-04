import { getCurrentInstance } from "./component";

export function provide (key: string, value: any) {
  const currentInstance = getCurrentInstance()
  // 当前组件的provides  ==> 初始化时指向了父组件的provides 
  if (currentInstance) {
    let { provides } = currentInstance
    let parentProvides = currentInstance.parent.provides
    // 初始化的时候 当前组件的provides 指向了父组件的provides
    // 每次执行Object.create的时候相当于重置了当前的组件的provides 的propotye所以只需要初始化一次即可
    if (provides == parentProvides) {
      // 将当前组件的 provides的原型指向父组件的 provides
      provides = currentInstance.provides = Object.create(parentProvides)
    }
    provides[key] = value
  }
}

/**
 * * @defaultValue 默认参数 也可以是函数
*/
export function inject (key: string, defaultValue: any) {
  const currentInstance = getCurrentInstance()
  if (currentInstance) {
    const { provides } = currentInstance
    if (key in provides) {
      return provides[key]
    } else {
      if (defaultValue) {
        if (typeof defaultValue === 'function') {
          return defaultValue()
        }
        return defaultValue
      }
    }
  }
}