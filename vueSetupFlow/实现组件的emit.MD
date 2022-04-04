## 实现组件的 emit事件

```js
  /**
   * 子组件 在setup函数的的第二个参数结构出 emit 方法
   * 子组件通过调用 emit('event') 触发props上的对应事件
  */
 function setupStatefulComponent(instance: any) {
  /** 组件 */ 
  const Component = instance.type
  
  const { setup } = Component

  // 创建组件的代理对象
  instance.proxy = new Proxy({_: instance}, PublicInstanceProxyHandlers)
  
  if (setup) {
    
    let setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit
    })

    handleSetupResult(instance, setupResult)
  }
}
 // 1 组件上添加一个 emit属性
 // 2 重写emit 这个方法
 //   2.1 通过bind返回一个填充过组件实例的函数
 //   外部调用时不在需要传入组件实例
 export function createComponentInstance(vnode: any) {
  const component = {
    /** 虚拟节点 */
    vnode,
    type: vnode.type,
    /** 组件的属性 */
    props: {},
    /** 组件setup 返回的数据 */ 
    setupState: {},
    /** 组件代理对象 方便用户 直接通过 this.xxx 访问组件的数据 */
    proxy: null,
    /** 组件emit 事件 */
    emit: () => {}
  }  
  /** 重写emit方法 将参数component传入emit内 */
  component.emit = emit.bind(null, component)
  return component
}


// emit 处理部分
function capitalize (str: string): string {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''
}

function camelize (str: string) {
  return str.replace(/-(\w)/g, (_, s: string)=> {
    return s ? s.toUpperCase() : ''
  })
}

function toHandelKey(str: string) {
  return str ? 'on' +  camelize(str) : ''
}

// 通过 ...args 将出剩余参数传入
export function emit (instance, event: string, ...args) {

  const { props } = instance

  let handelKey =  toHandelKey(capitalize(event))

  let handle = props[handelKey]

  handle && handle(...args)
}
```