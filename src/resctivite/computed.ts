

export class ComputedImpl {
  
  public _getter

  constructor(getter) {
    this._getter = getter
  }

  get value () {
    return this._getter()
  }

}

export function computed (fn: any) {
  const computed = new ComputedImpl(fn)
  return computed
}