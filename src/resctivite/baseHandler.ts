import { isObject } from "../shared/shared"
import { track, trigger } from "./effect"
import { isReactive, reactive, readonly } from "./reactive.ts"
import { isRef } from "./ref"

export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadonly",
}

const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)
const showllGet = createGetter(true, true)


/**
 * 创建Proxy get处理函数
 * @isReadonly 只读数据 默认为false 只读数据不需要进行依赖收集
*/
export function createGetter (isReadonly = false, IsShowll = false) {

  return function get (target: object, key: any) {

    if (key == ReactiveFlags.IS_READONLY) {
      return isReadonly
    } else if (key == ReactiveFlags.IS_REACTIVE) {
      return !isReadonly
    }

    let res = Reflect.get(target, key)

    /**
     * 浅代理只代理第一层属性
    */
    if (IsShowll) {
      return res
    }
    
    /**
     * 如果访问的数据是object类型
     * 就根据当前isReadonly的状态代理不同的数据类型
    */
    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }
    
    /* 如果是只读数据 就不需要依赖收集 因为在数据变化后不需要执行副作用函数* */
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


/**
 * proxyRefsHandlers   get set
*/
export const proxyRefsHandlers = {
  get (target: object, key: any) {
    let res = Reflect.get(target, key)
    return isRef(res) ? res.value : res
  },
  set (target: object, key: any, value: any) {

    if (isRef(target[key] && !isRef(value))) {
      return (target[key].value = value)
    } else {
      let res = Reflect.set(target, key,value)
      return res
    }
    
  }
}

/**
 * shallowReadonlyHandlers  get set
*/
export const shallowReadonlyHandlers = {
  get: showllGet,
  set: set
}