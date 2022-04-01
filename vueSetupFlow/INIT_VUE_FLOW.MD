
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
                    // 设置组件的更新 执行组件的render函数的得到 虚拟节点
                    ==> setupRenderEffect(instance, container)
                    
        //  vnode, container
        元素类型 ==> processElement(vnode, container)
                    // 初始化挂载元素
                    // 函数内部根据 虚拟节点的类型创建 元素
                      // 1.1 如果节点的 children是string 类型直接设置元素的textContent即可
                      // 1.2 如果元素children是array 就循环children 调用patch函数区分虚拟节点是组件还是普通元素， 递归处理
                      // 1.3 根据传入props 设置元素的属性
                    ==> mountElement(vnode, container)
```