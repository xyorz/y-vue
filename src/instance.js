import {observe} from "./observer";
import {updateDOM} from "./compile";
import {Watcher} from "./watcher";

export default function Vue(options) {
  this._init(options);
}

Vue._base = Vue;
Vue._components = {};

Vue.extend = function (options) {
  const Super = this;
  const Sub = function VueComponent (options) {
    this._init(options)
  };
  Sub.prototype = Object.create(Super.prototype);
  Sub.prototype.constructor = Sub;
  Sub.options = options;
  Sub.super = Super;
  Sub._base = Super._base;
  return Sub
};

Vue.component = function(name, options) {
  let Ctor = Vue.extend(options);
  Ctor._base._components[name] = Ctor;
};

Vue.prototype._init = function (options) {
  let vm = this;
  vm.$options = options;
  if (!vm.$options.template) {
    vm.$options.template = vm.$options.el.outerHTML || "";
  }
  initEvent(vm);
  callHook(vm, "beforeCreate");
  initState(vm);
  callHook(vm, "created");
  if (vm.$options.el) {
    vm.$mount()
  }
};

Vue.prototype.$mount = function () {
  let update = function() {
    updateDOM(this, this.$options.el);
  };
  callHook(this, "beforeMount");
  new Watcher(this, update, null);
  callHook(this, "mounted");
  return this;
};

Vue.prototype.$destroy = function () {
  callHook(this, "beforeDestroy");
  this._watcher.teardown();
  callHook(this, "destroyed");
};

export function proxy (target, sourceKey, key) {
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

Vue.prototype.toString = toString;

function toString (val) {
  return val == null
    ? ''
    : Array.isArray(val) || (Object.prototype.toString.call(val) === '[Object Object]' && val.toString === Object.prototype.toString)
      ? JSON.stringify(val, null, 2)
      : String(val)
}

function initState (vm) {
  vm._data = typeof vm.$options.data === "function"
    ? vm.$options.data.call(vm, vm)
    : vm.$options.data || {};
  vm._methods = vm.$options.methods || {};
  vm._props = vm.$options.propsData || {};
  observe(vm._data);
  Object.keys(vm._data).forEach((key) => proxy(vm, '_data', key));
  Object.keys(vm._methods).forEach((key) => proxy(vm, '_methods', key));
  Object.keys(vm._props).forEach((key) => proxy(vm, '_props', key));
}

function initEvent (vm) {
  vm._events = vm.$options.parentEvents || {};
  vm.$on = function (event, callback) {
    if (!vm._events[event]) {
      vm._events[event] = [];
    }
    vm._events[event].push(callback);
  };
  vm.$emit = function (event, ...args) {
    if (vm._events[event]) {
      vm._events[event].forEach((e) => e.apply(vm, args));
    }
  };
}

export function callHook(vm, hook) {
  let handler = vm.$options[hook];
  if (handler) {
    handler.call(vm);
  }
}

window.Vue = Vue;
