// ============================================
// POS-Shop — Admin Store Locations Management
// ============================================

import auth from '../auth.js';

export async function renderAdminStores(params, queryParams, container) {
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
          <a href="#/admin/discounts" class="admin-nav-item">🏷️ Discounts</a>
          <a href="#/admin/stores" class="admin-nav-item active">🏪 Store Locations</a>
        </nav>
      </div>

      <div class="admin-content">
        <div class="product-toolbar">
          <h2>Store Locations</h2>
          <button class="btn btn-primary">+ Add New Store</button>
        </div>

        <div class="grid grid-2 gap-4">
          <div class="card">
            <h3>Main Flagship Store (MAIN01)</h3>
            <p class="text-sm text-muted mt-2">123 Tech Park, Bangalore • +91 98765 43210</p>
            <span class="badge badge-success mt-4">Active POS Terminal</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

export default { renderAdminStores };
