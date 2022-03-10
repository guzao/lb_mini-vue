import { isArray, isON } from './../shared/shared';
import { isObject } from "../shared/shared";
import { processComponent } from "./component";
import { VnodeType, RootElnemt } from "./vue.dt";
import { ShapeFlags } from '../shared/ShapeFlages';

/**
 * @vnode  虚拟节点 | 组件
 * @rootContainer 挂载容器
*/
export function render(vnode: VnodeType, rootContainer: RootElnemt): void {
  patch(vnode, rootContainer)
}


/**
 * 根据vnode type 属性区分是组件还是普通元素做不同处理
 * @vnode 虚拟节点
 * @rootContainer 挂载容器
*/
export function patch(vnode: VnodeType, container: RootElnemt): void {
  const { type } = vnode

  console.log('根据vnode type 属性区分是组件还是普通元素做不同处理')

  if (typeof type === 'string') {
    // 元素类型
    processElement(vnode, container)
  } else if (isObject(type)) {
    // 组件类型
    processComponent(vnode, container)
  }


}

/**
 * 处理元素类型
 * @vnode 虚拟节点
 * @container 容器
*/
export function processElement(vnode: VnodeType, container: RootElnemt) {
  console.log('== 处理element 类型 =')
  mountElement(vnode, container)
}

/**
 *  挂载元素
 * @vnode 虚拟节点
 * @container 容器
*/
function mountElement(vnode: any, container: any) {
  console.log('=== 挂载元素 ===')
  const { type, children, props, shapeFlag } = vnode
  const el: Element = (vnode.el = document.createElement(type))

  // 元素设置
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN ) {
    console.log('子元素是字符串 直接设置元素的textContent即可')
    el.textContent = children
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    console.log('子元素是数组就 循环子元素 调用patch函数 继续处理')
    mountChildren(children, el)
  }

  // 元素属性设置
  for (const key in props) {
    const value = props[key]
    if (isON(key)) {  // 注册事件
      const event = key.slice(2).toLocaleLowerCase()
      el.addEventListener(event, value)
    } else {           // 添加属性
      el.setAttribute(key, value)
    }
  }

  // 生成的节点添加到容器中
  container.append(el)

}

/**
 * 挂载子元素
 * @children 数组类型的虚拟节点
 * @el 虚拟节点挂载的容器
*/
function mountChildren(children: any, el: any): void {
  children.forEach((vnode) => {
    patch(vnode, el)
  })
}

