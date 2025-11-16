/**
 * Peak Visibility AEO Agency - Backend Server
 * Full-Stack AEO-Optimized Digital Marketing Agency Platform
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3005;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'peak_visibility',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

// Test database connection
pool.connect((err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to PostgreSQL database');
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'default_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// ==========================================
// ROUTES
// ==========================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Peak Visibility API' });
});

// ==========================================
// AUTHENTICATION ENDPOINTS (Team Members)
// ==========================================

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      'SELECT * FROM team_members WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const member = result.rows[0];

    const valid = await bcrypt.compare(password, member.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: member.id, email: member.email, role: member.role },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Login successful',
      member: {
        id: member.id,
        email: member.email,
        first_name: member.first_name,
        last_name: member.last_name,
        role: member.role
      },
      token
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// ==========================================
// SERVICE ENDPOINTS
// ==========================================

// Get all service categories
app.get('/api/services/categories', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM service_categories
      WHERE is_active = true
      ORDER BY display_order, name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get all services
app.get('/api/services', async (req, res) => {
  try {
    const { category_id, featured } = req.query;

    let query = `
      SELECT s.*, sc.name as category_name
      FROM services s
      LEFT JOIN service_categories sc ON s.category_id = sc.id
      WHERE s.is_active = true
    `;
    const params = [];
    let paramCount = 0;

    if (category_id) {
      paramCount++;
      query += ` AND s.category_id = $${paramCount}`;
      params.push(category_id);
    }

    if (featured === 'true') {
      query += ' AND s.is_featured = true';
    }

    query += ' ORDER BY s.name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Get single service
app.get('/api/services/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;

    const result = await pool.query(`
      SELECT s.*, sc.name as category_name
      FROM services s
      LEFT JOIN service_categories sc ON s.category_id = sc.id
      WHERE (s.id::text = $1 OR s.slug = $1) AND s.is_active = true
    `, [identifier]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

// ==========================================
// CLIENT ENDPOINTS
// ==========================================

// Get all clients
app.get('/api/clients', authenticateToken, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM client_overview WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    query += ' ORDER BY company_name';

    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// Get single client
app.get('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const client = result.rows[0];

    // Get projects
    const projects = await pool.query(
      'SELECT * FROM projects WHERE client_id = $1 ORDER BY created_at DESC',
      [id]
    );
    client.projects = projects.rows;

    // Get invoices
    const invoices = await pool.query(
      'SELECT * FROM invoices WHERE client_id = $1 ORDER BY invoice_date DESC',
      [id]
    );
    client.invoices = invoices.rows;

    res.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// Create client
app.post('/api/clients', authenticateToken, async (req, res) => {
  try {
    const {
      company_name, industry, website_url, contact_name, contact_email,
      contact_phone, address_line1, city, state, postal_code, country,
      company_size, monthly_budget, lead_source, notes
    } = req.body;

    const result = await pool.query(`
      INSERT INTO clients
      (company_name, industry, website_url, contact_name, contact_email, contact_phone,
       address_line1, city, state, postal_code, country, company_size, monthly_budget,
       lead_source, assigned_account_manager, notes, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'prospect')
      RETURNING *
    `, [company_name, industry, website_url, contact_name, contact_email, contact_phone,
        address_line1, city, state, postal_code, country || 'US', company_size,
        monthly_budget, lead_source, req.user.id, notes]);

    res.status(201).json({
      message: 'Client created successfully',
      client: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// Update client
app.patch('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;

    const keys = Object.keys(fields);
    const values = Object.values(fields);

    if (keys.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
    const query = `UPDATE clients SET ${setClause}, last_contact = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`;

    const result = await pool.query(query, [id, ...values]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// ==========================================
// PROJECT ENDPOINTS
// ==========================================

// Get all projects
app.get('/api/projects', async (req, res) => {
  try {
    const { status, case_study, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT p.*, c.company_name as client_name
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND p.status = $${paramCount}`;
      params.push(status);
    }

    if (case_study === 'true') {
      query += ' AND p.is_case_study = true AND p.is_published = true';
    }

    query += ' ORDER BY p.created_at DESC';

    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get single project
app.get('/api/projects/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;

    const result = await pool.query(`
      SELECT p.*, c.company_name as client_name, c.industry
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE p.id::text = $1 OR p.slug = $1
    `, [identifier]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = result.rows[0];

    // Get team members
    const team = await pool.query(`
      SELECT tm.*, pt.role as project_role
      FROM project_team pt
      JOIN team_members tm ON pt.team_member_id = tm.id
      WHERE pt.project_id = $1
    `, [project.id]);
    project.team = team.rows;

    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create project
app.post('/api/projects', authenticateToken, async (req, res) => {
  try {
    const {
      client_id, project_name, slug, project_type, services,
      description, budget, timeline_start, timeline_end
    } = req.body;

    const result = await pool.query(`
      INSERT INTO projects
      (client_id, project_name, slug, project_type, services, description,
       budget, timeline_start, timeline_end, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
      RETURNING *
    `, [client_id, project_name, slug, project_type, JSON.stringify(services),
        description, budget, timeline_start, timeline_end]);

    res.status(201).json({
      message: 'Project created successfully',
      project: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
app.patch('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;

    const keys = Object.keys(fields);
    const values = Object.values(fields);

    if (keys.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
    const query = `UPDATE projects SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`;

    const result = await pool.query(query, [id, ...values]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// ==========================================
// TESTIMONIAL ENDPOINTS
// ==========================================

// Get testimonials
app.get('/api/testimonials', async (req, res) => {
  try {
    const { featured, approved = 'true' } = req.query;

    let query = 'SELECT * FROM testimonials WHERE 1=1';

    if (approved === 'true') {
      query += ' AND is_approved = true';
    }

    if (featured === 'true') {
      query += ' AND is_featured = true';
    }

    query += ' ORDER BY display_order, created_at DESC';

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

// ==========================================
// BLOG ENDPOINTS
// ==========================================

// Get blog categories
app.get('/api/blog/categories', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM blog_categories ORDER BY display_order, name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching blog categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get blog posts
app.get('/api/blog/posts', async (req, res) => {
  try {
    const { category_id, published = 'true', limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT bp.*, bc.name as category_name,
             tm.first_name || ' ' || tm.last_name as author_name
      FROM blog_posts bp
      LEFT JOIN blog_categories bc ON bp.category_id = bc.id
      LEFT JOIN team_members tm ON bp.author_id = tm.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (published === 'true') {
      query += ' AND bp.is_published = true';
    }

    if (category_id) {
      paramCount++;
      query += ` AND bp.category_id = $${paramCount}`;
      params.push(category_id);
    }

    query += ' ORDER BY bp.published_at DESC, bp.created_at DESC';

    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

// Get single blog post
app.get('/api/blog/posts/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const result = await pool.query(`
      SELECT bp.*, bc.name as category_name,
             tm.first_name || ' ' || tm.last_name as author_name,
             tm.bio as author_bio, tm.avatar_url as author_avatar
      FROM blog_posts bp
      LEFT JOIN blog_categories bc ON bp.category_id = bc.id
      LEFT JOIN team_members tm ON bp.author_id = tm.id
      WHERE bp.slug = $1 AND bp.is_published = true
    `, [slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Increment view count
    await pool.query(
      'UPDATE blog_posts SET view_count = view_count + 1 WHERE slug = $1',
      [slug]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
});

// ==========================================
// LEAD INQUIRY ENDPOINTS
// ==========================================

// Create lead inquiry
app.post('/api/leads', async (req, res) => {
  try {
    const {
      inquiry_type = 'general', first_name, last_name, email, phone,
      company, website_url, service_interest, budget_range, timeline,
      message, source, utm_source, utm_medium, utm_campaign
    } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if client exists
    let client_id = null;
    const existingClient = await pool.query(
      'SELECT id FROM clients WHERE contact_email = $1',
      [email]
    );

    if (existingClient.rows.length > 0) {
      client_id = existingClient.rows[0].id;
    }

    const result = await pool.query(`
      INSERT INTO lead_inquiries
      (client_id, inquiry_type, first_name, last_name, email, phone, company,
       website_url, service_interest, budget_range, timeline, message,
       source, utm_source, utm_medium, utm_campaign, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'new')
      RETURNING *
    `, [client_id, inquiry_type, first_name, last_name, email, phone, company,
        website_url, JSON.stringify(service_interest), budget_range, timeline,
        message, source, utm_source, utm_medium, utm_campaign]);

    res.status(201).json({
      message: 'Inquiry submitted successfully. We\'ll be in touch soon!',
      inquiry_id: result.rows[0].id
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ error: 'Failed to submit inquiry' });
  }
});

// Get all leads
app.get('/api/leads', authenticateToken, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM lead_inquiries WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// Update lead status
app.patch('/api/leads/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assigned_to } = req.body;

    const result = await pool.query(`
      UPDATE lead_inquiries
      SET status = COALESCE($1, status),
          assigned_to = COALESCE($2, assigned_to),
          followed_up_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [status, assigned_to, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// ==========================================
// AEO AUDIT ENDPOINTS
// ==========================================

// Request AEO audit
app.post('/api/audits', async (req, res) => {
  try {
    const {
      website_url, industry, contact_email, contact_name,
      current_traffic, main_competitors
    } = req.body;

    if (!website_url || !contact_email) {
      return res.status(400).json({ error: 'Website URL and email are required' });
    }

    // Check for existing lead
    let lead_inquiry_id = null;
    const leadResult = await pool.query(
      'SELECT id FROM lead_inquiries WHERE email = $1 ORDER BY created_at DESC LIMIT 1',
      [contact_email]
    );

    if (leadResult.rows.length > 0) {
      lead_inquiry_id = leadResult.rows[0].id;
    }

    const result = await pool.query(`
      INSERT INTO audit_requests
      (lead_inquiry_id, website_url, industry, contact_email, contact_name,
       current_traffic, main_competitors, audit_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING *
    `, [lead_inquiry_id, website_url, industry, contact_email, contact_name,
        current_traffic, main_competitors]);

    res.status(201).json({
      message: 'Audit request received! We\'ll send your free AEO audit within 48 hours.',
      audit_id: result.rows[0].id
    });
  } catch (error) {
    console.error('Error creating audit request:', error);
    res.status(500).json({ error: 'Failed to submit audit request' });
  }
});

// Get audit requests
app.get('/api/audits', authenticateToken, async (req, res) => {
  try {
    const { status = 'pending' } = req.query;

    const result = await pool.query(
      'SELECT * FROM audit_requests WHERE audit_status = $1 ORDER BY created_at DESC',
      [status]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching audits:', error);
    res.status(500).json({ error: 'Failed to fetch audits' });
  }
});

// ==========================================
// PROPOSAL ENDPOINTS
// ==========================================

// Create proposal
app.post('/api/proposals', authenticateToken, async (req, res) => {
  try {
    const {
      client_id, lead_inquiry_id, title, services, scope_of_work,
      deliverables, timeline_weeks, total_amount, valid_until
    } = req.body;

    const proposal_number = `PROP-${Date.now()}`;

    const result = await pool.query(`
      INSERT INTO proposals
      (client_id, lead_inquiry_id, proposal_number, title, services,
       scope_of_work, deliverables, timeline_weeks, total_amount,
       valid_until, created_by, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'draft')
      RETURNING *
    `, [client_id, lead_inquiry_id, proposal_number, title,
        JSON.stringify(services), scope_of_work, JSON.stringify(deliverables),
        timeline_weeks, total_amount, valid_until, req.user.id]);

    res.status(201).json({
      message: 'Proposal created successfully',
      proposal: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating proposal:', error);
    res.status(500).json({ error: 'Failed to create proposal' });
  }
});

// Get proposals
app.get('/api/proposals', authenticateToken, async (req, res) => {
  try {
    const { client_id, status } = req.query;

    let query = `
      SELECT p.*, c.company_name as client_name
      FROM proposals p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (client_id) {
      paramCount++;
      query += ` AND p.client_id = $${paramCount}`;
      params.push(client_id);
    }

    if (status) {
      paramCount++;
      query += ` AND p.status = $${paramCount}`;
      params.push(status);
    }

    query += ' ORDER BY p.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    res.status(500).json({ error: 'Failed to fetch proposals' });
  }
});

// Update proposal status
app.patch('/api/proposals/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    let updateFields = { status };
    let timestamp = null;

    if (status === 'sent') timestamp = 'sent_at';
    if (status === 'accepted') timestamp = 'accepted_at';
    if (status === 'rejected') timestamp = 'rejected_at';

    const setClause = timestamp
      ? `status = $1, ${timestamp} = CURRENT_TIMESTAMP`
      : 'status = $1';

    const result = await pool.query(
      `UPDATE proposals SET ${setClause} WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating proposal:', error);
    res.status(500).json({ error: 'Failed to update proposal' });
  }
});

// ==========================================
// INVOICE ENDPOINTS
// ==========================================

// Create invoice
app.post('/api/invoices', authenticateToken, async (req, res) => {
  try {
    const {
      client_id, contract_id, project_id, invoice_date, due_date,
      line_items, tax_amount = 0, discount_amount = 0, notes
    } = req.body;

    const invoice_number = `INV-${Date.now()}`;

    // Calculate totals
    let subtotal = 0;
    for (const item of line_items) {
      subtotal += item.quantity * item.unit_price;
    }

    const total_amount = subtotal + tax_amount - discount_amount;

    const result = await pool.query(`
      INSERT INTO invoices
      (client_id, contract_id, project_id, invoice_number, invoice_date,
       due_date, subtotal, tax_amount, discount_amount, total_amount,
       status, payment_status, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'draft', 'unpaid', $11)
      RETURNING *
    `, [client_id, contract_id, project_id, invoice_number, invoice_date,
        due_date, subtotal, tax_amount, discount_amount, total_amount, notes]);

    const invoice = result.rows[0];

    // Create line items
    for (const item of line_items) {
      await pool.query(`
        INSERT INTO invoice_line_items
        (invoice_id, description, quantity, unit_price, total_price, service_id)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [invoice.id, item.description, item.quantity, item.unit_price,
          item.quantity * item.unit_price, item.service_id]);
    }

    res.status(201).json({
      message: 'Invoice created successfully',
      invoice
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// Get invoices
app.get('/api/invoices', authenticateToken, async (req, res) => {
  try {
    const { client_id, payment_status } = req.query;

    let query = `
      SELECT i.*, c.company_name as client_name
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (client_id) {
      paramCount++;
      query += ` AND i.client_id = $${paramCount}`;
      params.push(client_id);
    }

    if (payment_status) {
      paramCount++;
      query += ` AND i.payment_status = $${paramCount}`;
      params.push(payment_status);
    }

    query += ' ORDER BY i.invoice_date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// ==========================================
// CITATION TRACKING ENDPOINTS
// ==========================================

// Record citation
app.post('/api/citations', authenticateToken, async (req, res) => {
  try {
    const {
      client_id, project_id, source, query_text, cited_url,
      cited_content, answer_engine, position, citation_date, is_positive
    } = req.body;

    const result = await pool.query(`
      INSERT INTO citations
      (client_id, project_id, source, query_text, cited_url, cited_content,
       answer_engine, position, citation_date, is_positive)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [client_id, project_id, source, query_text, cited_url, cited_content,
        answer_engine, position, citation_date, is_positive !== false]);

    res.status(201).json({
      message: 'Citation tracked successfully',
      citation: result.rows[0]
    });
  } catch (error) {
    console.error('Error tracking citation:', error);
    res.status(500).json({ error: 'Failed to track citation' });
  }
});

// Get citations
app.get('/api/citations', authenticateToken, async (req, res) => {
  try {
    const { client_id, project_id, answer_engine } = req.query;

    let query = 'SELECT * FROM citations WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (client_id) {
      paramCount++;
      query += ` AND client_id = $${paramCount}`;
      params.push(client_id);
    }

    if (project_id) {
      paramCount++;
      query += ` AND project_id = $${paramCount}`;
      params.push(project_id);
    }

    if (answer_engine) {
      paramCount++;
      query += ` AND answer_engine = $${paramCount}`;
      params.push(answer_engine);
    }

    query += ' ORDER BY citation_date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching citations:', error);
    res.status(500).json({ error: 'Failed to fetch citations' });
  }
});

// ==========================================
// CONTACT FORM ENDPOINTS
// ==========================================

// Submit contact form
app.post('/api/contact', async (req, res) => {
  try {
    const { form_type = 'general', name, email, phone, company, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    await pool.query(`
      INSERT INTO contact_submissions
      (form_type, name, email, phone, company, subject, message, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'new')
    `, [form_type, name, email, phone, company, subject, message]);

    res.status(201).json({
      message: 'Thank you for your message! We\'ll get back to you soon.'
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({ error: 'Failed to submit form' });
  }
});

// ==========================================
// TEAM MEMBER ENDPOINTS
// ==========================================

// Get team members
app.get('/api/team', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, first_name, last_name, role, department, bio, expertise, avatar_url
      FROM team_members
      WHERE is_active = true
      ORDER BY first_name, last_name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

// ==========================================
// ERROR HANDLING
// ==========================================

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(`Peak Visibility API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});
