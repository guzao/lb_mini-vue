
import { h } from '../../lib/guide-mini-vue.esm.js'
window.self = null
export default {
  name: "App",
  setup(props) {
    return {
      msg: '哈哈啊哈',
      jk: '测试组件代理对象'
    }
  },
  props: {
    mag: '哈哈嘿嘿',
  },
  render() {
    window.self = this
    // 测试单个元素
    // return h("div", 
    // { id: '45', class: 'red'  }, 
    //   [ 
    //     h('div', { id: 'op1' }, '我是div1'), 
    //     h('div', { id: 'op2' }, '我是div2'), 
    //     h('div', { id: 'op3' }, '我是div3')
    //   ]
    // );

    // 测试组件代理对象
    return h('div', {  }, 'hi' + this.msg + this.jk )
    

    // 测试 $el
    // return h('div', {  }, 'hi' + this.msg)
  },
};