-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all public tables
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Check if current user is staff or admin
CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('staff', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. STORES
CREATE POLICY "Public stores viewable" ON public.stores FOR SELECT USING (is_active = true OR public.is_staff_or_admin());
CREATE POLICY "Admin stores write" ON public.stores FOR ALL USING (public.is_admin());

-- 2. PROFILES
CREATE POLICY "Users read own profile or staff" ON public.profiles FOR SELECT USING (id = auth.uid() OR public.is_staff_or_admin());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admin profile write" ON public.profiles FOR ALL USING (public.is_admin());

-- 3. CATEGORIES & PRODUCTS & VARIANTS
CREATE POLICY "Public products viewable" ON public.products FOR SELECT USING (is_published = true OR public.is_staff_or_admin());
CREATE POLICY "Staff product write" ON public.products FOR ALL USING (public.is_staff_or_admin());

CREATE POLICY "Public categories viewable" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Staff category write" ON public.categories FOR ALL USING (public.is_staff_or_admin());

CREATE POLICY "Public variants viewable" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Staff variant write" ON public.product_variants FOR ALL USING (public.is_staff_or_admin());

-- 4. INVENTORY
CREATE POLICY "Public inventory read" ON public.inventory FOR SELECT USING (true);
CREATE POLICY "Staff inventory write" ON public.inventory FOR ALL USING (public.is_staff_or_admin());

-- 5. DISCOUNT CODES
CREATE POLICY "Public active discounts read" ON public.discount_codes FOR SELECT USING (is_active = true OR public.is_staff_or_admin());
CREATE POLICY "Staff discount write" ON public.discount_codes FOR ALL USING (public.is_staff_or_admin());

-- 6. CUSTOMERS (POS)
CREATE POLICY "Staff customer access" ON public.customers FOR ALL USING (public.is_staff_or_admin());

-- 7. ORDERS & ORDER ITEMS
CREATE POLICY "Users view own orders or staff" ON public.orders FOR SELECT USING (user_id = auth.uid() OR public.is_staff_or_admin());
CREATE POLICY "Authenticated users create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR public.is_staff_or_admin());
CREATE POLICY "Staff order update" ON public.orders FOR UPDATE USING (public.is_staff_or_admin());

CREATE POLICY "Users view own order items or staff" ON public.order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR public.is_staff_or_admin()))
);
CREATE POLICY "Insert order items" ON public.order_items FOR INSERT WITH CHECK (true);

-- 8. PAYMENTS
CREATE POLICY "Staff payment view" ON public.payments FOR SELECT USING (public.is_staff_or_admin());
CREATE POLICY "System payment write" ON public.payments FOR INSERT WITH CHECK (true);
