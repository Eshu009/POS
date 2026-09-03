// ============================================
// POS-Shop — Product Detail View
// ============================================

import { getSupabase, query } from '../supabase.js';
import { cart } from '../store/cart.js';
import { formatCurrency } from '../utils/format.js';
import { escapeHtml, delegate } from '../utils/dom.js';
import Config from '../config.js';

const icons = {
  minus: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg>`,
  plus: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>`,
  cart: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>`,
  chevronRight: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>`,
  star: '★',
  starEmpty: '☆',
};

export async function renderProductDetail(params, queryParams, container) {
  const productId = params.id;

  container.innerHTML = `
    <div class="product-detail container">
      <div class="product-detail-grid">
        <div class="product-gallery">
          <div class="product-gallery-main skeleton" style="aspect-ratio:1"></div>
        </div>
        <div class="product-info-section">
          <div class="skeleton" style="height:16px;width:200px;margin-bottom:16px"></div>
          <div class="skeleton" style="height:32px;width:80%;margin-bottom:16px"></div>
          <div class="skeleton" style="height:40px;width:150px;margin-bottom:24px"></div>
          <div class="skeleton" style="height:80px;width:100%"></div>
        </div>
      </div>
    </div>
  `;

  // Try loading from Supabase
  const product = await fetchProduct(productId);
  if (product) {
    renderDetail(container, product);
  } else {
    renderDemoDetail(container, productId);
  }
}

async function fetchProduct(productId) {
  const sb = getSupabase();
  if (!sb) return null;

  const { data } = await query(
    sb.from('products')
      .select(`
        *, 
        categories(name, slug),
        product_variants(id, name, sku, price, attributes),
        inventory(quantity, product_variant_id)
      `)
      .eq('id', productId)
      .single()
  );

  return data;
}

function renderDetail(container, product) {
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  const mainImage = product.images?.[0] || '';
  const stock = product.inventory?.[0]?.quantity ?? 99;
  const stockStatus = stock === 0 ? 'out-of-stock' : stock <= Config.LOW_STOCK_THRESHOLD ? 'low-stock' : 'in-stock';
  const stockText = stock === 0 ? 'Out of Stock' : stock <= Config.LOW_STOCK_THRESHOLD ? `Only ${stock} left!` : 'In Stock';

  const placeholderImg = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;
    background:linear-gradient(135deg, var(--color-bg-tertiary), var(--color-bg-secondary));
    font-size:6rem;opacity:0.3">🛍️</div>`;

  container.innerHTML = `
    <div class="product-detail container">
      <div class="product-detail-grid">
        <!-- Image Gallery -->
        <div class="product-gallery">
          <div class="product-gallery-main">
            ${mainImage ? `<img src="${escapeHtml(mainImage)}" alt="${escapeHtml(product.name)}" id="main-product-image">` : placeholderImg}
          </div>
          ${product.images?.length > 1 ? `
            <div class="product-gallery-thumbs">
              ${product.images.map((img, i) => `
                <div class="product-thumb ${i === 0 ? 'active' : ''}" data-image="${escapeHtml(img)}">
                  <img src="${escapeHtml(img)}" alt="Thumbnail ${i + 1}">
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <!-- Product Info -->
        <div class="product-info-section">
          <div class="product-breadcrumb">
            <a href="#/">Home</a>
            ${icons.chevronRight}
            ${product.categories ? `<a href="#/?cat=${escapeHtml(product.categories.slug)}">${escapeHtml(product.categories.name)}</a> ${icons.chevronRight}` : ''}
            <span>${escapeHtml(product.name)}</span>
          </div>

          <h1 class="product-title">${escapeHtml(product.name)}</h1>

          <div class="product-rating">
            <span class="stars" style="color:var(--color-accent-400)">${icons.star.repeat(4)}${icons.starEmpty}</span>
            <span>4.0 (24 reviews)</span>
          </div>

          <div class="product-price-section">
            <span class="price">${formatCurrency(product.price)}</span>
            ${hasDiscount ? `
              <span class="original-price">${formatCurrency(product.compare_at_price)}</span>
              <span class="discount-pct">-${discountPct}% OFF</span>
            ` : ''}
          </div>

          <div class="stock-indicator">
            <span class="stock-dot ${stockStatus}"></span>
            <span>${stockText}</span>
          </div>

          ${product.description ? `
            <div class="product-description">
              <p>${escapeHtml(product.description)}</p>
            </div>
          ` : ''}

          ${product.product_variants?.length > 0 ? renderVariants(product.product_variants) : ''}

          <div class="flex items-center gap-4 mt-6">
            <div class="quantity-selector" id="qty-selector">
              <button class="quantity-btn" data-action="decrease">${icons.minus}</button>
              <span class="quantity-value" id="qty-value">1</span>
              <button class="quantity-btn" data-action="increase">${icons.plus}</button>
            </div>

            <button class="btn btn-accent btn-lg flex-1" id="add-to-cart-btn" 
              ${stock === 0 ? 'disabled' : ''}
              data-product-id="${product.id}"
              data-product-name="${escapeHtml(product.name)}"
              data-product-price="${product.price}"
              data-product-image="${escapeHtml(mainImage)}"
              data-max-stock="${stock}">
              ${icons.cart}
              ${stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>

          ${product.sku ? `<p class="text-sm text-muted mt-4">SKU: <span class="font-mono">${escapeHtml(product.sku)}</span></p>` : ''}
        </div>
      </div>
    </div>
  `;

  setupDetailEvents(container, product);
}

function renderVariants(variants) {
  // Group variants by attribute type
  return `
    <div class="product-variants">
      <div class="variant-group">
        <span class="variant-label">Variant</span>
        <div class="variant-options" id="variant-options">
          ${variants.map((v, i) => `
            <button class="variant-option ${i === 0 ? 'active' : ''}" 
              data-variant-id="${v.id}" 
              data-variant-price="${v.price || ''}"
              data-variant-name="${escapeHtml(v.name)}">
              ${escapeHtml(v.name)}
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderDemoDetail(container, productId) {
  const demoProducts = {
    'demo-1': { id: 'demo-1', name: 'Wireless Bluetooth Earbuds', price: 2499, compare_at_price: 3999, description: 'Experience crystal-clear audio with our premium wireless earbuds. Featuring active noise cancellation, 30-hour battery life, and ergonomic fit for all-day comfort.', categories: { name: 'Electronics', slug: 'electronics' }, images: [], product_variants: [], inventory: [{ quantity: 45 }] },
    'demo-2': { id: 'demo-2', name: 'Premium Cotton T-Shirt', price: 799, compare_at_price: 1299, description: '100% organic cotton t-shirt with a relaxed fit. Pre-shrunk fabric, reinforced stitching, and available in multiple sizes.', categories: { name: 'Clothing', slug: 'clothing' }, images: [], product_variants: [{ id: 'v1', name: 'S', price: null }, { id: 'v2', name: 'M', price: null }, { id: 'v3', name: 'L', price: null }, { id: 'v4', name: 'XL', price: null }], inventory: [{ quantity: 120 }] },
    'demo-3': { id: 'demo-3', name: 'Smart Watch Pro', price: 4999, compare_at_price: 7999, description: 'Advanced fitness tracking, heart rate monitoring, GPS, and 7-day battery life. Water-resistant up to 50m.', categories: { name: 'Electronics', slug: 'electronics' }, images: [], product_variants: [], inventory: [{ quantity: 8 }] },
  };

  const product = demoProducts[productId] || {
    id: productId, name: 'Product', price: 999, compare_at_price: null,
    description: 'A premium product.', categories: { name: 'General', slug: 'general' },
    images: [], product_variants: [], inventory: [{ quantity: 50 }],
  };

  renderDetail(container, product);
}

function setupDetailEvents(container, product) {
  let quantity = 1;
  const maxStock = product.inventory?.[0]?.quantity ?? 99;
  let selectedVariant = product.product_variants?.[0] || null;

  // Quantity buttons
  delegate(container, 'click', '.quantity-btn', (e, btn) => {
    const action = btn.dataset.action;
    if (action === 'increase' && quantity < maxStock) {
      quantity++;
    } else if (action === 'decrease' && quantity > 1) {
      quantity--;
    }
    const qtyEl = document.getElementById('qty-value');
    if (qtyEl) qtyEl.textContent = quantity;
  });

  // Variant selection
  delegate(container, 'click', '.variant-option', (e, option) => {
    container.querySelectorAll('.variant-option').forEach((o) => o.classList.remove('active'));
    option.classList.add('active');
    selectedVariant = {
      id: option.dataset.variantId,
      name: option.dataset.variantName,
      price: option.dataset.variantPrice ? parseFloat(option.dataset.variantPrice) : null,
    };
  });

  // Add to cart
  const addBtn = document.getElementById('add-to-cart-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const price = selectedVariant?.price || product.price;
      cart.addItem({
        id: product.id,
        name: product.name,
        price,
        image: product.images?.[0] || null,
        variant_id: selectedVariant?.id || null,
        variant_name: selectedVariant?.name || null,
        max_stock: maxStock,
      }, quantity);
    });
  }

  // Thumbnail clicks
  delegate(container, 'click', '.product-thumb', (e, thumb) => {
    container.querySelectorAll('.product-thumb').forEach((t) => t.classList.remove('active'));
    thumb.classList.add('active');
    const mainImg = document.getElementById('main-product-image');
    if (mainImg) mainImg.src = thumb.dataset.image;
  });
}

export default { renderProductDetail };
