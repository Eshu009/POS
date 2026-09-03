// ============================================
// POS-Shop — POS & Store Order Management View
// ============================================

import auth from '../auth.js';
import { getSupabase, query } from '../supabase.js';
import { formatCurrency, formatDate } from '../utils/format.js';

export async function renderPosOrders(params, queryParams, container) {
  if (!auth.isStaff()) {
    window.location.hash = '#/';
    return;
  }

  container.innerHTML = `
    <div class="inventory-layout container">
      <div class="inventory-header">
        <div>
          <h2>Order Management</h2>
          <p class="text-sm text-muted">All online & POS orders</p>
        </div>
      </div>

      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Source</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Payment Method</th>
              <th>Status</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="font-mono">#ORD-9812</td>
              <td><span class="badge badge-accent">POS</span></td>
              <td>Just now</td>
              <td>Walk-in Customer</td>
              <td>Cash</td>
              <td><span class="badge badge-success">COMPLETED</span></td>
              <td><strong>₹3,298.00</strong></td>
            </tr>
            <tr>
              <td class="font-mono">#ORD-8921</td>
              <td><span class="badge badge-primary">Online</span></td>
              <td>10 mins ago</td>
              <td>Rahul Sharma</td>
              <td>Razorpay</td>
              <td><span class="badge badge-warning">PROCESSING</span></td>
              <td><strong>₹2,948.82</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

export default { renderPosOrders };
