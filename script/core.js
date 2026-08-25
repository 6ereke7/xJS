class App {
  #states = {}
  #subscribers = {};
  #routes = {
    'now': null
  }
  
  #subscribe(name, updateFunc) {
    this.#subscribers[name].push(updateFunc);
  }
  constructor(storage = null) {
    //sync state
    if (storage !== null) {
      const savedState = localStorage.getItem(storage);
      this.#states = savedState ? JSON.parse(savedState) : {};
    }
  }
  
  // All state methods are bellow
  exists(name) {
    return this.#states[name] === undefined || this.#states[name] === null ? false : true;
  }
  newState(name, value = null, onChange = () => {}) {
    if (this.exists(name)) {
      console.error(`can not add new state ${name}, already exists`)
      return false;
    }
    this.#states[name] = [value, onChange]
    this.#subscribers[name] = [];
    return true;
  }
  getState(name) {
    if (!this.exists(name)) {
      console.error(`can not get state ${name}, doesn't exists`)
      return false;
    }
    return this.#states[name][0];
  }
  updateState(name, value) {
    if (!this.exists(name)) {
      console.error(`can not update state ${name}, doesn't exists`)
      return false;
    }
    this.#states[name][0] = value;
    this.#states[name][1](value);
    this.#subscribers[name].forEach((update) => {
      update();
    })
    return true;
  }
  removeState(name) {
    if (this.#states[name] == undefined) {
      console.error(`can not delete state ${name}, doesn't exists`)
      return false;
    }
    delete this.#states[name];
    delete this.#subscribers[name]
    return true;
  }
  #insert(txt){
    txt = txt.replace(/{{\s(\w+)\s}}/ig, (_,p1) =>{
      return this.getState(p1);
    })
    return txt;
  }
  
  // all bindings are bellow (subscribtion to states)
  #data_bind(root = document) {
    root.querySelectorAll('[data-bind]').forEach(el => {
      const states = el.getAttribute('data-bind').split(',').map(s => s.trim());
      const attrsAttr = el.getAttribute('data-attrs');
      const attrs = attrsAttr ? attrsAttr.split(',').map(a => a.trim()) : [];
      let raw = {
        'text': el.textContent
      }
      attrs.forEach(attr => {
        raw[attr]= el.getAttribute(attr)
      })
      console.log(el,raw)
      const update = () => {
      el.innerHTML = this.#insert(raw['text'])
        attrs.forEach(attr =>{
          el.setAttribute(attr, this.#insert(raw[attr]))
        })
      }
      update()
      states.forEach(state => {
        if(!this.#states[state]) this.newState(state)
        this.#subscribe(state,update)
      })
    })
  }
  #data_model(root = document) {
    root.querySelectorAll('[data-model]').forEach(el => {
      const prop = el.getAttribute('data-model');
      if (!this.exists(prop)) {
        this.newState(prop)
      }
      const update = () => {
        el.value = this.getState(prop);
      }
      update();
      this.#subscribe(prop, update)
      el.addEventListener('input', (e) => {
        this.updateState(prop, e.target.value);
      });
      
    });
  }
  #data_if(root = document) {
    root.querySelectorAll('[data-if]').forEach(el => {
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
  #data_for(root = document) {
    root.querySelectorAll('[data-for]').forEach(el => {
      const expr = el.getAttribute('data-for'); // e.g., "item of items"
      const [itemName, , arrayName] = expr.split(/\s+/);
      
      // Keep a placeholder comment to know where to render the list
      const placeholder = root.createComment(`for:${arrayName}`);
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
        const fragment = root.createDocumentFragment();
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
      this.#subscribe(arrayName, el, renderList);
    });
  }
  
  // router
  #cleanPath(path) {
    if (!path) return false;
    while (path[0] === '#' || path[0] === '/') {
      path = path.slice(1)
    }
    return path.split('/');
  }
  #route(path = ['/']) {
    let newPage = this.#routes;
    
    for (var i = 0; i < path.length; i++) {
      newPage = newPage[path[i]];
    }
    if (this.#routes['now'] !== null) this.#routes['now'].style.display = 'none';
    newPage['self'].style.display = 'block';
    this.#routes['now'] = newPage['self'];
    
    if (!newPage['loaded']) {
      this.#loadIncludes(newPage['self'])
      this.#loadTemplates(newPage['self']);
      this.#data_bind(newPage['self'])
      this.#data_model(newPage['self'])
      this.#data_if(newPage['self'])
      this.#data_for(newPage['self'])
      newPage['loaded'] = true
    }
  }
  #loadRoutes() {
    document.querySelectorAll('route').forEach(el => {
      let path = el.getAttribute('path')
      const active = el.getAttribute('active') !== null;
      if (!path) return;
      
      path = this.#cleanPath(path);
      
      let current = this.#routes;
      for (var i = 0; i < path.length - 1; i++) {
        if (current[path[i]] === undefined || current[path[i]] === null) {
          current[path[i]] = { 'self': null, 'loaded': false }
        }
        current = current[path[i]];
      }
      
      const lastPath = path[path.length - 1]
      if (!current[lastPath]) {
        current[lastPath] = { 'self': null, 'loaded': false };
      }
      current[lastPath]['self'] = el;
      if (!active) return;
      this.#route(path);
    })
    window.addEventListener('hashchange', () => {
      this.#route(this.#cleanPath(window.location.hash));
    });
  }
  
  // template system
  #loadTemplates(root = document) {
    root.querySelectorAll('template').forEach(el => {
      const name = el.getAttribute('name')
      if (!name) return false;
      if (!customElements.get(name)) {
        
        class newTemplate extends HTMLElement {
          connectedCallback() {
            const clone = el.content.cloneNode(true);
            this.appendChild(clone);
          }
        }
        
        customElements.define(name, newTemplate);
      }
      el.remove();
    })
  }
  async #loadIncludes(root = document) {
    const selector = root === document ? 'include:not(route > include)' : 'include';
    const elements = root.querySelectorAll(selector);

    for (const el of elements) {
      const src = el.getAttribute('src');
      if (src) {
        try {
          const res = await fetch(src);
          if (!res.ok) throw new Error(`Failed to load ${src}`);
          
          el.innerHTML = await res.text();
          
          // Run directives on the newly loaded content
          this.#data_bind(el);
          this.#data_model(el);
          this.#data_if(el);
          this.#data_for(el);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }

  
  // activate any dynamic/state related processes
  async run() {
    await this.#loadIncludes()
    this.#loadTemplates();
    this.#loadRoutes()
    this.#data_bind()
    this.#data_model()
    this.#data_if()
    this.#data_for()
  }
  log() {
    console.log(this.#states, this.#subscribers, this.#routes)
  }
}
export { App }