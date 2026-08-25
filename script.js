const observer = new MutationObserver((mutationsList) => {
  for (const mutation of mutationsList) {
    
    // 1. Elements added to the page (Simulates connectedCallback)
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        //console.log('Connected:', node); 
        // Do your execution on the element here
      }
    });

    // 2. Elements removed from the page (Simulates disconnectedCallback)
    mutation.removedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        //console.log('Disconnected:', node);
      }
    });
  }
});
observer.observe(document.body, { childList: true, subtree: true });
