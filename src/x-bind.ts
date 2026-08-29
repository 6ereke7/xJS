import { sm, type subInterface } from "./state"
import { domReady } from "./domReady"

const excludedModelTypes = new Set(['checkbox', 'radio'])

domReady(() => {
  document.querySelectorAll("[x-bind], [x-model]").forEach(el => {
    bindText(el as HTMLElement)
    bindModel(el as HTMLInputElement)
  })
})

function bindText(el: HTMLElement): void {
  const names: Array<string> = (el.getAttribute('x-bind') ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
  if (names.length === 0) return

  const bound: Array<{ name: string, state: any }> = []
  for (const name of names) {
    const state = sm(name)
    if (!state) {
      console.log(`x-bind: state "${name}" not found on <${el.tagName}>`)
      continue
    }
    bound.push({ name, state })
  }
  if (bound.length === 0) return

  // TODO: unsubscribe from `state` when the element is removed from the DOM
  // (core's State has no unsub API yet)

  const content: string = el.textContent
  const reRender = () => {
    let temp: string = content
    for (const { name, state } of bound) {
      temp = temp.split(`$${name}`).join(state.get())
    }
    el.textContent = temp
  }
  reRender()

  const subInfo: subInterface = {
    type: "normal",
    update: reRender,
    args: []
  }
  for (const { state } of bound) {
    state.sub(subInfo)
  }
}

function bindModel(el: HTMLInputElement): void {
  const name = (el.getAttribute('x-model') ?? '').trim()
  if (!name) return

  if (el.tagName === 'SELECT' || excludedModelTypes.has(el.type ?? '')) {
    console.log(`x-model: <${el.tagName}> on "${name}" is not supported (excluded control type)`)
    return
  }

  const state = sm(name)
  if (!state) {
    console.log(`x-model: state "${name}" not found on <${el.tagName}>`)
    return
  }

  // TODO: unsubscribe from `state` when the element is removed from the DOM
  // (core's State has no unsub API yet)

  if (el.value !== String(state.get())) {
    el.value = String(state.get())
  }

  el.addEventListener('input', () => {
    if (state.get() !== el.value) {
      state.set(el.value)
    }
  })

  const subInfo: subInterface = {
    type: "normal",
    update: () => {
      if (el.value !== String(state.get())) {
        el.value = String(state.get())
      }
    },
    args: []
  }
  state.sub(subInfo)
}
