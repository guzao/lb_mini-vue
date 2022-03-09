import { isObject } from "../shared/shared";
import { processComponent } from "./component";
import { VnodeType, RootElnemt } from "./vue.dt";


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
  // 组件类型
  console.log('根据vnode type 属性区分是组件还是普通元素做不同处理', vnode)
  if (isObject(type)) {
    processComponent(vnode, container)
  } else { // 元素类型
    console.log('元素类型')
  }


}


