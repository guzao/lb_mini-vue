import { track, trigger } from "./effect"

export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadonly",
}


const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)


/**
 * 创建Proxy get处理函数
 * @isReadonly 只读数据 默认为false 只读数据不需要进行依赖收集
*/
export function createGetter (isReadonly = false) {
  return function get (target: object, key: any) {

    if (key == ReactiveFlags.IS_READONLY) {
      return isReadonly
    } else if (key == ReactiveFlags.IS_REACTIVE) {
      return !isReadonly
    }

    let res = Reflect.get(target, key)

    if (!isReadonly) {
      track(target, key)
    }

    return res
  }
}

/**
 * 创建Proxy set处理函数
*/
export function createSetter () {
  return function set (target: object, key: any, value: any) {
    let res = Reflect.set(target, key, value)
    trigger(target, key)
    
    return res
  }
}


/**
 * reactive  get set
*/
export const mutableHandlers = {
  get,
  set,
}

/**
 * readonly get set
*/
export const readonlyHandlers = {
  get: readonlyGet,
  set (target: object, key: any, value: any) {
    console.warn(
      `key :"${String(key)}" set 失败，因为 target 是 readonly 类型`,
      target
    );
    return true
  }
}