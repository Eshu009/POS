// ============================================
// POS-Shop — Global Reactive State
// Simple pub/sub state management
// ============================================

class Store {
  constructor(initialState = {}) {
    this.state = { ...initialState };
    this.listeners = new Map(); // key -> Set of callbacks
  }

  /**
   * Get a state value.
   * @param {string} key
   * @returns {any}
   */
  get(key) {
    return this.state[key];
  }

  /**
   * Set a state value and notify listeners.
   * @param {string} key
   * @param {any} value
   */
  set(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;

    // Notify specific key listeners
    if (this.listeners.has(key)) {
      this.listeners.get(key).forEach((cb) => cb(value, oldValue));
    }

    // Notify wildcard listeners
    if (this.listeners.has('*')) {
      this.listeners.get('*').forEach((cb) => cb(key, value, oldValue));
    }
  }

  /**
   * Subscribe to state changes for a specific key.
   * @param {string} key - State key or '*' for all changes
   * @param {Function} callback
   * @returns {Function} unsubscribe
   */
  on(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);

    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  /**
   * Merge multiple values at once.
   * @param {object} updates
   */
  merge(updates) {
    Object.entries(updates).forEach(([key, value]) => {
      this.set(key, value);
    });
  }

  /**
   * Get entire state (snapshot).
   * @returns {object}
   */
  getState() {
    return { ...this.state };
  }
}

// Global app state
const appState = new Store({
  loading: false,
  currentView: 'storefront',
  categories: [],
  selectedCategory: null,
  searchQuery: '',
  mobileMenuOpen: false,
});

export default appState;
