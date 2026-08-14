export class Route {
  constructor() {
    this.groups = {};
    // Keep track of the currently active path for each group
    this.activeGroupPaths = {};

    document.querySelectorAll("route").forEach(el => {
      const group = el.getAttribute("group") || "default";
      const path = el.getAttribute("path");

      if (!this.groups[group]) {
        this.groups[group] = {};
        this.activeGroupPaths[group] = "/"; // default fallback
      }

      this.groups[group][path] = el;
      el.style.display = path === "/" ? "block" : "none";
    });

    window.addEventListener('hashchange', () => this.resolve());
    this.resolve();
  }

  resolve() {
    const hash = window.location.hash.slice(1) || "/";

    // 1. Separate base path from group declarations
    const groupStartIndex = hash.search(/([a-zA-Z0-9_-]+):/);
    
    let basePath = hash;
    let groupString = "";

    if (groupStartIndex !== -1) {
      basePath = hash.substring(0, groupStartIndex).replace(/\/$/, "");
      groupString = hash.substring(groupStartIndex);
    }
    if (!basePath) basePath = "/";

    // 2. Extract groups present in the *current* hash
    const currentHashGroups = {};
    const regex = /([a-zA-Z0-9_-]+):([^\/]+)/g;
    let match;
    while ((match = regex.exec(groupString)) !== null) {
      currentHashGroups[match[1]] = "/" + match[2];
    }

    // 3. Update active paths: if a group is in the hash, update its active path. 
    // If it's NOT in the hash, it keeps its previous active path (so sibling groups don't break!).
    Object.keys(this.groups).forEach(groupName => {
      if (groupName === "default") {
        this.activeGroupPaths["default"] = basePath;
      } else if (currentHashGroups[groupName]) {
        this.activeGroupPaths[groupName] = currentHashGroups[groupName];
      }
      // If the group isn't mentioned in the hash, `this.activeGroupPaths[groupName]` remains untouched!
    });

    // 4. Apply visibility based on remembered states
    Object.entries(this.groups).forEach(([groupName, groupRoutes]) => {
      const activePath = this.activeGroupPaths[groupName] || "/";
      
      Object.entries(groupRoutes).forEach(([path, el]) => {
        el.style.display = (path === activePath) ? "block" : "none";
      });
    });
  }

  navigateTo(path) {
    window.location.hash = path;
  }
}
