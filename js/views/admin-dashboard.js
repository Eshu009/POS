// ============================================
// POS-Shop — Admin Analytics Dashboard
// ============================================

import auth from '../auth.js';
import { formatCurrency } from '../utils/format.js';

export async function renderAdminDashboard(params, queryParams, container) {
  if (!auth.isAdmin()) {
    window.location.hash = '#/';
    return;
  }

  container.innerHTML = `
    <div class="admin-layout">
      <!-- Admin Sidebar Nav -->
      <div class="admin-sidebar">
        <div class="admin-nav-section">Management</div>
        <nav class="admin-nav">
          <a href="#/admin" class="admin-nav-item active">📊 Dashboard</a>
          <a href="#/admin/products" class="admin-nav-item">📦 Products</a>
          <a href="#/admin/discounts" class="admin-nav-item">🏷️ Discounts</a>
          <a href="#/admin/stores" class="admin-nav-item">🏪 Store Locations</a>
          <a href="#/pos" class="admin-nav-item">💻 POS Terminal</a>
        </nav>
      </div>

      <!-- Main Admin Content -->
      <div class="admin-content">
        <h1 style="margin-bottom:var(--space-6)">Store Analytics & Overview</h1>

        <div class="dashboard-stats">
          <div class="stat-card revenue">
            <div class="stat-card-header">
              <span class="stat-card-label">Total Revenue</span>
              <div class="stat-card-icon">💰</div>
            </div>
            <div class="stat-card-value">₹1,48,920</div>
            <span class="stat-card-change positive">+14.2% from last month</span>
          </div>

          <div class="stat-card orders">
            <div class="stat-card-header">
              <span class="stat-card-label">Total Orders</span>
              <div class="stat-card-icon">🛒</div>
            </div>
            <div class="stat-card-value">342</div>
            <span class="stat-card-change positive">+8.5% this week</span>
          </div>

          <div class="stat-card products">
            <div class="stat-card-header">
              <span class="stat-card-label">Active Products</span>
              <div class="stat-card-icon">📦</div>
            </div>
            <div class="stat-card-value">128</div>
            <span class="stat-card-change positive">100% in stock</span>
          </div>

          <div class="stat-card customers">
            <div class="stat-card-header">
              <span class="stat-card-label">Customers</span>
              <div class="stat-card-icon">👥</div>
            </div>
            <div class="stat-card-value">512</div>
            <span class="stat-card-change positive">+24 new today</span>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">Revenue Trend (Last 7 Days)</h3>
          </div>
          <div class="chart-canvas-container" style="display:flex;align-items:flex-end;gap:12px;padding:20px;height:240px;background:var(--color-bg-primary);border-radius:16px">
            <div style="flex:1;background:var(--color-primary-600);height:40%;border-radius:8px 8px 0 0"></div>
            <div style="flex:1;background:var(--color-primary-600);height:65%;border-radius:8px 8px 0 0"></div>
            <div style="flex:1;background:var(--color-primary-600);height:50%;border-radius:8px 8px 0 0"></div>
            <div style="flex:1;background:var(--color-primary-600);height:80%;border-radius:8px 8px 0 0"></div>
            <div style="flex:1;background:var(--color-primary-600);height:70%;border-radius:8px 8px 0 0"></div>
            <div style="flex:1;background:var(--color-primary-600);height:95%;border-radius:8px 8px 0 0"></div>
            <div style="flex:1;background:var(--color-accent-500);height:100%;border-radius:8px 8px 0 0"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export default { renderAdminDashboard };
