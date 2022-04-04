import { shallowReadonly } from "../resctivite"
import { isObject } from "../shared/shared"
import { emit } from "./componentEmit"
import { initProps } from "./componentProps"
import { PublicInstanceProxyHandlers } from "./componentPublicInstance"
import { initSlots } from "./componentSlots"

export function createComponentInstance(vnode: any) {
  const component = {
    /** 虚拟节点 */
    vnode,
    
    type: vnode.type,
    /** 组件的属性 */
    props: {},
    /** 组件setup 返回的数据 */ 
    setupState: {},
    /** 组件代理对象 方便用户 直接通过 this.xxx 访问组件的数据 */
    proxy: null,
    /** 组件emit 事件 */
    emit: () => {},
    /** 组件的插槽 */
    slots: []
  }  
  /** 重写emit方法 将参数1传入emit内 */
  component.emit = emit.bind(null, component)
  return component
}

 
export function setupComponent(instance: any) {
  // 初始化属性
  initProps(instance, instance.vnode.props)

  // 初始化插槽
  initSlots(instance, instance.vnode.children)

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
    
    let setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit
    })

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



