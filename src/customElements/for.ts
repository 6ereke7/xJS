import { domReady } from "../helper"
import { sm } from "../state"

class For extends HTMLElement {
  private bound: Array<string> = []
  private template: string = ''
  private asName: string = 'val'
  private from: string = ''
  private reRender: () => void = () => { }

  connectedCallback() {
    this.from = this.getAttribute('from') ?? ''
    if (!this.from) return

    this.asName = this.getAttribute('as') ?? 'val'
    this.bound = (this.getAttribute('x-bind') ?? '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    this.template = this.innerHTML

    this.reRender = () => {
      this.render()
    }

    domReady(() => {
      for (const name of this.bound) {
        const state = sm.states[name]
        // unsub not implemented yet; subscription leaks on disconnect
        state?.sub({ type: 'normal', update: this.reRender, args: [] })
      }
      this.reRender()
    })
  }

  disconnectedCallback() {
    // TODO: unsubscribe from bound states here once core.ts exposes unsub
  }

  private evaluate(con: string): any {
    const evalFunc = new Function('sm', `return (${con})`)
    return evalFunc(sm)
  }

  private render(): void {
    let iterable: Array<unknown>
    try {
      iterable = Array.from(this.evaluate(this.from) ?? [])
    } catch {
      iterable = []
    }

    let html = ''
    for (let i = 0; i < iterable.length; i++) {
      let item = this.template
      item = item.split(`$${this.asName}`).join(String(iterable[i]))
      item = item.split('$index').join(String(i))
      html += item
    }
    this.innerHTML = html
  }
}

customElements.define('x-for', For)

