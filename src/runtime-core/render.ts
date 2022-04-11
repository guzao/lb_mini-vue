import { createAppAPI } from './createApp'
import { ShapeFlages } from "../shared/ShapeFlages"
import { createComponentInstance, setupComponent } from "./component"
import { Fragment, Text } from "./vnode"
import { effect } from '../resctivite/effect'
function isSomeVNodeType(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}
export function createRenderer(options) {

  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    setElementText: hostSetElementText,
    removeElement: hostRemoveElement,
  } = options

  function render(vnode: any, container: Element, parentInstance, anchor) {
    patch(null, vnode, container, parentInstance, anchor)
  }

  function patch(n1, n2: any, container: Element, parentInstance, anchor) {
    
    const { shapeflag, type} = n2 
    switch (type) {
      case Fragment:
        processFrament(n1, n2, container, parentInstance, anchor)
        break;
      case Text:
        processText(n1, n2, container)
        break;
    
      default:
        if (shapeflag & ShapeFlages.ELEMENT) {
          // 处理元素
          processElement(n1, n2, container, parentInstance, anchor)
        } else if (shapeflag & ShapeFlages.STATEFUL_COMPONENT) {
          // 处理组件
          processComponent(n1, n2, container, parentInstance, anchor)
        }
        break;
    }

  }

  /** 处理组件 */
  function processComponent(n1, n2: any, container: Element, parentInstance, anchor) {
    mountComponent(n2, container, parentInstance, anchor)
  }
  
  /** 挂载元素  */ 
  function mountComponent(vnode: any, container: Element, parentInstance, anchor) {
    const instance = createComponentInstance(vnode, parentInstance)

    // 设置组件的属性、插槽、render函数 
    setupComponent(instance)

    // 设置组件更新
    setupRenderEffect(instance, vnode, container, anchor)
  }

  /** 组件更新 */
  function setupRenderEffect(instance: any, vnode: any, container: Element, anchor) {
    effect(() => {
      if (!instance.isMounted) {
        const { proxy } = instance
        // 修改render函数的this 指向组件的代理对象 就可以直接通过 this.xxx访问组件的数据了
        const subTree = (instance.subTree =  instance.render.call(proxy))
        patch(null, subTree, container, instance, anchor)
        vnode.el = subTree.el
        instance.isMounted = true
      } else {
        const { proxy } = instance
        // 修改render函数的this 指向组件的代理对象 就可以直接通过 this.xxx访问组件的数据了
        /** 新的虚拟节点 */
        const subTree = instance.render.call(proxy)
        /** 老的虚拟节点 */
        const prevSubTree = instance.subTree
        instance.subTree = subTree;
        // 更新 subTree
        patch(prevSubTree, subTree, container, instance, anchor)
      }
    })
  }


  /** 处理元素 */
  function processElement(n1, n2: any, container: Element, parentInstance, anchor) {
    if (n1) {
      patchElement(n1, n2, container, parentInstance, anchor)
    } else {
      mountElement(n2, container, parentInstance, anchor)
    }
  }

  const TEMP_OBJECT = {}

  function patchElement (n1: any, n2: any, container: Element, parentInstance, anchor) {
    // 节点得属性可能不存在 props 需要初始化一个默认值 
    // 默认值 指向同一个对象
    // 方便处理属性时做优化
    // 如果新旧属性都是同一个对象则不需要循环处理
    const prevProps = n1.props || TEMP_OBJECT
    const nextProps = n2.props || TEMP_OBJECT
    const el = (n2.el = n1.el);
    patchChildren(n1, n2, el, parentInstance, anchor)
    patchProps(el, prevProps, nextProps)
  }

  /** 比对新旧节点的props 更新对应的属性*/
  function patchProps (el, oldProps, newProps) {

    if (newProps !== oldProps) {
      /** 新的属性更旧的不同更改 */
      for (const key in newProps) {
        const newValue = newProps[key]
        const oldValue = oldProps[key]
        if (newValue !== oldValue) {
          hostPatchProp(el, key, oldValue, newValue)
        }
      }
    }
    // 如果老的节点是TEMP_OBJECT 说明节点是初始化得属性不需要循环
    if (oldProps !== TEMP_OBJECT) {
      // 老的属性再新得中不存在 循环老的属性即可
      for (const key in oldProps) {
        if (!(key in newProps)) {
          hostPatchProp(el, key, oldProps[key], null)
        }
      }
    }

  }
  /** 比对 children */
  function patchChildren (n1, n2, container: Element, parentInstance, anchor) {
    // 新节点
    const newShapeflag = n2.shapeflag
    const newChildren  = n2.children

    // 老节点
    const oldShapeflag = n1.shapeflag
    const oldChildren = n1.children
    
    if (newShapeflag & ShapeFlages.TEXT_CHILDREN) {
      if (oldShapeflag & ShapeFlages.ARRAY_CHILDREN) {
        unmountChildren(oldChildren)
      } 
      if (newChildren !== oldChildren) {
        hostSetElementText(container, newChildren)
      }
    } else {
      if (oldShapeflag & ShapeFlages.TEXT_CHILDREN) {
        hostSetElementText(container, '')
        mountChildren(n2.children, container, parentInstance, anchor)
      } else {
        patchKeyedChildren(oldChildren, newChildren, container, parentInstance, anchor)
      }
    }

  }

  function patchKeyedChildren(c1: any, c2: any, container: Element, parentInstance: any, anchor) {
    let l2 = c2.length
    let i = 0;
    let e1 = c1.length - 1
    let e2 = c2.length - 1

    // 1. 左侧的对比
    while ( i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = c2[i]
      if (isSomeVNodeType(n1, n2)) {
        // type key 相同比对属性你
        patch(n1, n2, container, parentInstance, anchor)
      } else {
        break
      }
      i++
    }

    // 右侧的对比
    while ( i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]
      if (isSomeVNodeType(n1, n2)) {
        patch(n1, n2, container, parentInstance, anchor);
      } else {
        break
      }
      e1--
      e2--
    }

    // 3. 新的比老的长
    //     创建新的 ==> mountElement
    if (i > e1) { 
      if (i <= e2) {
        const nextPos = e2 + 1;
        const anchor = nextPos < l2 ? c2[nextPos].el : null;
        while (i <= e2) {
          let n2 =  c2[i]
          patch(null, n2,  container, parentInstance, anchor)
          i++
        }
      }
    } else if (i > e2){
      // l老的比新的长 删除
      while(i <= e1) {
        hostRemoveElement(c1[i].el)
        i++
      }
    } else {


      let s1 = i
      let s2 = i
      const keyToNewIndexMap: Map< string, number > = new Map()
      
      // 获取新的节点中部分总数
      // 如果新的比对完成 多余的直接删除即可
      const toBePatched = e2 - s2 + 1
      let patched = 0
      // 初始化
      const newIndexToOldIndexMap = new Array(toBePatched)

      for (let index = 0; index < toBePatched; index++) {
        newIndexToOldIndexMap[index] = 0;
      }


      console.log(newIndexToOldIndexMap)
      
      for (let index = s2; index <= e2; index++) {
        keyToNewIndexMap.set(c2[index].key, index)
      }

      // 循环老节点 是否存在新的节点中
      for (let index = s1; index <= e1; index++) {
        let prevChild = c1[index]

        // 新的节点对比完成 多余的老节点直接删除
        if (patched >= toBePatched) {
          hostRemoveElement(prevChild.el)
          continue
        }

        let newIndex
        if (prevChild.key != null) {
          newIndex = keyToNewIndexMap.get(prevChild.key) 
        } else {
          for (let j = s2; j < e2; j++) {
            if (isSomeVNodeType(prevChild, c2[j])) {
              newIndex = j
              break
            }
          }
        }
        
        // 老的不在新的里面删除
        if (newIndex === undefined) {
          hostRemoveElement(prevChild.el)
        } else {
          //
          newIndexToOldIndexMap[ newIndex - s2 ] = index + 1
          // 老的再新的的里面 比对props children
          patch(prevChild, c2[newIndex], container, parentInstance, null)
          console.log(newIndexToOldIndexMap)
          patched++
        }


      }

      const increasingNewIndexSequence = getSequence(newIndexToOldIndexMap)
      let j: number = increasingNewIndexSequence.length - 1 
      for (let index = toBePatched; index >= 0 ; index--) {
        const nextIndex = i + s2;
        const nextChild = c2[nextIndex];
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
        if (index !== increasingNewIndexSequence[j]) {
          console.log('ismove', nextChild.el)
          console.log('ismove', nextChild.el)
          debugger
          hostInsert(nextChild.el, container, anchor);
        } else {
          j--
        }
      }

    }


  }

  function mountElement( vnode: any, container: Element, parentInstance, anchor) {
    const { type, children, props, shapeflag } = vnode
    // 创建元素
    const el: Element = ( vnode.el = hostCreateElement(type))

    // 文本节点
    if (shapeflag & ShapeFlages.TEXT_CHILDREN) {
      hostSetElementText(el, children)
    } else if (shapeflag & ShapeFlages.ARRAY_CHILDREN) { // 数组节点
      mountChildren(vnode.children, el, parentInstance, anchor)
    }

    for (const key in props) {
      const value = props[key]
      hostPatchProp(el, key, null, value)
    }

    hostInsert(el, container, anchor)
  }

  function unmountChildren (children: any) {
    children.forEach(vnode => {
      let el: Element = vnode.el
      hostRemoveElement(el)
    })
  }


  function mountChildren(n2: any[], container: Element, parentInstance, anchor) {
    n2.forEach((vnode) => {
      patch(null, vnode, container, parentInstance, anchor)
    })
  }


  /** 处理Frament  */ 
  function processFrament(n1, n2: any, container: Element, parentInstance, anchor) {
    /** 只需要渲染 children 部分 */
    mountChildren(n2.children, container, parentInstance, anchor)
  }

  /** 处理Text  */
  function processText(n1, n2: any, container: Element) {
    const el = (n2.el =  document.createTextNode(n2.children))
    container.append(el)
  }

  return {
    createApp: createAppAPI(render)
  }
}





/**
 *最长递增子序列
*/
function getSequence(arr) {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}
