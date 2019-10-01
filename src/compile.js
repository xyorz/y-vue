const vueAttrReg = [/^(v-on):(.+?)$/, /^(@)(.+?)$/, /^(v-bind):(.+?)$/, /^(:)(.+)?$/];
// v-if语句上下文栈
const ifStack = [];

export function updateDOM(vm, el) {
  // template由字符串转化为DOM
  let tempElm = document.createElement("div");
  tempElm.innerHTML = vm.$options.template;
  // 新的要插入el的DOM
  let newElm = createEmptyElement(tempElm.firstChild.tagName);
  // 由模板和vm实例构建新的DOM
  buildElement(vm, newElm, tempElm.firstChild);
  el.innerHTML = newElm.firstChild.innerHTML;
}

function buildElement(vm, parent, tempElem) {
  let elementToInsert = null;
  let attrs = getAttrs(tempElem);
  // 组件名称Set
  let componentTags = new Set(Object.keys(vm.$options.components || {})
    .concat(Object.keys(vm.constructor._base._components || {})));
  if (tempElem.nodeType === 3) {
    // textNode
    parent.appendChild(createTextNode(vm, tempElem.data));
    return;
  } else if (componentTags.has(tempElem.tagName.toLowerCase())) {
    // 组件
    createComponent(vm, tempElem.tagName.toLowerCase(), parent);
    return;
  } else if (tempElem.nodeType === 1) {
    // element
    let hasNextSibling = tempElem.nextElementSibling;
    // 处理v-if语句
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
      if (prevSibling && getAttrs(prevSibling).includes("v-if", "v-else-if")) {
        ifStack.pop();
      }
    }
  }
  elementToInsert = createElem(vm, tempElem);
  parent.appendChild(elementToInsert);
  let childNodes = Array.from(tempElem.childNodes);
  // v-for语句
  if (attrs && attrs.includes("v-for")) {
    let [alias, source] = resolveVueAttr(vm, "v-for", null, tempElem.getAttribute("v-for"));
    let context = Object.create(vm);
    for (let i in Object.keys(source)) {
      context[alias] = source[i];
      for (let childNode of childNodes) {
        buildElement(context, elementToInsert, childNode);
      }
    }
  } else {
    childNodes.forEach(function (node) {
      buildElement(vm, elementToInsert, node);
    })
  }
}

export function createTextNode(vm, text) {
  if (text) {
    text = text.replace(/{{(.*?)}}/g, (match, $1) => resolveExp(vm, $1, "string"));
    return document.createTextNode(text);
  }
  return document.createTextNode("");
}

function createEmptyElement(tag) {
  return document.createElement(tag);
}

function createElem(vm, tempElem) {
  let newElem = createEmptyElement(tempElem.tagName);
  transformAttr(vm, newElem, tempElem);
  return newElem;
}

function createComponent(vm, name, parent) {
  // 由组件自身定义的component或Vue.component声明的全局组件获取组件的构造函数
  let Ctor = vm.$options.components && vm.$options.components[name] || vm.constructor._base._components[name];
  // 将组件的template字符串转化为DOM
  let tempElem = document.createElement("div");
  tempElem.innerHTML = Ctor.options.template;
  // 将template的根元素插入到DOM中作为组件的el
  Ctor.options.el = tempElem.firstChild;
  parent.appendChild(tempElem.firstChild);
  new Ctor(Ctor.options);
}

function transformAttr(vm, newElem, tempElem) {
  let attrs = getAttrs(tempElem);
  for (let attr of attrs) {
    let [matchAttr, matchParam] = [null, null];
    let attrVal = tempElem.getAttribute(attr);
    for(let vAttrReg of vueAttrReg){
      if (vAttrReg.test(attr)) {
        [matchAttr, matchParam] = [RegExp.$1, RegExp.$2];
        break;
      }
    }
    if (matchAttr) {
      // vue模板属性
      const [attr, val] = resolveVueAttr(vm, matchAttr, matchParam, attrVal);
      newElem.setAttribute(attr, val);
    } else {
      // DOM原生属性
      newElem.setAttribute(attr, attrVal);
    }
  }
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
    evalString = "with(vm){return toString(" + exp +")}"
  } else if (type === "event") {

  } else {
    evalString = "with(vm){return (" + exp +")}";
  }
  return (new Function("vm", evalString))(vm);
}

function getAttrs(elem) {
  if (elem.attributes) {
    return Array.from(elem.attributes).map((attrObj) => attrObj.name)
  }
}
