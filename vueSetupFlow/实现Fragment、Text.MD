
### patch 函数的内部处理代码
```js
export const Fragment  = Symbol('Fragment')
export const Text  = Symbol('Text')

function patch(vnode: any, container: Element) {
  const { shapeflag, type} = vnode 
  switch (type) {
    case Fragment:
      // 处理 Frament
      processFrament(vnode, container)
      break;
    case Text:
      // 处理 文本节点
      processText(vnode, container)
      break;
  
    default:
      if (shapeflag & ShapeFlages.ELEMENT) {
        // 处理元素
        processElemnt(vnode, container)
      } else if (shapeflag & ShapeFlages.STATEFUL_COMPONENT) {
        // 处理组件
        processComponent(vnode, container)
      }
      break;
  }
}
```


## 实现 Fragment 
```js
  /**
   * 1 使用插槽创建节点的时候 给createVNode的 第一个参数赋值为Fragment 
   * 2 在patch 的时候 针对于Fragment 类型对应的处理
   * 3 对于Fragment 类型 只需要 循环children节点 继续调用patch 即可
  */
import { createVNode, Fragment } from "../vnode";
export function renderSlots (slots: any, name: string, props) {
  let slot = slots[name]
  if (slot) {
    if (typeof slot === 'function') {
      return createVNode(Fragment, {}, slot(props))
    }
  }
}
/** 处理Frament  */ 
function processFrament(vnode: any, container: Element) {
  /** 只需要渲染 children 部分 */
  mountChildren(vnode.children, container)
}
```

## 实现 Text vnode 
```js
/** 创建文本虚拟节点 */
/**
 * 1 在创建文本的虚拟节点时 给参数1赋值为 Text 类型
 * 2 在执行patch 函数的时候做对应的处理
 * 3 
*/
export function createTextVNode (children: string) {
  return h(Text, {}, children)
}
/** 处理文本节点 */
function processText(vnode: any, container: Element) {
  const el = (vnode.el =  document.createTextNode(vnode.children))
  container.append(el)
}
```
   