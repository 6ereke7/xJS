"use strict";
class State {
    #name;
    #value;
    #updateFunc;
    #args;
    #subs = [];
    #compute;
    #isDependent;
    constructor(name, options = {
        value: null,
        onChange: () => { },
        args: []
    }) {
        this.#name = name;
        this.#value = options.value;
        this.#updateFunc = options.onChange ?? (() => { });
        this.#args = options.args ?? [];
        this.#compute = options.compute;
        this.#isDependent = options.compute !== undefined;
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
            }
            else {
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
            }
            else {
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
module.exports = sm;
