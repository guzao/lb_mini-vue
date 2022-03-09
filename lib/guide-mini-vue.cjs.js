'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

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
 * 处理组件
 * @vnode 虚拟节点
 * @container 节点挂载的容器
*/
function processComponent(vnode, container) {
    console.log('处理组件');
    mountComponent(vnode, container);
}
/**
 * 挂载组件
 * @vnode 虚拟节点
 * @container 节点挂载的容器
*/
function mountComponent(vnode, container) {
    console.log('挂载组件');
    const instance = createComponentInstance(vnode);
    console.log(instance, '=========组件实例======');
    setupComponent(instance);
    setupRenderEffect(instance, vnode, container);
}
/**
 * 创建组件实例
 * @vnode 虚拟节点
 * @container 节点挂载的容器
*/
function createComponentInstance(vnode, container) {
    console.log('创建组件实例');
    const instance = {
        vnode,
        type: vnode.type,
    };
    return instance;
}
/**
 * 初始化组件
 * @instance 组件实例
*/
function setupComponent(instance) {
    console.log('初始化组件');
    initProps(instance, instance.type.props);
    setupStatefulComponent(instance);
}
/**
 *初始化属性
*/
function initProps(instance, rawProps) {
    console.log('初始化属性,', rawProps);
    instance.props = rawProps;
}
/**
 * 初始化有状态的组件
 * @instance 组件实例
*/
function setupStatefulComponent(instance) {
    console.log('初始化有状态的组件');
    const Component = instance.type;
    console.log(Component, instance, '组件实例');
    const { setup } = Component;
    if (setup) {
        const setupResult = setup();
        handleSetupResult(instance, setupResult);
    }
}
/**
 * 处理组件返回值
*/
function handleSetupResult(instance, setupResult) {
    console.log('处理setup函数的返回值', setupResult);
    // TODO function
    // object
    if (typeof setupResult == 'object') {
        instance.setupState = setupResult;
        console.log(instance, '=====返回值是object 就给组件实例上添加setupState 属性======');
    }
    finishComponentSetup(instance);
}
/**
 * 确保组件拥有render 函数
 * @instance 组件实例
*/
function finishComponentSetup(instance) {
    const Component = instance.type;
    instance.render = Component.render;
    console.log(instance, '===确保组件拥有render 函数===');
}
/**
 * 组件处理完成交给patch
*/
function setupRenderEffect(instance, vnode, container) {
    const { setupState } = instance;
    const subTree = instance.render.call(setupState);
    console.log(instance, vnode, '组件处理完成交给patch 处理', subTree);
    patch(subTree, container);
}

/**
 * @vnode  虚拟节点 | 组件
 * @rootContainer 挂载容器
*/
function render(vnode, rootContainer) {
    patch(vnode, rootContainer);
}
/**
 * 根据vnode type 属性区分是组件还是普通元素做不同处理
 * @vnode 虚拟节点
 * @rootContainer 挂载容器
*/
function patch(vnode, container) {
    const { type } = vnode;
    console.log('根据vnode type 属性区分是组件还是普通元素做不同处理', vnode);
    if (typeof type === 'string') {
        // 元素类型
        processElement(vnode, container);
    }
    else if (isObject(type)) {
        // 组件类型
        processComponent(vnode, container);
    }
}
/**
 * 处理元素类型
 * @vnode 虚拟节点
 * @container 容器
*/
function processElement(vnode, container) {
    console.log(vnode, '== 处理element 类型 =');
    mountElement(vnode, container);
}
/**
 *  挂载元素
 * @vnode 虚拟节点
 * @container 容器
*/
function mountElement(vnode, container) {
    console.log('=== 挂载元素 ===');
    const { type, children, props } = vnode;
    const el = document.createElement(type);
    // 元素设置
    if (typeof children === 'string') {
        console.log('子元素是字符串 直接设置元素的textContent即可');
        el.textContent = children;
    }
    else if (isArray(children)) {
        console.log('子元素是数组就 循环子元素 调用patch函数 继续处理');
        mountChildren(children, el);
    }
    // 元素属性设置
    for (const key in props) {
        el.setAttribute(key, props[key]);
    }
    container.append(el);
}
/**
 * 挂载子元素
 * @children 数组类型的虚拟节点
 * @el 虚拟节点挂载的容器
*/
function mountChildren(children, el) {
    children.forEach((vnode) => {
        patch(vnode, el);
    });
}

/**
 * 创建虚拟节点
 * @type  类型
 * @props 属性
 * @children 子元素
*/
function createVNode(type, props, children) {
    console.log('创建虚拟节点');
    const vnode = {
        type,
        props,
        children,
    };
    return vnode;
}

/**
 * 初始化应用
 * @rootComponent 根组件
*/
function createApp(rootComponent) {
    console.log('初始化应用');
    return {
        /** 挂载应用 */
        mount(rootContainer) {
            console.log('挂载应用');
            /**
             * 虚拟节点
            */
            const vnode = createVNode(rootComponent);
            console.log(vnode, 'vnode, ========= 虚拟节点 ========');
            /**
             * 基于虚拟节点执行后续操作
            */
            render(vnode, rootContainer);
        }
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

exports.createApp = createApp;
exports.h = h;
