"use strict";
const sm = require("./core");
const registered = new Set();
class Include extends HTMLElement {
    src = '';
    controller;
    connectedCallback() {
        this.src = this.getAttribute('src') ?? '';
        if (!this.src)
            return;
        void this.load();
    }
    disconnectedCallback() {
        this.controller?.abort();
        this.controller = undefined;
    }
    async load() {
        this.controller = new AbortController();
        try {
            const res = await fetch(this.src, { signal: this.controller.signal });
            if (!res.ok)
                throw new Error(`failed to load ${this.src}`);
            this.innerHTML = await res.text();
        }
        catch (err) {
            if (this.controller?.signal.aborted)
                return;
            console.error(err);
        }
        finally {
            this.controller = undefined;
        }
    }
}
class Component extends HTMLElement {
    connectedCallback() {
        const name = this.getAttribute('name');
        if (!name || registered.has(name))
            return;
        registered.add(name);
        const props = (this.getAttribute('props') ?? '')
            .split(',')
            .map(p => p.trim())
            .filter(Boolean);
        const template = this.innerHTML;
        class NewComp extends HTMLElement {
            connectedCallback() {
                let content = template;
                for (const prop of props) {
                    const value = this.getAttribute(prop) ?? '';
                    content = content.split(`$${prop}`).join(value);
                }
                this.innerHTML = content;
            }
        }
        customElements.define(name, NewComp);
        this.remove();
    }
}
class If extends HTMLElement {
    bound = [];
    reRender = () => { };
    constructor() {
        super();
        this.hidden = true;
    }
    connectedCallback() {
        const condition = this.getAttribute('condition') ?? '';
        if (!condition)
            return;
        this.bound = (this.getAttribute('x-bind') ?? '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
        this.reRender = () => {
            this.hidden = !this.evaluate(condition);
        };
        for (const name of this.bound) {
            const state = sm.states[name];
            // unsub not implemented yet; subscription leaks on disconnect
            state?.sub({ type: 'normal', update: this.reRender, args: [] });
        }
        this.reRender();
    }
    disconnectedCallback() {
        // TODO: unsubscribe from bound states here once core.ts exposes unsub
    }
    evaluate(con) {
        const evalFunc = new Function('sm', `return (${con})`);
        return evalFunc(sm);
    }
}
class For extends HTMLElement {
    bound = [];
    template = '';
    asName = 'val';
    from = '';
    reRender = () => { };
    connectedCallback() {
        this.from = this.getAttribute('from') ?? '';
        if (!this.from)
            return;
        this.asName = this.getAttribute('as') ?? 'val';
        this.bound = (this.getAttribute('x-bind') ?? '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
        this.template = this.innerHTML;
        this.reRender = () => {
            this.render();
        };
        for (const name of this.bound) {
            const state = sm.states[name];
            // unsub not implemented yet; subscription leaks on disconnect
            state?.sub({ type: 'normal', update: this.reRender, args: [] });
        }
        this.reRender();
    }
    disconnectedCallback() {
        // TODO: unsubscribe from bound states here once core.ts exposes unsub
    }
    evaluate(con) {
        const evalFunc = new Function('sm', `return (${con})`);
        return evalFunc(sm);
    }
    render() {
        let iterable;
        try {
            iterable = Array.from(this.evaluate(this.from) ?? []);
        }
        catch {
            iterable = [];
        }
        let html = '';
        for (let i = 0; i < iterable.length; i++) {
            let item = this.template;
            item = item.split(`$${this.asName}`).join(String(iterable[i]));
            item = item.split('$index').join(String(i));
            html += item;
        }
        this.innerHTML = html;
    }
}
customElements.define('x-include', Include);
customElements.define('x-component', Component);
customElements.define('x-if', If);
customElements.define('x-for', For);
module.exports = { Include, Component, If, For };
