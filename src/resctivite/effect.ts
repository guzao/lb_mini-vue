type anyFn = () => any

/** effect 函数的返回值 */
type effectFn = {
  (): anyFn,
  /** effect实例 */
  effect: ReactiveEffect
}

/**
 * 存储响应式数据的副作用容器
 *  @ targetMap Map数据结构 全局响应式对象的容器
 *            @-- object Map数据结构 响应式对象
 *                      @-- key Set数据结构 响应式对象的key  通过key值找到对应的依赖
*/
const targetMap: Map<object, Map<string, any>> = new Map()

let activeEffect: ReactiveEffect | undefined  = undefined

/** 是否需要收集依赖 */
let shouldTrack: boolean = false

/**
 * 
 * 一个effect 对应一个ReactiveEffect实例
*/
class ReactiveEffect {
  /** 传入的fn*/
  public fn: anyFn

  /** 配置参数 传入首次执行fn, 当数据变更后不会再执行fn而是调用scheduler */
  public scheduler

  /** 存储副作用 */
  public dep = []

  /** 是否没有执行过stop函数 */
  public active: boolean = true
  
  constructor(fn: anyFn, scheduler? ) {
    this.scheduler = scheduler
    this.fn = fn
  }

  /**
   *
   * 数据变化函数执行
  */
  run (): anyFn {
    activeEffect = this
    return this.fn()
  }


  /** 清除收集的依赖 后续数据变更后副作用不在执行 */
  stop (): void {
    if (!this.active) {
      cleanupEffect(this)
    }
  }

}

export function cleanupEffect (effect): void {
  effect.dep.forEach((dep: Set<any>) => {
    dep.delete(effect)
  })
}


export function stop (runner: effectFn): void {
  runner.effect.stop()
}


/** 收集依赖 */
export function track (target: object, key: any) {

  if (!activeEffect) return 

  let depsMap = targetMap.get(target)
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }
  let dep = depsMap.get(key)
  if (!dep) {
    dep = new Set()
    depsMap.set(key, dep)
  }
  dep.add(activeEffect)
  activeEffect.dep.push(dep)
}


/** 触发依赖 */
export function trigger (target: object, key: any) {

  let depsMap = targetMap.get(target)
  let dep = depsMap.get(key)
  triggerEffects(dep)

}

/** 触发依赖 */
export function triggerEffects (dep): void {
  for (const effect of dep) {
    let _effect: ReactiveEffect = effect
    if (_effect.scheduler) {
      _effect.scheduler()
    } else {
      _effect.run()
    }
  }
}


/**
 * 
 * 一个effect 对应一个ReactiveEffect实例
 * @fn 响应式数据变更后触发的函数
*/
export function effect (fn: anyFn, options: any = {} ): effectFn {

  let _effect: ReactiveEffect = new ReactiveEffect(fn, options.scheduler)

  _effect.run()

  const runner = _effect.run.bind(_effect)

  runner.effect = _effect
  
  return runner

}