import { isTracking, trackEffects, triggerEffects } from "./effect"


class RefImpl {

  /** 包装过后的值 */
  public _value

  /** 原始值 */
  public _rawValue

  public dep = new Set()

  constructor(value) {
    this._rawValue = value
    this._value = value
  }

  get value () {
    /** 依赖收集 */
    if (isTracking()) {
      trackEffects(this.dep)
    }
    return this._value
  }

  set value (newValue) {
    this._rawValue = newValue 
    this._value = newValue
    triggerEffects(this.dep)
  }


}

export function ref (value: any) {
  const ref = new RefImpl(value)
  return ref
}