import { sm, type State } from "./state"

export function domReady(cb: () => void): any {
  if (typeof document === "undefined") return

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", cb)
  } else {
    cb()
  }
}

export function bindToDict(binds: string): Record<string, State> {

  const res: Record<string, State> = {}
  // domReady(() => {
  const names = binds?.split(',').map(s => s.trim()).filter(Boolean)
  for (const name of names) {
    const state = sm(name)
    if (state) res[name] = state
    else log(`state ${name} not found.`)
  }
  //  })
  return res

}

export function evaluate(script: string, states: Record<string, State> = {}): string {

  try {
    script = `return ${script}`
    const func = new Function(...Object.keys(states), script)
    const res = func(...Object.values(states).map(s => s.get()))
    return String(res)
  } catch (e) {
    log(`Error: ${e}`)
    return `Error: ${e}`
  }
}
export function bool(inp: string): Boolean | undefined {
  const truthMap: Record<string, Boolean> = {
    "true": true,
    "True": true,
    "TRUE": true,
    "false": false,
    "False": false,
    "FALSE": false,
  }
  return truthMap[inp]
}
export function scriptToValue(content: string, states: Record<string, State>): { old: string, new: string } {
  const reg = /{{(.+)}}/g
  const res = content.replace(reg, (match, p1) => {
    return evaluate(p1, states)
  })
  return { old: content, new: res };
}

export function log(txt: unknown) {
  const el = document.getElementById('log1')
  if (el) el.innerText += String(txt)
}
