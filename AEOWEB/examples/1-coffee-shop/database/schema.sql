-- Coffee Shop Database Schema
-- Extends base AEOWEB schema with coffee shop specific tables

-- Menu Categories
CREATE TABLE menu_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Menu Items (Products)
CREATE TABLE menu_items (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES menu_categories(id),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  price_small DECIMAL(10,2),
  price_medium DECIMAL(10,2),
  price_large DECIMAL(10,2),
  calories_small INTEGER,
  calories_medium INTEGER,
  calories_large INTEGER,
  is_available BOOLEAN DEFAULT true,
  is_seasonal BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  allergens TEXT[],  -- Array of allergens
  dietary_tags TEXT[], -- vegan, gluten-free, etc.
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Daily Specials
CREATE TABLE daily_specials (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  menu_item_id INTEGER REFERENCES menu_items(id),
  special_price DECIMAL(10,2),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(200),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  order_type VARCHAR(20) CHECK (order_type IN ('in-store', 'online', 'catering')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled')),
  subtotal DECIMAL(10,2),
  tax DECIMAL(10,2),
  total DECIMAL(10,2),
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Order Items
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id INTEGER REFERENCES menu_items(id),
  quantity INTEGER NOT NULL,
  size VARCHAR(20), -- small, medium, large
  customizations JSONB, -- milk type, shots, etc.
  item_price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Loyalty Program
CREATE TABLE loyalty_members (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(200) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  points_balance INTEGER DEFAULT 0,
  lifetime_points INTEGER DEFAULT 0,
  tier VARCHAR(20) DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold')),
  joined_date DATE DEFAULT CURRENT_DATE,
  last_visit DATE,
  total_spent DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Loyalty Transactions
CREATE TABLE loyalty_transactions (
  id SERIAL PRIMARY KEY,
  member_id INTEGER REFERENCES loyalty_members(id),
  order_id INTEGER REFERENCES orders(id),
  points_earned INTEGER,
  points_redeemed INTEGER,
  transaction_type VARCHAR(20) CHECK (transaction_type IN ('earn', 'redeem', 'bonus', 'expire')),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Catering Requests
CREATE TABLE catering_requests (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(200),
  contact_name VARCHAR(200) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  number_of_people INTEGER NOT NULL,
  event_type VARCHAR(100),
  service_type VARCHAR(50), -- delivery, on-site service
  delivery_address TEXT,
  menu_preferences TEXT,
  dietary_restrictions TEXT,
  budget_range VARCHAR(50),
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'quoted', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Store Locations (for multi-location support)
CREATE TABLE store_locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  street_address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(2) NOT NULL,
  zip_code VARCHAR(10) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  opening_hours JSONB, -- Store hours by day
  amenities TEXT[], -- WiFi, outdoor seating, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Customer Reviews
CREATE TABLE customer_reviews (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(200),
  email VARCHAR(255),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_title VARCHAR(200),
  review_text TEXT,
  visit_date DATE,
  order_id INTEGER REFERENCES orders(id),
  is_verified BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  response TEXT, -- Management response
  responded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Coffee Subscriptions
CREATE TABLE coffee_subscriptions (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(200) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  shipping_address TEXT NOT NULL,
  coffee_preference VARCHAR(100), -- blend type
  frequency VARCHAR(20) CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
  quantity INTEGER DEFAULT 1, -- pounds per shipment
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  next_shipment_date DATE,
  started_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_menu_items_available ON menu_items(is_available);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date ON orders(created_at);
CREATE INDEX idx_loyalty_email ON loyalty_members(email);
CREATE INDEX idx_catering_date ON catering_requests(event_date);
CREATE INDEX idx_reviews_approved ON customer_reviews(is_approved);

-- Triggers
CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Views
CREATE VIEW popular_items AS
SELECT
  mi.id,
  mi.name,
  mc.name as category,
  COUNT(oi.id) as times_ordered,
  SUM(oi.quantity) as total_quantity,
  AVG(oi.item_price) as avg_price
FROM menu_items mi
LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
LEFT JOIN menu_categories mc ON mi.category_id = mc.id
GROUP BY mi.id, mi.name, mc.name
ORDER BY times_ordered DESC;

CREATE VIEW daily_sales AS
SELECT
  DATE(created_at) as sale_date,
  COUNT(*) as total_orders,
  SUM(total) as total_revenue,
  AVG(total) as avg_order_value
FROM orders
WHERE status = 'completed'
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

COMMENT ON TABLE menu_items IS 'Coffee shop menu with sizes and pricing';
COMMENT ON TABLE loyalty_members IS 'Customer loyalty program members';
COMMENT ON TABLE catering_requests IS 'Corporate and event catering inquiries';
