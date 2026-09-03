// ============================================
// POS-Shop — POS Terminal View (Quick Sale)
// ============================================

import { posCart } from '../store/cart.js';
import auth from '../auth.js';
import { getSupabase, query } from '../supabase.js';
import { formatCurrency } from '../utils/format.js';
import { escapeHtml, delegate, debounce } from '../utils/dom.js';
import { showToast } from '../utils/toast.js';
import { listenForBarcodeInput, startBarcodeScanner } from '../utils/barcode.js';

const icons = {
  search: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>`,
  barcode: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 5v14M7 5v14M11 5v14M15 5v14M19 5v14M21 5v14"/></svg>`,
  trash: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>`,
  print: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"/></svg>`,
};

let cleanupBarcodeListener = null;

export async function renderPosTerminal(params, queryParams, container) {
  if (!auth.isStaff()) {
    showToast('Please log in as Staff or Admin to access POS Terminal', 'info');
    window.location.hash = '#/login?redirect=pos';
    return;
  }

  container.innerHTML = `
    <div class="pos-layout">
      <!-- Main POS Grid & Search -->
      <div class="pos-main">
        <div class="pos-topbar">
          <div class="pos-search">
            <span class="search-icon">${icons.search}</span>
            <input type="text" class="form-input" id="pos-search-input" placeholder="Search product by name, SKU or barcode (F2)..." autofocus autocomplete="off">
            <div class="pos-search-results hidden" id="pos-search-results"></div>
          </div>
          <button class="pos-scanner-btn" id="pos-camera-btn" title="Camera Barcode Scanner">
            ${icons.barcode}
            <span class="hide-mobile">Scan Barcode</span>
          </button>
        </div>

        <div class="pos-products">
          <div class="pos-category-tabs" id="pos-cat-tabs">
            <button class="pos-category-tab active" data-cat="">All Items</button>
            <button class="pos-category-tab" data-cat="electronics">Electronics</button>
            <button class="pos-category-tab" data-cat="clothing">Clothing</button>
            <button class="pos-category-tab" data-cat="groceries">Groceries</button>
            <button class="pos-category-tab" data-cat="accessories">Accessories</button>
          </div>
          <div class="pos-product-grid" id="pos-product-grid">
            <!-- Tiles rendered dynamically -->
          </div>
        </div>

        <!-- Keyboard Shortcuts Footer Bar -->
        <div class="keyboard-hints">
          <div class="keyboard-hint"><span class="kbd">F2</span> Search</div>
          <div class="keyboard-hint"><span class="kbd">F8</span> Pay Cash</div>
          <div class="keyboard-hint"><span class="kbd">F9</span> Pay Card</div>
          <div class="keyboard-hint"><span class="kbd">Esc</span> Clear Cart</div>
        </div>
      </div>

      <!-- Right Cart Sidebar -->
      <div class="pos-sidebar">
        <div class="pos-cart-header">
          <div>
            <div class="pos-cart-title">Current Order</div>
            <div class="pos-cart-count" id="pos-cart-count">0 items</div>
          </div>
          <button class="btn btn-ghost btn-sm text-danger" id="pos-clear-cart-btn">Clear</button>
        </div>

        <div class="pos-cart-items" id="pos-cart-items">
          <!-- Cart items list -->
        </div>

        <div class="pos-cart-footer">
          <div class="pos-cart-summary-row">
            <span>Subtotal</span>
            <span id="pos-subtotal">₹0.00</span>
          </div>
          <div class="pos-cart-summary-row">
            <span>GST (18%)</span>
            <span id="pos-tax">₹0.00</span>
          </div>
          <div class="pos-cart-total">
            <span>Total</span>
            <span id="pos-total">₹0.00</span>
          </div>

          <div class="pos-payment-actions">
            <button class="pos-payment-btn pos-pay-cash" id="pos-cash-btn">
              💵 CASH (F8)
            </button>
            <button class="pos-payment-btn pos-pay-card" id="pos-card-btn">
              💳 CARD (F9)
            </button>
            <button class="pos-payment-btn pos-pay-qr" id="pos-qr-btn">
              📱 RAZORPAY QR
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals Container -->
    <div id="pos-modal-container"></div>
  `;

  await loadPosProducts();
  refreshPosCart();
  setupPosEvents(container);
}

async function loadPosProducts(category = '', search = '') {
  const grid = document.getElementById('pos-product-grid');
  if (!grid) return;

  const sb = getSupabase();
  let products = [];

  if (sb) {
    let q = sb.from('products').select('*, inventory(quantity)').eq('is_published', true);
    if (search) q = q.or(`name.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}%`);
    const { data } = await query(q);
    if (data) products = data;
  }

  if (products.length === 0) {
    products = [
      { id: 'demo-1', name: 'Wireless Earbuds', price: 2499, sku: 'EAR-001', inventory: [{ quantity: 45 }] },
      { id: 'demo-2', name: 'Cotton T-Shirt', price: 799, sku: 'TSH-002', inventory: [{ quantity: 120 }] },
      { id: 'demo-3', name: 'Smart Watch Pro', price: 4999, sku: 'WTC-003', inventory: [{ quantity: 15 }] },
      { id: 'demo-4', name: 'Green Tea 100g', price: 349, sku: 'TEA-004', inventory: [{ quantity: 200 }] },
      { id: 'demo-5', name: 'Leather Wallet', price: 1299, sku: 'WLT-005', inventory: [{ quantity: 35 }] },
    ];
  }

  grid.innerHTML = products.map(p => `
    <div class="pos-product-tile" data-id="${p.id}" data-name="${escapeHtml(p.name)}" data-price="${p.price}">
      <div class="pos-product-tile-image">
        <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.5rem">🛍️</div>
      </div>
      <div class="pos-product-tile-name">${escapeHtml(p.name)}</div>
      <div class="pos-product-tile-price">${formatCurrency(p.price)}</div>
    </div>
  `).join('');
}

function refreshPosCart() {
  const itemsContainer = document.getElementById('pos-cart-items');
  const countEl = document.getElementById('pos-cart-count');
  const subtotalEl = document.getElementById('pos-subtotal');
  const taxEl = document.getElementById('pos-tax');
  const totalEl = document.getElementById('pos-total');

  if (!itemsContainer) return;

  const items = posCart.items;
  countEl.textContent = `${posCart.getItemCount()} items`;
  subtotalEl.textContent = formatCurrency(posCart.getSubtotal());
  taxEl.textContent = formatCurrency(posCart.getTax());
  totalEl.textContent = formatCurrency(posCart.getTotal());

  if (items.length === 0) {
    itemsContainer.innerHTML = `
      <div class="empty-state" style="padding:var(--space-8) 0">
        <p class="text-muted text-sm">Cart is empty. Click a product or scan barcode.</p>
      </div>
    `;
    return;
  }

  itemsContainer.innerHTML = items.map(item => `
    <div class="pos-cart-item" data-id="${item.id}">
      <div class="pos-cart-item-info">
        <div class="pos-cart-item-name">${escapeHtml(item.name)}</div>
        <div class="pos-cart-item-price">${formatCurrency(item.price * item.quantity)}</div>
      </div>
      <div class="pos-cart-item-qty">
        <button data-action="dec">-</button>
        <span>${item.quantity}</span>
        <button data-action="inc">+</button>
      </div>
      <button class="pos-cart-item-remove" data-action="rem">${icons.trash}</button>
    </div>
  `).join('');
}

function setupPosEvents(container) {
  // Tile click
  delegate(container, 'click', '.pos-product-tile', (e, tile) => {
    posCart.addItem({
      id: tile.dataset.id,
      name: tile.dataset.name,
      price: parseFloat(tile.dataset.price),
    });
    refreshPosCart();
  });

  // Quantity controls
  delegate(container, 'click', '.pos-cart-item-qty button', (e, btn) => {
    const itemEl = btn.closest('.pos-cart-item');
    const id = itemEl.dataset.id;
    const item = posCart.items.find(i => i.id === id);
    if (!item) return;

    const action = btn.dataset.action;
    if (action === 'inc') posCart.updateQuantity(id, null, item.quantity + 1);
    if (action === 'dec') posCart.updateQuantity(id, null, item.quantity - 1);
    refreshPosCart();
  });

  delegate(container, 'click', '.pos-cart-item-remove', (e, btn) => {
    const itemEl = btn.closest('.pos-cart-item');
    posCart.removeItem(itemEl.dataset.id);
    refreshPosCart();
  });

  document.getElementById('pos-clear-cart-btn').addEventListener('click', () => {
    posCart.clear();
    refreshPosCart();
  });

  // Cash payment modal
  document.getElementById('pos-cash-btn').addEventListener('click', () => handleCashCheckout(container));
  document.getElementById('pos-card-btn').addEventListener('click', () => completePosOrder('card'));
  document.getElementById('pos-qr-btn').addEventListener('click', () => completePosOrder('razorpay'));

  // Barcode USB scanner listener
  if (cleanupBarcodeListener) cleanupBarcodeListener();
  cleanupBarcodeListener = listenForBarcodeInput((barcode) => {
    showToast(`Scanned Barcode: ${barcode}`, 'info');
    loadPosProducts('', barcode);
  });
}

function handleCashCheckout(container) {
  const total = posCart.getTotal();
  if (total === 0) return;

  const modalHtml = `
    <div class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Cash Payment</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <p class="text-sm text-muted">Total Amount: <strong class="text-lg text-primary">${formatCurrency(total)}</strong></p>
        
        <div class="form-group mt-4">
          <label class="form-label">Tendered Amount</label>
          <input type="number" class="form-input" id="cash-tendered" value="${Math.ceil(total / 100) * 100}" autofocus>
        </div>

        <div class="cash-change-display">
          <div class="cash-change-label">Change to Return</div>
          <div class="cash-change-amount" id="cash-change">₹0.00</div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-primary btn-full btn-lg mt-4" id="confirm-cash-sale">Complete Sale & Print Receipt</button>
        </div>
      </div>
    </div>
  `;

  const modalContainer = document.getElementById('pos-modal-container');
  modalContainer.innerHTML = modalHtml;

  const tenderedInput = document.getElementById('cash-tendered');
  const changeEl = document.getElementById('cash-change');

  const updateChange = () => {
    const tendered = parseFloat(tenderedInput.value) || 0;
    const change = Math.max(0, tendered - total);
    changeEl.textContent = formatCurrency(change);
  };
  updateChange();
  tenderedInput.addEventListener('input', updateChange);

  document.getElementById('confirm-cash-sale').addEventListener('click', () => {
    modalContainer.innerHTML = '';
    completePosOrder('cash');
  });
}

async function completePosOrder(method) {
  if (posCart.items.length === 0) return;

  showToast(`POS Sale Completed via ${method.toUpperCase()}!`, 'success');
  printReceipt(posCart.items, posCart.getTotal());
  posCart.clear();
  refreshPosCart();
}

function printReceipt(items, total) {
  const printWindow = window.open('', '_blank', 'width=320,height=600');
  printWindow.document.write(`
    <html>
      <head>
        <title>Receipt</title>
        <style>
          body { font-family: monospace; font-size: 12px; padding: 10px; width: 280px; }
          .text-center { text-align: center; }
          .flex { display: flex; justify-content: space-between; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <h2>MyShop POS</h2>
          <p>Thank you for shopping!</p>
        </div>
        <div class="divider"></div>
        ${items.map(i => `<div class="flex"><span>${i.name} x${i.quantity}</span><span>₹${i.price * i.quantity}</span></div>`).join('')}
        <div class="divider"></div>
        <div class="flex"><strong>Total</strong><strong>₹${total}</strong></div>
        <div class="divider"></div>
        <p class="text-center">${new Date().toLocaleString()}</p>
        <script>window.print(); window.close();</script>
      </body>
    </html>
  `);
}

export default { renderPosTerminal };
