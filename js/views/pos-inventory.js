// ============================================
// POS-Shop — Inventory Management View
// ============================================

import auth from '../auth.js';
import { getSupabase, query } from '../supabase.js';
import { formatCurrency } from '../utils/format.js';
import { escapeHtml } from '../utils/dom.js';

export async function renderPosInventory(params, queryParams, container) {
  if (!auth.isStaff()) {
    window.location.hash = '#/';
    return;
  }

  container.innerHTML = `
    <div class="inventory-layout container">
      <div class="inventory-header">
        <div>
          <h2>Inventory Management</h2>
          <p class="text-sm text-muted">Stock tracking & multi-store inventory</p>
        </div>
      </div>

      <div class="inventory-stats">
        <div class="inventory-stat-card">
          <div class="inventory-stat-label">Total SKUs</div>
          <div class="inventory-stat-value">128</div>
        </div>
        <div class="inventory-stat-card">
          <div class="inventory-stat-label">Low Stock Alerts</div>
          <div class="inventory-stat-value text-danger">3</div>
        </div>
        <div class="inventory-stat-card">
          <div class="inventory-stat-label">Total Stock Units</div>
          <div class="inventory-stat-value">1,450</div>
        </div>
        <div class="inventory-stat-card">
          <div class="inventory-stat-label">Inventory Value</div>
          <div class="inventory-stat-value text-success">₹4,85,000</div>
        </div>
      </div>

      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Unit Price</th>
              <th>Stock Status</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody id="inventory-table-body">
            <tr>
              <td>Wireless Earbuds</td>
              <td class="font-mono">EAR-001</td>
              <td>Electronics</td>
              <td>₹2,499.00</td>
              <td><span class="badge badge-success">In Stock</span></td>
              <td><strong>45</strong></td>
            </tr>
            <tr>
              <td>Cotton T-Shirt</td>
              <td class="font-mono">TSH-002</td>
              <td>Clothing</td>
              <td>₹799.00</td>
              <td><span class="badge badge-success">In Stock</span></td>
              <td><strong>120</strong></td>
            </tr>
            <tr>
              <td>Smart Watch Pro</td>
              <td class="font-mono">WTC-003</td>
              <td>Electronics</td>
              <td>₹4,999.00</td>
              <td><span class="badge badge-warning">Low Stock</span></td>
              <td><strong>8</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

export default { renderPosInventory };
