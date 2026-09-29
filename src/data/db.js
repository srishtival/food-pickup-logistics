// Tiny change-notification bus so React re-renders when any repository saves.
const listeners = new Set();
const registry = [];
let version = 0;

export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
export const getVersion = () => version;
export const emitChange = () => {
  version += 1;
  listeners.forEach((fn) => fn());
};
export const registerRepository = (repo) => registry.push(repo);
export const resetDemoData = () => {
  registry.forEach((r) => r.reset(false));
  emitChange();
};
