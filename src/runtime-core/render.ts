import { ShapeFlages } from "../shared/ShapeFlages"
import { createComponentInstance, setupComponent } from "./component"

/** 是否是以 on开头  */
const isOn = (key: string) => /^on[A-Z]/.test(key)
// 获取事件名称
const getEventName = (key: string) => key.slice(2).toLocaleLowerCase()

export function render(vnode: any, container: Element) {
  patch(vnode, container)
}

function patch(vnode: any, container: Element) {
  
  const { shapeflag } = vnode  
  if (shapeflag & ShapeFlages.ELEMENT) {
    // 处理元素
    processElemnt(vnode, container)
  } else if (shapeflag & ShapeFlages.STATEFUL_COMPONENT) {
    // 处理组件
    processComponent(vnode, container)
  }

}

/** 处理组件 */
function processComponent(vnode: any, container: Element) {
  mountComponent(vnode, container)
}
 
/** 挂载元素  */ 
function mountComponent(vnode: any, container: Element) {
  const instance = createComponentInstance(vnode)

  // 设置组件的属性、插槽、render函数 
  setupComponent(instance)

  // 设置组件更新
  setupRenderEffect(instance, vnode, container)
}

/** 组件更新 */
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
  const { type, children, props, shapeflag } = vnode

  // 创建元素
  const el: Element = ( vnode.el =  document.createElement(type))

  // 文本节点
  if (shapeflag & ShapeFlages.TEXT_CHILDREN) {
    el.textContent = children
  } else if (shapeflag & ShapeFlages.ARRAY_CHILDREN) { // 数组节点
    mountChildren(children, el)
  }

  // attr
  for (const key in props) {
    const value = props[key]
    if (isOn(key)) {
      let event = getEventName(key)
      el.addEventListener(event, value)
    } else {
      el.setAttribute(key, value)
    }
  }

  container.append(el)
}


function mountChildren(children: any[], container: Element) {
  children.forEach((vnode) => {
    patch(vnode, container)
  })
}
