
import { h, renderSlots } from '../../lib/guide-mini-vue.esm.js'
const foo = {
  name: "foo",
  setup (props, { emit }) {
    const add  = () => {
      emit('add', 1, 2)
    }
    return {
      th: 'BU',
      add
    }
  },
  render () {
    // 2 可以通过this.xxx 获取props 数据
    return h('button', {
      onClick: this.add,
    }, 'button')
  }
}
const foo1 = {
  name: "foo",
  setup (props, { emit }) {
    const add  = () => {
      emit('add-foo', 4, 5 )
    }
    return {
      th: 'BU',
      add
    }
  },
  render () {
    // 2 可以通过this.xxx 获取props 数据
    return h('button', {
      onClick: this.add,
    }, 'foo1')
  }
}


/** c组件插槽 */
// 1 可以通过this$slots获取到传入的虚拟节点 ==》 ok
// 2 使用一个 renderSolts 函数来创建节点 
const APP1 = {
  name: 'APP1',
  setup () {
  },
  render () {
     const app1 = h('div', {}, 'APP1'  )
    return h('div', {}, [app1, renderSlots(this.$slots)])
  }
}
window.self = null
export default {
  name: "App",
  setup(props) {
    return {
    }
  },
  props: {
    mag: '哈哈嘿嘿',
  },
  render() {
    window.self = this
    // 测试单个元素
    // return h("div", 
    // { id: '45', class: ''  }, 
    //   [ 
    //     h('div', { id: 'op1' }, '我是div1'), 
    //     h('div', { id: 'op2' }, '我是div2'), 
    //     h(foo, { count: 1 })
    //   ]
    // );

    // 测试组件代理对象
    // return h('div', {  }, 'hi' + this.msg + this.jk )
    

    // 测试 $el
    // return h('div', {  }, 'hi' + this.msg)

    // return h('div', {}, [h(foo, { 
    //   onAdd: (a,b) => {
    //     console.log('onAdd',a,b)
    //   },
     
    //  }), h(foo1, {  onAddFoo: (a,b) => {
    //   console.log('onAddFoo', a,b)
    // } }, [ h('div', {}, 'div') ])] )




    return h('div', {}, [h(APP1, {}, h('h1', {}, 'h1'))])

  },
};
