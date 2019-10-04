// v-if上下文栈
const ifStack = [];

export function updateDOM(vm, el) {
  clearListeners(vm, el);
  // template由字符串转化为DOM
  let tempElmContainer = document.createElement("div");
  tempElmContainer.innerHTML = vm.$options.template;
  let tempElm = tempElmContainer.firstChild;
  // 新的要插入el的DOM
  let newElmContainer = document.createElement("div");
  // 由模板和vm实例构建新的DOM
  buildElement(vm, newElmContainer, tempElm);
  let newElm = newElmContainer.firstChild;
  el.parentElement.insertBefore(newElm, el);
  el.parentElement.removeChild(el);
  vm.$options.el = newElm;
}

function buildElement(vm, parent, tempElem, noFor) {
  let elementToInsert = null;
  let attrs = getAttrs(tempElem);
  let events = {};
  // v-for 语句
  if (attrs && attrs.includes("v-for") && !noFor) {
    let [alias, source] = resolveVueAttr(vm, "v-for", null, tempElem.getAttribute("v-for"));
    // 创建变量上下文
    let context = Object.create(vm);
    for (let i of Object.keys(source)) {
      context[alias] = source[i];
      buildElement(context, parent, tempElem, true);
    }
    return;
  }
  // 注册过的组件名称Set
  let componentTags = new Set(Object.keys(vm.$options.components || {})
    .concat(Object.keys(vm.constructor._base._components || {})));
  if (tempElem.nodeType === 3) {
    // 文本节点
    parent.appendChild(createTextNode(vm, tempElem.data));
    return;
  } else {
    let hasNextSibling = !!tempElem.nextElementSibling;
    // v-if语句，判断是否渲染元素，不渲染直接return
    if (attrs.includes("v-if")) {
      const exp = tempElem.getAttribute("v-if");
      if (resolveExp(vm, exp)) {
        hasNextSibling && ifStack.push(true);
      } else {
        hasNextSibling && ifStack.push(false);
        return;
      }
    } else if (attrs.includes("v-else-if")) {
      let alreadyTrue = ifStack.pop();
      if (alreadyTrue) {
        hasNextSibling && ifStack.push(true);
        return;
      } else {
        const exp = tempElem.getAttribute("v-else-if");
        if (resolveExp(vm, exp)) {
          hasNextSibling && ifStack.push(true);
        } else {
          return;
        }
      }
    } else if (attrs.includes("v-else")) {
      let alreadyTrue = ifStack.pop();
      if (alreadyTrue) {
        return;
      }
    } else {
      let prevSibling = tempElem.previousElementSibling;
      let prevAttrs = getAttrs(prevSibling);
      if (prevAttrs && prevAttrs.includes("v-if") || prevAttrs.includes("v-else-if") ) {
        ifStack.pop();
      }
    }
    // v-if结束，元素需要渲染
    // 处理元素事件，生成 events 对象
    for (let attr of attrs) {
      if (/^v-on:(.+?)$/.test(attr) || /^@(.+?)$/.test(attr)) {
        let [event, callback] = resolveVueAttr(vm, "v-on", RegExp.$1, tempElem.getAttribute(attr));
        if (!events[event]) {
          events[event] = [];
        }
        events[event].push(callback);
      }
    }
    if (componentTags.has(tempElem.tagName.toLowerCase())) {
      // 组件
      let attrObj = transformVBindAttr(vm, tempElem);
      let newComponent = createComponent(vm, tempElem.tagName.toLowerCase(), attrObj, events);
      elementToInsert = newComponent.$options.el;
      elementToInsert._componentInstance = newComponent;
    } else {
      // DOM元素
      elementToInsert = createElem(vm, tempElem);
      // 事件注册与监听
      for (let event of Object.keys(events)) {
        events[event] = events[event].map((e) => e.bind(vm));
        events[event].forEach((e) => {
          elementToInsert.addEventListener(event, e);
          vm.$on(event, e);
        });
      }
      elementToInsert._listeners = events;
    }
  }
  parent.appendChild(elementToInsert);
  let childNodes = Array.from(tempElem.childNodes);
  childNodes.forEach(function (node) {
    buildElement(vm, elementToInsert, node);
  })
}

export function createTextNode(vm, text) {
  if (text) {
    text = text.replace(/{{(.*?)}}/g, (match, $1) => resolveExp(vm, $1, "string"));
  }
  return document.createTextNode(text? text: "");
}

function createElem(vm, tempElem) {
  let newElem = document.createElement(tempElem.tagName);
  let attrObj = transformVBindAttr(vm, tempElem);
  for (let i of Object.keys(attrObj)) {
    newElem.setAttribute(i, attrObj[i]);
  }
  return newElem;
}

function createComponent(vm, name, props, events) {
  // 由组件自身定义的component或Vue.component声明的全局组件获取组件的构造函数
  let Ctor = vm.$options.components && vm.$options.components[name] || vm.constructor._base._components[name];
  // 如果 Ctor 不是构造函数，调用 extend 生成构造
  if (typeof Ctor !== "function") {
    Ctor = vm._base.extend(Ctor);
  }
  let options = Ctor.options;
  // 处理 props
  options.propsData = {};
  if (options.props && Array.isArray(options.props)) {
    for (let i of Object.keys(props)) {
      if (options.props.includes(i)) {
          options.propsData[i] = props[i];
      }
    }
  }
  // event 的 this 指针绑定实例
  for (let event of Object.keys(events)) {
    events[event] = events[event].map((e) => e.bind(vm));
  }
  options.parentEvents = events;
  // template 的根元素作为 el
  let tempElmContainer = document.createElement("div");
  tempElmContainer.innerHTML = Ctor.options.template;
  let temElm = tempElmContainer.firstChild;
  // 将template的根元素插入到DOM中作为组件的el
  options.el = temElm;
  return new Ctor(options);
}

function clearListeners(vm, el) {
  if (el._listeners) {
    for (let event of Object.keys(el._listeners)) {
      el._listeners[event].forEach((e) => el.removeEventListener(event, e));
    }
  }
  if (el._componentInstance) {
    vm = el._componentInstance;
    vm.$destroy();
  }
  let childNodes = Array.from(el.childNodes);
  childNodes.forEach((e) => clearListeners(vm, e));
}

function transformVBindAttr(vm, tempElem) {
  let attrs = getAttrs(tempElem);
  let resAttrObj = {};
  for (let attr of attrs) {
    let [matchAttr, matchParam] = [null, null];
    let attrVal = tempElem.getAttribute(attr);
    for(let vAttrReg of [/^(v-bind):(.+?)$/, /^(:)(.+)?$/]){
      if (vAttrReg.test(attr)) {
        [matchAttr, matchParam] = [RegExp.$1, RegExp.$2];
        break;
      }
    }
    if (matchAttr) {
      // vue模板属性
      const [attr, val] = resolveVueAttr(vm, matchAttr, matchParam, attrVal);
      if (attr) {
        resAttrObj[attr] = val;
      }
    } else {
      if (attr.slice(0, 2) !== "v-" && attr.slice(0, 1) !== "@" && attr.slice(0, 1) !== ":" ) {
        // DOM原生属性
        resAttrObj[attr] = attrVal;
      }
    }
  }
  return resAttrObj;
}

function resolveVueAttr(vm, attr, param, val) {
  if (attr === "v-if") {
    return resolveExp(vm, val);
  } else if (["v-on", "@"].includes(attr)) {
    return [param, resolveExp(vm, val, "event")];
  } else if (["v-bind", ":"].includes(attr)) {
    return [param, resolveExp(vm, val)];
  } else if ("v-for" === attr) {
    /^(.+)? in (.+?)$/.test(val);
    const [alias, sourceExp] = [RegExp.$1, RegExp.$2];
    let source = resolveExp(vm, sourceExp);
    return [alias, source];
  }
}

function resolveExp(vm, exp, type) {
  let evalString = "";
  if (type === "string") {
    evalString = "with(vm){return toString(" + exp +")}";
  } else if (type === "event") {
    if (/^[a-zA-Z][a-zA-Z0-9]*?$/.test(exp)) {
      // 函数
      evalString = "with(vm){return " + exp + "}";
    } else {
      // 语句
      evalString = "with(vm){return function(){" + exp + "}}";
    }
  } else {
    evalString = "with(vm){return (" + exp +")}";
  }
  return (new Function("vm", evalString))(vm);
}

function getAttrs(elem) {
  if (elem && elem.attributes) {
    return Array.from(elem.attributes).map((attrObj) => attrObj.name)
  }
  return [];
}
