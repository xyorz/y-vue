import Dep, {targetStack} from './dep'
import {callHook} from "./instance";

export class Watcher {
  constructor(vm, updateFn) {
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
    });
    this.deps = [];
  }

  get() {
    this.cleanupDeps();
    Dep.target = this;
    targetStack.push(this);
    this.getter.call(this.vm);
    targetStack.pop();
    Dep.target = targetStack[targetStack.length-1];
  }

  update() {
    callHook(this.vm, "beforeUpdate");
    this.get();
    callHook(this.vm, "updated")
  }
}
