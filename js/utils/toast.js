// ============================================
// POS-Shop — Toast Notification System
// ============================================

let container = null;

function getContainer() {
  if (container) return container;
  container = document.createElement('div');
  container.className = 'toast-container';
  container.id = 'toast-container';
  document.body.appendChild(container);
  return container;
}

const icons = {
  success: `<svg class="toast-icon" viewBox="0 0 20 20" fill="currentColor" style="color:var(--color-success-400)">
    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
  </svg>`,
  error: `<svg class="toast-icon" viewBox="0 0 20 20" fill="currentColor" style="color:var(--color-danger-400)">
    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
  </svg>`,
  warning: `<svg class="toast-icon" viewBox="0 0 20 20" fill="currentColor" style="color:var(--color-warning-400)">
    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
  </svg>`,
  info: `<svg class="toast-icon" viewBox="0 0 20 20" fill="currentColor" style="color:var(--color-primary-400)">
    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
  </svg>`,
};

/**
 * Show a toast notification.
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} type
 * @param {number} duration - Duration in ms (default 4000)
 */
export function showToast(message, type = 'info', duration = 4000) {
  const container = getContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    ${icons[type] || icons.info}
    <span class="toast-message">${message}</span>
    <button class="modal-close" onclick="this.parentElement.classList.add('toast-exit')">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M1 1l12 12M13 1L1 13"/>
      </svg>
    </button>
  `;

  container.appendChild(toast);

  // Auto-remove
  const timer = setTimeout(() => {
    toast.classList.add('toast-exit');
  }, duration);

  // Remove from DOM after exit animation
  toast.addEventListener('animationend', (e) => {
    if (e.animationName === 'toastExit') {
      clearTimeout(timer);
      toast.remove();
    }
  });

  // Click close
  toast.querySelector('.modal-close').addEventListener('click', () => {
    clearTimeout(timer);
    setTimeout(() => toast.remove(), 200);
  });
}

export default { showToast };
