import { createAppAPI } from './createApp'
import { ShapeFlages } from "../shared/ShapeFlages"
import { createComponentInstance, setupComponent } from "./component"
import { Fragment, Text } from "./vnode"

/** 是否是以 on开头  */
const isOn = (key: string) => /^on[A-Z]/.test(key)
// 获取事件名称
const getEventName = (key: string) => key.slice(2).toLocaleLowerCase()



export function createRenderer(options) {

  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    setElementText: hostSetElementText
  } = options

  function render(vnode: any, container: Element, parentInstance) {
    patch(vnode, container, parentInstance)
  }

  function patch(vnode: any, container: Element, parentInstance) {
    
    const { shapeflag, type} = vnode 
    switch (type) {
      case Fragment:
        processFrament(vnode, container, parentInstance)
        break;
      case Text:
        processText(vnode, container)
        break;
    
      default:
        if (shapeflag & ShapeFlages.ELEMENT) {
          // 处理元素
          processElemnt(vnode, container, parentInstance)
        } else if (shapeflag & ShapeFlages.STATEFUL_COMPONENT) {
          // 处理组件
          processComponent(vnode, container, parentInstance)
        }
        break;
    }

  }

  /** 处理组件 */
  function processComponent(vnode: any, container: Element, parentInstance) {
    mountComponent(vnode, container, parentInstance)
  }
  
  /** 挂载元素  */ 
  function mountComponent(vnode: any, container: Element, parentInstance) {
    const instance = createComponentInstance(vnode, parentInstance)

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

    patch(subTree, container, instance)

    vnode.el = subTree.el
  }



  /** 处理元素 */
  function processElemnt(vnode: any, container: Element, parentInstance) {
    mountElement(vnode, container, parentInstance)
  }

  function mountElement(vnode: any, container: Element, parentInstance) {
    const { type, children, props, shapeflag } = vnode

    // 创建元素
    const el: Element = ( vnode.el = hostCreateElement(type))

    // 文本节点
    if (shapeflag & ShapeFlages.TEXT_CHILDREN) {
      hostSetElementText(el, children)
    } else if (shapeflag & ShapeFlages.ARRAY_CHILDREN) { // 数组节点
      mountChildren(children, el, parentInstance)
    }

    for (const key in props) {
      const value = props[key]
      hostPatchProp(el, key, value)
    }

    hostInsert(el, container)
  }


  function mountChildren(children: any[], container: Element, parentInstance) {
    children.forEach((vnode) => {
      patch(vnode, container, parentInstance)
    })
  }


  /** 处理Frament  */ 
  function processFrament(vnode: any, container: Element, parentInstance) {
    /** 只需要渲染 children 部分 */
    mountChildren(vnode.children, container, parentInstance)
  }

  /** 处理Text  */
  function processText(vnode: any, container: Element) {
    const el = (vnode.el =  document.createTextNode(vnode.children))
    container.append(el)
  }

  return {
    createApp: createAppAPI(render)
  }
}
