import { track, trigger } from "./effect"

export function reactive (raw: any) {
  return new Proxy(raw, {
    get (target: object, key: any) {
      let res = Reflect.get(target, key)
      track(target, key)

      return res
    },
    set (target: object, key: any, value: any) {
      let res = Reflect.set(target, key, value)
      trigger(target, key)
      
      return res
    }
  })
}