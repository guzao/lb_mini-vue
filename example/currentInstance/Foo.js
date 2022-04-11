import { h, getCurrentInstance } from "../../lib/guide-mini-vue.esm.js";

export const Foo = {
  name:"Foo",
  setup() {
    let instance = getCurrentInstance()
    return {
      text: instance.vnode.shapeflag,
      ...instance
    }
  },
  render() {
    console.log(this)
    return h("div", {}, "foo" + this.text);
  },
};
