
export class State {
  static #states = {}
  static #subs = {}
  static new(state,val=null,onChange = () => {}){
    State.#states[state] = {
      value:val,
      onChange: onChange
    }
    State.#subs[state] = []
  }
  static link(state,depend,valFunc){
    State.set( state, valFunc( State.get(state) ) )
    depend.forEach(state =>{
      State.sub(state,valFunc)
    })
  }
  static set(state, val){
    State.#states[sstate].value = val
    State.#states[sstate].onChange()
    State.#subs[state].forEach(subscriber => {
      const type,update,args = subscriber
      update(val,...args.map(arg => State.get(arg)))
    })
  }
  static get(state) {
    return State.#states[state][0]
  }
  static del(state){
    delete State.#states[state]
    delete State.#subs[state]
  }
  static is(state){
    return State.#states[state] === undefined? false: true
  }
  static sub(state,onChange){
    if(!State.#subs[state]) State.#subs[state] = []
    State.#subs[state] = [...State.#subs[state],onChange]
  }
}


class Include extends HTMLElement{
  constructor(){
    super()
  }
  connectedCallback(){
    this.src = this.getAttribute('src')
    this.load()
  }
  async load(){
    if(!this.src) return
    const res = await fetch(this.src)
    if(!res.ok) throw new Error(`failed to load ${this.src}`)
    this.innerHTML = await res.text()
    bind(this)
  }
}
class Component extends HTMLElement{
  constructor(){
    super()
  }
  connectedCallback(){
    const name = this.getAttribute('name')
    if(!name || customElements.get(name)) return;
    
    const content = this.innerHTML
    const clonedAttributes = Array.from(this.attributes)
      .filter(attr => attr.name !== 'name')
      .map(attr => ({ name: attr.name, value: attr.value }));
 
    this.newComp = class extends HTMLElement{
      constructor(){super()}
      connectedCallback(){
        this.innerHTML = content;
        clonedAttributes.forEach(attr =>{
          this.setAttribute(attr.name,attr.value)
        })
      }
    }
    customElements.define(name,this.newComp);
    this.remove()
  }
}
class If extends HTMLElement {
  constructor(){
    super()
    this.style.display='none'
  }
  connectedCallback(){
    if(this.evaluate(this.getAttribute('condition'))){
      this.style.display = 'block'
    } else {
      this.style.display = 'none'
    }
  }
  evaluate(con){
    const evalFunc = new Function('State',`return (${con})`)
    return evalFunc(State)
  }
}
class ForEach extends HTMLElement{
  constructor(){
    super()
  }
  connectedCallback(){
    let key = this.getAttribute('from')
    let item = this.getAttribute('as') || 'this'
    if(!key || !item) return;
    if(!State.is(key)) return;
    let items = State.get(key)
    if(!Array.isArray(items)) return
    this.removeAttribute('from')
    const template = this.cloneNode(true)
    const list = []
    const render = () => {
      items = State.get(key)
      list.forEach(el => el.remove())
      items.forEach(val =>{
        const copy = template.cloneNode(true)
        list.push(copy)
        copy.innerText = copy.innerText.replace(`$${item}`,val)
        this.insertAdjacentElement("beforebegin",copy)
      })
    }
    render()
    State.sub(key,render)
    this.style.display='none'
  }
}
function bind(root = document) {
  root.querySelectorAll('[x-bind],[x-model]').forEach(el => {
  const binds = el.getAttribute('x-bind') || null
  const model = el.getAttribute('x-model') || null
  if (!binds) return
  
  const template = el.innerText
  const states = binds.split(/\s+/).filter(Boolean)
  
  const update = () => {
    let result = template
    states.forEach(state => {
      const repReg = new RegExp(`\\$${state}\\b`, 'g')
      result = result.replace(repReg, State.get(state))
    })
    el.innerText = result
  }
  
  update()
  states.forEach(state => State.sub(state, update))
})
}
export function run() {
  bind()
  customElements.define('x-include', Include)
  customElements.define('x-component', Component)
  customElements.define('x-if', If)
  customElements.define('for-each', ForEach)
}