import { emitChange, registerRepository } from './db.js';

// Generic repository. Today it persists to localStorage.
// To move to a real database, keep these method names and change the bodies
// (for example, fetch() calls to an API route). Nothing above this layer changes.
export class Repository {
  constructor(name, idField, seedFn = () => []) {
    this.key = `fpl:${name}`;
    this.idField = idField;
    this.seedFn = seedFn;
    registerRepository(this);
    this.items = this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(this.key);
      if (raw) return JSON.parse(raw);
    } catch {
      /* storage unavailable, fall through to seed */
    }
    const seeded = this.seedFn();
    this._persist(seeded);
    return seeded;
  }

  _persist(items = this.items) {
    try {
      localStorage.setItem(this.key, JSON.stringify(items));
    } catch {
      /* ignore quota / private mode */
    }
  }

  reset(notify = true) {
    this.items = this.seedFn();
    this._persist();
    if (notify) emitChange();
  }

  findAll() {
    return [...this.items];
  }

  findById(id) {
    return this.items.find((i) => i[this.idField] === id);
  }

  findWhere(predicate) {
    return this.items.filter(predicate);
  }

  save(entity) {
    let saved = entity;
    if (entity[this.idField] == null) {
      saved = { ...entity, [this.idField]: this._nextId() };
      this.items.push(saved);
    } else {
      const idx = this.items.findIndex((i) => i[this.idField] === entity[this.idField]);
      if (idx >= 0) this.items[idx] = saved;
      else this.items.push(saved);
    }
    this._persist();
    emitChange();
    return saved;
  }

  _nextId() {
    return this.items.reduce((m, i) => Math.max(m, i[this.idField]), 1000) + 1;
  }
}
