import { shallowReadonly } from "../resctivite";
import { emit } from "./componentEmit";
import { initProps } from "./componentProps";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { initSlots } from "./componentSlots";
import { patch } from "./render";
import { RootElnemt, VnodeType } from "./vue.dt";


/**
 * 处理组件
 * @vnode 虚拟节点
 * @container 节点挂载的容器
*/
export function processComponent(vnode: VnodeType, container: RootElnemt): void {
  console.log('   <<<<<<<<<<<处理组件>>>>>>>>>>>>>')
  mountComponent(vnode, container)
}


/**
 * 挂载组件
 * @vnode 虚拟节点
 * @container 节点挂载的容器
*/
export function mountComponent(vnode: VnodeType, container: RootElnemt): void {
  const instance = createComponentInstance(vnode, container )

  setupComponent(instance)

  setupRenderEffect(instance, vnode, container)
}

/**
 * 创建组件实例
 * @vnode 虚拟节点
 * @container 节点挂载的容器
*/
export function createComponentInstance(vnode: VnodeType, container: RootElnemt) {
  const Component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    /** 插槽 */
    slots: {},
    /** emit事件  */
    emit: () => {},
  }

  /** 通过bind函数使用Component 作为函数的第一个参数 */
  Component.emit = emit.bind(null, Component)
  
  return Component
}

/**
 * 初始化组件
 * @instance 组件实例
*/
function setupComponent(instance: any) {
  
  initProps(instance, instance.vnode.props)

  initSlots(instance, instance.vnode.children)

  setupStatefulComponent(instance)

}



/**
 * 初始化有状态的组件
 * @instance 组件实例
*/
function setupStatefulComponent(instance: any) {

  instance.proxy = new Proxy({_: instance}, PublicInstanceProxyHandlers)

  const Component = instance.type

  const { setup } = Component

  if (setup) {
    setCurrentInstance(instance)
    const props = instance.props
    // 在setup 中可以获取到组件props数据
    const setupResult = setup(shallowReadonly(props), {
      emit: instance.emit,
    })
    handleSetupResult(instance, setupResult)
    setCurrentInstance(null)
  }
}

/**
 * 处理组件返回值
*/
function handleSetupResult(instance, setupResult: any) {

  // TODO function

  // object
  if (typeof setupResult == 'object') {
    instance.setupState = setupResult
  }

  finishComponentSetup(instance)

}

/**
 * 确保组件拥有render 函数
 * @instance 组件实例
*/
function finishComponentSetup(instance: any) {
  const Component = instance.type

  instance.render = Component.render

}

/**
 * 组件处理完成交给patch
*/
function setupRenderEffect(instance, vnode, container) {

  const { proxy } = instance

  // 组件代理 proxy组件代理对象
  const subTree = instance.render.call(proxy)

  console.log('      组件处理完成获得subtree 交给patch处理')

  patch(subTree, container)
  vnode.el = subTree.el

}

/** 全局变量临时存储 组件实例 */
let currentInstance = null
/**
 * 获得当前组件实例
*/
export function getCurrentInstance () {
  return currentInstance
}
function setCurrentInstance (instance) {
  currentInstance = instance
}



