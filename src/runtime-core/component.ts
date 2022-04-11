import { proxyRefs } from "../resctivite"
import { shallowReadonly } from "../resctivite/reactive"
import { isObject } from "../shared/shared"
import { emit } from "./componentEmit"
import { initProps } from "./componentProps"
import { PublicInstanceProxyHandlers } from "./componentPublicInstance"
import { initSlots } from "./componentSlots"

/** 临时存储组件的实例 */ 
let currentInstance = null


/** 创建组件实例 将vnoe 上的数据 经过处理添加到 组件上 */
export function createComponentInstance(vnode: any, parent) {
  const component = {
    /** 组件是否已经被挂载过 */
    isMounted: false,
    /** 虚拟节点 */
    vnode,
    /**  */
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
    slots: [],
    /** 当前组件的依赖注入 */
    provides: parent ? parent.provides : {},
    /** 当前组件得父级组件 */
    parent,
  }  
  /** 重写emit方法 将参数1传入emit内 */
  component.emit = emit.bind(null, component)
  return component
}

/** 初始化组件 初始化对应的 props  slots  初始化渲染函数 */
export function setupComponent(instance: any) {
  // 初始化属性
  initProps(instance, instance.vnode.props)

  // 初始化插槽
  initSlots(instance, instance.vnode.children)

  // 设置组件渲染函数
  setupStatefulComponent(instance)
}

/** 初始化有状态的组件的 调用组件的 */
function setupStatefulComponent(instance: any) {
  /** 组件 */ 
  const Component = instance.type
  
  const { setup } = Component

  // 创建组件的代理对象
  instance.proxy = new Proxy({_: instance}, PublicInstanceProxyHandlers)
  
  if (setup) {
    setCurrentInstance(instance)
    let setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit
    })
    setCurrentInstance(null)
    handleSetupResult(instance, setupResult)
  }
}

<<<<<<< HEAD
/**
 * 处理组件返回值
*/
function handleSetupResult(instance, setupResult: any) {
  console.log('处理setup函数的返回值', setupResult)

  // TODO function

  // object
  if (typeof setupResult == 'object') {
    instance.setupState = setupResult
    console.log('=====返回值是object 就给组件实例上添加setupState 属性====   [git]  ==')
=======
function handleSetupResult(instance: any, setupResult: any) {
  if (isObject(setupResult)) {
    instance.setupState = proxyRefs(setupResult)
  } else {
>>>>>>> lb-dev
  }
  finishComponentSetup(instance)
}

function finishComponentSetup(instance: any) {
  const Component = instance.type
  instance.render = Component.render
}


/**
 * 获取当前组件的实例
 * 函数会在创建组件实例的时候执行 
*/
export function getCurrentInstance () {
  return currentInstance
}

/**
 * 通过这个函数修改 组件的实例
*/
function setCurrentInstance (value) {
  currentInstance = value
}


