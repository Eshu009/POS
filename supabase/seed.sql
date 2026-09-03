-- ============================================
-- POS-Shop Seed Data for Testing
-- ============================================

-- 1. Default Store
INSERT INTO public.stores (id, name, code, address, phone, email)
VALUES ('00000000-0000-0000-0000-000000000001', 'Main Flagship Store', 'MAIN01', '123 Tech Park, Bangalore', '+91 98765 43210', 'store@myshop.com')
ON CONFLICT (code) DO NOTHING;

-- 2. Categories
INSERT INTO public.categories (id, name, slug, description)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Electronics', 'electronics', 'Gadgets, audio, accessories'),
    ('22222222-2222-2222-2222-222222222222', 'Clothing', 'clothing', 'Apparel & fashion'),
    ('33333333-3333-3333-3333-333333333333', 'Groceries', 'groceries', 'Organic food & drinks'),
    ('44444444-4444-4444-4444-444444444444', 'Accessories', 'accessories', 'Bags, wallets & lifestyle')
ON CONFLICT (slug) DO NOTHING;

-- 3. Products
INSERT INTO public.products (id, name, slug, sku, barcode, description, price, compare_at_price, category_id, is_published)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', 'Wireless Bluetooth Earbuds', 'wireless-earbuds', 'EAR-001', '8901234567890', 'Active noise cancellation earbuds with 30hr playback.', 2499.00, 3999.00, '11111111-1111-1111-1111-111111111111', true),
    ('a0000000-0000-0000-0000-000000000002', 'Premium Cotton T-Shirt', 'premium-tshirt', 'TSH-002', '8901234567891', '100% organic cotton breathable t-shirt.', 799.00, 1299.00, '22222222-2222-2222-2222-222222222222', true),
    ('a0000000-0000-0000-0000-000000000003', 'Smart Watch Pro', 'smart-watch-pro', 'WTC-003', '8901234567892', 'Fitness tracking, heart rate, GPS smart watch.', 4999.00, 7999.00, '11111111-1111-1111-1111-111111111111', true),
    ('a0000000-0000-0000-0000-000000000004', 'Organic Green Tea (100g)', 'organic-green-tea', 'TEA-004', '8901234567893', 'Pure Himalayan organic green tea leaves.', 349.00, NULL, '33333333-3333-3333-3333-333333333333', true),
    ('a0000000-0000-0000-0000-000000000005', 'Genuine Leather Wallet', 'leather-wallet', 'WLT-005', '8901234567894', 'Handcrafted RFID blocking genuine leather wallet.', 1299.00, 1999.00, '44444444-4444-4444-4444-444444444444', true)
ON CONFLICT (slug) DO NOTHING;

-- 4. Initial Inventory
INSERT INTO public.inventory (store_id, product_id, quantity)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 50),
    ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 120),
    ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 15),
    ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 200),
    ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', 35)
ON CONFLICT DO NOTHING;

-- 5. Discount Codes
INSERT INTO public.discount_codes (code, discount_type, value, min_order_amount, is_active)
VALUES 
    ('WELCOME10', 'percentage', 10.00, 500.00, true),
    ('SAVE200', 'fixed', 200.00, 1500.00, true)
ON CONFLICT (code) DO NOTHING;
