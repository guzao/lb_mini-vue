import { h, renderSlots } from "../../lib/guide-mini-vue.esm.js";

export const Foo = {
  setup() {
    return {};
  },
  render() {
    const count = 1
    const foo = h("p", {}, "foo");
    return h("div", {}, [ renderSlots(this.$slots, 'header', { count }), foo, renderSlots(this.$slots, 'footer')]);
  },
};
