import { hasChanged, isObject } from "../shared/shared"
import { proxyRefsHandlers } from "./baseHandler"
import { isTracking, trackEffects, triggerEffects } from "./effect"
import { reactive } from "./reactive"

/**
 * RefImpl
 * @value 需要代理的数据
 * ref class类 内部存储 副作用 
*/
class RefImpl {

  public __v_isRef = true

  /** 包装过后的值 */
  public _value

  /** 原始值 */
  public _rawValue

  public dep = new Set()

  constructor(value) {

    this._rawValue = value
    this._value =  convert(value)

  }

  get value () {
    /** 依赖收集 */
    trackRefValue(this)
    return this._value
  }

  set value (newValue) {
    // 触发依赖
    if (hasChanged(this._rawValue, newValue)) {
      this._rawValue = newValue 
      this._value = convert(newValue)
      triggerEffects(this.dep)
    }
  }

}

/**
 * 触发ref依赖收集
*/
function trackRefValue (ref): void {
  if (isTracking()) {
    trackEffects(ref.dep)
  }
}

/**
 * 如果传入了object 就使用reactive包装 反值返回值本身
*/
export function convert (value): any {
  return isObject(value) ? reactive(value) : value
}


/**
 * ref
*/
export function ref (value: any) {
  const ref = new RefImpl(value)
  return ref
}

/**
 * @ref 需要检测的数据
 * @ 数据是否是ref 类型
*/
export function isRef (ref: any): boolean {
  return !!ref.__v_isRef
}

/**
 * @value 需要检测的数据
 * @ 如果数据是 ref 返回ref.value 反值返回值本身
*/
export function unRef (value: any): boolean {
  return isRef(value) ? value.value : value
}

/**
 * 访问的数据是 ref 类型 就返回ref.value值
*/
export function proxyRefs (objectWithRefs: any): any {
  return new Proxy(objectWithRefs, proxyRefsHandlers)
}