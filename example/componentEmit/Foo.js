import { h } from "../../lib/guide-mini-vue.esm.js";

export const Foo = {
  name: 'Foo',
  setup(props, { emit }) {
    const emitAdd = () => {
      console.log("emit add");
      emit("add",1,2);
      emit("add-foo", emit, props);
    };

    return {
      emitAdd,
    };
  },
  render() {
    const btn = h(
      "button",
      {
        onClick: this.emitAdd,
      },
      "emitAdd"
    );

    const foo = h("p", {}, "foo");
    return h("div", {}, [foo, btn, h('ul', {}, [h('li', {}, 'klop')])]);
  },
};
