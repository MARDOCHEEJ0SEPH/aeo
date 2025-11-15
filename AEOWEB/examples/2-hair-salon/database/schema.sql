-- Luxe Hair Studio Database Schema
-- Complete booking and salon management system

-- Service Categories
CREATE TABLE service_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Services
CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES service_categories(id),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL, -- Service duration
  price_from DECIMAL(10,2),
  price_to DECIMAL(10,2),
  requires_consultation BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Stylists/Staff
CREATE TABLE stylists (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  title VARCHAR(100), -- e.g., "Senior Stylist", "Color Specialist"
  bio TEXT,
  specialties TEXT[], -- Array of specialties
  years_experience INTEGER,
  certifications TEXT[],
  photo_url VARCHAR(500),
  instagram_handle VARCHAR(100),
  is_accepting_clients BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Stylist Services (What services each stylist offers)
CREATE TABLE stylist_services (
  stylist_id INTEGER REFERENCES stylists(id) ON DELETE CASCADE,
  service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
  custom_price DECIMAL(10,2), -- Override service price for this stylist
  PRIMARY KEY (stylist_id, service_id)
);

-- Stylist Availability
CREATE TABLE stylist_schedules (
  id SERIAL PRIMARY KEY,
  stylist_id INTEGER REFERENCES stylists(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Customers/Clients
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  date_of_birth DATE,
  preferred_stylist_id INTEGER REFERENCES stylists(id),
  hair_type VARCHAR(50), -- straight, wavy, curly, coily
  hair_length VARCHAR(50), -- short, medium, long
  hair_color VARCHAR(50),
  allergies TEXT,
  notes TEXT, -- Private notes about client preferences
  total_visits INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  last_visit DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Appointments
CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  stylist_id INTEGER REFERENCES stylists(id),
  service_id INTEGER REFERENCES services(id),
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show')),
  customer_notes TEXT, -- Customer's special requests
  stylist_notes TEXT, -- Stylist's private notes
  reminder_sent BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Client Service History
CREATE TABLE service_history (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  appointment_id INTEGER REFERENCES appointments(id),
  stylist_id INTEGER REFERENCES stylists(id),
  service_id INTEGER REFERENCES services(id),
  service_date DATE NOT NULL,
  service_details JSONB, -- Colors used, techniques, formulas
  photos_before TEXT[],
  photos_after TEXT[],
  cost DECIMAL(10,2),
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Products (Retail)
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  brand VARCHAR(100),
  category VARCHAR(100), -- shampoo, conditioner, styling, treatment
  description TEXT,
  price DECIMAL(10,2),
  size VARCHAR(50), -- e.g., "8 oz", "250ml"
  stock_quantity INTEGER DEFAULT 0,
  sku VARCHAR(100) UNIQUE,
  image_url VARCHAR(500),
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Product Inventory
CREATE TABLE inventory_transactions (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  transaction_type VARCHAR(20) CHECK (transaction_type IN ('purchase', 'sale', 'adjustment', 'return')),
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10,2),
  notes TEXT,
  created_by INTEGER, -- Staff member ID
  created_at TIMESTAMP DEFAULT NOW()
);

-- Gift Cards
CREATE TABLE gift_cards (
  id SERIAL PRIMARY KEY,
  card_number VARCHAR(50) UNIQUE NOT NULL,
  purchaser_name VARCHAR(200),
  purchaser_email VARCHAR(255),
  recipient_name VARCHAR(200),
  recipient_email VARCHAR(255),
  initial_amount DECIMAL(10,2) NOT NULL,
  current_balance DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired', 'cancelled')),
  purchased_date DATE DEFAULT CURRENT_DATE,
  expiration_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Gift Card Transactions
CREATE TABLE gift_card_transactions (
  id SERIAL PRIMARY KEY,
  gift_card_id INTEGER REFERENCES gift_cards(id),
  transaction_type VARCHAR(20) CHECK (transaction_type IN ('purchase', 'redemption', 'refund')),
  amount DECIMAL(10,2),
  appointment_id INTEGER REFERENCES appointments(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reviews
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  stylist_id INTEGER REFERENCES stylists(id),
  appointment_id INTEGER REFERENCES appointments(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_title VARCHAR(200),
  review_text TEXT,
  is_approved BOOLEAN DEFAULT false,
  response TEXT, -- Salon's response
  responded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Promotions
CREATE TABLE promotions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value DECIMAL(10,2),
  promo_code VARCHAR(50) UNIQUE,
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Service Packages (e.g., "Bridal Package")
CREATE TABLE packages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  services_included TEXT[], -- Array of service names
  total_value DECIMAL(10,2),
  package_price DECIMAL(10,2),
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_stylist ON appointments(stylist_id);
CREATE INDEX idx_appointments_customer ON appointments(customer_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_stylists_slug ON stylists(slug);
CREATE INDEX idx_services_slug ON services(slug);

-- Views
CREATE VIEW upcoming_appointments AS
SELECT
  a.id,
  a.appointment_date,
  a.start_time,
  c.first_name || ' ' || c.last_name as customer_name,
  c.email as customer_email,
  c.phone as customer_phone,
  s.first_name || ' ' || s.last_name as stylist_name,
  srv.name as service_name,
  srv.duration_minutes,
  a.status
FROM appointments a
JOIN customers c ON a.customer_id = c.id
JOIN stylists s ON a.stylist_id = s.id
JOIN services srv ON a.service_id = srv.id
WHERE a.appointment_date >= CURRENT_DATE
  AND a.status IN ('scheduled', 'confirmed')
ORDER BY a.appointment_date, a.start_time;

CREATE VIEW stylist_performance AS
SELECT
  s.id,
  s.first_name || ' ' || s.last_name as stylist_name,
  COUNT(DISTINCT a.id) as total_appointments,
  COUNT(DISTINCT a.customer_id) as unique_clients,
  AVG(r.rating) as avg_rating,
  COUNT(r.id) as total_reviews
FROM stylists s
LEFT JOIN appointments a ON s.id = a.stylist_id AND a.status = 'completed'
LEFT JOIN reviews r ON s.id = r.stylist_id
WHERE s.is_active = true
GROUP BY s.id, stylist_name;

COMMENT ON TABLE stylists IS 'Salon staff and their specialties';
COMMENT ON TABLE appointments IS 'Client appointments and booking system';
COMMENT ON TABLE service_history IS 'Complete service history for client retention and formulation tracking';
