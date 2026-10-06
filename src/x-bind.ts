import { sm, State } from "./state"
import type { subInterface } from "./interfaces"
import { bindToDict, domReady, log, scriptToValue } from "./helper"

export function bind(root: Document | Element) {
  const selector: string = "[x-bind]:not([bound]), [x-model]:not([bound])"
  root.querySelectorAll(selector).forEach(el => {
    if (el.hasAttribute('x-bind')) {
      bindTextAndAttr(el)
    }
    if (el.hasAttribute('x-model')) bindModel(el as HTMLInputElement)

  })
  function bindTextAndAttr(el: Element) {
    const states = bindToDict(el.getAttribute('x-bind') ?? '')
    var content = scriptToValue(el.innerHTML, states)
    var attrMap = {}
    for (var i = 0; i < el.attributes.length; i++) {
      if (el.attributes[i]?.name !== undefined) {
        attrMap[el.attributes[i]?.name] = scriptToValue(el.attributes[i]?.value, states)
      }
    }
    const reRender = () => {
      content = scriptToValue(content.old, states)
      el.innerHTML = content.new
      for (let [attr, val] of Object.entries(attrMap)) {
        val = scriptToValue(val.old, states)
        el.setAttribute(attr, val.new)
      }
    }
    reRender()

    const subInfo: subInterface = {
      type: "normal",
      update: reRender,
      args: []
    }
    for (const state of Object.values(states)) {
      state.sub(subInfo)
    }
    el.setAttribute('bound', '')
  }

  function bindModel(el: HTMLInputElement) {
    const name: string = (el.getAttribute('x-model') ?? "").trim()
    const state = sm(name)
    if (!state) {
      console.log(`x-bind: state "${name}" not found on <${el.tagName}>`)
      return
    }
    if (el.type === 'checkbox' || el.type === 'radio') return
    el.value = String(state?.get())
    el.addEventListener("input", () => state?.set(el.value))

    const subInfo: subInterface = {
      type: 'normal',
      update: () => el.value = String(state?.get()),
      args: []
    }
    state?.sub(subInfo)
  }
}

domReady(() => bind(document))
