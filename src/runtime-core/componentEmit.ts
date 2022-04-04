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

export function emit (instance, event: string, ...args) {

  const { props } = instance

  let handelKey =  toHandelKey(capitalize(event))

  let handle = props[handelKey]

  handle && handle(...args)
}