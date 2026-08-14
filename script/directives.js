export function bindDirectives(app) {
  const { state, subscribe } = app;

  // Text binding: data-bind
  document.querySelectorAll('[data-bind]').forEach(el => {
    const prop = el.getAttribute('data-bind');
    if (state[prop] !== undefined) {
      el.textContent = state[prop];
      subscribe(prop, newVal => el.textContent = newVal);
    }
  });

  // Input two-way sync: data-model
  document.querySelectorAll('[data-model]').forEach(el => {
    const prop = el.getAttribute('data-model');
    if (state[prop] !== undefined) {
      el.value = state[prop];
      subscribe(prop, newVal => el.value = newVal);
      el.addEventListener('input', (e) => {
        state[prop] = e.target.value;
      });
    }
  });

  // Conditional rendering: data-if
  document.querySelectorAll('[data-if]').forEach(el => {
    const prop = el.getAttribute('data-if');
    const placeholder = document.createComment(`if:${prop}`);
    
    const updateVisibility = (val) => {
      const shouldShow = Boolean(val);
      if (shouldShow && !el.isConnected) {
        placeholder.replaceWith(el);
      } else if (!shouldShow && el.isConnected) {
        el.replaceWith(placeholder);
      }
    };

    updateVisibility(state[prop]);
    subscribe(prop, newVal => updateVisibility(newVal));
  });
  
  //for loop
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
    if (state[arrayName]) {
      renderList(state[arrayName]);
    }

    // Subscribe to array updates
    subscribe(arrayName, newVal => renderList(newVal));
  });
}