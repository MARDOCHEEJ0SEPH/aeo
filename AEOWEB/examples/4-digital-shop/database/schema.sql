-- DesignKit Pro Digital Shop Database Schema
-- Digital product marketplace with license management and instant delivery

-- Customers
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  company VARCHAR(200),
  phone VARCHAR(20),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  affiliate_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- Product Categories
CREATE TABLE product_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  parent_category_id INTEGER REFERENCES product_categories(id),
  icon VARCHAR(100),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products (Digital Products)
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES product_categories(id),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  tagline VARCHAR(255),
  description TEXT,
  features JSONB,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  product_type VARCHAR(50) DEFAULT 'digital',
  tech_stack JSONB,
  demo_url TEXT,
  thumbnail_url TEXT,
  cover_image_url TEXT,
  video_url TEXT,
  total_downloads INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  requires_license BOOLEAN DEFAULT true,
  max_activations INTEGER DEFAULT 5,
  meta_title VARCHAR(200),
  meta_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product Versions
CREATE TABLE product_versions (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  version_number VARCHAR(20) NOT NULL,
  release_notes TEXT,
  is_major_update BOOLEAN DEFAULT false,
  file_size_mb DECIMAL(10,2),
  release_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_current BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product Files (downloadable files per version)
CREATE TABLE product_files (
  id SERIAL PRIMARY KEY,
  version_id INTEGER REFERENCES product_versions(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50),
  file_path TEXT NOT NULL,
  file_size_bytes BIGINT,
  framework VARCHAR(50),
  download_url TEXT,
  checksum VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Licenses
CREATE TABLE licenses (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  product_id INTEGER REFERENCES products(id),
  order_id INTEGER,
  license_key VARCHAR(255) UNIQUE NOT NULL,
  license_type VARCHAR(50) DEFAULT 'single',
  status VARCHAR(50) DEFAULT 'active',
  max_activations INTEGER DEFAULT 5,
  activation_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP,
  last_validated TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- License Activations
CREATE TABLE license_activations (
  id SERIAL PRIMARY KEY,
  license_id INTEGER REFERENCES licenses(id) ON DELETE CASCADE,
  activation_token VARCHAR(255) UNIQUE NOT NULL,
  domain VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  activation_data JSONB,
  activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  deactivated_at TIMESTAMP
);

-- Orders
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  order_status VARCHAR(50) DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_transaction_id VARCHAR(255),
  affiliate_id INTEGER,
  affiliate_commission DECIMAL(10,2) DEFAULT 0,
  customer_notes TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- Order Items
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  product_name VARCHAR(200),
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  license_key VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Downloads (tracking)
CREATE TABLE downloads (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  product_id INTEGER REFERENCES products(id),
  version_id INTEGER REFERENCES product_versions(id),
  file_id INTEGER REFERENCES product_files(id),
  license_id INTEGER REFERENCES licenses(id),
  ip_address VARCHAR(45),
  user_agent TEXT,
  downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product Reviews
CREATE TABLE product_reviews (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES customers(id),
  order_id INTEGER REFERENCES orders(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_title VARCHAR(200),
  review_text TEXT,
  pros TEXT,
  cons TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product Documentation
CREATE TABLE product_documentation (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  content TEXT,
  category VARCHAR(100),
  display_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Affiliates
CREATE TABLE affiliates (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  affiliate_code VARCHAR(50) UNIQUE NOT NULL,
  commission_rate DECIMAL(5,2) DEFAULT 20.00,
  status VARCHAR(50) DEFAULT 'active',
  total_referrals INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  payout_email VARCHAR(255),
  payout_method VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Affiliate Commissions
CREATE TABLE affiliate_commissions (
  id SERIAL PRIMARY KEY,
  affiliate_id INTEGER REFERENCES affiliates(id),
  order_id INTEGER REFERENCES orders(id),
  commission_amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Support Tickets
CREATE TABLE support_tickets (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  product_id INTEGER REFERENCES products(id),
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  subject VARCHAR(255) NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal',
  status VARCHAR(50) DEFAULT 'open',
  assigned_to VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP
);

-- Support Ticket Messages
CREATE TABLE support_ticket_messages (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL,
  sender_id INTEGER,
  message TEXT NOT NULL,
  attachments JSONB,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product Updates Log
CREATE TABLE product_updates_log (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  version_id INTEGER REFERENCES product_versions(id),
  update_type VARCHAR(50),
  title VARCHAR(200),
  description TEXT,
  published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment Transactions
CREATE TABLE payment_transactions (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  customer_id INTEGER REFERENCES customers(id),
  transaction_id VARCHAR(255) UNIQUE NOT NULL,
  payment_gateway VARCHAR(50),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50),
  payment_method VARCHAR(50),
  card_last4 VARCHAR(4),
  transaction_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_licenses_customer ON licenses(customer_id);
CREATE INDEX idx_licenses_product ON licenses(product_id);
CREATE INDEX idx_licenses_key ON licenses(license_key);
CREATE INDEX idx_licenses_status ON licenses(status);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_downloads_customer ON downloads(customer_id);
CREATE INDEX idx_downloads_product ON downloads(product_id);
CREATE INDEX idx_reviews_product ON product_reviews(product_id);
CREATE INDEX idx_reviews_approved ON product_reviews(is_approved);
CREATE INDEX idx_affiliates_code ON affiliates(affiliate_code);

-- Views
CREATE VIEW customer_licenses AS
SELECT
  l.id,
  l.license_key,
  l.license_type,
  l.status,
  l.activation_count,
  l.max_activations,
  l.valid_until,
  p.name as product_name,
  p.slug as product_slug,
  pv.version_number as current_version,
  c.email as customer_email
FROM licenses l
JOIN products p ON l.product_id = p.id
JOIN customers c ON l.customer_id = c.id
LEFT JOIN product_versions pv ON p.id = pv.product_id AND pv.is_current = true
WHERE l.status = 'active';

CREATE VIEW product_stats AS
SELECT
  p.id,
  p.name,
  p.slug,
  p.price,
  COUNT(DISTINCT l.id) as total_licenses,
  COUNT(DISTINCT o.id) as total_orders,
  p.total_downloads,
  COALESCE(AVG(pr.rating), 0) as avg_rating,
  COUNT(pr.id) as review_count
FROM products p
LEFT JOIN licenses l ON p.id = l.product_id
LEFT JOIN orders o ON p.id = o.id
LEFT JOIN product_reviews pr ON p.id = pr.product_id AND pr.is_approved = true
WHERE p.is_active = true
GROUP BY p.id;

CREATE VIEW affiliate_earnings AS
SELECT
  a.id,
  a.affiliate_code,
  a.total_referrals,
  a.total_earnings,
  COUNT(ac.id) as pending_commissions,
  SUM(CASE WHEN ac.status = 'pending' THEN ac.commission_amount ELSE 0 END) as pending_amount,
  SUM(CASE WHEN ac.status = 'paid' THEN ac.commission_amount ELSE 0 END) as paid_amount
FROM affiliates a
LEFT JOIN affiliate_commissions ac ON a.id = ac.affiliate_id
GROUP BY a.id;

COMMENT ON TABLE products IS 'Digital products catalog including UI kits, templates, and SaaS tools';
COMMENT ON TABLE licenses IS 'Product licenses with activation tracking and validation';
COMMENT ON TABLE product_versions IS 'Version control for product updates and releases';
COMMENT ON TABLE affiliates IS 'Affiliate program for customer referrals';
