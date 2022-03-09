import { PublicInstanceProxyHandlers } from "./componentProps"

/**
 * 实例化在组件
 * @vnode 虚拟节点
 * 
*/
export function createComponentInstance (vnode: any) {

  const Component = {
    /** 虚拟节点 */
    vnode,
    /***/
    type: vnode.type,
    /** setup 函数的返回值 */
    setupState: {},
    /** 组件挂载的节点 */
    el: null
  }
  return Component

}

/**
 * 设置组件
 * @vnode 虚拟节点
 * 
*/
export function setupComponent (instance: any) {

  /**
   * 组件
  */
  setupStatefulComponent(instance)

}

/**
 * 初始化有状态的组件
 * @instance 组件实例
*/
function setupStatefulComponent(instance: any) {

  const Component = instance.type
 
  // 实现组件代理  instance 组件实例
  instance.proxy = new Proxy({_: instance }, PublicInstanceProxyHandlers)

  /**
   * 用户传入的 setup 函数执行后可以得到数据 或视图
  */
  const { setup } = Component

  if (setup) {

    const setupResult = setup()

    handleSetupResult(instance, setupResult)

  }

}

/**
 * 处理组件 setup 函数返回的结果
 * @instance 组件实例
 * @setupResult  setup函数返回值
*/
function handleSetupResult(instance, setupResult: any) {

  // function Object

  // TODO function

  if (typeof setupResult === "object") {
    /**
     * 实例上添加 setup 函数执行返回的结果
    */
    instance.setupState = setupResult
  }
  /**
   * 刷新组件 确保组件拥 render 函数
  */
  finishComponentSetup(instance)
}

/**
 * 刷新组件 组件上绑定 render函数
 * @instance 组件实例
*/
function finishComponentSetup(instance: any) {

  const Component = instance.type

  instance.render = Component.render

}