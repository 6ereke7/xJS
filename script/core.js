class App{
  #state = {}
  #subscribers = {};
  #routes = {
    'now':''
  }
  
  #subscribe(name,el,updateFunc){
    this.#subscribers[name].push([el,updateFunc]);
  }
  constructor(storage = null) {
    //sync state
    if (storage !== null) {
      const savedState = localStorage.getItem(storage);
      this.#state = savedState ? JSON.parse(savedState) : {};
    }
    this.#loadIncludes()
    this.#loadTemplates();
    this.#loadRoutes()
  }
  
  // All state methods are bellow
  exists(name) {
    return this.#state[name] === undefined || this.#state[name] === null ? false : true;
  }
  newState(name, value = null, onChange = () =>{}) {
    if (this.exists(name)) {
      console.error(`can not add new state ${name}, already exists`)
      return false;
    }
    this.#state[name] = [value, onChange]
    this.#subscribers[name] = [];
    return true;
  }
  getState(name) {
    if (!this.exists(name)) {
      console.error(`can not get state ${name}, doesn't exists`)
      return false;
    }
    return this.#state[name][0];
  }
  updateState(name, value) {
    if (!this.exists(name)) {
      console.error(`can not update state ${name}, doesn't exists`)
      return false;
    }
    this.#state[name][0] = value;
    this.#state[name][1](value);
    this.#subscribers[name].forEach(([el,update]) => {
      update();
    })
    return true;
  }
  removeState(name) {
    if (this.#state[name] == undefined) {
      console.error(`can not delete state ${name}, doesn't exists`)
      return false;
    }
    delete this.#state[name];
    delete this.#subscribers[name]
    return true;
  }
  
  // all bindings are bellow (subscribtion to states)
  #data_bind(){
    document.querySelectorAll('[data-bind]').forEach(el => {
      const prop = el.getAttribute('data-bind');
      if (!this.exists(prop)) {
        this.newState(prop);
      }
        const update = () => {
          el.textContent = this.getState(prop)
        }
        update()
        this.#subscribe(prop,el,update)
      
    })
  }
  #data_model(){
    document.querySelectorAll('[data-model]').forEach(el => {
      const prop = el.getAttribute('data-model');
      if (!this.exists(prop)) {
        this.newState(prop)
      }
        const update =() =>{
          el.value = this.getState(prop);
        }
        update();
        this.#subscribe(prop,el,update)
        el.addEventListener('input', (e) => {
          this.updateState(prop, e.target.value);
        });
      
    });
  }
  #data_if(){
    document.querySelectorAll('[data-if]').forEach(el => {
      const prop = el.getAttribute('data-if');
      const placeholder = document.createComment(`if:${prop}`);
      const check = new Function(prop);
      
      function update() {
        const shouldShow = check();
        if (shouldShow && !el.isConnected) {
          placeholder.replaceWith(el);
        } else if (!shouldShow && el.isConnected) {
          el.replaceWith(placeholder);
        }
      };
  
      update()
      
    }); 
  }
  #data_for(){
    document.querySelectorAll('[data-for]').forEach(el => {
      const expr = el.getAttribute('data-for'); // e.g., "item of items"
      const [itemName, , arrayName] = expr.split(/\s+/);
      
      // Keep a placeholder comment to know where to render the list
      const placeholder = document.createComment(`for:${arrayName}`);
      el.replaceWith(placeholder);
  
      // Template template to clone for each item
      const template = el;
      template.removeAttribute('data-for');
  
      const renderList = (items) => {
        if (!Array.isArray(items)) return;
  
        // Remove existing rendered elements tied to this loop
        const currentNodes = [];
        let next = placeholder.nextSibling;
        while (next && next._isLoopItem) {
          currentNodes.push(next);
          next = next.nextSibling;
        }
        currentNodes.forEach(node => node.remove());
  
        // Render fresh elements
        const fragment = document.createDocumentFragment();
        items.forEach((item, index) => {
          const clone = template.cloneNode(true);
          clone._isLoopItem = true; // marker to clean up later
  
          // Replace template placeholders like {{item}} inside the clone
          clone.innerHTML = clone.innerHTML.replace(new RegExp(`{{\\s*${itemName}\\s*}}`, 'g'), item);
          
          fragment.appendChild(clone);
        });
  
        placeholder.parentNode.insertBefore(fragment, placeholder.nextSibling);
      };
  
      // Initial render
      if (this.exists(arrayName)) {
        renderList(this.getState(arrayName));
      }
      this.#subscribe(arrayName,el,renderList);
    });
  }
  
  // router
  #route(path = ['/']){
    const newPage = this.#routes;
    for (var i = 0; i < path.length; i++) {
      newPage = newPage[path[i]];
    }
    this.#routes['now'].style.display = 'none';
    newPage['self'].style.display = 'block';
    this.#routes['now'] = newPage['self'];
  }
  #loadRoutes(){
    document.querySelectorAll('route').forEach(el =>{
      let path = el.getAttribute('path')
      if(path){
        path = path.split('/')
        const current = this.#routes;
        
        for (var i = 0; i < path.length-1; i++) {
          if(current[path[i]] === undefined || current[path[i]] === null){
            current[path[i]] = {'self':null}
          }
          current = current[path[i]];
        }
        
        const lastPath = path[path.length -1]
        if (!current[lastPath]) {
          current[lastPath] = { 'self': null };
        }
        current[lastPath]['self'] = el;
      }
    })
    window.addEventListener('hashchange', () => {
      const path = window.location.hash.slice(1).split('/');
      this.#route(path);
    });
  }
  
  // template system
  #loadTemplates(){
    document.querySelectorAll('template').forEach(el => {
      const name = el.getAttribute('name')
      if(!name) return false;
      if(!customElements.get(name)){
        
        class newTemplate extends HTMLElement {
          connectedCallback(){
            const clone = el.content.cloneNode(true);
            this.appendChild(clone);
          }
        }
        
        customElements.define(name,newTemplate);
      }
      el.remove();
    })
  }
  #loadIncludes(){
    document.querySelectorAll('include').forEach(el =>{
      const src = el.getAttribute('src')
      if(src){
        try{
          const getfile = async () =>{
          const res = await fetch(src);
          if (!res.ok) throw new Error(`Failed to load ${src}`);
          el.innerHTML = await res.text()
          el.replaceWith(...el.childNodes)
          console.log(el)
          }
          getfile()
        } catch (e) {
          console.log(e)
        }
      }
    })
  }
  
  // activate any dynamic/state related processes
  run(){
    // directives activation
    this.#data_bind()
    this.#data_model()
    this.#data_if()
    this.#data_for()
  }
  log(){
    console.log(this.#state,this.#subscribers,this.#routes)
  }
}