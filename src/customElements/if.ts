import { bool, domReady, evaluate, log } from "../helper"
import { sm, State } from "../state"

class If extends HTMLElement {
  constructor() {
    super()
    this.hidden = true
  }

  connectedCallback() {
    const condition = this.getAttribute('condition') ?? ''
    if (!condition) return

    const states: Record<string, State> = {}

    const names = (this.getAttribute('x-bind') ?? '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    const reRender = () => {
      const val = bool(evaluate(condition, states))
      this.hidden = val !== undefined ? !val : this.hidden
    }

    domReady(() => {

      names.forEach(name => {
        const state = sm(name)
        if (state !== undefined) states[name] = state
      })
      reRender()
      if (this.hasAttribute('bound')) return
      for (const state of Object.values(states)) {
        state?.sub({ type: 'normal', update: reRender, args: [] })
      }
      this.setAttribute('bound', '')
    })
  }

  disconnectedCallback() {
    // TODO: unsubscribe from bound states here once core.ts exposes unsub
  }
}

customElements.define('x-if', If)
/*
defination = show element conditionally
tagName = x-if

attriubes:
  condition = a js condition (states can be used directly if binded)
  x-bind = binds with state, lets 'condition' use states
*/
