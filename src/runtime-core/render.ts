import { isArray } from "../shared/shared";
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
  const { type } = vnode

  if (typeof type == 'object') {
    processComponent(vnode, container)
  } else {
    processElement(vnode, container)
  }

}



/**
 * 处理元素
 * @vnode    虚拟节点
 * @container  挂载容器
*/
function processElement(vnode: any, container: any) {

  mountElement(vnode, container)

}

/**
 * 挂载元素
 * @vnode    虚拟节点
 * @container  挂载容器
*/
function mountElement(vnode: any, container: any) {

  const { type, children } = vnode

  // 创建元素
  const el: Element = document.createElement(type)

  // 检查children 是否是 字符串
  if (typeof children == 'string' ) {
    el.textContent = children
  } 

  // 如果是数组类型就递归 patch 处理
  if (isArray(children)) {
    mountChildren(children, el)
  }

  // 添加到根容器中
  container.append(el)

}

/**
 * 挂载子元素
 * @children 子元素
 * @el 根容器
*/
function mountChildren(children: any, el: Element) {
  children.forEach((vnode) => {
    patch(vnode, el)
  })
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


