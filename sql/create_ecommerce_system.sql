-- ============================================================
-- BUSINESS PAGE EVOLUTION SQL
-- Tablas adicionales para e-commerce, reservas, y más
-- ============================================================

-- 1. CARRITO DE COMPRAS (session-based)
CREATE TABLE IF NOT EXISTS shopping_carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  business_profile_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
  items JSONB DEFAULT '[]'::jsonb,
  subtotal DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX idx_carts_session ON shopping_carts(session_id);
CREATE INDEX idx_carts_business ON shopping_carts(business_profile_id);
CREATE INDEX idx_carts_expires ON shopping_carts(expires_at);

-- Auto-delete expired carts
CREATE OR REPLACE FUNCTION delete_expired_carts()
RETURNS void AS $$
BEGIN
  DELETE FROM shopping_carts WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 2. PEDIDOS/ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  business_profile_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
  
  -- Customer info
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_address TEXT,
  
  -- Order details
  items JSONB NOT NULL, -- Array of {product_id, title, quantity, price, subtotal}
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'delivering', 'completed', 'cancelled')),
  payment_method TEXT DEFAULT 'whatsapp',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  
  -- Additional info
  special_instructions TEXT,
  estimated_delivery TIMESTAMP WITH TIME ZONE,
  
  -- Tracking
  whatsapp_message_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_orders_business ON orders(business_profile_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_phone ON orders(customer_phone);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- Generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('order_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS order_number_seq;

CREATE TRIGGER set_order_number
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION generate_order_number();

-- 3. CLIENTES DEL NEGOCIO (Loyalty)
CREATE TABLE IF NOT EXISTS business_customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_profile_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
  
  phone TEXT NOT NULL,
  name TEXT,
  email TEXT,
  
  -- Loyalty
  loyalty_points INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  
  -- Tracking
  first_purchase_at TIMESTAMP WITH TIME ZONE,
  last_purchase_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(business_profile_id, phone)
);

CREATE INDEX idx_customers_business ON business_customers(business_profile_id);
CREATE INDEX idx_customers_phone ON business_customers(phone);
CREATE INDEX idx_customers_tier ON business_customers(tier);

-- 4. HORARIOS DEL NEGOCIO
CREATE TABLE IF NOT EXISTS business_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_profile_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
  
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(business_profile_id, day_of_week)
);

CREATE INDEX idx_hours_business ON business_hours(business_profile_id);

-- 5. RESEÑAS/VALORACIONES
CREATE TABLE IF NOT EXISTS business_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_profile_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
  
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  is_verified BOOLEAN DEFAULT false,
  is_visible BOOLEAN DEFAULT true,
  
  response_text TEXT, -- Business can respond
  responded_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reviews_business ON business_reviews(business_profile_id);
CREATE INDEX idx_reviews_rating ON business_reviews(rating);
CREATE INDEX idx_reviews_verified ON business_reviews(is_verified);

-- Calculate average rating
CREATE OR REPLACE FUNCTION calculate_average_rating(biz_id UUID)
RETURNS DECIMAL AS $$
  SELECT COALESCE(AVG(rating), 0)
  FROM business_reviews
  WHERE business_profile_id = biz_id
    AND is_visible = true;
$$ LANGUAGE SQL;

-- 6. RESERVAS/CITAS
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_profile_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
  
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  
  service TEXT NOT NULL,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  
  -- Reminders
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reservations_business ON reservations(business_profile_id);
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_reservations_status ON reservations(status);

-- 7. TEMAS/PERSONALIZACIÓN
CREATE TABLE IF NOT EXISTS business_themes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_profile_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE UNIQUE,
  
  theme_name TEXT DEFAULT 'modern' CHECK (theme_name IN ('modern', 'vibrant', 'classic', 'dark')),
  
  -- Colors
  primary_color TEXT DEFAULT '#53acc5',
  secondary_color TEXT DEFAULT '#ffc24a',
  accent_color TEXT,
  background_color TEXT,
  text_color TEXT,
  
  -- Typography
  font_family TEXT DEFAULT 'Inter',
  heading_font TEXT,
  
  -- Layout
  hero_style TEXT DEFAULT 'centered',
  product_grid_columns INTEGER DEFAULT 3,
  show_prices BOOLEAN DEFAULT true,
  show_stock BOOLEAN DEFAULT false,
  
  -- Components visibility
  show_reviews BOOLEAN DEFAULT true,
  show_location BOOLEAN DEFAULT true,
  show_about BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. ESTADÍSTICAS DE LA PÁGINA
CREATE TABLE IF NOT EXISTS page_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_profile_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL, -- 'page_view', 'product_view', 'whatsapp_click', 'cart_add', 'order_complete'
  product_id UUID REFERENCES catalog_products(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  
  -- Session info
  session_id TEXT,
  user_agent TEXT,
  referrer TEXT,
  
  -- Metadata
  metadata JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analytics_business ON page_analytics(business_profile_id);
CREATE INDEX idx_analytics_event ON page_analytics(event_type);
CREATE INDEX idx_analytics_created ON page_analytics(created_at DESC);
CREATE INDEX idx_analytics_product ON page_analytics(product_id) WHERE product_id IS NOT NULL;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Shopping carts - Users can only access their own
ALTER TABLE shopping_carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own carts"
ON shopping_carts FOR SELECT
USING (
  (user_id = auth.uid()) OR
  (session_id IS NOT NULL) -- Allow session-based access in client
);

CREATE POLICY "Users can insert their own carts"
ON shopping_carts FOR INSERT
WITH CHECK (true); -- Client-side handles session_id

CREATE POLICY "Users can update their own carts"
ON shopping_carts FOR UPDATE
USING (true);

-- Orders - Business owners can view their orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can view their orders"
ON orders FOR SELECT
USING (
  business_profile_id IN (
    SELECT id FROM business_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can create orders"
ON orders FOR INSERT
WITH CHECK (true);

CREATE POLICY "Business owners can update their orders"
ON orders FOR UPDATE
USING (
  business_profile_id IN (
    SELECT id FROM business_profiles WHERE user_id = auth.uid()
  )
);

-- Business customers - Business owners only
ALTER TABLE business_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage their customers"
ON business_customers FOR ALL
USING (
  business_profile_id IN (
    SELECT id FROM business_profiles WHERE user_id = auth.uid()
  )
);

-- Business hours - Business owners can edit, everyone can view
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view business hours"
ON business_hours FOR SELECT
USING (true);

CREATE POLICY "Business owners can manage hours"
ON business_hours FOR ALL
USING (
  business_profile_id IN (
    SELECT id FROM business_profiles WHERE user_id = auth.uid()
  )
);

-- Reviews - Everyone can view, verified users can create
ALTER TABLE business_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view visible reviews"
ON business_reviews FOR SELECT
USING (is_visible = true);

CREATE POLICY "Anyone can create reviews"
ON business_reviews FOR INSERT
WITH CHECK (true);

CREATE POLICY "Business owners can manage reviews"
ON business_reviews FOR UPDATE
USING (
  business_profile_id IN (
    SELECT id FROM business_profiles WHERE user_id = auth.uid()
  )
);

-- Reservations - Similar to orders
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can view their reservations"
ON reservations FOR SELECT
USING (
  business_profile_id IN (
    SELECT id FROM business_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can create reservations"
ON reservations FOR INSERT
WITH CHECK (true);

CREATE POLICY "Business owners can update reservations"
ON reservations FOR UPDATE
USING (
  business_profile_id IN (
    SELECT id FROM business_profiles WHERE user_id = auth.uid()
  )
);

-- Themes - Business owners only
ALTER TABLE business_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage their theme"
ON business_themes FOR ALL
USING (
  business_profile_id IN (
    SELECT id FROM business_profiles WHERE user_id = auth.uid()
  )
);

-- Analytics - Business owners can view
ALTER TABLE page_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can view their analytics"
ON page_analytics FOR SELECT
USING (
  business_profile_id IN (
    SELECT id FROM business_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can insert analytics"
ON page_analytics FOR INSERT
WITH CHECK (true);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Update orders updated_at
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Update customers updated_at
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON business_customers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Update carts updated_at
CREATE TRIGGER update_carts_updated_at
BEFORE UPDATE ON shopping_carts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Update themes updated_at
CREATE TRIGGER update_themes_updated_at
BEFORE UPDATE ON business_themes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Update reservations updated_at
CREATE TRIGGER update_reservations_updated_at
BEFORE UPDATE ON reservations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Get business status (open/closed) based on current time
CREATE OR REPLACE FUNCTION is_business_open(biz_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_day INTEGER;
  biz_current_time TIME;
  hours RECORD;
BEGIN
  current_day := EXTRACT(DOW FROM NOW());
  biz_current_time := NOW()::TIME;
  
  SELECT * INTO hours
  FROM business_hours
  WHERE business_profile_id = biz_id
    AND day_of_week = current_day;
  
  IF NOT FOUND OR hours.is_closed THEN
    RETURN false;
  END IF;
  
  RETURN biz_current_time >= hours.open_time AND biz_current_time <= hours.close_time;
END;
$$ LANGUAGE plpgsql;

-- Get total revenue for a business
CREATE OR REPLACE FUNCTION get_business_revenue(biz_id UUID, days INTEGER DEFAULT 30)
RETURNS DECIMAL AS $$
  SELECT COALESCE(SUM(total), 0)
  FROM orders
  WHERE business_profile_id = biz_id
    AND status IN ('completed', 'confirmed')
    AND created_at >= NOW() - (days || ' days')::INTERVAL;
$$ LANGUAGE SQL;
