// ============================================
// POS-Shop — Admin Product CRUD Management
// ============================================

import auth from '../auth.js';
import { getSupabase, uploadFile, query } from '../supabase.js';
import { formatCurrency } from '../utils/format.js';
import { showToast } from '../utils/toast.js';

export async function renderAdminProducts(params, queryParams, container) {
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
          <a href="#/admin/products" class="admin-nav-item active">📦 Products</a>
          <a href="#/admin/discounts" class="admin-nav-item">🏷️ Discounts</a>
          <a href="#/admin/stores" class="admin-nav-item">🏪 Store Locations</a>
        </nav>
      </div>

      <div class="admin-content">
        <div class="product-toolbar">
          <h2>Product Management</h2>
          <button class="btn btn-primary" id="add-product-btn">+ Add New Product</button>
        </div>

        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Compare Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="admin-products-table">
              <tr>
                <td>Wireless Bluetooth Earbuds</td>
                <td class="font-mono">EAR-001</td>
                <td>₹2,499.00</td>
                <td>₹3,999.00</td>
                <td><span class="badge badge-success">Published</span></td>
                <td><button class="btn btn-ghost btn-sm">Edit</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

export default { renderAdminProducts };
