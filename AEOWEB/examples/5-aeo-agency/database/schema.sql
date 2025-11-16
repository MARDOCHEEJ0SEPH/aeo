-- Peak Visibility AEO Agency Database Schema
-- Professional services agency for Answer Engine Optimization

-- Service Categories
CREATE TABLE service_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Services
CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES service_categories(id),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  tagline VARCHAR(255),
  description TEXT,
  deliverables JSONB,
  timeline_days INTEGER,
  base_price DECIMAL(10,2),
  pricing_model VARCHAR(50),
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  meta_title VARCHAR(200),
  meta_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clients
CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(200) NOT NULL,
  industry VARCHAR(100),
  website_url TEXT,
  contact_name VARCHAR(150),
  contact_email VARCHAR(255) UNIQUE NOT NULL,
  contact_phone VARCHAR(20),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(2) DEFAULT 'US',
  company_size VARCHAR(50),
  monthly_budget DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'prospect',
  lead_source VARCHAR(100),
  assigned_account_manager INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_contact TIMESTAMP
);

-- Team Members
CREATE TABLE team_members (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(100),
  department VARCHAR(100),
  bio TEXT,
  expertise JSONB,
  avatar_url TEXT,
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  hire_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects (Case Studies)
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id),
  project_name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE,
  project_type VARCHAR(100),
  services JSONB,
  description TEXT,
  challenge TEXT,
  solution TEXT,
  results JSONB,
  metrics JSONB,
  timeline_start DATE,
  timeline_end DATE,
  budget DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'active',
  is_case_study BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  thumbnail_url TEXT,
  featured_image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Team (many-to-many relationship)
CREATE TABLE project_team (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  team_member_id INTEGER REFERENCES team_members(id),
  role VARCHAR(100),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Testimonials
CREATE TABLE testimonials (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id),
  project_id INTEGER REFERENCES projects(id),
  author_name VARCHAR(150) NOT NULL,
  author_position VARCHAR(150),
  author_company VARCHAR(200),
  author_photo_url TEXT,
  testimonial_text TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_featured BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blog Categories
CREATE TABLE blog_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blog Posts
CREATE TABLE blog_posts (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES blog_categories(id),
  author_id INTEGER REFERENCES team_members(id),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image_url TEXT,
  read_time_minutes INTEGER,
  view_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP,
  meta_title VARCHAR(200),
  meta_description TEXT,
  keywords JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lead Inquiries
CREATE TABLE lead_inquiries (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id),
  inquiry_type VARCHAR(50) DEFAULT 'general',
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  company VARCHAR(200),
  website_url TEXT,
  service_interest JSONB,
  budget_range VARCHAR(50),
  timeline VARCHAR(50),
  message TEXT,
  status VARCHAR(50) DEFAULT 'new',
  assigned_to INTEGER REFERENCES team_members(id),
  source VARCHAR(100),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  followed_up_at TIMESTAMP
);

-- AEO Audit Requests
CREATE TABLE audit_requests (
  id SERIAL PRIMARY KEY,
  lead_inquiry_id INTEGER REFERENCES lead_inquiries(id),
  website_url TEXT NOT NULL,
  industry VARCHAR(100),
  contact_email VARCHAR(255) NOT NULL,
  contact_name VARCHAR(150),
  current_traffic INTEGER,
  main_competitors TEXT,
  audit_status VARCHAR(50) DEFAULT 'pending',
  audit_results JSONB,
  score INTEGER,
  recommendations TEXT,
  assigned_to INTEGER REFERENCES team_members(id),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Proposals
CREATE TABLE proposals (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id),
  lead_inquiry_id INTEGER REFERENCES lead_inquiries(id),
  proposal_number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  services JSONB,
  scope_of_work TEXT,
  deliverables JSONB,
  timeline_weeks INTEGER,
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'draft',
  valid_until DATE,
  created_by INTEGER REFERENCES team_members(id),
  sent_at TIMESTAMP,
  viewed_at TIMESTAMP,
  accepted_at TIMESTAMP,
  rejected_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contracts
CREATE TABLE contracts (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id),
  proposal_id INTEGER REFERENCES proposals(id),
  contract_number VARCHAR(50) UNIQUE NOT NULL,
  contract_type VARCHAR(50),
  start_date DATE NOT NULL,
  end_date DATE,
  monthly_retainer DECIMAL(10,2),
  total_value DECIMAL(10,2),
  payment_terms VARCHAR(100),
  status VARCHAR(50) DEFAULT 'draft',
  contract_url TEXT,
  signed_by_client BOOLEAN DEFAULT false,
  signed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices
CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id),
  contract_id INTEGER REFERENCES contracts(id),
  project_id INTEGER REFERENCES projects(id),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'draft',
  payment_status VARCHAR(50) DEFAULT 'unpaid',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP,
  paid_at TIMESTAMP
);

-- Invoice Line Items
CREATE TABLE invoice_line_items (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  service_id INTEGER REFERENCES services(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id),
  invoice_id INTEGER REFERENCES invoices(id),
  payment_number VARCHAR(50) UNIQUE NOT NULL,
  payment_method VARCHAR(50),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  transaction_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'completed',
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Tasks
CREATE TABLE project_tasks (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  assigned_to INTEGER REFERENCES team_members(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'normal',
  due_date DATE,
  completed_at TIMESTAMP,
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Citation Tracking
CREATE TABLE citations (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id),
  project_id INTEGER REFERENCES projects(id),
  source VARCHAR(100),
  query_text TEXT NOT NULL,
  cited_url TEXT,
  cited_content TEXT,
  answer_engine VARCHAR(50),
  position INTEGER,
  citation_date DATE,
  screenshot_url TEXT,
  is_positive BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance Reports
CREATE TABLE performance_reports (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id),
  project_id INTEGER REFERENCES projects(id),
  report_type VARCHAR(50),
  report_period_start DATE NOT NULL,
  report_period_end DATE NOT NULL,
  metrics JSONB,
  summary TEXT,
  recommendations TEXT,
  report_url TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  created_by INTEGER REFERENCES team_members(id),
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contact Form Submissions
CREATE TABLE contact_submissions (
  id SERIAL PRIMARY KEY,
  form_type VARCHAR(50) DEFAULT 'general',
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  company VARCHAR(200),
  subject VARCHAR(255),
  message TEXT,
  status VARCHAR(50) DEFAULT 'new',
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- File Attachments
CREATE TABLE file_attachments (
  id SERIAL PRIMARY KEY,
  related_type VARCHAR(50),
  related_id INTEGER,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100),
  file_size_bytes BIGINT,
  file_path TEXT NOT NULL,
  uploaded_by INTEGER REFERENCES team_members(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_published ON projects(is_published);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_published ON blog_posts(is_published);
CREATE INDEX idx_lead_inquiries_status ON lead_inquiries(status);
CREATE INDEX idx_lead_inquiries_email ON lead_inquiries(email);
CREATE INDEX idx_proposals_client ON proposals(client_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(payment_status);
CREATE INDEX idx_citations_client ON citations(client_id);
CREATE INDEX idx_tasks_assigned ON project_tasks(assigned_to);
CREATE INDEX idx_tasks_status ON project_tasks(status);

-- Views
CREATE VIEW client_overview AS
SELECT
  c.id,
  c.company_name,
  c.status,
  COUNT(DISTINCT p.id) as total_projects,
  COUNT(DISTINCT i.id) as total_invoices,
  SUM(CASE WHEN i.payment_status = 'paid' THEN i.total_amount ELSE 0 END) as total_paid,
  SUM(CASE WHEN i.payment_status = 'unpaid' THEN i.total_amount ELSE 0 END) as total_outstanding,
  MAX(p.updated_at) as last_project_update
FROM clients c
LEFT JOIN projects p ON c.id = p.client_id
LEFT JOIN invoices i ON c.id = i.client_id
GROUP BY c.id;

CREATE VIEW project_status_summary AS
SELECT
  p.id,
  p.project_name,
  p.status,
  c.company_name as client_name,
  COUNT(pt.id) as total_tasks,
  SUM(CASE WHEN pt.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
  SUM(CASE WHEN pt.status = 'pending' THEN 1 ELSE 0 END) as pending_tasks
FROM projects p
JOIN clients c ON p.client_id = c.id
LEFT JOIN project_tasks pt ON p.id = pt.project_id
GROUP BY p.id, c.company_name;

CREATE VIEW revenue_summary AS
SELECT
  DATE_TRUNC('month', i.invoice_date) as month,
  COUNT(i.id) as invoice_count,
  SUM(i.total_amount) as total_invoiced,
  SUM(CASE WHEN i.payment_status = 'paid' THEN i.total_amount ELSE 0 END) as total_collected,
  SUM(CASE WHEN i.payment_status = 'unpaid' AND i.due_date < CURRENT_DATE THEN i.total_amount ELSE 0 END) as overdue_amount
FROM invoices i
GROUP BY DATE_TRUNC('month', i.invoice_date)
ORDER BY month DESC;

COMMENT ON TABLE services IS 'AEO services catalog offered by the agency';
COMMENT ON TABLE projects IS 'Client projects and case studies with results';
COMMENT ON TABLE citations IS 'AI answer engine citation tracking for clients';
COMMENT ON TABLE audit_requests IS 'Free AEO audit requests from prospects';
