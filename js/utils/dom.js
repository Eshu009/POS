// ============================================
// POS-Shop — DOM Utilities
// Helper functions for rendering and DOM manipulation
// ============================================

/**
 * Shorthand for document.getElementById.
 * @param {string} id
 * @returns {HTMLElement|null}
 */
export function $(id) {
  return document.getElementById(id);
}

/**
 * Shorthand for document.querySelector.
 * @param {string} selector
 * @param {HTMLElement} parent
 * @returns {HTMLElement|null}
 */
export function $q(selector, parent = document) {
  return parent.querySelector(selector);
}

/**
 * Shorthand for document.querySelectorAll.
 * @param {string} selector
 * @param {HTMLElement} parent
 * @returns {NodeListOf<HTMLElement>}
 */
export function $qa(selector, parent = document) {
  return parent.querySelectorAll(selector);
}

/**
 * Create an element with attributes and children.
 * @param {string} tag
 * @param {object} attrs
 * @param {...(string|HTMLElement)} children
 * @returns {HTMLElement}
 */
export function createElement(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') {
      el.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(el.style, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'dataset' && typeof value === 'object') {
      Object.entries(value).forEach(([k, v]) => (el.dataset[k] = v));
    } else if (key === 'innerHTML') {
      el.innerHTML = value;
    } else {
      el.setAttribute(key, value);
    }
  }

  children.forEach((child) => {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else if (child instanceof HTMLElement) {
      el.appendChild(child);
    } else if (Array.isArray(child)) {
      child.forEach((c) => {
        if (c instanceof HTMLElement) el.appendChild(c);
        else if (typeof c === 'string') el.appendChild(document.createTextNode(c));
      });
    }
  });

  return el;
}

/**
 * Render HTML string into a container safely.
 * @param {HTMLElement} container
 * @param {string} html
 */
export function render(container, html) {
  container.innerHTML = html;
  executeScripts(container);
}

/**
 * Execute inline scripts inside a container (needed after innerHTML).
 * @param {HTMLElement} container
 */
function executeScripts(container) {
  const scripts = container.querySelectorAll('script');
  scripts.forEach((oldScript) => {
    const newScript = document.createElement('script');
    Array.from(oldScript.attributes).forEach((attr) => {
      newScript.setAttribute(attr.name, attr.value);
    });
    newScript.textContent = oldScript.textContent;
    oldScript.parentNode.replaceChild(newScript, oldScript);
  });
}

/**
 * Delegate event handling to a parent element.
 * @param {HTMLElement} parent
 * @param {string} eventType
 * @param {string} selector
 * @param {Function} handler
 */
export function delegate(parent, eventType, selector, handler) {
  parent.addEventListener(eventType, (event) => {
    const target = event.target.closest(selector);
    if (target && parent.contains(target)) {
      handler(event, target);
    }
  });
}

/**
 * Debounce a function.
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Generate skeleton loading placeholders.
 * @param {number} count
 * @param {string} type - 'card', 'row', 'text'
 * @returns {string}
 */
export function skeletonLoader(count = 4, type = 'card') {
  const skeletons = {
    card: `
      <div class="product-card" style="pointer-events:none">
        <div class="product-card-image skeleton" style="aspect-ratio:1"></div>
        <div class="product-card-info">
          <div class="skeleton" style="height:12px;width:60%;margin-bottom:8px"></div>
          <div class="skeleton" style="height:16px;width:80%;margin-bottom:12px"></div>
          <div class="skeleton" style="height:20px;width:40%"></div>
        </div>
      </div>
    `,
    row: `
      <div class="flex items-center gap-3 p-4" style="pointer-events:none">
        <div class="skeleton" style="width:48px;height:48px;border-radius:8px;flex-shrink:0"></div>
        <div class="flex-1">
          <div class="skeleton" style="height:14px;width:60%;margin-bottom:8px"></div>
          <div class="skeleton" style="height:12px;width:40%"></div>
        </div>
        <div class="skeleton" style="height:14px;width:60px"></div>
      </div>
    `,
    text: `
      <div style="pointer-events:none">
        <div class="skeleton" style="height:14px;width:90%;margin-bottom:8px"></div>
        <div class="skeleton" style="height:14px;width:70%;margin-bottom:8px"></div>
        <div class="skeleton" style="height:14px;width:80%"></div>
      </div>
    `,
  };

  return Array(count).fill(skeletons[type] || skeletons.card).join('');
}

/**
 * Escape HTML to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export default { $, $q, $qa, createElement, render, delegate, debounce, skeletonLoader, escapeHtml };
