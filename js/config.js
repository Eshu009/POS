// ============================================
// POS-Shop — Configuration
// Public keys only — secrets go in Supabase Edge Function env
// ============================================

const Config = {
  // Supabase — Live credentials
  SUPABASE_URL: 'https://wtffisrmlgasjoqrfivc.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0ZmZpc3JtbGdhc2pvcXJmaXZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MzI1NTEsImV4cCI6MjEwNDAwODU1MX0.ZVjr8h5xX_usD-076R5Fi-GWLnvzurxCzrDLznCZ86U',

  // Razorpay — Public key only (test mode key for development)
  RAZORPAY_KEY_ID: 'rzp_test_YOUR_KEY_ID',

  // Store settings
  STORE_NAME: 'MyShop',
  STORE_TAGLINE: 'Premium Shopping Experience',
  CURRENCY: 'INR',
  CURRENCY_SYMBOL: '₹',
  CURRENCY_LOCALE: 'en-IN',
  TAX_RATE: 0.18, // 18% GST
  LOW_STOCK_THRESHOLD: 10,

  // Pagination
  PRODUCTS_PER_PAGE: 20,
  ORDERS_PER_PAGE: 15,

  // Image upload
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  IMAGE_BUCKET: 'product-images',

  // User roles
  ROLES: {
    CUSTOMER: 'customer',
    STAFF: 'staff',
    ADMIN: 'admin',
  },

  // Order sources
  ORDER_SOURCE: {
    ONLINE: 'online',
    POS: 'pos',
  },

  // Payment methods
  PAYMENT_METHODS: {
    CASH: 'cash',
    CARD: 'card',
    RAZORPAY: 'razorpay',
    UPI: 'upi',
  },

  // Order statuses
  ORDER_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
  },

  // Payment statuses
  PAYMENT_STATUS: {
    PENDING: 'pending',
    CAPTURED: 'captured',
    FAILED: 'failed',
    REFUNDED: 'refunded',
  },
};

// Freeze to prevent accidental mutation
Object.freeze(Config);
Object.freeze(Config.ROLES);
Object.freeze(Config.ORDER_SOURCE);
Object.freeze(Config.PAYMENT_METHODS);
Object.freeze(Config.ORDER_STATUS);
Object.freeze(Config.PAYMENT_STATUS);

export default Config;
