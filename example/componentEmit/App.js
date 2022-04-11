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
    // return h('div', {}, [p, renderSlots(this.$slots, 'header')])

    // 使用具名插槽 
    // return h('div', {}, [renderSlots(this.$slots, 'navigator'), renderSlots(this.$slots, 'header'), p,  renderSlots(this.$slots, 'footer')])

    // 作用域插槽
    const age = 40
    return h('div', {}, [renderSlots(this.$slots, 'navigator', { age }), renderSlots(this.$slots, 'header'), p,  renderSlots(this.$slots, 'footer')])
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
    // return h(
    //   'div',
    //   {},
    //   [
    //     h(
    //       'div',
    //       { class: 'red ' },
    //       'App'
    //     ),
    //     h(
    //       foo
    //       , {}
    //       ,
    //         h(
    //           'h1'
    //           ,
    //           {},
    //           'h1'
    //         ),
    //     )
    //   ]
    // )

    // 具名插槽
    // const app = h("div", {}, "App");
    // return h('div', {}, [app, h(foo, {}, {
    //   navigator: h('nav', {}, 'nav'),
    //   header: h('h1',{}, 'header'),
    //   footer: h('h1',{}, 'footer'),
    // })])

    // 作用域插槽
    const app = h("div", {}, "App");
    return h('div', {}, [app, h(foo, {}, {
      navigator: ({ age }) =>  h('nav', {}, 'nav' + age),
      header: () =>  h('h1',{}, 'header'),
      footer: () => h('h1',{}, 'footer'),
    })])

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
