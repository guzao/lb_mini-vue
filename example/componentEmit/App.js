import { h, renderSlots} from "../../lib/guide-mini-vue.esm.js";
import { Foo } from "./Foo.js";

const foo = {
  name: "foo",
  render() {
    window.slots = this.$slots
    const p = h('p', {}, 'P')
    // 传入单个渲染元素
    // return h('div', {}, [p, this.$slots])

    // 传入数组类型子元素
    // 因为patch时 只会渲染虚拟节点 并不会处理数组类型的数据 可以使用h函数包裹创建一个新的节点
    // return h('div', {}, [p, h('div', {}, this.$slots)])

    // 使用renderSlots辅助函数
    return h('div', {}, [p, renderSlots(this.$slots)])
  },
  setup() {
    return {
      tag: '454'
    }
  }
}

export const App = {
  name: "App",
  render() {
    // 传入单个渲染元素
    // return h('div', {}, [ h('div', {class: 'red '}, 'App'), h(foo, {}, h('h1', {}, 'h1') ) ])

    // 传入数组类型子元素
    return h(
      'div',
      {},
      [
        h(
          'div',
          { class: 'red ' },
          'App'
        ),
        h(
          foo
          , {}
          ,
            h(
              'h1'
              ,
              {},
              'h1'
            ),
        )
      ]
    )
  },
  setup() {
    return {
    };
  },
};

// export const App = {
//   name: "App",
//   render() {
//     // return h("div", {}, [
//     //   h("div", {}, "App"),
//     //   h(Foo, {
//     //     onAdd(a, b) {
//     //       console.log("onAdd", a, b);
//     //     },
//     //     onAddFoo() {
//     //       console.log("onAddFoo");
//     //     },
//     //   }),
//     // ]);
//     return h('div', {}, [h(foo, {}, [ h('h1', {}, 'h1'), h('h2', {}, 'h2') ])])
//   },
//   setup() {
//     return {
//     };
//   },
// };
