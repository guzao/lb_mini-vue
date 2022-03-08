import { ReactiveEffect } from ".";


export class ComputedImpl {

  public _value

  private _dirty: boolean = true; 

  public effect: ReactiveEffect

  constructor(getter) {

    this.effect = new ReactiveEffect(getter, () => {
      /**
       * 通过scheduler参数 在数据变化后执行这个传入的函数修改this._dirty 的状态标记为true
      */
      if (!this._dirty) {
        this._dirty = true
      }

    })

  }

  get value () {
    /**
     * @ 通过this._dirty 标记是否初始化过this._value 的值 
     * @ 读取过后将状态标记为false 后续依赖的数据没有变化就不再给this._value 重新赋值 直接将之前读取的返沪即可
    */
    if (this._dirty) {
      this._dirty = false
      this._value = this.effect.run()
    }
    return this._value
  }

}

export function computed (fn: any) {
  const computed = new ComputedImpl(fn)
  return computed
}