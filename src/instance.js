import {observe} from "./observer";
import {updateDOM} from "./compile";
import {Watcher} from "./watcher";

export default function Vue(options) {
  this._init(options);
}

Vue._base = Vue;
Vue._components = {};

Vue.component = function (name, options) {
  const Super = this;
  const Sub = function VueComponent (options) {
    this._init(options)
  };
  Sub.prototype = Object.create(Super.prototype);
  Sub.prototype.constructor = Sub;
  Sub.options = options;
  Sub.super = Super;
  Sub._base = Super._base;
  Sub._base._components[name] = Sub;
  return Sub
};

Vue.prototype._init = function (options) {
  let vm = this;
  vm.$options = options;
  callHook(vm, "beforeCreate");
  initState(vm);
  callHook(vm, "created");
  if (vm.$options.el) {
    vm.$mount(vm.$options.el)
  }
};

Vue.prototype.toString = toString;

Vue.prototype.$mount = function(el) {
  let update = function() {
    updateDOM(this, el);
  };
  callHook(this, "beforeMount");
  new Watcher(this, update, null);
  callHook(this, "mounted");
  return this;
};

function proxy (target, sourceKey, key) {
  Object.defineProperty(target, key, {
    enumerable: true,
    configurable: true,
    get() {
      return this[sourceKey][key]
    },
    set(val) {
      this[sourceKey][key] = val
    }
  })
}

function toString (val) {
  return val == null
    ? ''
    : Array.isArray(val) || (Object.prototype.toString.call(val) === '[Object Object]' && val.toString === Object.prototype.toString)
      ? JSON.stringify(val, null, 2)
      : String(val)
}

let initState = function (vm) {
  vm._data = typeof vm.$options.data === "function"
    ? vm.$options.data.call(vm, vm)
    : vm.$options.data;
  observe(vm._data);
  const keys = Object.keys(vm._data);
  keys.forEach((key) => proxy(vm, '_data', key));
};

export function callHook(vm, hook) {
  let handler = vm.$options[hook];
  if (handler) {
    handler();
  }
}

window.Vue = Vue;
