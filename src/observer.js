import Dep from './dep'
export class Observer {
  constructor(value) {
    if (Array.isArray(value)) {
      this.observeArray(value)
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

  observeArray(arr) {
    arr.forEach((a) => observe(a));
  }
}

export function observe (value) {
  if (typeof value !== 'object') {
    return
  }
  return new Observer(value);
}

export function defineReactive(obj, key) {
  let dep = new Dep();
  observe(obj[key]);
  let value = obj[key];
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
