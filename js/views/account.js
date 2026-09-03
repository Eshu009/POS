// ============================================
// POS-Shop — Customer Account & Order History View
// ============================================

import auth from '../auth.js';
import { getSupabase, query } from '../supabase.js';
import { formatCurrency, formatDate, formatOrderId } from '../utils/format.js';
import { escapeHtml } from '../utils/dom.js';

export async function renderAccount(params, queryParams, container) {
  if (!auth.isAuthenticated()) {
    window.location.hash = '#/login?redirect=account';
    return;
  }

  const user = auth.user;
  const profile = auth.profile;

  container.innerHTML = `
    <div class="account-page container">
      <div class="account-header">
        <div class="avatar avatar-lg">${auth.getInitials()}</div>
        <div class="account-info">
          <h2>${escapeHtml(auth.getDisplayName())}</h2>
          <p class="text-muted">${escapeHtml(user.email)} • Role: <span class="badge badge-primary">${escapeHtml(auth.getRole())}</span></p>
        </div>
        <button class="btn btn-secondary btn-sm style="margin-left:auto" id="account-signout-btn">Sign Out</button>
      </div>

      <h3 style="margin-bottom:var(--space-4)">Order History</h3>
      <div id="orders-list">
        <div class="skeleton" style="height:100px;margin-bottom:16px;border-radius:16px"></div>
        <div class="skeleton" style="height:100px;border-radius:16px"></div>
      </div>
    </div>
  `;

  document.getElementById('account-signout-btn').addEventListener('click', () => {
    auth.signOut();
    window.location.hash = '#/';
  });

  await loadCustomerOrders();
}

async function loadCustomerOrders() {
  const sb = getSupabase();
  const listEl = document.getElementById('orders-list');
  if (!listEl) return;

  if (!sb) {
    renderDemoOrders(listEl);
    return;
  }

  const { data: orders, error } = await query(
    sb.from('orders')
      .select('*, order_items(*)')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
  );

  if (error || !orders || orders.length === 0) {
    renderDemoOrders(listEl);
    return;
  }

  listEl.innerHTML = orders.map(order => `
    <div class="order-card">
      <div class="order-card-header">
        <div>
          <span class="order-id">${formatOrderId(order.id)}</span>
          <span class="text-xs text-muted" style="margin-left:8px">${formatDate(order.created_at, 'long')}</span>
        </div>
        <span class="badge badge-${order.status === 'delivered' ? 'success' : order.status === 'pending' ? 'warning' : 'primary'}">
          ${order.status.toUpperCase()}
        </span>
      </div>
      <div class="order-items-preview">
        ${order.order_items.map(item => `
          <div class="text-sm font-medium py-1">
            ${escapeHtml(item.product_name)} x${item.quantity} (${formatCurrency(item.price)})
          </div>
        `).join('')}
      </div>
      <div class="order-card-footer">
        <span class="text-sm text-muted">Payment: ${order.payment_method || 'Online'}</span>
        <span class="font-bold text-lg">${formatCurrency(order.total_amount)}</span>
      </div>
    </div>
  `).join('');
}

function renderDemoOrders(listEl) {
  listEl.innerHTML = `
    <div class="order-card">
      <div class="order-card-header">
        <div>
          <span class="order-id">#ORD-8921A</span>
          <span class="text-xs text-muted" style="margin-left:8px">Just now</span>
        </div>
        <span class="badge badge-warning">PROCESSING</span>
      </div>
      <div class="text-sm py-2">
        Wireless Bluetooth Earbuds x1 (₹2,499.00)
      </div>
      <div class="order-card-footer">
        <span class="text-sm text-muted">Payment: Razorpay</span>
        <span class="font-bold text-lg">₹2,948.82</span>
      </div>
    </div>
  `;
}

export default { renderAccount };
