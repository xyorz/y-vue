import Dep from './dep'
const mutationMethods = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];

export class Observer {
  constructor(value) {
    if (Array.isArray(value)) {
      observeArray(value)
    } else {
      this.walk(value)
    }
  }

  walk(obj) {
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i])
    }
  }
}

export function observe (value) {
  if (typeof value !== 'object') {
    return
  }
  return new Observer(value);
}

function observeArray(arr) {
  arr.forEach((a) => observe(a));
}

function observeArrayMutation(arr, dep) {
  let arrayProto = Array.prototype;
  let arrayReactiveMethods = Object.create(arrayProto);
  mutationMethods.forEach((method) => {
    arrayReactiveMethods[method] = function (...args) {
      const result = arrayProto[method].apply(arr, ...args);
      let inserted;
      if (["unshift", "push"].includes(method)) {
        inserted = args;
      } else if ("splice" === method) {
        inserted = args.slice(2);
      }
      if (inserted) {
        observeArray(inserted);
      }
      dep.notify();
      return result;
    }
  });
  arr.__proto__ = arrayReactiveMethods;
}

export function defineReactive(obj, key) {
  let dep = new Dep();
  observe(obj[key]);
  let value = obj[key];
  if (Array.isArray(value)) {
    observeArrayMutation(value, dep);
  }
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      if (Dep.target) {
        dep.depend()
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      if (newVal === value) {
        return
      }
      value = newVal;
      dep.notify()
    }
  })
}
