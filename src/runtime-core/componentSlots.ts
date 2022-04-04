import { ShapeFlages } from "../shared/ShapeFlages";
import { isArray } from "../shared/shared";
export function initSlots (instance: any, children: any) {
  let { vnode } = instance
  if (vnode.shapeflag & ShapeFlages.SLOTS_CHILDREN) {
    normalizeObjectSlots(children, instance.slots)
  }
}

function normalizeObjectSlots(children, slots) {
  for (const key in children) {
    let value = children[key];
    slots[key] = (props) =>  normalizeSlotValue(value(props))
  }
}

function normalizeSlotValue (value) {
  return isArray(value) ? value : [ value ]
}