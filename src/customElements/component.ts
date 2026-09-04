const registered = new Set<string>()
class Component extends HTMLElement {
  connectedCallback() {
    const name = this.getAttribute('name')
    if (!name || registered.has(name)) return
    registered.add(name)

    const props = (this.getAttribute('props') ?? '')
      .split(',')
      .map(p => p.trim())
      .filter(Boolean)

    const template = this.innerHTML

    class NewComp extends HTMLElement {
      connectedCallback() {
        let content = template
        for (const prop of props) {
          const value = this.getAttribute(prop) ?? ''
          content = content.split(`$${prop}`).join(value)
        }
        this.innerHTML = content
      }
    }

    customElements.define(name, NewComp)
    this.remove()
  }
}

customElements.define('x-component', Component)

