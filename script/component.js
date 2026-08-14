export function initComponents() {
  document.querySelectorAll('template[is-component]').forEach(template => {
    const name = template.getAttribute('name');
    if (!name) return;

    // Define the custom element if not already defined
    if (!customElements.get(name)) {
      const templateContent = template.content;

      class DynamicComponent extends HTMLElement {
        connectedCallback() {
          const clone = templateContent.cloneNode(true);
          this.appendChild(clone);
        }
      }

      customElements.define(name, DynamicComponent);
    }

    // Remove the template definition tag from the DOM entirely
    template.remove();
  });
}