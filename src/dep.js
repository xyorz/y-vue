export default class Dep {
  constructor() {
    this.subs = [];
  }

  notify() {
    this.subs.forEach((sub) => {
      sub.update();
    })
  }

  depend() {
    if (Dep.target) {
      Dep.target.addDep(this);
    }
  }

  addSub(sub) {
    this.subs.push(sub);
  }

  removeSub(subToRemove) {
    this.subs = this.subs.filter((sub) => subToRemove !== sub);
  }
}

export let targetStack = [];
Dep.target = null;
