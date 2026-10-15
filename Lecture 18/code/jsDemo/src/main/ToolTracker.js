import { AsyncLocalStorage } from 'node:async_hooks';

export class ToolTracker {
  storage = new AsyncLocalStorage();
  // Keep each request's trace isolated even when model calls overlap.
  run(callback) { return this.storage.run({ toolsUsed: [], toolArguments: {}, toolResults: {} }, callback); }
  get state() {
    const state = this.storage.getStore();
    if (!state) throw new Error('ToolTracker must run inside a request scope');
    return state;
  }
  clear() { Object.assign(this.state, { toolsUsed: [], toolArguments: {}, toolResults: {} }); }
  record(name, argument, result) {
    if (!this.state.toolsUsed.includes(name)) this.state.toolsUsed.push(name);
    this.state.toolArguments[name] = argument;
    this.state.toolResults[name] = result;
  }
  getToolsUsed() { return [...this.state.toolsUsed]; }
  getToolArguments() { return { ...this.state.toolArguments }; }
  getToolResults() { return { ...this.state.toolResults }; }
}
