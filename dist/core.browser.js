var xJS = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/state.ts
  var State, sm;
  var init_state = __esm({
    "src/state.ts"() {
      "use strict";
      State = class {
        #name;
        #value;
        #updateFunc;
        #args;
        #subs = [];
        #compute;
        #isDependent;
        constructor(name, options = {
          value: null,
          onChange: () => {
          },
          args: []
        }) {
          this.#name = name;
          this.#value = options.value;
          this.#updateFunc = options.onChange ?? (() => {
          });
          this.#args = options.args ?? [];
          this.#compute = options.compute;
          this.#isDependent = options.compute !== void 0;
          if (this.#isDependent) {
            this.#value = this.#compute();
            const deps = options.deps ?? [];
            for (const dep of deps) {
              dep.sub({ type: "dependent", update: () => this.#recompute(), args: [] });
            }
          }
        }
        set(value) {
          if (this.#isDependent) {
            throw new Error(`cannot set dependent state "${this.#name}"`);
          }
          this.#value = value;
          this.#updateFunc(this.#value, ...this.#args);
          for (const sub of this.#subs) {
            if (sub.type === "dependent") {
              sub.update.call(sub, this);
            } else {
              sub.update.call(sub, this.#value);
            }
          }
          return true;
        }
        #recompute() {
          this.#value = this.#compute(...this.#args);
          for (const sub of this.#subs) {
            if (sub.type === "dependent") {
              sub.update.call(sub, this);
            } else {
              sub.update.call(sub, this.#value);
            }
          }
        }
        get() {
          return this.#value;
        }
        onChange(update, args = []) {
          this.#updateFunc = update;
          this.#args = args;
        }
        sub(opt) {
          this.#subs.push(opt);
          return true;
        }
      };
      sm = (state) => {
        if (state) {
          return sm.states[state];
        }
      };
      sm.states = {};
      sm.new = (name, options) => {
        sm.states[name] = new State(name, options);
        return true;
      };
      sm.del = (name) => {
        delete sm.states[name];
        return true;
      };
      if (typeof globalThis !== "undefined") {
        ;
        globalThis.sm = sm;
      }
    }
  });

  // src/domReady.ts
  function domReady(cb) {
    if (typeof document === "undefined") return;
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", cb);
    } else {
      cb();
    }
  }
  var init_domReady = __esm({
    "src/domReady.ts"() {
      "use strict";
    }
  });

  // src/x-bind.ts
  var require_x_bind = __commonJS({
    "src/x-bind.ts"() {
      "use strict";
      init_state();
      init_domReady();
      var excludedModelTypes = /* @__PURE__ */ new Set(["checkbox", "radio"]);
      domReady(() => {
        document.querySelectorAll("[x-bind], [x-model]").forEach((el) => {
          bindText(el);
          bindModel(el);
        });
      });
      function bindText(el) {
        const names = (el.getAttribute("x-bind") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
        if (names.length === 0) return;
        const bound = [];
        for (const name of names) {
          const state = sm(name);
          if (!state) {
            console.log(`x-bind: state "${name}" not found on <${el.tagName}>`);
            continue;
          }
          bound.push({ name, state });
        }
        if (bound.length === 0) return;
        const content = el.textContent;
        const reRender = () => {
          let temp = content;
          for (const { name, state } of bound) {
            temp = temp.split(`$${name}`).join(state.get());
          }
          el.textContent = temp;
        };
        reRender();
        const subInfo = {
          type: "normal",
          update: reRender,
          args: []
        };
        for (const { state } of bound) {
          state.sub(subInfo);
        }
      }
      function bindModel(el) {
        const name = (el.getAttribute("x-model") ?? "").trim();
        if (!name) return;
        if (el.tagName === "SELECT" || excludedModelTypes.has(el.type ?? "")) {
          console.log(`x-model: <${el.tagName}> on "${name}" is not supported (excluded control type)`);
          return;
        }
        const state = sm(name);
        if (!state) {
          console.log(`x-model: state "${name}" not found on <${el.tagName}>`);
          return;
        }
        if (el.value !== String(state.get())) {
          el.value = String(state.get());
        }
        el.addEventListener("input", () => {
          if (state.get() !== el.value) {
            state.set(el.value);
          }
        });
        const subInfo = {
          type: "normal",
          update: () => {
            if (el.value !== String(state.get())) {
              el.value = String(state.get());
            }
          },
          args: []
        };
        state.sub(subInfo);
      }
    }
  });

  // ../tmp/tmp.T308mJQWBY.ts
  var tmp_T308mJQWBY_exports = {};
  __export(tmp_T308mJQWBY_exports, {
    Component: () => Component,
    For: () => For,
    If: () => If,
    Include: () => Include,
    domReady: () => domReady,
    sm: () => sm
  });

  // src/customElements.ts
  init_state();
  init_domReady();
  var registered = /* @__PURE__ */ new Set();
  var Include = class extends HTMLElement {
    src = "";
    controller;
    connectedCallback() {
      this.src = this.getAttribute("src") ?? "";
      if (!this.src) return;
      void this.load();
    }
    disconnectedCallback() {
      this.controller?.abort();
      this.controller = void 0;
    }
    async load() {
      this.controller = new AbortController();
      try {
        const res = await fetch(this.src, { signal: this.controller.signal });
        if (!res.ok) throw new Error(`failed to load ${this.src}`);
        this.innerHTML = await res.text();
      } catch (err) {
        if (this.controller?.signal.aborted) return;
        console.error(err);
      } finally {
        this.controller = void 0;
      }
    }
  };
  var Component = class extends HTMLElement {
    connectedCallback() {
      const name = this.getAttribute("name");
      if (!name || registered.has(name)) return;
      registered.add(name);
      const props = (this.getAttribute("props") ?? "").split(",").map((p) => p.trim()).filter(Boolean);
      const template = this.innerHTML;
      class NewComp extends HTMLElement {
        connectedCallback() {
          let content = template;
          for (const prop of props) {
            const value = this.getAttribute(prop) ?? "";
            content = content.split(`$${prop}`).join(value);
          }
          this.innerHTML = content;
        }
      }
      customElements.define(name, NewComp);
      this.remove();
    }
  };
  var If = class extends HTMLElement {
    bound = [];
    reRender = () => {
    };
    constructor() {
      super();
      this.hidden = true;
    }
    connectedCallback() {
      const condition = this.getAttribute("condition") ?? "";
      if (!condition) return;
      this.bound = (this.getAttribute("x-bind") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
      this.reRender = () => {
        this.hidden = !this.evaluate(condition);
      };
      domReady(() => {
        for (const name of this.bound) {
          const state = sm.states[name];
          state?.sub({ type: "normal", update: this.reRender, args: [] });
        }
        this.reRender();
      });
    }
    disconnectedCallback() {
    }
    evaluate(con) {
      const evalFunc = new Function("sm", `return (${con})`);
      return evalFunc(sm);
    }
  };
  var For = class extends HTMLElement {
    bound = [];
    template = "";
    asName = "val";
    from = "";
    reRender = () => {
    };
    connectedCallback() {
      this.from = this.getAttribute("from") ?? "";
      if (!this.from) return;
      this.asName = this.getAttribute("as") ?? "val";
      this.bound = (this.getAttribute("x-bind") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
      this.template = this.innerHTML;
      this.reRender = () => {
        this.render();
      };
      domReady(() => {
        for (const name of this.bound) {
          const state = sm.states[name];
          state?.sub({ type: "normal", update: this.reRender, args: [] });
        }
        this.reRender();
      });
    }
    disconnectedCallback() {
    }
    evaluate(con) {
      const evalFunc = new Function("sm", `return (${con})`);
      return evalFunc(sm);
    }
    render() {
      let iterable;
      try {
        iterable = Array.from(this.evaluate(this.from) ?? []);
      } catch {
        iterable = [];
      }
      let html = "";
      for (let i = 0; i < iterable.length; i++) {
        let item = this.template;
        item = item.split(`$${this.asName}`).join(String(iterable[i]));
        item = item.split("$index").join(String(i));
        html += item;
      }
      this.innerHTML = html;
    }
  };
  customElements.define("x-include", Include);
  customElements.define("x-component", Component);
  customElements.define("x-if", If);
  customElements.define("x-for", For);

  // ../tmp/tmp.T308mJQWBY.ts
  init_domReady();
  init_state();
  __reExport(tmp_T308mJQWBY_exports, __toESM(require_x_bind()));
  return __toCommonJS(tmp_T308mJQWBY_exports);
})();
