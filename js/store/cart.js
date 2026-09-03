// ============================================
// POS-Shop — Cart State Management
// Persistent cart with localStorage + reactive updates
// ============================================

import { showToast } from '../utils/toast.js';
import Config from '../config.js';

class CartStore {
  constructor() {
    this.items = [];
    this.discountCode = null;
    this.discountData = null; // { type, value, code }
    this.listeners = [];
    this._load();
  }

  /**
   * Load cart from localStorage.
   */
  _load() {
    try {
      const saved = localStorage.getItem('pos-shop-cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.items = parsed.items || [];
        this.discountCode = parsed.discountCode || null;
        this.discountData = parsed.discountData || null;
      }
    } catch (e) {
      console.error('Failed to load cart:', e);
      this.items = [];
    }
  }

  /**
   * Save cart to localStorage.
   */
  _save() {
    try {
      localStorage.setItem('pos-shop-cart', JSON.stringify({
        items: this.items,
        discountCode: this.discountCode,
        discountData: this.discountData,
      }));
    } catch (e) {
      console.error('Failed to save cart:', e);
    }
    this._notify();
  }

  /**
   * Add an item to the cart.
   * @param {object} product - { id, name, price, image, sku, variant_id, variant_name, max_stock }
   * @param {number} quantity
   */
  addItem(product, quantity = 1) {
    const existingIdx = this.items.findIndex(
      (item) => item.id === product.id && item.variant_id === product.variant_id
    );

    if (existingIdx >= 0) {
      const newQty = this.items[existingIdx].quantity + quantity;
      if (product.max_stock && newQty > product.max_stock) {
        showToast(`Only ${product.max_stock} available in stock`, 'warning');
        this.items[existingIdx].quantity = product.max_stock;
      } else {
        this.items[existingIdx].quantity = newQty;
      }
    } else {
      this.items.push({
        id: product.id,
        variant_id: product.variant_id || null,
        name: product.name,
        variant_name: product.variant_name || null,
        price: product.price,
        image: product.image || null,
        sku: product.sku || null,
        max_stock: product.max_stock || null,
        quantity,
      });
    }

    showToast(`${product.name} added to cart`, 'success');
    this._save();
  }

  /**
   * Update item quantity.
   * @param {string} id
   * @param {string|null} variantId
   * @param {number} quantity
   */
  updateQuantity(id, variantId, quantity) {
    const item = this.items.find((i) => i.id === id && i.variant_id === variantId);
    if (!item) return;

    if (quantity <= 0) {
      this.removeItem(id, variantId);
      return;
    }

    if (item.max_stock && quantity > item.max_stock) {
      showToast(`Only ${item.max_stock} available`, 'warning');
      item.quantity = item.max_stock;
    } else {
      item.quantity = quantity;
    }

    this._save();
  }

  /**
   * Remove an item from the cart.
   */
  removeItem(id, variantId = null) {
    this.items = this.items.filter(
      (item) => !(item.id === id && item.variant_id === variantId)
    );
    this._save();
  }

  /**
   * Clear the entire cart.
   */
  clear() {
    this.items = [];
    this.discountCode = null;
    this.discountData = null;
    this._save();
  }

  /**
   * Apply a discount code.
   * @param {object} discount - { code, type, value }
   */
  applyDiscount(discount) {
    this.discountCode = discount.code;
    this.discountData = discount;
    this._save();
    showToast(`Discount "${discount.code}" applied!`, 'success');
  }

  /**
   * Remove discount.
   */
  removeDiscount() {
    this.discountCode = null;
    this.discountData = null;
    this._save();
  }

  /**
   * Get total number of items.
   */
  getItemCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Get subtotal (before tax and discount).
   */
  getSubtotal() {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  /**
   * Get discount amount.
   */
  getDiscountAmount() {
    if (!this.discountData) return 0;
    const subtotal = this.getSubtotal();
    if (this.discountData.type === 'percentage') {
      return Math.round(subtotal * (this.discountData.value / 100) * 100) / 100;
    }
    return Math.min(this.discountData.value, subtotal);
  }

  /**
   * Get tax amount.
   */
  getTax() {
    const afterDiscount = this.getSubtotal() - this.getDiscountAmount();
    return Math.round(afterDiscount * Config.TAX_RATE * 100) / 100;
  }

  /**
   * Get grand total.
   */
  getTotal() {
    const subtotal = this.getSubtotal();
    const discount = this.getDiscountAmount();
    const tax = this.getTax();
    return Math.round((subtotal - discount + tax) * 100) / 100;
  }

  /**
   * Subscribe to cart changes.
   * @param {Function} callback
   * @returns {Function} unsubscribe
   */
  onChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  /**
   * Notify all listeners.
   */
  _notify() {
    this.listeners.forEach((cb) => cb(this));
  }
}

// Export separate instances for storefront and POS
export const cart = new CartStore();

// POS has its own cart that doesn't persist
class POSCart extends CartStore {
  constructor() {
    super();
    this.items = []; // Don't load from localStorage
    this.customerName = '';
    this.customerPhone = '';
  }

  _load() {
    // POS cart starts empty each session
    this.items = [];
  }

  _save() {
    // Don't persist POS cart to localStorage
    this._notify();
  }

  setCustomer(name, phone) {
    this.customerName = name;
    this.customerPhone = phone;
  }

  clearCustomer() {
    this.customerName = '';
    this.customerPhone = '';
  }
}

export const posCart = new POSCart();

export default { cart, posCart };
