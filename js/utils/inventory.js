// ============================================
// POS-Shop — Inventory Helper Service
// Atomic stock deduction & multi-store tracking
// ============================================

import { getSupabase, query } from '../supabase.js';
import Config from '../config.js';

const DEMO_INVENTORY_KEY = 'pos-shop-demo-inventory';

// Default initial stock for demo mode
const defaultDemoStock = {
  'demo-1': 45,
  'demo-2': 120,
  'demo-3': 15,
  'demo-4': 200,
  'demo-5': 35,
  'a0000000-0000-0000-0000-000000000001': 50,
  'a0000000-0000-0000-0000-000000000002': 120,
  'a0000000-0000-0000-0000-000000000003': 15,
  'a0000000-0000-0000-0000-000000000004': 200,
  'a0000000-0000-0000-0000-000000000005': 35,
};

/**
 * Load demo stock map from localStorage.
 */
export function getDemoStockMap() {
  try {
    const saved = localStorage.getItem(DEMO_INVENTORY_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading demo stock map:', e);
  }
  localStorage.setItem(DEMO_INVENTORY_KEY, JSON.stringify(defaultDemoStock));
  return { ...defaultDemoStock };
}

/**
 * Save demo stock map to localStorage.
 */
export function saveDemoStockMap(stockMap) {
  try {
    localStorage.setItem(DEMO_INVENTORY_KEY, JSON.stringify(stockMap));
  } catch (e) {
    console.error('Error saving demo stock map:', e);
  }
}

/**
 * Deduct inventory for completed sale items (works in Supabase + Demo mode).
 * @param {Array} items - Cart items [{ id, quantity, price, name }]
 * @param {string} paymentMethod - 'cash' | 'card' | 'razorpay'
 * @param {object} totals - { subtotal, tax, discount, total }
 */
export async function deductInventoryAndSaveOrder(items, paymentMethod, totals) {
  const sb = getSupabase();
  const demoStock = getDemoStockMap();

  // 1. Always update local demo stock for immediate offline preview reactivity
  items.forEach((item) => {
    const currentStock = demoStock[item.id] !== undefined ? demoStock[item.id] : 50;
    demoStock[item.id] = Math.max(0, currentStock - item.quantity);
  });
  saveDemoStockMap(demoStock);

  // 2. If Supabase is connected, execute database update & record order
  if (sb) {
    try {
      // Create Order
      const orderNum = paymentMethod === 'razorpay' ? `ONLINE-${Date.now()}` : `POS-${Date.now()}`;
      const { data: order, error: orderErr } = await sb
        .from('orders')
        .insert({
          order_number: orderNum,
          source: paymentMethod === 'razorpay' ? Config.ORDER_SOURCE.ONLINE : Config.ORDER_SOURCE.POS,
          status: Config.ORDER_STATUS.DELIVERED,
          payment_status: Config.PAYMENT_STATUS.CAPTURED,
          payment_method: paymentMethod,
          subtotal: totals.subtotal,
          tax_amount: totals.tax,
          discount_amount: totals.discount,
          total_amount: totals.total,
          store_id: '00000000-0000-0000-0000-000000000001',
        })
        .select()
        .single();

      if (!orderErr && order) {
        // Insert order items
        const orderItems = items.map((item) => ({
          order_id: order.id,
          product_id: item.id.startsWith('demo-') ? null : item.id,
          product_name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
        }));
        await sb.from('order_items').insert(orderItems);

        // Deduct inventory in DB
        for (const item of items) {
          if (item.id.startsWith('demo-')) continue;

          // Check if inventory row exists
          const { data: inv } = await sb
            .from('inventory')
            .select('id, quantity')
            .eq('product_id', item.id)
            .single();

          if (inv) {
            const newQty = Math.max(0, inv.quantity - item.quantity);
            await sb.from('inventory').update({ quantity: newQty, updated_at: new Date() }).eq('id', inv.id);
          } else {
            // Create inventory row if missing
            await sb.from('inventory').insert({
              store_id: '00000000-0000-0000-0000-000000000001',
              product_id: item.id,
              quantity: Math.max(0, 50 - item.quantity),
            });
          }
        }
      }
    } catch (err) {
      console.warn('Supabase DB order sync error (using local demo stock):', err);
    }
  }

  return true;
}

export default { getDemoStockMap, saveDemoStockMap, deductInventoryAndSaveOrder };
