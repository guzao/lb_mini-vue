import { createRenderer } from "../runtime-core/render"
/** 是否是以 on开头  */
const isOn = (key: string) => /^on[A-Z]/.test(key)
// 获取事件名称
const getEventName = (key: string) => key.slice(2).toLocaleLowerCase()


function createElement(type) {
  return document.createElement(type)
}

function patchProp(el, key, value) {
  if (isOn(key)) {
    let event = getEventName(key)
    el.addEventListener(event, value)
  } else {
    el.setAttribute(key, value)
  }
}

function insert (el, parent) {
  parent.append(el)
}

function setElementText (el, text) {
  el.textContent = text;
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
  setElementText
})

export function createApp(...args) {
  return renderer.createApp(...args);
}
export * from '../runtime-core/index'