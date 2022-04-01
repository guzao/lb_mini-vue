import { isArray, isObject } from "../shared/shared"
import { createComponentInstance, setupComponent } from "./component"

export function render(vnode: any, container: Element) {
  patch(vnode, container)
}

function patch(vnode: any, container: Element) {
  
  let { type } = vnode  

  if (typeof type === 'string') {
    // 处理元素
    processElemnt(vnode, container)
  } else if (isObject(type)) {
    // 处理组件
    processComponent(vnode, container)
  }
}


/** 处理组件 */
function processComponent(vnode: any, container: Element) {
  mountComponent(vnode, container)
}
  
function mountComponent(vnode: any, container: Element) {
  const instance = createComponentInstance(vnode)

  // 设置组件的属性、插槽、render函数 
  setupComponent(instance)

  // 设置组件更新
  setupRenderEffect(instance, vnode, container)
}

function setupRenderEffect(instance: any, vnode: any ,container: Element) {

  const { proxy } = instance
  
  // 修改render函数的this 指向组件的代理对象 就可以直接通过 this.xxx访问组件的数据了
  const subTree = instance.render.call(proxy)
  patch(subTree, container)
  vnode.el = subTree.el
}



/** 处理元素 */
function processElemnt(vnode: any, container: Element) {
  mountElement(vnode, container)
}

function mountElement(vnode: any, container: Element) {
  const { type, children, props } = vnode

  // 创建元素
  const el: Element = ( vnode.el =  document.createElement(type))

  if (typeof children === 'string') {
    el.textContent = children
  } else if (isArray(children)) {
    console.log('children isArray')
    mountChildren(children, el)
  }

  // attr
  for (const key in props) {
    const value = props[key]
    el.setAttribute(key, value)
  }

  container.append(el)
}


function mountChildren(children: any[], container: Element) {
  children.forEach((vnode) => {
    patch(vnode, container)
  })
}
