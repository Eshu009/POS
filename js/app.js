// ============================================
// POS-Shop — Main Application Entry Point
// ============================================

import router from './router.js';
import auth from './auth.js';
import { cart } from './store/cart.js';
import { renderStorefront } from './views/storefront.js';
import { renderProductDetail } from './views/product-detail.js';
import { renderCart } from './views/cart.js';
import { renderCheckout } from './views/checkout.js';
import { renderAccount } from './views/account.js';
import { renderLogin } from './views/login.js';
import { renderPosTerminal } from './views/pos-terminal.js';
import { renderPosInventory } from './views/pos-inventory.js';
import { renderPosOrders } from './views/pos-orders.js';
import { renderAdminDashboard } from './views/admin-dashboard.js';
import { renderAdminProducts } from './views/admin-products.js';
import { renderAdminDiscounts } from './views/admin-discounts.js';
import { renderAdminStores } from './views/admin-stores.js';

// Register All SPA Routes
router
  .on('/', renderStorefront, { title: 'Home Shop' })
  .on('/product/:id', renderProductDetail, { title: 'Product Details' })
  .on('/cart', renderCart, { title: 'Shopping Cart' })
  .on('/checkout', renderCheckout, { title: 'Checkout', requiresAuth: true })
  .on('/account', renderAccount, { title: 'My Account', requiresAuth: true })
  .on('/login', renderLogin, { title: 'Sign In' })
  .on('/pos', renderPosTerminal, { title: 'POS Terminal', requiresStaff: true })
  .on('/pos/inventory', renderPosInventory, { title: 'POS Inventory', requiresStaff: true })
  .on('/pos/orders', renderPosOrders, { title: 'POS Orders', requiresStaff: true })
  .on('/admin', renderAdminDashboard, { title: 'Admin Analytics', requiresAdmin: true })
  .on('/admin/products', renderAdminProducts, { title: 'Admin Products', requiresAdmin: true })
  .on('/admin/discounts', renderAdminDiscounts, { title: 'Admin Discounts', requiresAdmin: true })
  .on('/admin/stores', renderAdminStores, { title: 'Admin Store Locations', requiresAdmin: true });

// Route Navigation Guards
router.beforeEach(async (to) => {
  if (to.meta.requiresAuth && !auth.isAuthenticated()) {
    return `/login?redirect=${encodeURIComponent(to.path.slice(1))}`;
  }
  if (to.meta.requiresStaff && !auth.isStaff()) {
    if (!auth.isAuthenticated()) {
      return `/login?redirect=${encodeURIComponent(to.path.slice(1))}`;
    }
    return '/';
  }
  if (to.meta.requiresAdmin && !auth.isAdmin()) {
    if (!auth.isAuthenticated()) {
      return `/login?redirect=${encodeURIComponent(to.path.slice(1))}`;
    }
    return '/';
  }
  return true;
});

// Update Header Cart Counter
function updateHeaderCartCount() {
  const badge = document.getElementById('header-cart-count');
  if (badge) {
    badge.textContent = cart.getItemCount();
  }
}

// App Initialization
async function initApp() {
  await auth.init();
  updateHeaderCartCount();
  cart.onChange(updateHeaderCartCount);
  router.start();
}

document.addEventListener('DOMContentLoaded', initApp);
