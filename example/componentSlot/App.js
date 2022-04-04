import { h, createTextVNode} from "../../lib/guide-mini-vue.esm.js";
import { Foo } from "./Foo.js";

// Fragment 以及 Text
export const App = {
  name: "App",
  render() {
    const app = h("div", {}, "App");

    const header = (props) => {
      return [ h('div', {}, 'header' + props.count), createTextVNode('hhaah')]
    } 
    const footer = (props) =>  h('div', {}, 'footer')
    const hj = (prosp) => h('h1', { class: 'red' }, '[]')

    // 单个节点
    // const foo = h(Foo, {}, header );
    // 支持传入数组
    // const foo = h(Foo, {}, [header, footer] )
    
    // 实现具名插槽
    // 作用域插槽
    const foo = h(Foo, {}, {
      footer: footer,
      header: header,
      hj: hj
    });

    return h("div", {}, [app, foo]);
  },

  setup() {
    return {};
  },
};
