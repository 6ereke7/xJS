import { State } from './state.js';
import { bindDirectives } from './directives.js';
import { initComponents } from '././component.js';

export class MicroFramework {
  constructor(options = {}) {
    initComponents()
    const core = State(options.state || {});
    this.state = core.state;
    this.subscribe = core.subscribe;
  }

  init() {
    bindDirectives(this);
  }
}
