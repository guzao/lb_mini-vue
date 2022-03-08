/**
 * 数据是否是对象
 * @data 数据源
*/
/**
 * 是否是数组
*/
const isArray = Array.isArray;

/**
 * 实例化在组件
 * @vnode 虚拟节点
 *
*/
function createComponentInstance(vnode) {
    const Component = {
        /** 虚拟节点 */
        vnode,
        type: vnode.type
    };
    return Component;
}
/**
 * 设置组件
 * @vnode 虚拟节点
 *
*/
function setupComponent(instance) {
    // TODO
    // initProps()
    // initSlots()
    setupStatefulComponent(instance);
}
/**
 * 初始化有状态的组件
 * @instance 组件实例
*/
function setupStatefulComponent(instance) {
    /**
     * 组件
    */
    const Component = instance.type;
    /**
     * 用户传入的 setup 函数执行后可以得到数据 或视图
    */
    const { setup } = Component;
    if (setup) {
        const setupResult = setup();
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
 * 刷新组件
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
 * 处理subtree
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
    console.log(vnode);
    // 创建元素
    const el = document.createElement(type);
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
        el.setAttribute(key, props[key]);
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
    setupRenderEffect(instance, container);
}
/**
 * 开渲染组件
 * @instance 组件实例
 * @container 挂载的容器
*/
function setupRenderEffect(instance, container) {
    /** 需要渲染的视图 */
    const subTree = instance.render();
    patch(subTree, container);
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
        children
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
