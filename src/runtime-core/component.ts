import { isObject } from "../shared/shared"
import { PublicInstanceProxyHandlers } from "./componentPublicInstance"

export function createComponentInstance(vnode: any) {
  const component = {
    vnode,
    type: vnode.type,
    props: {},
    /** 组件setup 返回的数据 */ 
    setupState: {},
    /** 组件代理对象 方便用户 直接通过 this.xxx 访问组件的数据 */
    proxy: null,
  }  
  return component
}

 
export function setupComponent(instance: any) {
  // 初始化属性

  // 初始化插槽

  // 设置组件渲染函数
  setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: any) {
  /** 组件 */ 
  const Component = instance.type
  
  const { setup } = Component

  // 创建组件的代理对象
  instance.proxy = new Proxy({_: instance}, PublicInstanceProxyHandlers)
  
  if (setup) {
    let setupResult = setup()
    handleSetupResult(instance, setupResult)
  }
}
function handleSetupResult(instance: any, setupResult: any) {

  if (isObject(setupResult)) {
    instance.setupState = setupResult
  } else {
  }

  finishComponentSetup(instance)
}

function finishComponentSetup(instance: any) {
  const Component = instance.type
  instance.render = Component.render
}

