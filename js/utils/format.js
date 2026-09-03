// ============================================
// POS-Shop — Formatting Utilities
// Currency, date, number formatting
// ============================================

import Config from '../config.js';

/**
 * Format a number as currency.
 * @param {number} amount
 * @param {string} currency
 * @returns {string}
 */
export function formatCurrency(amount, currency = Config.CURRENCY) {
  return new Intl.NumberFormat(Config.CURRENCY_LOCALE, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number with locale.
 * @param {number} num
 * @returns {string}
 */
export function formatNumber(num) {
  return new Intl.NumberFormat(Config.CURRENCY_LOCALE).format(num);
}

/**
 * Format a compact number (1.2K, 3.4M).
 * @param {number} num
 * @returns {string}
 */
export function formatCompact(num) {
  return new Intl.NumberFormat(Config.CURRENCY_LOCALE, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(num);
}

/**
 * Format a date.
 * @param {string|Date} date
 * @param {string} style - 'short', 'medium', 'long', 'relative'
 * @returns {string}
 */
export function formatDate(date, style = 'medium') {
  const d = new Date(date);

  if (style === 'relative') {
    return relativeTime(d);
  }

  const options = {
    short: { month: 'short', day: 'numeric' },
    medium: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
    time: { hour: '2-digit', minute: '2-digit' },
  };

  return new Intl.DateTimeFormat(Config.CURRENCY_LOCALE, options[style] || options.medium).format(d);
}

/**
 * Get relative time string (e.g., "2 hours ago").
 * @param {Date} date
 * @returns {string}
 */
function relativeTime(date) {
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date, 'short');
}

/**
 * Format a percentage.
 * @param {number} value
 * @param {number} decimals
 * @returns {string}
 */
export function formatPercent(value, decimals = 1) {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format order ID for display.
 * @param {string} uuid
 * @returns {string}
 */
export function formatOrderId(uuid) {
  if (!uuid) return '';
  return `#${uuid.slice(0, 8).toUpperCase()}`;
}

/**
 * Format a phone number (Indian format).
 * @param {string} phone
 * @returns {string}
 */
export function formatPhone(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
}

/**
 * Calculate tax amount.
 * @param {number} subtotal
 * @param {number} rate
 * @returns {number}
 */
export function calculateTax(subtotal, rate = Config.TAX_RATE) {
  return Math.round(subtotal * rate * 100) / 100;
}

/**
 * Calculate discount.
 * @param {number} subtotal
 * @param {object} discount - { type: 'percentage'|'fixed', value: number }
 * @returns {number}
 */
export function calculateDiscount(subtotal, discount) {
  if (!discount) return 0;
  if (discount.type === 'percentage') {
    return Math.round(subtotal * (discount.value / 100) * 100) / 100;
  }
  return Math.min(discount.value, subtotal);
}

/**
 * Truncate text with ellipsis.
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text || '';
  return text.slice(0, maxLength) + '…';
}

/**
 * Generate a unique ID.
 * @returns {string}
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export default {
  formatCurrency, formatNumber, formatCompact, formatDate, formatPercent,
  formatOrderId, formatPhone, calculateTax, calculateDiscount, truncate, generateId,
};
