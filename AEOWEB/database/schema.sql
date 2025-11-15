-- ================================================
-- AEO Website - Complete Database Schema
-- PostgreSQL 14+
-- Full-Stack Implementation Base
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- USERS & AUTHENTICATION
-- ================================================

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'editor', 'admin', 'super_admin')),
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  email_verification_token VARCHAR(255),
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  last_login_at TIMESTAMP,
  last_login_ip VARCHAR(45),
  login_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_uuid ON users(uuid);

-- User sessions
CREATE TABLE user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_user ON user_sessions(user_id);

-- ================================================
-- CONTENT MANAGEMENT
-- ================================================

CREATE TABLE content (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) UNIQUE NOT NULL,
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('page', 'article', 'service', 'product', 'guide', 'faq_page')),
  body TEXT,
  excerpt TEXT,
  meta_title VARCHAR(60),
  meta_description VARCHAR(160),
  meta_keywords TEXT,
  featured_image VARCHAR(500),
  featured_image_alt TEXT,
  schema_data JSONB, -- Store complete schema markup
  author_id INTEGER REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled', 'archived')),
  visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'password')),
  password VARCHAR(255), -- For password-protected content
  view_count INTEGER DEFAULT 0,
  published_at TIMESTAMP,
  scheduled_for TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_content_slug ON content(slug);
CREATE INDEX idx_content_type ON content(content_type);
CREATE INDEX idx_content_status ON content(status);
CREATE INDEX idx_content_author ON content(author_id);
CREATE INDEX idx_content_published ON content(published_at);
CREATE INDEX idx_content_uuid ON content(uuid);

-- Content categories/tags (many-to-many)
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  parent_id INTEGER REFERENCES categories(id),
  meta_description VARCHAR(160),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);

CREATE TABLE content_categories (
  content_id INTEGER REFERENCES content(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, category_id)
);

CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tags_slug ON tags(slug);

CREATE TABLE content_tags (
  content_id INTEGER REFERENCES content(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, tag_id)
);

-- Content revisions (version history)
CREATE TABLE content_revisions (
  id SERIAL PRIMARY KEY,
  content_id INTEGER REFERENCES content(id) ON DELETE CASCADE,
  title VARCHAR(500),
  body TEXT,
  schema_data JSONB,
  revised_by INTEGER REFERENCES users(id),
  revision_note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_revisions_content ON content_revisions(content_id);

-- ================================================
-- FAQ SYSTEM
-- ================================================

CREATE TABLE faqs (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100),
  content_id INTEGER REFERENCES content(id) ON DELETE SET NULL, -- Optional: link to specific page
  order_position INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_faqs_category ON faqs(category);
CREATE INDEX idx_faqs_published ON faqs(is_published);
CREATE INDEX idx_faqs_content ON faqs(content_id);

-- FAQ voting (track helpful/not helpful)
CREATE TABLE faq_votes (
  id SERIAL PRIMARY KEY,
  faq_id INTEGER REFERENCES faqs(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(faq_id, ip_address)
);

CREATE INDEX idx_faq_votes_faq ON faq_votes(faq_id);

-- ================================================
-- SCHEMA TEMPLATES
-- ================================================

CREATE TABLE schema_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  schema_type VARCHAR(50) NOT NULL, -- 'Organization', 'Article', 'Product', 'FAQPage', etc.
  template_json JSONB NOT NULL,
  is_global BOOLEAN DEFAULT false, -- Global schemas appear on all pages
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_schema_type ON schema_templates(schema_type);
CREATE INDEX idx_schema_global ON schema_templates(is_global);

-- ================================================
-- CITATIONS & AI TRACKING
-- ================================================

CREATE TABLE citations (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
  source VARCHAR(100) NOT NULL, -- 'chatgpt', 'perplexity', 'google-ai', 'copilot', 'claude', etc.
  query TEXT, -- The question asked
  page_url VARCHAR(500),
  content_id INTEGER REFERENCES content(id) ON DELETE SET NULL,
  referrer VARCHAR(500),
  user_agent TEXT,
  ip_address VARCHAR(45),
  session_id VARCHAR(100),
  country_code VARCHAR(2),
  city VARCHAR(100),
  is_verified BOOLEAN DEFAULT false, -- Manually verified citation
  screenshot_url VARCHAR(500), -- Optional: screenshot of citation
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_citations_source ON citations(source);
CREATE INDEX idx_citations_date ON citations(created_at);
CREATE INDEX idx_citations_content ON citations(content_id);
CREATE INDEX idx_citations_query ON citations USING gin(to_tsvector('english', query));

-- Citation statistics (aggregated data for performance)
CREATE TABLE citation_stats (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  source VARCHAR(100),
  content_id INTEGER REFERENCES content(id) ON DELETE CASCADE,
  total_citations INTEGER DEFAULT 0,
  unique_queries INTEGER DEFAULT 0,
  UNIQUE(date, source, content_id)
);

CREATE INDEX idx_citation_stats_date ON citation_stats(date);
CREATE INDEX idx_citation_stats_source ON citation_stats(source);

-- ================================================
-- ANALYTICS & TRACKING
-- ================================================

CREATE TABLE pageviews (
  id SERIAL PRIMARY KEY,
  page_url VARCHAR(500) NOT NULL,
  content_id INTEGER REFERENCES content(id) ON DELETE SET NULL,
  session_id VARCHAR(100),
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  referrer VARCHAR(500),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  device_type VARCHAR(50), -- 'mobile', 'tablet', 'desktop'
  browser VARCHAR(100),
  os VARCHAR(100),
  country_code VARCHAR(2),
  city VARCHAR(100),
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pageviews_page ON pageviews(page_url);
CREATE INDEX idx_pageviews_content ON pageviews(content_id);
CREATE INDEX idx_pageviews_date ON pageviews(created_at);
CREATE INDEX idx_pageviews_session ON pageviews(session_id);

-- Custom events
CREATE TABLE analytics_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL, -- 'click', 'download', 'signup', 'purchase', etc.
  event_category VARCHAR(50),
  event_label VARCHAR(100),
  event_value INTEGER,
  page_url VARCHAR(500),
  content_id INTEGER REFERENCES content(id) ON DELETE SET NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(100),
  event_data JSONB, -- Additional event metadata
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_type ON analytics_events(event_type);
CREATE INDEX idx_events_date ON analytics_events(created_at);
CREATE INDEX idx_events_content ON analytics_events(content_id);

-- ================================================
-- SEO & AEO SPECIFIC
-- ================================================

-- Track which questions/queries our content ranks for
CREATE TABLE tracked_queries (
  id SERIAL PRIMARY KEY,
  query TEXT NOT NULL,
  query_type VARCHAR(50), -- 'informational', 'transactional', 'navigational', 'local'
  target_url VARCHAR(500),
  content_id INTEGER REFERENCES content(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 5, -- 1-10 priority
  current_position INTEGER, -- Where we rank
  ai_citation_rate DECIMAL(5,2), -- % of time cited by AI
  search_volume INTEGER,
  difficulty_score INTEGER, -- 1-100
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_queries_content ON tracked_queries(content_id);
CREATE INDEX idx_queries_active ON tracked_queries(is_active);
CREATE INDEX idx_queries_text ON tracked_queries USING gin(to_tsvector('english', query));

-- Track query rankings over time
CREATE TABLE query_rankings (
  id SERIAL PRIMARY KEY,
  query_id INTEGER REFERENCES tracked_queries(id) ON DELETE CASCADE,
  position INTEGER,
  ai_engine VARCHAR(50), -- 'chatgpt', 'perplexity', 'google', etc.
  is_cited BOOLEAN DEFAULT false,
  checked_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rankings_query ON query_rankings(query_id);
CREATE INDEX idx_rankings_date ON query_rankings(checked_at);

-- ================================================
-- MEDIA LIBRARY
-- ================================================

CREATE TABLE media (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255),
  file_path VARCHAR(500) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_size INTEGER, -- bytes
  mime_type VARCHAR(100),
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  caption TEXT,
  description TEXT,
  uploaded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_media_uuid ON media(uuid);
CREATE INDEX idx_media_mime ON media(mime_type);

-- ================================================
-- PRODUCTS (E-commerce)
-- ================================================

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  sku VARCHAR(100) UNIQUE,
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  cost DECIMAL(10,2),
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  is_in_stock BOOLEAN DEFAULT true,
  weight DECIMAL(8,2), -- in kg or lbs
  dimensions VARCHAR(50), -- LxWxH
  featured_image INTEGER REFERENCES media(id),
  schema_data JSONB,
  seo_title VARCHAR(60),
  seo_description VARCHAR(160),
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_published ON products(is_published);

-- Product variants
CREATE TABLE product_variants (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(100), -- e.g., "Small - Red"
  sku VARCHAR(100) UNIQUE,
  price DECIMAL(10,2),
  stock_quantity INTEGER DEFAULT 0,
  option1_name VARCHAR(50), -- e.g., "Size"
  option1_value VARCHAR(50), -- e.g., "Small"
  option2_name VARCHAR(50), -- e.g., "Color"
  option2_value VARCHAR(50), -- e.g., "Red"
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_variants_product ON product_variants(product_id);

-- Product reviews
CREATE TABLE product_reviews (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(200),
  review_text TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reviews_product ON product_reviews(product_id);
CREATE INDEX idx_reviews_approved ON product_reviews(is_approved);

-- ================================================
-- FORMS & SUBMISSIONS
-- ================================================

CREATE TABLE forms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  fields JSONB NOT NULL, -- Form field definitions
  success_message TEXT,
  redirect_url VARCHAR(500),
  email_notification BOOLEAN DEFAULT true,
  notification_email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_forms_slug ON forms(slug);

CREATE TABLE form_submissions (
  id SERIAL PRIMARY KEY,
  form_id INTEGER REFERENCES forms(id) ON DELETE CASCADE,
  data JSONB NOT NULL, -- Submitted form data
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  referrer VARCHAR(500),
  status VARCHAR(50) DEFAULT 'new', -- 'new', 'read', 'responded', 'archived'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_submissions_form ON form_submissions(form_id);
CREATE INDEX idx_submissions_status ON form_submissions(status);

-- ================================================
-- EMAIL CAMPAIGNS
-- ================================================

CREATE TABLE email_subscribers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  status VARCHAR(50) DEFAULT 'subscribed' CHECK (status IN ('subscribed', 'unsubscribed', 'bounced')),
  subscription_source VARCHAR(100), -- Where they subscribed from
  tags TEXT[], -- Array of tags
  metadata JSONB,
  subscribed_at TIMESTAMP DEFAULT NOW(),
  unsubscribed_at TIMESTAMP
);

CREATE INDEX idx_subscribers_email ON email_subscribers(email);
CREATE INDEX idx_subscribers_status ON email_subscribers(status);

CREATE TABLE email_campaigns (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  body_html TEXT,
  body_text TEXT,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'cancelled')),
  scheduled_for TIMESTAMP,
  sent_at TIMESTAMP,
  sent_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_campaigns_status ON email_campaigns(status);

-- ================================================
-- SETTINGS & CONFIGURATION
-- ================================================

CREATE TABLE site_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT,
  data_type VARCHAR(20) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
  category VARCHAR(50), -- 'general', 'seo', 'schema', 'email', etc.
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default settings
INSERT INTO site_settings (key, value, category, description) VALUES
('site_name', 'Your Business Name', 'general', 'Website name'),
('site_url', 'https://yourdomain.com', 'general', 'Website URL'),
('site_description', 'Your site description', 'general', 'Website description'),
('organization_name', 'Your Business Name', 'schema', 'Organization name for schema'),
('organization_logo', 'https://yourdomain.com/logo.png', 'schema', 'Logo URL for schema'),
('contact_email', 'contact@yourdomain.com', 'general', 'Primary contact email'),
('contact_phone', '+1-XXX-XXX-XXXX', 'general', 'Primary contact phone'),
('google_analytics_id', '', 'analytics', 'Google Analytics 4 ID'),
('enable_citations_tracking', 'true', 'analytics', 'Enable AI citation tracking'),
('auto_generate_schema', 'true', 'schema', 'Automatically generate schema for content');

-- ================================================
-- CACHING & OPTIMIZATION
-- ================================================

CREATE TABLE cache_entries (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cache_expires ON cache_entries(expires_at);

-- ================================================
-- AUDIT LOG
-- ================================================

CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'login', etc.
  entity_type VARCHAR(50), -- 'content', 'user', 'product', etc.
  entity_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_date ON audit_log(created_at);

-- ================================================
-- SCHEDULED TASKS
-- ================================================

CREATE TABLE scheduled_tasks (
  id SERIAL PRIMARY KEY,
  task_name VARCHAR(100) NOT NULL,
  task_type VARCHAR(50), -- 'content_publish', 'sitemap_generate', 'backup', etc.
  parameters JSONB,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  scheduled_for TIMESTAMP NOT NULL,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tasks_scheduled ON scheduled_tasks(scheduled_for);
CREATE INDEX idx_tasks_status ON scheduled_tasks(status);

-- ================================================
-- FUNCTIONS & TRIGGERS
-- ================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON faqs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tracked_queries_updated_at BEFORE UPDATE ON tracked_queries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(content_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE content SET view_count = view_count + 1 WHERE uuid = content_uuid;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- VIEWS (Pre-computed queries for performance)
-- ================================================

-- View: Popular content
CREATE VIEW popular_content AS
SELECT
  c.id,
  c.title,
  c.slug,
  c.content_type,
  c.view_count,
  COUNT(DISTINCT cit.id) as citation_count,
  c.published_at
FROM content c
LEFT JOIN citations cit ON c.id = cit.content_id
WHERE c.status = 'published'
GROUP BY c.id
ORDER BY c.view_count DESC, citation_count DESC;

-- View: Citation summary by source
CREATE VIEW citation_summary AS
SELECT
  source,
  COUNT(*) as total_citations,
  COUNT(DISTINCT DATE(created_at)) as days_with_citations,
  COUNT(DISTINCT content_id) as content_cited,
  MIN(created_at) as first_citation,
  MAX(created_at) as last_citation
FROM citations
GROUP BY source;

-- View: Content performance
CREATE VIEW content_performance AS
SELECT
  c.id,
  c.title,
  c.slug,
  c.view_count,
  COUNT(DISTINCT cit.id) as citations,
  COUNT(DISTINCT pv.id) as pageviews,
  c.published_at
FROM content c
LEFT JOIN citations cit ON c.id = cit.content_id
LEFT JOIN pageviews pv ON c.id = pv.content_id
WHERE c.status = 'published'
GROUP BY c.id;

-- ================================================
-- INITIAL DATA
-- ================================================

-- Create default admin user (password: changeme123 - CHANGE THIS!)
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
VALUES ('admin@example.com', '$2b$10$8qvZ.OqzX8xqK0cZYvVQfO8H6Y1n5T5jQ8gV0yW3qF9pK9wX8qvZe', 'Admin', 'User', 'super_admin', true, true);

-- Create default FAQ categories
INSERT INTO faqs (question, answer, category, is_published) VALUES
('What is Answer Engine Optimization (AEO)?', 'Answer Engine Optimization (AEO) is the practice of optimizing your content to be cited and recommended by AI-powered answer engines like ChatGPT, Perplexity, Google AI Overviews, and Microsoft Copilot.', 'General', true),
('How is AEO different from SEO?', 'While SEO focuses on ranking in search engine results pages, AEO focuses on being cited directly in AI-generated answers. AEO requires structured data, direct answers to questions, and high authority content.', 'General', true);

-- Create default schema template
INSERT INTO schema_templates (name, schema_type, template_json, is_global) VALUES
('Default Organization', 'Organization', '{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "{{site_name}}",
  "url": "{{site_url}}",
  "logo": "{{organization_logo}}"
}'::jsonb, true);

-- ================================================
-- MAINTENANCE
-- ================================================

-- Clean old sessions (run daily)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM user_sessions WHERE expires_at < NOW();
  DELETE FROM cache_entries WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Aggregate citation stats (run daily)
CREATE OR REPLACE FUNCTION aggregate_citation_stats()
RETURNS void AS $$
BEGIN
  INSERT INTO citation_stats (date, source, content_id, total_citations, unique_queries)
  SELECT
    DATE(created_at) as date,
    source,
    content_id,
    COUNT(*) as total_citations,
    COUNT(DISTINCT query) as unique_queries
  FROM citations
  WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
  GROUP BY DATE(created_at), source, content_id
  ON CONFLICT (date, source, content_id) DO UPDATE
  SET total_citations = EXCLUDED.total_citations,
      unique_queries = EXCLUDED.unique_queries;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- COMMENTS FOR DOCUMENTATION
-- ================================================

COMMENT ON TABLE content IS 'Main content table for pages, articles, services, and products';
COMMENT ON TABLE faqs IS 'FAQ questions and answers optimized for AI citations';
COMMENT ON TABLE citations IS 'Track when content is cited by AI engines';
COMMENT ON TABLE schema_templates IS 'Reusable schema.org markup templates';
COMMENT ON TABLE tracked_queries IS 'Questions/queries we want to rank for in AI engines';

-- ================================================
-- DATABASE COMPLETE
-- ================================================

-- Grant appropriate permissions (adjust for your user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
