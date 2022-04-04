
## mini-ve 执行顺序
- 
```js
createrApp(rootComponent)
.mount(container) // mount中开始执行 createVNode 和 render

    /** * 返回虚拟节点*/
    ==> createVNode(rootComponent) ==> vnode 
    // 将createVNode 返回的虚拟节点 交给render 函数处理

    /** * 通过 vnode 进行进一步的处理   */ 
    ==> render(vnode, rootComponent)

      // 执行patch 这里开始区分vnode 是组件类型 还是elment 类型
      // 根据不同的类型做不同的处理
      ==> patch(vnode, container)
        // vnode, container
        组件类型 ==> processComponent( vnode, container)

                  // 挂载组件  vnode, container
                  ==> mountComponent( vnode, container )

                      // 创建组件实例  
                      ==> createComponentInstance(vnode) // 返回组件实例

                    // 设置组件的属性、插槽、render函数
                    ==> setupComponent(instance)

                      ==> setupStatefulComponent(instance) // 初始化有状态的组件

                        // 处理 setup 函数返回的数据
                        ==> handleSetupResult(instance, setupResult)

                          // 设置组件的render 函数  确保组件拥有渲染函数
                          ==> finishComponentSetup(instance)
                    // 设置组件的更新 执行组件的render函数的得到 虚拟节点  subTree
                    ==> setupRenderEffect(instance, container)
                      // 将组件内的 render函数的返回值 交给patch 继续递归处理
                      ==> patch(subTree, container)
                    
        //  vnode, container
        元素类型 ==> processElement(vnode, container)
                    // 初始化挂载元素
                    // 函数内部根据 虚拟节点的类型创建 元素
                      // 1.1 如果节点的 children是string 类型直接设置元素的textContent即可
                      // 1.2 如果元素children是array 就循环children 调用patch函数区分虚拟节点是组件还是普通元素， 递归处理
                      // 1.3 根据传入props 设置元素的属性
                    ==> mountElement(vnode, container)
```


## 使用位运算标识组件类型
```js
  // 
  // 元素类型
  ELEMENT = 1, // 0001
  // 组件类型
  STATEFUL_COMPONENT = 1 << 1 , // 0010
  // 文本类型
  TEXT_CHILDREN = 1 << 2,       // 0100
  // 数组类型
  ARRAY_CHILDREN = 1 << 3       // 1000
0010
1000
0000
  /**
   * | 两位都为0 才为0
   * & 两位都为1 才为1
   * 
   * 
   * 通过 |运算符 修改
   *    0000
   * |  0001
   * ==>0001 修改为 elemnt类型 
   * 
   *     0000
   * |   0010
   * ==> 0010 修改为 组件类型
   * 
   * // 既是元素 children又是 string
   *    0001
   * |  0100
   * ==>0101  
   * .........
   * 
   * 
   * 通过 &运算符 查询
   *    0001
   * &  0001
   * ==>0000
   * 
   * // 判断既是元素 children又是 string的类型
   *    0101
   * &  0001
   * ==>0001 ==> element 类型  
   * 
  */
 // 1 createVnode 在初始化虚拟节点的时候区分节点的类型
 // 2 
 createVNode(type, props, children)
     // type 为对象说明节点是 组件类型初步设置为 STATEFUL_COMPONENT ==>> 0010
     // type 为string 说明是 元素类型初步设置为  ELEMENT            ==>> 0001
   ==> getShapeFlag(type) // 设置节点类型
     // 在根据子元素的类型设置 flage的标记 
     // 如果 flage为element children 为string 则设置为 0101
     // 如果 flage为element children 为array  则设置为 1001
   ==> updateVnodeShapeFlag(vnode, children)
```

