import { domReady } from "../helper"
import { bind } from "../x-bind"

class Include extends HTMLElement {
  private src: string = ''
  private controller: AbortController | undefined

  connectedCallback() {
    this.src = this.getAttribute('src') ?? ''
    if (!this.src || this.hasAttribute('bound')) return
    void this.load()
  }

  disconnectedCallback() {
    this.controller?.abort()
    this.controller = undefined
  }

  async load(): Promise<void> {
    this.controller = new AbortController()
    try {
      const res = await fetch(this.src, { signal: this.controller.signal })
      if (!res.ok) throw new Error(`failed to load ${this.src}`)
      this.innerHTML = await res.text()
      domReady(() => bind(this))
    } catch (err) {
      if (this.controller?.signal.aborted) return
      console.error(err)
    } finally {
      this.controller = undefined
      this.setAttribute('bound', '')
    }
  }
}
customElements.define('x-include', Include)

