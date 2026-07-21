// Polyfill for localStorage in Node environments
global.localStorage = {
  _store: {},
  getItem(key) { return this._store[key] || null; },
  setItem(key, value) { this._store[key] = value; },
  removeItem(key) { delete this._store[key]; },
  clear() { this._store = {}; }
};
