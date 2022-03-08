
import { h } from '../../lib/guide-mini-vue.esm.js'

export default {
  name: "App",
  setup() {
    return {
      obj: 'mini-vue'
    }
  },
  render() {
    // return h("div", { test: 'test'  }, 'ceshi');
    // return h("div", { test: 'test' }, [ h('p', {}, 'p1'), h('p', {}, 'p2') ]);
    return h("div", { test: 'test' }, [ h('p', {}, 'p1'), h('p', {}, 'p2') ]);
  },
};