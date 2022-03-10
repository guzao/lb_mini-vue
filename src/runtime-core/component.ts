import { shallowReadonly } from "../resctivite";
import { emit } from "./componentEmit";
import { initProps } from "./componentProps";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { patch } from "./render";
import { RootElnemt, VnodeType } from "./vue.dt";


/**
 * 处理组件
 * @vnode 虚拟节点
 * @container 节点挂载的容器
*/
export function processComponent(vnode: VnodeType, container: RootElnemt): void {
  console.log('处理组件')
  mountComponent(vnode, container)
}


/**
 * 挂载组件
 * @vnode 虚拟节点
 * @container 节点挂载的容器
*/
export function mountComponent(vnode: VnodeType, container: RootElnemt): void {
  console.log('挂载组件')
  const instance = createComponentInstance(vnode, container )

  console.log(instance,'=========组件实例======')

  setupComponent(instance)

  setupRenderEffect(instance, vnode, container)
}

/**
 * 创建组件实例
 * @vnode 虚拟节点
 * @container 节点挂载的容器
*/
export function createComponentInstance(vnode: VnodeType, container: RootElnemt) {
  console.log('创建组件实例')
  const Component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    /** emit事件  */
    emit: () => {}
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
  console.log('初始化组件')
  initProps(instance, instance.vnode.props)
  setupStatefulComponent(instance)
}




/**
 * 初始化有状态的组件
 * @instance 组件实例
*/
function setupStatefulComponent(instance: any) {


  instance.proxy = new Proxy({_: instance}, PublicInstanceProxyHandlers)

  console.log('初始化有状态的组件')

  const Component = instance.type
  console.log(Component, instance, '组件实例')

  const { setup } = Component

  if (setup) {
    const props = instance.props
    // 在setup 中可以获取到组件props数据
    const setupResult = setup(shallowReadonly(props), {
      emit: instance.emit,
    })
    handleSetupResult(instance, setupResult)
  }
}

/**
 * 处理组件返回值
*/
function handleSetupResult(instance, setupResult: any) {
  console.log('处理setup函数的返回值', setupResult)

  // TODO function

  // object
  if (typeof setupResult == 'object') {
    instance.setupState = setupResult
    console.log('=====返回值是object 就给组件实例上添加setupState 属性======')
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

  console.log(instance, '===确保组件拥有render 函数===')
}

/**
 * 组件处理完成交给patch
*/
function setupRenderEffect(instance, vnode, container) {

  const { proxy } = instance

  // 组件代理 proxy组件代理对象
  const subTree = instance.render.call(proxy)

  console.log('组件处理完成交给patch 处理', subTree)

  patch(subTree, container)
  vnode.el = subTree.el

}



