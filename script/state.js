export function State(initialState = {}, onChange) {
  const savedState = localStorage.getItem('app_state');
  const actualInitialState = savedState ? JSON.parse(savedState) : initialState;
  
  const subscribers = {};
  
  const state = new Proxy(actualInitialState, {
    set(target, property, value) {
      target[property] = value;
      localStorage.setItem('app_state', JSON.stringify(target));
      if (subscribers[property]) {
        subscribers[property].forEach(cb => cb(value));
      }
      if (onChange) onChange(property, value);
      return true;
    }
  });

  function subscribe(property, callback) {
    if (!subscribers[property]) subscribers[property] = [];
    subscribers[property].push(callback);
  }

  return { state, subscribe };
}