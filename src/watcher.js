import Dep, {targetStack} from './dep'
import {callHook} from "./instance";

export class Watcher {
  constructor(vm, updateFn, options) {
    this.vm = vm;
    this.getter = updateFn;
    this.deps = [];
    this.update();
  }

  addDep(dep) {
    if (!this.deps.some((d) => dep === d)) {
      this.deps.push(dep);
      dep.addSub(this);
    }
  }

  cleanupDeps() {
    this.deps.forEach((dep) => {
      dep.removeSub(this);
      this.deps.length = 0;
    })
  }

  get() {
    Dep.target = this;
    targetStack.push(this);
    this.getter.call(this.vm);
    Dep.target = targetStack.pop();
    this.cleanupDeps();
  }

  update() {
    callHook(this.vm, "beforeUpdate");
    this.get();
    callHook(this.vm, "updated")
  }
}
