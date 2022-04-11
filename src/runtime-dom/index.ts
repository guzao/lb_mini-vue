import { createRenderer } from "../runtime-core/render"
/** 是否是以 on开头  */
const isOn = (key: string) => /^on[A-Z]/.test(key)
// 获取事件名称
const getEventName = (key: string) => key.slice(2).toLocaleLowerCase()


function createElement(type) {
  return document.createElement(type)
}

function patchProp(el: Element, key, prevValue, newValue) {
  if (isOn(key)) {
    let event = getEventName(key)
    el.addEventListener(event, newValue)
  } else {
    el.setAttribute(key, newValue)
  }
  // 新得是 null || undefined 删除属性
  if (newValue == null || newValue == undefined) {
    el.removeAttribute(key)
  }
  
}

function insert (el: Element, parent: Element, anchor) {
  // parent.append(el)
  parent.insertBefore(el, anchor || null)
}


function removeElement (el) {
  el.parentNode.removeChild(el)
}

function setElementText (el, text) {
  el.textContent = text;
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
  setElementText,
  removeElement
})

export function createApp(...args) {
  return renderer.createApp(...args);
}
export * from '../runtime-core/index'