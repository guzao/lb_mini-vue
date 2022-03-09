/**
 * 数据是否是对象
 * @data 数据源
*/
function isObject(data) {
    return typeof data == 'object' && data !== null;
}
/**
 * 是否是数组
*/
const isArray = Array.isArray;

/**
 * 存储响应式数据的副作用容器
 *  @ targetMap Map数据结构 全局响应式对象的容器
 *            @-- object Map数据结构 响应式对象
 *                      @-- key Set数据结构 响应式对象的key  通过key值找到对应的依赖
*/
const targetMap = new Map();
/** 触发依赖 */
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    let dep = depsMap.get(key);
    triggerEffects(dep);
}
/** 触发依赖 */
function triggerEffects(dep) {
    for (const effect of dep) {
        let _effect = effect;
        if (_effect.scheduler) {
            _effect.scheduler();
        }
        else {
            _effect.run();
        }
    }
}

/**
 * @raw 原始数据 object类型
 * 响应式对象
*/
function reactive(raw) {
    return creayeReactive(raw, mutableHandlers);
}
/**
 * @raw 原始数据 object类型
 * 只读对象
*/
function readonly(raw) {
    return creayeReactive(raw, readonlyHandlers);
}
/**
 * 数据浅代理 代理第一层属性
 * @raw 需要被检测的数据
*/
function shallowReadonly(raw) {
    return creayeReactive(raw, shallowReadonlyHandlers);
}
/**
 * 初始化Proxy 代理对象
 * @raw 需要代理的数据
 * @mutableHandlers Proxy代理对象的 get set 处理函数
*/
function creayeReactive(raw, mutableHandlers) {
    return new Proxy(raw, mutableHandlers);
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const showllGet = createGetter(true, true);
/**
 * 创建Proxy get处理函数
 * @isReadonly 只读数据 默认为false 只读数据不需要进行依赖收集
*/
function createGetter(isReadonly = false, IsShowll = false) {
    return function get(target, key) {
        if (key == "__v_isReadonly" /* IS_READONLY */) {
            return isReadonly;
        }
        else if (key == "__v_isReactive" /* IS_REACTIVE */) {
            return !isReadonly;
        }
        let res = Reflect.get(target, key);
        /**
         * 浅代理只代理第一层属性
        */
        if (IsShowll) {
            return res;
        }
        /**
         * 如果访问的数据是object类型
         * 就根据当前isReadonly的状态代理不同的数据类型
        */
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
/**
 * 创建Proxy set处理函数
*/
function createSetter() {
    return function set(target, key, value) {
        let res = Reflect.set(target, key, value);
        trigger(target, key);
        return res;
    };
}
/**
 * reactive  get set
*/
const mutableHandlers = {
    get,
    set,
};
/**
 * readonly get set
*/
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`key :"${String(key)}" set 失败，因为 target 是 readonly 类型`, target);
        return true;
    }
};
/**
 * shallowReadonlyHandlers  get set
*/
const shallowReadonlyHandlers = {
    get: showllGet,
    set(target, key, value) {
        console.warn(`key :"${String(key)}" set 失败，因为 target 是 readonly 类型`, target);
        return true;
    }
};

const publicPropertiesMap = {
    $el: (instance) => instance.vnode.el,
};
/**
 * 组件代理设置
*/
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (key in setupState) {
            return setupState[key];
        }
        else if (key in props) {
            return props[key];
        }
        /**
         * 如果访问的key存在在publicPropertiesMap对象中 就是获取publicPropertiesMap[key]的值并且执行返回组件上属性的值
        */
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    }
};

/**
 * 实例化在组件
 * @vnode 虚拟节点
 *
*/
function createComponentInstance(vnode) {
    const Component = {
        /** 虚拟节点 */
        vnode,
        /***/
        type: vnode.type,
        /** setup 函数的返回值 */
        setupState: {},
    };
    return Component;
}
/**
 * 设置组件
 * @vnode 虚拟节点
 *
*/
function setupComponent(instance) {
    // 处理props
    initProps(instance, instance.type.props);
    // 处理组件
    setupStatefulComponent(instance);
}
function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}
/**
 * 初始化有状态的组件
 * @instance 组件实例
*/
function setupStatefulComponent(instance) {
    console.log(instance);
    const Component = instance.type;
    // 实现组件代理  instance 组件实例
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    /**
     * 用户传入的 setup 函数执行后可以得到数据 或视图
    */
    const { setup, props } = Component;
    if (setup) {
        const setupResult = setup(shallowReadonly(props));
        handleSetupResult(instance, setupResult);
    }
}
/**
 * 处理组件 setup 函数返回的结果
 * @instance 组件实例
 * @setupResult  setup函数返回值
*/
function handleSetupResult(instance, setupResult) {
    // function Object
    // TODO function
    if (typeof setupResult === "object") {
        /**
         * 实例上添加 setup 函数执行返回的结果
        */
        instance.setupState = setupResult;
    }
    /**
     * 刷新组件 确保组件拥 render 函数
    */
    finishComponentSetup(instance);
}
/**
 * 刷新组件 组件上绑定 render函数
 * @instance 组件实例
*/
function finishComponentSetup(instance) {
    const Component = instance.type;
    instance.render = Component.render;
}

/**
 * @vnode 虚拟节点
 * @container 挂载的容器
*/
function render(vnode, container) {
    patch(vnode, container);
}
/**
 * @ 处理subtree
 * @ 根据vnode.type 区分组件类型 还是element类型 做不同的处理
 * @ 组件类型    执行 processComponent
 * @ element类型 执行 processElement
 * @vnode  虚拟节点
 * @container  挂载的容器
*/
function patch(vnode, container) {
    const { type } = vnode;
    if (typeof type == 'object') {
        processComponent(vnode, container);
    }
    else {
        processElement(vnode, container);
    }
}
/**
 * 处理元素
 * @vnode    虚拟节点
 * @container  挂载容器
*/
function processElement(vnode, container) {
    mountElement(vnode, container);
}
/**
 * 挂载元素
 * @vnode    虚拟节点
 * @container  挂载容器
*/
function mountElement(vnode, container) {
    const { type, children, props } = vnode;
    // 创建元素
    const el = (vnode.el = document.createElement(type));
    // Element
    // 检查children 是否是 字符串
    if (typeof children == 'string') {
        el.textContent = children;
    }
    else if (isArray(children)) { // 如果是数组类型就递归 patch 处理
        mountChildren(children, el);
    }
    // proprs 设置属性
    for (const key in props) {
        const isOn = (key) => /^on[A-Z]/.test(key);
        if (isOn(key)) {
            const eventKey = key.slice(2).toLocaleLowerCase();
            const event = props[key];
            container.addEventListener(eventKey, event);
        }
        else {
            el.setAttribute(key, props[key]);
        }
    }
    // 添加到根容器中
    container.append(el);
}
/**
 * 挂载子元素
 * @children 子元素
 * @el 根容器
*/
function mountChildren(children, el) {
    children.forEach((vnode) => {
        patch(vnode, el);
    });
}
/**
 * 处理组件
 * @vnode  虚拟节点
 * @container  挂载的容器
*/
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
/**
 * 挂载组件
 * @vnode  虚拟节点
 * @container  挂载的容器
*/
function mountComponent(vnode, container) {
    const instance = createComponentInstance(vnode);
    setupComponent(instance);
    setupRenderEffect(instance, vnode, container);
}
/**
 * 开渲染组件
 * @instance 组件实例
 * @vnode 虚拟节点
 * @container 挂载的容器
*/
function setupRenderEffect(instance, vnode, container) {
    let { proxy } = instance;
    /** 需要渲染的视图 */
    // 将render函数的this执向组件的代理对象
    const subTree = instance.render.call(proxy);
    patch(subTree, container);
    // 给组件实例添加挂载元素属性
    vnode.el = subTree.el;
}

/**
 * 生成虚拟节点
 * @type      组件
 * @props     属性
 * @children  子元素
*/
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        /** 组件挂载的节点 */
        el: null,
    };
    return vnode;
}

/**
 * 初始化应用
 * @rootComponent 根组件
*/
function createApp(rootComponent) {
    return {
        /**
         * 挂载元素
         * @rootContainer 根容器
        */
        mount(rootContainer) {
            /**
             * 创建虚拟节点
            */
            const vnode = createVNode(rootComponent);
            /**
             * 基于虚拟节点创建元素
            */
            render(vnode, rootContainer);
        }
    };
}

/**
 * 生成虚拟节点
 * @type      组件
 * @props     属性
 * @children  子元素文本类型或者数组类型
*/
function h(type, props, children) {
    return createVNode(type, props, children);
}

export { createApp, h };
