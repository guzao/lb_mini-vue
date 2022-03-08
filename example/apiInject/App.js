
import { h } from '../../lib/guide-mini-vue.esm.js'

const Foo = {
  name: "Foo",
  setup() {
    return {
      obj: []
    }
  },
  render () {
    return h('div', { }, 'foo')
  }
}

export default {
  name: "App",
  setup() {
    return {
      obj: 'mini-vue',
      hg: '哈哈啊哈'
    }
  },
  render() {
    // 测试单个元素
    // return h("div", { test: 'test'  }, 'ceshi');

    // 测试子元素为数组
    // return h("div", { test: 'test' }, [ h('p', {}, 'p1'), h('p', {}, 'p2'), h('span', {}, 'span') ]);

    // 测试多层嵌套
    // return h("div", { test: 'test'  }, [
    //   h('ul', {}, [
    //     h('li', {}, [
    //       h('span', {},'span1'),
    //       h('span', {},'span2')
    //     ])
    //   ])
    // ]);

    // 测试子元素是组件类型
    // return h("div", { test: 'test' }, [ h(Foo), h(Foo) , h('span', { class: 'red blue' }, 'opopp')])

    // 添加属性
    // return h("div", { class: 'red blue', id: 'div' }, 'ceshi');

    const foo = h('h2', { style: 'font-size: 45px' }, '我是H2')
    // 组件代理
    return h('div', { class: 'red' },  [ h('div', {} , this.obj + this.hg), foo ])

  },
};