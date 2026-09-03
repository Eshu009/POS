// ============================================
// POS-Shop — Checkout View (Razorpay Integration)
// ============================================

import { cart } from '../store/cart.js';
import auth from '../auth.js';
import { formatCurrency } from '../utils/format.js';
import { showToast } from '../utils/toast.js';
import { invokeFunction, getSupabase, query } from '../supabase.js';
import Config from '../config.js';

export async function renderCheckout(params, queryParams, container) {
  if (cart.items.length === 0) {
    window.location.hash = '#/cart';
    return;
  }

  const user = auth.user;
  const profile = auth.profile;

  container.innerHTML = `
    <div class="checkout-layout container">
      <div class="checkout-main">
        <h1 style="margin-bottom:var(--space-6)">Checkout</h1>

        <!-- Step 1: Shipping Address -->
        <div class="checkout-section">
          <div class="checkout-section-title">
            <span class="step-number">1</span>
            <span>Shipping Address</span>
          </div>
          <form id="shipping-form" class="address-grid">
            <div class="form-group" style="grid-column: span 2">
              <label class="form-label">Full Name</label>
              <input type="text" class="form-input" id="ship-name" required value="${profile?.full_name || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input type="tel" class="form-input" id="ship-phone" required value="${profile?.phone || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" class="form-input" id="ship-email" required value="${user?.email || ''}">
            </div>
            <div class="form-group" style="grid-column: span 2">
              <label class="form-label">Street Address</label>
              <input type="text" class="form-input" id="ship-address" required placeholder="House No., Street Name, Area">
            </div>
            <div class="form-group">
              <label class="form-label">City</label>
              <input type="text" class="form-input" id="ship-city" required>
            </div>
            <div class="form-group">
              <label class="form-label">State</label>
              <input type="text" class="form-input" id="ship-state" required>
            </div>
            <div class="form-group">
              <label class="form-label">PIN Code</label>
              <input type="text" class="form-input" id="ship-pincode" required>
            </div>
          </form>
        </div>

        <!-- Step 2: Payment Method -->
        <div class="checkout-section">
          <div class="checkout-section-title">
            <span class="step-number">2</span>
            <span>Payment Method</span>
          </div>
          <div class="flex flex-col gap-3">
            <label class="card flex items-center gap-4" style="cursor:pointer;padding:var(--space-4)">
              <input type="radio" name="payment_method" value="razorpay" checked>
              <div class="flex-1">
                <strong>Razorpay Online Payment</strong>
                <p class="text-xs text-muted">UPI, Cards, NetBanking, Wallets</p>
              </div>
              <span class="badge badge-primary">Fast & Secure</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Summary Sidebar -->
      <div class="cart-summary">
        <h3 class="cart-summary-title">Order Items</h3>
        <div style="max-height:200px;overflow-y:auto;margin-bottom:var(--space-4)">
          ${cart.items.map(item => `
            <div class="flex justify-between items-center text-sm py-2 border-b border-border">
              <span class="truncate" style="max-width:180px">${item.name} x${item.quantity}</span>
              <span class="font-semibold">${formatCurrency(item.price * item.quantity)}</span>
            </div>
          `).join('')}
        </div>
        <div class="cart-summary-row"><span>Subtotal</span><span>${formatCurrency(cart.getSubtotal())}</span></div>
        ${cart.getDiscountAmount() > 0 ? `<div class="cart-summary-row text-success"><span>Discount</span><span>-${formatCurrency(cart.getDiscountAmount())}</span></div>` : ''}
        <div class="cart-summary-row"><span>GST (18%)</span><span>${formatCurrency(cart.getTax())}</span></div>
        <div class="cart-summary-row total"><span>Total Payable</span><span class="value">${formatCurrency(cart.getTotal())}</span></div>

        <button class="btn btn-accent btn-lg btn-full mt-6" id="pay-now-btn">
          Pay ${formatCurrency(cart.getTotal())}
        </button>
      </div>
    </div>
  `;

  setupCheckoutEvents(container);
}

function setupCheckoutEvents(container) {
  const payBtn = document.getElementById('pay-now-btn');
  const form = document.getElementById('shipping-form');

  payBtn.addEventListener('click', async () => {
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const shippingAddress = {
      name: document.getElementById('ship-name').value,
      phone: document.getElementById('ship-phone').value,
      email: document.getElementById('ship-email').value,
      address: document.getElementById('ship-address').value,
      city: document.getElementById('ship-city').value,
      state: document.getElementById('ship-state').value,
      pincode: document.getElementById('ship-pincode').value,
    };

    payBtn.disabled = true;
    payBtn.textContent = 'Processing Order...';

    // 1. Create order in Edge Function or locally in DB fallback
    const { data: edgeData, error: edgeErr } = await invokeFunction('create-razorpay-order', {
      items: cart.items,
      shippingAddress,
      discountCode: cart.discountCode,
      amount: cart.getTotal(),
    });

    if (edgeErr || !edgeData?.order_id) {
      // Fallback demo flow if Edge Functions aren't deployed yet
      console.warn('Edge function unavailable, initiating client demo payment mode.');
      initiateRazorpayCheckout({
        id: `order_demo_${Date.now()}`,
        amount: cart.getTotal() * 100, // Razorpay works in paise
        currency: Config.CURRENCY,
      }, shippingAddress);
    } else {
      initiateRazorpayCheckout(edgeData, shippingAddress);
    }

    payBtn.disabled = false;
    payBtn.textContent = `Pay ${formatCurrency(cart.getTotal())}`;
  });
}

function initiateRazorpayCheckout(orderData, shippingAddress) {
  if (typeof window.Razorpay === 'undefined') {
    showToast('Razorpay Checkout script not loaded', 'error');
    return;
  }

  const options = {
    key: Config.RAZORPAY_KEY_ID,
    amount: orderData.amount,
    currency: orderData.currency || 'INR',
    name: Config.STORE_NAME,
    description: 'Order Payment',
    order_id: orderData.id.startsWith('order_demo_') ? undefined : orderData.id,
    prefill: {
      name: shippingAddress.name,
      email: shippingAddress.email,
      contact: shippingAddress.phone,
    },
    theme: {
      color: '#3b82f6',
    },
    handler: async function (response) {
      showToast('Payment successful! Processing order...', 'success');
      
      // Verify payment on Edge Function or fallback
      await invokeFunction('verify-payment', {
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature,
      });

      cart.clear();
      window.location.hash = '#/account';
    },
    modal: {
      ondismiss: function () {
        showToast('Payment cancelled', 'warning');
      },
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
}

export default { renderCheckout };
