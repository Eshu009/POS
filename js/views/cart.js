// ============================================
// POS-Shop — Cart View
// ============================================

import { cart } from '../store/cart.js';
import { formatCurrency } from '../utils/format.js';
import { escapeHtml, delegate } from '../utils/dom.js';
import { showToast } from '../utils/toast.js';
import auth from '../auth.js';

const icons = {
  minus: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg>`,
  plus: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>`,
  trash: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>`,
  shoppingBag: `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/></svg>`,
  tag: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
};

export async function renderCart(params, queryParams, container) {
  const items = cart.items;

  if (items.length === 0) {
    container.innerHTML = `
      <div class="cart-page container">
        <div class="empty-state">
          <div class="empty-state-icon">${icons.shoppingBag}</div>
          <h2 class="empty-state-title">Your cart is empty</h2>
          <p class="empty-state-desc">Looks like you haven't added anything yet. Browse our products and find something you love!</p>
          <a href="#/" class="btn btn-primary btn-lg">Continue Shopping</a>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="cart-page container">
      <h1 style="margin-bottom:var(--space-6)">Shopping Cart</h1>
      <div class="cart-layout">
        <div class="cart-items" id="cart-items-list">
          ${renderCartItems(items)}
        </div>
        <div class="cart-summary" id="cart-summary">
          ${renderCartSummary()}
        </div>
      </div>
    </div>
  `;

  setupCartEvents(container);
}

function renderCartItems(items) {
  return items.map((item) => {
    const imgPlaceholder = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;
      background:linear-gradient(135deg, var(--color-bg-tertiary), var(--color-bg-secondary));font-size:1.5rem;opacity:0.4">🛍️</div>`;

    return `
      <div class="cart-item" data-item-id="${item.id}" data-variant-id="${item.variant_id || ''}">
        <div class="cart-item-image">
          ${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">` : imgPlaceholder}
        </div>
        <div class="cart-item-info">
          <div class="cart-item-name">${escapeHtml(item.name)}</div>
          ${item.variant_name ? `<div class="cart-item-variant">${escapeHtml(item.variant_name)}</div>` : ''}
          <div class="cart-item-bottom">
            <div class="quantity-selector" style="transform:scale(0.85);transform-origin:left">
              <button class="quantity-btn" data-action="decrease">${icons.minus}</button>
              <span class="quantity-value">${item.quantity}</span>
              <button class="quantity-btn" data-action="increase">${icons.plus}</button>
            </div>
            <div class="flex items-center gap-3">
              <span class="cart-item-price">${formatCurrency(item.price * item.quantity)}</span>
              <button class="cart-item-remove" data-action="remove" title="Remove">${icons.trash}</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderCartSummary() {
  const subtotal = cart.getSubtotal();
  const discount = cart.getDiscountAmount();
  const tax = cart.getTax();
  const total = cart.getTotal();

  return `
    <h3 class="cart-summary-title">Order Summary</h3>
    <div class="cart-summary-row">
      <span>Subtotal (${cart.getItemCount()} items)</span>
      <span class="value">${formatCurrency(subtotal)}</span>
    </div>
    ${discount > 0 ? `
      <div class="cart-summary-row" style="color:var(--color-success-400)">
        <span>Discount (${cart.discountData?.code})</span>
        <span>-${formatCurrency(discount)}</span>
      </div>
    ` : ''}
    <div class="cart-summary-row">
      <span>GST (18%)</span>
      <span class="value">${formatCurrency(tax)}</span>
    </div>
    <div class="cart-summary-row total">
      <span>Total</span>
      <span class="value">${formatCurrency(total)}</span>
    </div>

    <div class="discount-input-row" id="discount-row">
      <input type="text" class="form-input" id="discount-code-input" 
        placeholder="Discount code" value="${escapeHtml(cart.discountCode || '')}">
      <button class="btn btn-secondary" id="apply-discount-btn">
        ${cart.discountCode ? 'Remove' : 'Apply'}
      </button>
    </div>

    <button class="btn btn-accent btn-lg btn-full mt-6" id="checkout-btn">
      Proceed to Checkout
    </button>
    <a href="#/" class="btn btn-ghost btn-full mt-2" style="text-align:center">Continue Shopping</a>
  `;
}

function refreshCart(container) {
  const itemsList = document.getElementById('cart-items-list');
  const summary = document.getElementById('cart-summary');

  if (cart.items.length === 0) {
    renderCart({}, {}, container);
    return;
  }

  if (itemsList) itemsList.innerHTML = renderCartItems(cart.items);
  if (summary) summary.innerHTML = renderCartSummary();
  setupCartEvents(container);
}

function setupCartEvents(container) {
  // Quantity changes
  delegate(container, 'click', '.quantity-btn', (e, btn) => {
    const cartItem = btn.closest('.cart-item');
    if (!cartItem) return;

    const itemId = cartItem.dataset.itemId;
    const variantId = cartItem.dataset.variantId || null;
    const item = cart.items.find((i) => i.id === itemId && (i.variant_id || '') === (variantId || ''));
    if (!item) return;

    const action = btn.dataset.action;
    const newQty = action === 'increase' ? item.quantity + 1 : item.quantity - 1;
    cart.updateQuantity(itemId, variantId, newQty);
    refreshCart(container);
  });

  // Remove item
  delegate(container, 'click', '[data-action="remove"]', (e, btn) => {
    const cartItem = btn.closest('.cart-item');
    if (!cartItem) return;
    cart.removeItem(cartItem.dataset.itemId, cartItem.dataset.variantId || null);
    refreshCart(container);
  });

  // Discount code
  const discountBtn = document.getElementById('apply-discount-btn');
  if (discountBtn) {
    discountBtn.addEventListener('click', () => {
      if (cart.discountCode) {
        cart.removeDiscount();
        refreshCart(container);
        return;
      }

      const input = document.getElementById('discount-code-input');
      const code = input?.value.trim();
      if (!code) {
        showToast('Enter a discount code', 'warning');
        return;
      }

      // For demo, accept any code as 10% off
      cart.applyDiscount({ code, type: 'percentage', value: 10 });
      refreshCart(container);
    });
  }

  // Checkout button
  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (!auth.isAuthenticated()) {
        showToast('Please sign in to checkout', 'warning');
        window.location.hash = '#/login?redirect=checkout';
        return;
      }
      window.location.hash = '#/checkout';
    });
  }
}

export default { renderCart };
