// ============================================
// POS-Shop — Admin Discount Code Management View
// ============================================

import auth from '../auth.js';

export async function renderAdminDiscounts(params, queryParams, container) {
  if (!auth.isAdmin()) {
    window.location.hash = '#/';
    return;
  }

  container.innerHTML = `
    <div class="admin-layout">
      <div class="admin-sidebar">
        <div class="admin-nav-section">Management</div>
        <nav class="admin-nav">
          <a href="#/admin" class="admin-nav-item">📊 Dashboard</a>
          <a href="#/admin/products" class="admin-nav-item">📦 Products</a>
          <a href="#/admin/discounts" class="admin-nav-item active">🏷️ Discounts</a>
          <a href="#/admin/stores" class="admin-nav-item">🏪 Store Locations</a>
        </nav>
      </div>

      <div class="admin-content">
        <div class="product-toolbar">
          <h2>Discount Codes & Promotions</h2>
          <button class="btn btn-primary">+ Create Discount Code</button>
        </div>

        <div class="grid grid-2 gap-4">
          <div class="discount-card">
            <div class="discount-code-display">WELCOME10</div>
            <div>
              <strong>10% OFF</strong>
              <p class="text-xs text-muted">Min order ₹500 • Active</p>
            </div>
            <span class="badge badge-success" style="margin-left:auto">Active</span>
          </div>

          <div class="discount-card">
            <div class="discount-code-display">SAVE200</div>
            <div>
              <strong>Flat ₹200 OFF</strong>
              <p class="text-xs text-muted">Min order ₹1,500 • Active</p>
            </div>
            <span class="badge badge-success" style="margin-left:auto">Active</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

export default { renderAdminDiscounts };
