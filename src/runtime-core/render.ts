import { createComponentInstance, setupComponent } from "./component";

/**
 * @vnode 虚拟节点
 * @container 挂载的容器
*/
export function render (vnode, container) {
  patch(vnode, container)
}

/**
 * 处理subtree
 * @vnode  虚拟节点
 * @container  挂载的容器
*/
function patch(vnode: any, container: any) {
  processComponent(vnode, container)
}


/**
 * 处理组件
 * @vnode  虚拟节点
 * @container  挂载的容器
*/
function processComponent(vnode: any, container: any) {
  mountComponent(vnode, container)
}

/**
 * 挂载组件
 * @vnode  虚拟节点
 * @container  挂载的容器
*/
function mountComponent(vnode: any, container) {

  const instance = createComponentInstance(vnode)

  setupComponent(instance)

  setupRenderEffect(instance, container)
}

/**
 * 开渲染组件
 * @instance 组件实例
 * @container 挂载的容器
*/
function setupRenderEffect(instance: any, container) {

  /** 需要渲染的视图 */
  const subTree = instance.render()

  patch(subTree, container)

}
