// ============================================
// POS-Shop — Storefront View (Home + Product Listing)
// ============================================

import { getSupabase, query } from '../supabase.js';
import { cart } from '../store/cart.js';
import { formatCurrency } from '../utils/format.js';
import { delegate, debounce, skeletonLoader, escapeHtml } from '../utils/dom.js';
import appState from '../store/state.js';
import Config from '../config.js';

// SVG Icons
const icons = {
  cart: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>`,
  eye: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  search: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>`,
  sparkle: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z"/></svg>`,
};

/**
 * Render the storefront home page.
 */
export async function renderStorefront(params, queryParams, container) {
  const searchQuery = queryParams.q || '';
  const categoryFilter = queryParams.cat || '';

  container.innerHTML = `
    <!-- Hero Section -->
    <section class="hero" id="storefront-hero">
      <div class="container">
        <h1 class="hero-title">${escapeHtml(Config.STORE_NAME)}</h1>
        <p class="hero-subtitle">${escapeHtml(Config.STORE_TAGLINE)}. Discover premium products at unbeatable prices.</p>
        <div class="hero-actions">
          <a href="#/login" class="btn btn-primary btn-lg" id="hero-shop-btn">
            ${icons.sparkle} Shop Now
          </a>
          <div class="search-box" style="width:340px">
            <span class="search-icon">${icons.search}</span>
            <input type="text" class="form-input" id="storefront-search" 
              placeholder="Search products..." value="${escapeHtml(searchQuery)}" 
              autocomplete="off">
          </div>
        </div>
      </div>
    </section>

    <!-- Categories -->
    <section class="container">
      <div class="category-bar" id="category-bar">
        <button class="category-chip ${!categoryFilter ? 'active' : ''}" data-category="">All</button>
        <!-- Filled dynamically -->
      </div>
    </section>

    <!-- Products -->
    <section class="products-section container" id="products-section">
      <div class="products-header">
        <h2 id="products-title">All Products</h2>
        <span class="text-sm text-muted" id="products-count"></span>
      </div>
      <div class="products-grid" id="products-grid">
        ${skeletonLoader(8, 'card')}
      </div>
    </section>
  `;

  // Load categories
  await loadCategories(categoryFilter);

  // Load products
  await loadProducts(searchQuery, categoryFilter);

  // Event handlers
  setupStorefrontEvents(container);
}

/**
 * Load categories into the filter bar.
 */
async function loadCategories(activeCategory) {
  const sb = getSupabase();
  if (!sb) return;

  const { data: categories } = await query(
    sb.from('categories').select('id, name, slug').order('name')
  );

  if (!categories) return;

  appState.set('categories', categories);

  const bar = document.getElementById('category-bar');
  if (!bar) return;

  const chips = categories.map((cat) => `
    <button class="category-chip ${activeCategory === cat.slug ? 'active' : ''}" 
      data-category="${escapeHtml(cat.slug)}">
      ${escapeHtml(cat.name)}
    </button>
  `).join('');

  bar.innerHTML = `
    <button class="category-chip ${!activeCategory ? 'active' : ''}" data-category="">All</button>
    ${chips}
  `;
}

/**
 * Load and render products.
 */
async function loadProducts(search = '', category = '') {
  const sb = getSupabase();
  if (!sb) {
    renderDemoProducts();
    return;
  }

  let q = sb
    .from('products')
    .select(`
      id, name, slug, price, compare_at_price, images, 
      categories(name, slug),
      inventory(quantity)
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(Config.PRODUCTS_PER_PAGE);

  if (search) {
    q = q.ilike('name', `%${search}%`);
  }

  if (category) {
    q = q.eq('categories.slug', category);
  }

  const { data: products, error } = await query(q);

  if (error || !products) {
    renderDemoProducts();
    return;
  }

  renderProductGrid(products);
}

/**
 * Render product grid with actual data.
 */
function renderProductGrid(products) {
  const grid = document.getElementById('products-grid');
  const count = document.getElementById('products-count');
  const title = document.getElementById('products-title');

  if (!grid) return;

  if (count) count.textContent = `${products.length} products`;

  if (products.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1">
        <div class="empty-state-icon">${icons.search}</div>
        <h3 class="empty-state-title">No products found</h3>
        <p class="empty-state-desc">Try adjusting your search or category filter.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = products.map((product) => renderProductCard(product)).join('');
}

/**
 * Render a single product card.
 */
function renderProductCard(product) {
  const image = product.images?.[0] || '';
  const category = product.categories?.name || '';
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;
  const stock = product.inventory?.[0]?.quantity ?? 0;
  const stockClass = stock === 0 ? 'out' : stock <= Config.LOW_STOCK_THRESHOLD ? 'low' : '';
  const stockText = stock === 0 ? 'Out of stock' : stock <= Config.LOW_STOCK_THRESHOLD ? `Only ${stock} left` : 'In stock';

  const imagePlaceholder = `
    <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;
      background:linear-gradient(135deg, var(--color-bg-tertiary), var(--color-bg-secondary));
      font-size:var(--text-3xl);opacity:0.3">
      🛍️
    </div>
  `;

  return `
    <div class="product-card" data-product-id="${product.id}" data-slug="${escapeHtml(product.slug || '')}">
      <div class="product-card-image">
        ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" loading="lazy">` : imagePlaceholder}
        ${hasDiscount ? `<span class="product-card-badge badge badge-success">-${discountPct}%</span>` : ''}
        <div class="product-card-actions">
          <button class="product-card-action-btn" data-action="quick-view" title="Quick view">${icons.eye}</button>
          <button class="product-card-action-btn" data-action="add-to-cart" title="Add to cart">${icons.cart}</button>
        </div>
      </div>
      <div class="product-card-info">
        ${category ? `<span class="product-card-category">${escapeHtml(category)}</span>` : ''}
        <h3 class="product-card-name">${escapeHtml(product.name)}</h3>
        <div class="product-card-price">
          <span class="current">${formatCurrency(product.price)}</span>
          ${hasDiscount ? `<span class="original">${formatCurrency(product.compare_at_price)}</span>` : ''}
        </div>
        <span class="product-card-stock ${stockClass}">${stockText}</span>
      </div>
    </div>
  `;
}

/**
 * Render demo products when Supabase is not configured.
 */
function renderDemoProducts() {
  const demoProducts = [
    { id: 'demo-1', name: 'Wireless Bluetooth Earbuds', slug: 'wireless-earbuds', price: 2499, compare_at_price: 3999, categories: { name: 'Electronics' }, inventory: [{ quantity: 45 }], images: [] },
    { id: 'demo-2', name: 'Premium Cotton T-Shirt', slug: 'premium-tshirt', price: 799, compare_at_price: 1299, categories: { name: 'Clothing' }, inventory: [{ quantity: 120 }], images: [] },
    { id: 'demo-3', name: 'Smart Watch Pro', slug: 'smart-watch-pro', price: 4999, compare_at_price: 7999, categories: { name: 'Electronics' }, inventory: [{ quantity: 8 }], images: [] },
    { id: 'demo-4', name: 'Organic Green Tea (100g)', slug: 'organic-green-tea', price: 349, compare_at_price: null, categories: { name: 'Groceries' }, inventory: [{ quantity: 200 }], images: [] },
    { id: 'demo-5', name: 'Leather Wallet', slug: 'leather-wallet', price: 1299, compare_at_price: 1999, categories: { name: 'Accessories' }, inventory: [{ quantity: 35 }], images: [] },
    { id: 'demo-6', name: 'Running Shoes — Air Max', slug: 'running-shoes', price: 3499, compare_at_price: 5499, categories: { name: 'Footwear' }, inventory: [{ quantity: 0 }], images: [] },
    { id: 'demo-7', name: 'USB-C Fast Charger 65W', slug: 'usbc-charger', price: 1199, compare_at_price: null, categories: { name: 'Electronics' }, inventory: [{ quantity: 78 }], images: [] },
    { id: 'demo-8', name: 'Stainless Steel Water Bottle', slug: 'steel-bottle', price: 599, compare_at_price: 899, categories: { name: 'Accessories' }, inventory: [{ quantity: 150 }], images: [] },
  ];

  renderProductGrid(demoProducts);

  // Also populate demo categories
  const bar = document.getElementById('category-bar');
  if (bar) {
    bar.innerHTML = `
      <button class="category-chip active" data-category="">All</button>
      <button class="category-chip" data-category="electronics">Electronics</button>
      <button class="category-chip" data-category="clothing">Clothing</button>
      <button class="category-chip" data-category="accessories">Accessories</button>
      <button class="category-chip" data-category="footwear">Footwear</button>
      <button class="category-chip" data-category="groceries">Groceries</button>
    `;
  }
}

/**
 * Set up event listeners for storefront.
 */
function setupStorefrontEvents(container) {
  // Category filter clicks
  delegate(container, 'click', '.category-chip', (e, chip) => {
    const cat = chip.dataset.category;
    const searchInput = document.getElementById('storefront-search');
    const search = searchInput?.value || '';

    // Update active chip
    container.querySelectorAll('.category-chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');

    // Update URL and reload products
    const params = new URLSearchParams();
    if (cat) params.set('cat', cat);
    if (search) params.set('q', search);
    const qs = params.toString();
    window.location.hash = `#/${qs ? '?' + qs : ''}`;

    loadProducts(search, cat);
  });

  // Search input
  const searchInput = document.getElementById('storefront-search');
  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      const search = e.target.value;
      const activeChip = container.querySelector('.category-chip.active');
      const cat = activeChip?.dataset.category || '';
      loadProducts(search, cat);
    }, 400));
  }

  // Product card clicks
  delegate(container, 'click', '.product-card', (e, card) => {
    const actionBtn = e.target.closest('[data-action]');
    const productId = card.dataset.productId;
    const slug = card.dataset.slug;

    if (actionBtn) {
      e.stopPropagation();
      const action = actionBtn.dataset.action;

      if (action === 'add-to-cart') {
        const name = card.querySelector('.product-card-name')?.textContent || '';
        const priceText = card.querySelector('.product-card-price .current')?.textContent || '0';
        const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));

        cart.addItem({
          id: productId,
          name,
          price,
          image: card.querySelector('.product-card-image img')?.src || null,
        });
        return;
      }
    }

    // Navigate to product detail
    window.location.hash = `#/product/${productId}`;
  });
}

export default { renderStorefront };
