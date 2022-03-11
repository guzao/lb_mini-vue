import { getCurrentInstance } from ".";


export function provide (key, value) {
  // 存
  // 1 先获取到当前的组件
  const currentInstance = getCurrentInstance()
  if (currentInstance) {
    // 给当前的组件实例上的 provide 属性赋值
    const { provides } = currentInstance
    provides[key] = value
  }
}


export function inject (key, value) {
  
}