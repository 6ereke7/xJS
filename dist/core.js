"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class State {
    #name;
    #value;
    #updateFunc;
    #args;
    #subs = [];
    constructor(name, options = {
        value: null,
        onChange: () => { },
        args: []
    }) {
        this.#name = name;
        this.#value = options.value;
        this.#updateFunc = options.onChange;
        this.#args = options.args;
    }
    set(value) {
        this.#value = value;
        this.#updateFunc(this.#value, ...this.#args);
        return true;
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
}
const sm = function (state = '') {
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
