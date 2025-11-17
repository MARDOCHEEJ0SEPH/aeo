-- Little Wonders Baby Shop Database Schema
-- PostgreSQL Database for Baby Products E-commerce Platform

-- Drop existing database and create new one
DROP DATABASE IF EXISTS baby_shop;
CREATE DATABASE baby_shop;

\c baby_shop;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== CUSTOMERS ====================

CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    active BOOLEAN DEFAULT true,
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_created_at ON customers(created_at DESC);

-- ==================== BRANDS ====================

CREATE TABLE brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    website VARCHAR(255),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_brands_slug ON brands(slug);

-- ==================== CATEGORIES ====================

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    image_url VARCHAR(500),
    icon VARCHAR(50),
    display_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);

-- ==================== PRODUCTS ====================

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    long_description TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL,
    price DECIMAL(10, 2) NOT NULL,
    compare_at_price DECIMAL(10, 2),
    cost DECIMAL(10, 2),

    -- Product attributes
    age_range VARCHAR(50), -- 'newborn', 'infant', 'toddler', 'preschool'
    gender VARCHAR(20), -- 'unisex', 'boy', 'girl'
    size VARCHAR(50),
    color VARCHAR(50),
    weight DECIMAL(10, 2),
    dimensions VARCHAR(100),

    -- Product features
    is_organic BOOLEAN DEFAULT false,
    is_eco_friendly BOOLEAN DEFAULT false,
    is_hypoallergenic BOOLEAN DEFAULT false,
    safety_certified BOOLEAN DEFAULT false,
    certification_details JSONB,

    -- Media
    image_url VARCHAR(500),
    video_url VARCHAR(500),

    -- SEO
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT,

    -- Status
    active BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT positive_price CHECK (price >= 0),
    CONSTRAINT valid_age_range CHECK (age_range IN ('newborn', 'infant', 'toddler', 'preschool', NULL))
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_featured ON products(featured);
CREATE INDEX idx_products_active ON products(active);

-- ==================== PRODUCT IMAGES ====================

CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_images_product ON product_images(product_id);

-- ==================== INVENTORY ====================

CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    last_restocked TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT non_negative_quantity CHECK (quantity >= 0)
);

CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_inventory_low_stock ON inventory(quantity) WHERE quantity <= low_stock_threshold;

-- ==================== CART ====================

CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT positive_quantity CHECK (quantity > 0),
    UNIQUE(customer_id, product_id)
);

CREATE INDEX idx_cart_customer ON cart_items(customer_id);
CREATE INDEX idx_cart_product ON cart_items(product_id);

-- ==================== ORDERS ====================

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL DEFAULT 'LW' || LPAD(NEXTVAL('orders_id_seq')::TEXT, 8, '0'),
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',

    -- Pricing
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
    shipping DECIMAL(10, 2) NOT NULL DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,

    -- Addresses (stored as JSONB)
    shipping_address JSONB NOT NULL,
    billing_address JSONB NOT NULL,

    -- Payment
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_transaction_id VARCHAR(255),

    -- Shipping
    shipping_method VARCHAR(100),
    tracking_number VARCHAR(100),
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,

    -- Notes
    customer_notes TEXT,
    internal_notes TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'))
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_number ON orders(order_number);

-- ==================== ORDER ITEMS ====================

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    sku VARCHAR(50),
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * price) STORED,
    CONSTRAINT positive_quantity CHECK (quantity > 0)
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- Trigger to auto-populate product_name and sku
CREATE OR REPLACE FUNCTION populate_order_item_details()
RETURNS TRIGGER AS $$
BEGIN
    SELECT name, sku INTO NEW.product_name, NEW.sku
    FROM products
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_items_populate_details
    BEFORE INSERT ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION populate_order_item_details();

-- ==================== REVIEWS ====================

CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL,
    title VARCHAR(255),
    comment TEXT,
    approved BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_rating CHECK (rating BETWEEN 1 AND 5),
    UNIQUE(customer_id, product_id)
);

CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_customer ON reviews(customer_id);
CREATE INDEX idx_reviews_approved ON reviews(approved);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- ==================== ADDRESSES ====================

CREATE TABLE addresses (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- 'shipping' or 'billing'
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company VARCHAR(100),
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(2) DEFAULT 'US',
    phone VARCHAR(20),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_addresses_customer ON addresses(customer_id);
CREATE INDEX idx_addresses_type ON addresses(type);

-- ==================== WISHLISTS ====================

CREATE TABLE wishlists (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL DEFAULT 'My Wishlist',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wishlist_items (
    id SERIAL PRIMARY KEY,
    wishlist_id INTEGER REFERENCES wishlists(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(wishlist_id, product_id)
);

CREATE INDEX idx_wishlists_customer ON wishlists(customer_id);
CREATE INDEX idx_wishlist_items_wishlist ON wishlist_items(wishlist_id);

-- ==================== BABY REGISTRY ====================

CREATE TABLE baby_registries (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    registry_number VARCHAR(50) UNIQUE NOT NULL DEFAULT 'BR' || LPAD(NEXTVAL('baby_registries_id_seq')::TEXT, 8, '0'),
    parent_names VARCHAR(255) NOT NULL,
    baby_name VARCHAR(100),
    due_date DATE,
    gender VARCHAR(20),
    shower_date DATE,
    shower_location TEXT,
    message TEXT,
    is_public BOOLEAN DEFAULT true,
    completion_discount_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE registry_items (
    id SERIAL PRIMARY KEY,
    registry_id INTEGER REFERENCES baby_registries(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity_requested INTEGER NOT NULL DEFAULT 1,
    quantity_purchased INTEGER DEFAULT 0,
    priority VARCHAR(20) DEFAULT 'medium', -- 'high', 'medium', 'low'
    notes TEXT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_priority CHECK (priority IN ('high', 'medium', 'low')),
    UNIQUE(registry_id, product_id)
);

CREATE INDEX idx_baby_registries_customer ON baby_registries(customer_id);
CREATE INDEX idx_baby_registries_number ON baby_registries(registry_number);
CREATE INDEX idx_registry_items_registry ON registry_items(registry_id);

-- ==================== NEWSLETTER ====================

CREATE TABLE newsletter_subscribers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at TIMESTAMP,
    active BOOLEAN DEFAULT true,
    preferences JSONB
);

CREATE INDEX idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX idx_newsletter_active ON newsletter_subscribers(active);

-- ==================== CONTACT MESSAGES ====================

CREATE TABLE contact_messages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'new',
    responded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_status CHECK (status IN ('new', 'in_progress', 'resolved', 'closed'))
);

CREATE INDEX idx_contact_status ON contact_messages(status);
CREATE INDEX idx_contact_created_at ON contact_messages(created_at DESC);

-- ==================== DISCOUNT CODES ====================

CREATE TABLE discount_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'percentage' or 'fixed'
    value DECIMAL(10, 2) NOT NULL,
    min_purchase_amount DECIMAL(10, 2),
    max_discount_amount DECIMAL(10, 2),
    usage_limit INTEGER,
    times_used INTEGER DEFAULT 0,
    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_type CHECK (type IN ('percentage', 'fixed')),
    CONSTRAINT positive_value CHECK (value > 0)
);

CREATE INDEX idx_discount_codes_code ON discount_codes(code);
CREATE INDEX idx_discount_codes_active ON discount_codes(active);

-- ==================== FUNCTIONS ====================

-- Function to update product's updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update_at trigger to relevant tables
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==================== VIEWS ====================

-- View for product catalog with aggregated data
CREATE VIEW product_catalog AS
SELECT
    p.*,
    b.name as brand_name,
    c.name as category_name,
    i.quantity as stock_quantity,
    COALESCE(AVG(r.rating), 0) as avg_rating,
    COUNT(DISTINCT r.id) as review_count
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN inventory i ON p.id = i.product_id
LEFT JOIN reviews r ON p.id = r.product_id AND r.approved = true
GROUP BY p.id, b.name, c.name, i.quantity;

-- View for order summary
CREATE VIEW order_summary AS
SELECT
    o.*,
    c.email as customer_email,
    c.first_name || ' ' || c.last_name as customer_name,
    COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, c.email, c.first_name, c.last_name;

-- ==================== SEED INITIAL DATA ====================

-- Insert default categories
INSERT INTO categories (name, slug, description, icon, display_order) VALUES
('Newborn Essentials', 'newborn', 'Everything you need for the first weeks', '👶', 1),
('Baby Clothing', 'clothing', 'Soft, comfortable clothing from newborn to 4T', '👕', 2),
('Nursery Furniture', 'furniture', 'Safe, stylish furniture for baby''s nursery', '🛏️', 3),
('Feeding Essentials', 'feeding', 'Bottles, breast pumps, high chairs, and feeding accessories', '🍼', 4),
('Diapers & Wipes', 'diapers', 'Eco-friendly diapers, sensitive wipes, diapering accessories', '🚼', 5),
('Strollers & Car Seats', 'travel', 'Safety-tested travel gear', '🚗', 6),
('Toys & Books', 'toys', 'Educational toys and children''s books', '🧸', 7),
('Bath & Skincare', 'bath', 'Gentle, natural skincare products and bath essentials', '🛁', 8);

-- Insert default brands
INSERT INTO brands (name, slug, description) VALUES
('Little Wonders Essentials', 'little-wonders', 'Our in-house brand of quality baby products'),
('GreenBaby', 'greenbaby', 'Organic and eco-friendly baby products'),
('Urban Baby Gear', 'urban-baby', 'Modern, functional baby gear for city families'),
('Soft Start', 'soft-start', 'Gentle products for baby''s delicate skin'),
('Happy Feet Baby', 'happy-feet', 'Quality footwear and accessories for little ones');

COMMENT ON DATABASE baby_shop IS 'Little Wonders Baby Shop - Comprehensive e-commerce database for baby products';
