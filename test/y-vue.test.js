require('../dist/y-vue.js')

const htmlTemplate = `
<html>
<head>
	<title>y-vue test</title>
	<meta charset="utf-8" />
</head>
<body>

<div id="el">
  <div id="testDoubleBrackets">{{doubleBrackets}}</div>
  <div id="testIf" v-if="if0">
    <div id="testNestedIf0" v-if="true"></div>
    <div id="testNestedElseIf0" v-else-if="false"></div>
    <div id="testNestedElse0" v-else=""></div>
  </div>
  <div id="testElseIf" v-else-if="if1">
    <div id="testNestedIf1" v-if="false"></div>
    <div id="testNestedElseIf1" v-else-if="true"></div>
    <div id="testNestedElse1" v-else=""></div>
  </div>
  <div id="testElse" v-else="">
    <div id="testNestedIf2" v-if="false"></div>
    <div id="testNestedElseIf2" v-else-if="false"></div>
    <div id="testNestedElse2" v-else=""></div>
  </div>
  <div class="testFor0" v-if="if2" v-for="id in for0">{{id}}</div>
  <div v-for="id0 in for0">
    <div class="testFor1" v-for="id1 in for1">{{id0 + "-" + id1}}</div>
  </div>
  <div>
    <component0></component0>
  </div>
  <div>
    <component1></component1>
  </div>
</div>

</body>
</html>
`

const document = new DOMParser().parseFromString(htmlTemplate, "text/xml");

const innerHTML = id => {
  const elem = document.querySelector(`#${id}`);
  return elem
    ? elem.innerHTML
    : null
}

const innerHTMLList = className => {
  const elemList = document.querySelectorAll(`.${className}`);
  return Array.from(elemList).map(elem => elem.innerHTML);
}

const component0Template = `<div :id="name">{{name}}</div>`

const component1Template = `<div :id="name"><component0></component0></div>`

const Component0 = {
  template: component0Template,
  data() {
    return {
      name: `testComponent0`
    }
  }
}

const Component1 = {
  template: component1Template,
  data() {
    return {
      name: `testComponent1`
    }
  },
  components: {
    component0: Component0
  }
}

const instance = new Vue({
  el: document.querySelector("#el"),
  data() {
    return {
      doubleBrackets: "123",
      if0: true,
      if1: true,
      if2: true,
      for0: [0, 1, 2, 3],
      for1: ["a", "b", "c", "d"]
    }
  },
  components: {
    component0: Component0,
    component1: Component1
  },
  docContent: document
});

test('test double brackets', () => {
  expect(innerHTML("testDoubleBrackets")).toBe("123");
})

test('test if0', () => {
  expect(innerHTML("testIf")).toBeDefined();
  expect(innerHTML("testElseIf")).toBeNull();
  expect(innerHTML("testElse")).toBeNull();
})

test('test if1', () => {
  instance.if0 = false;
  expect(innerHTML("testIf")).toBeNull();
  expect(innerHTML("testElseIf")).toBeDefined();
  expect(innerHTML("testElse")).toBeNull();
})

test('test if2', () => {
  instance.if1 = false;
  expect(innerHTML("testIf")).toBeNull();
  expect(innerHTML("testElseIf")).toBeNull();
  expect(innerHTML("testElse")).toBeDefined();
})

test('test nested if0', () => {
  instance.if0 = true;
  expect(innerHTML("testNestedIf0")).toBeDefined();
  expect(innerHTML("testNestedElseIf0")).toBeNull();
  expect(innerHTML("testNestedElse0")).toBeNull();
})

test('test nested if1', () => {
  instance.if0 = false;
  instance.if1 = true;
  expect(innerHTML("testNestedIf1")).toBeNull();
  expect(innerHTML("testNestedElseIf1")).toBeDefined();
  expect(innerHTML("testNestedElse1")).toBeNull();
})

test('test nested if1', () => {
  instance.if1 = false;
  expect(innerHTML("testNestedIf2")).toBeNull();
  expect(innerHTML("testNestedElseIf2")).toBeNull();
  expect(innerHTML("testNestedElse2")).toBeDefined();
})

test('test for0', () => {
  innerHTMLList("testFor0").forEach((HTML, index) => {
    expect(HTML).toBe(index.toString());
  })
})

test('test for0 and if', () => {
  instance.if2 = false;
  expect(innerHTMLList("testFor0").length).toBe(0);
})

test('test nested for', () => {
  let count = 0;
  innerHTMLList("testFor0").forEach((HTML, index) => {
    if (index % count === 0) {
      count ++;
    }
    expect(HTML).toBe(index.toString() + "-" + instance.for1[index]);
  })
})

test('test component0', () => {
  expect(innerHTML("testComponent0")).toBe(`testComponent0`);
})

test('test component1', () => {
  expect(innerHTML("testComponent1")).toBe(`<div id="testComponent0">testComponent0</div>`);
})