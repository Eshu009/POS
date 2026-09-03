// ============================================
// POS-Shop — SPA Hash Router
// Lightweight, dependency-free hash-based routing
// ============================================

class Router {
  constructor() {
    this.routes = [];
    this.currentRoute = null;
    this.beforeEachGuards = [];
    this.afterEachHooks = [];
    this.notFoundHandler = null;
    this._onHashChange = this._onHashChange.bind(this);
  }

  /**
   * Register a route.
   * @param {string} path - Route pattern (e.g., '/product/:id')
   * @param {Function} handler - Async function(params, query) that returns HTML or renders into the container
   * @param {object} meta - Route metadata (title, requiresAuth, requiredRole, etc.)
   */
  on(path, handler, meta = {}) {
    const paramNames = [];
    const regexStr = path.replace(/:(\w+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });
    const regex = new RegExp(`^${regexStr}$`);

    this.routes.push({ path, regex, paramNames, handler, meta });
    return this;
  }

  /**
   * Register a 404 handler.
   */
  notFound(handler) {
    this.notFoundHandler = handler;
    return this;
  }

  /**
   * Register a navigation guard.
   * @param {Function} guard - (to, from) => boolean | string (redirect path)
   */
  beforeEach(guard) {
    this.beforeEachGuards.push(guard);
    return this;
  }

  /**
   * Register an after-navigation hook.
   * @param {Function} hook - (to, from) => void
   */
  afterEach(hook) {
    this.afterEachHooks.push(hook);
    return this;
  }

  /**
   * Start listening for hash changes.
   */
  start() {
    window.addEventListener('hashchange', this._onHashChange);
    // Handle initial route
    this._onHashChange();
  }

  /**
   * Stop listening for hash changes.
   */
  stop() {
    window.removeEventListener('hashchange', this._onHashChange);
  }

  /**
   * Navigate to a path programmatically.
   * @param {string} path
   */
  navigate(path) {
    window.location.hash = `#${path}`;
  }

  /**
   * Replace current route without adding to history.
   * @param {string} path
   */
  replace(path) {
    const url = new URL(window.location);
    url.hash = `#${path}`;
    window.history.replaceState(null, '', url);
    this._onHashChange();
  }

  /**
   * Get current hash path.
   */
  getCurrentPath() {
    const hash = window.location.hash.slice(1) || '/';
    return hash.split('?')[0];
  }

  /**
   * Parse query string from hash.
   */
  getQueryParams() {
    const hash = window.location.hash.slice(1) || '/';
    const queryIndex = hash.indexOf('?');
    if (queryIndex === -1) return {};

    const searchParams = new URLSearchParams(hash.slice(queryIndex));
    const params = {};
    for (const [key, value] of searchParams) {
      params[key] = value;
    }
    return params;
  }

  /**
   * Internal: handle hash change.
   */
  async _onHashChange() {
    const path = this.getCurrentPath();
    const queryParams = this.getQueryParams();
    const from = this.currentRoute;

    // Find matching route
    let matchedRoute = null;
    let params = {};

    for (const route of this.routes) {
      const match = path.match(route.regex);
      if (match) {
        matchedRoute = route;
        route.paramNames.forEach((name, i) => {
          params[name] = decodeURIComponent(match[i + 1]);
        });
        break;
      }
    }

    const to = matchedRoute
      ? { path, params, query: queryParams, meta: matchedRoute.meta }
      : { path, params: {}, query: queryParams, meta: {} };

    // Run before guards
    for (const guard of this.beforeEachGuards) {
      const result = await guard(to, from);
      if (result === false) return;
      if (typeof result === 'string') {
        this.navigate(result);
        return;
      }
    }

    this.currentRoute = to;

    // Update page title
    if (to.meta.title) {
      document.title = `${to.meta.title} | ${window.__APP_CONFIG?.STORE_NAME || 'MyShop'}`;
    }

    // Run handler
    const container = document.getElementById('app-main');
    if (!container) return;

    if (matchedRoute) {
      // Add exit animation
      container.classList.add('page-exit');
      await new Promise((r) => setTimeout(r, 100));
      container.classList.remove('page-exit');

      try {
        await matchedRoute.handler(params, queryParams, container);
      } catch (err) {
        console.error('Route handler error:', err);
        container.innerHTML = `
          <div class="container" style="padding-top: var(--space-16); text-align: center;">
            <h2>Something went wrong</h2>
            <p>${err.message}</p>
            <button class="btn btn-primary mt-4" onclick="location.hash='#/'">Go Home</button>
          </div>
        `;
      }

      // Add enter animation
      container.classList.add('page-enter');
      container.addEventListener('animationend', () => {
        container.classList.remove('page-enter');
      }, { once: true });
    } else if (this.notFoundHandler) {
      await this.notFoundHandler(container);
    } else {
      container.innerHTML = `
        <div class="container empty-state">
          <h2>404 — Page Not Found</h2>
          <p class="text-muted mt-2">The page you're looking for doesn't exist.</p>
          <button class="btn btn-primary mt-4" onclick="location.hash='#/'">Go Home</button>
        </div>
      `;
    }

    // Run after hooks
    for (const hook of this.afterEachHooks) {
      hook(to, from);
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Singleton
const router = new Router();
export default router;
