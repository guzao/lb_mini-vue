

export class ComputedImpl {

  public _getter

  public _value

  private _dirty: boolean = true; 
  constructor(getter) {
    this._getter = getter
  }

  get value () {
    if (this._dirty) {
      this._value = this._getter()
      this._dirty = false
    }
    return this._value
  }

}

export function computed (fn: any) {
  const computed = new ComputedImpl(fn)
  return computed
}