interface optionsInterface {
  value: any;
  onChange?: Function;
  args?: Array<State>;
  compute?: Function;
  deps?: Array<State>;
}
export interface subInterface {
  type: "normal" | "dependent";
  update: Function;
  args: Array<State>
}
export class State {
  #name: string;
  #value: any;
  #updateFunc: Function;
  #args: Array<State>;
  #subs: Array<subInterface> = []
  #compute: Function | undefined;
  #isDependent: boolean;
  constructor(
    name: string,
    options: optionsInterface = {
      value: null,
      onChange: () => { },
      args: []
    }) {
    this.#name = name;
    this.#value = options.value
    this.#updateFunc = options.onChange ?? (() => { })
    this.#args = options.args ?? []
    this.#compute = options.compute
    this.#isDependent = options.compute !== undefined
    if (this.#isDependent) {
      this.#value = this.#compute!()
      const deps = options.deps ?? []
      for (const dep of deps) {
        dep.sub({ type: "dependent", update: () => this.#recompute(), args: [] })
      }
    }
  }
  set(value: any): boolean {
    if (this.#isDependent) {
      throw new Error(`cannot set dependent state "${this.#name}"`)
    }
    this.#value = value
    this.#updateFunc(this.#value, ...this.#args)
    for (const sub of this.#subs) {
      if (sub.type === "dependent") {
        sub.update.call(sub, this)
      } else {
        sub.update.call(sub, this.#value)
      }
    }
    return true
  }
  #recompute(): void {
    this.#value = this.#compute!(...this.#args)
    for (const sub of this.#subs) {
      if (sub.type === "dependent") {
        sub.update.call(sub, this)
      } else {
        sub.update.call(sub, this.#value)
      }
    }
  }
  get(): any {
    return this.#value
  }
  onChange(update: Function, args: Array<State> = []): void {
    this.#updateFunc = update
    this.#args = args
  }
  sub(opt: subInterface): boolean {
    this.#subs.push(opt)
    return true
  }
}

interface smInterface {
  (state: string): State | undefined;
  states: Record<string, State>
  new: Function;
  del: Function;
}
export const sm: smInterface = (state) => {
  if (state) {
    return sm.states[state]
  }
}
sm.states = {};
sm.new = (name: string, options: optionsInterface): boolean => {
  sm.states[name] = new State(name, options)
  return true
}
sm.del = (name: string): boolean => {
  delete sm.states[name];
  return true;
}

if (typeof globalThis !== "undefined") {
  ; (globalThis as Record<string, unknown>).sm = sm
}
