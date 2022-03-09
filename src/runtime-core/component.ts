import { patch } from "./render";
import { Component, RootElnemt, VnodeType } from "./vue.dt";


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
  const instance = {
    vnode,
    type: vnode.type,
  }
  return instance
}

/**
 * 初始化组件
 * @instance 组件实例
*/
function setupComponent(instance: any) {
  console.log('初始化组件')
  setupStatefulComponent(instance)

}

/**
 * 初始化有状态的组件
 * @instance 组件实例
*/
function setupStatefulComponent(instance: any) {
  console.log('初始化有状态的组件')

  const Component = instance.type
  console.log(Component, instance, '组件实例')

  const { setup } = Component

  if (setup) {
    const setupResult = setup()
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
    console.log(instance, '=====返回值是object 就给组件实例上添加setupState 属性======')
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
 * 
*/
function setupRenderEffect(instance, vnode, container) {
  
  const subTree = instance.render()

  console.log(instance, vnode, container, '组件处理完成交给patch 处理', subTree)

  patch(subTree, container)

}

