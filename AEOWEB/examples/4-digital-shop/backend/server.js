/**
 * DesignKit Pro Digital Shop - Backend Server
 * Full-Stack AEO-Optimized Digital Product Marketplace
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
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3004;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'designkit_pro',
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

// License Key Generation
function generateLicenseKey() {
  const prefix = process.env.LICENSE_KEY_PREFIX || 'DKP';
  const parts = [];
  for (let i = 0; i < 4; i++) {
    parts.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return `${prefix}-${parts.join('-')}`;
}

// ==========================================
// ROUTES
// ==========================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'DesignKit Pro API' });
});

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name, company } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const existing = await pool.query(
      'SELECT id FROM customers WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(`
      INSERT INTO customers (email, password_hash, first_name, last_name, company)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, first_name, last_name, company
    `, [email, password_hash, first_name, last_name, company]);

    const customer = result.rows[0];

    const token = jwt.sign(
      { id: customer.id, email: customer.email },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      customer,
      token
    });
  } catch (error) {
    console.error('Error registering:', error);
    res.status(500).json({ error: 'Failed to register' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      'SELECT * FROM customers WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const customer = result.rows[0];

    const valid = await bcrypt.compare(password, customer.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await pool.query(
      'UPDATE customers SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [customer.id]
    );

    const token = jwt.sign(
      { id: customer.id, email: customer.email },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Login successful',
      customer: {
        id: customer.id,
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name
      },
      token
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// ==========================================
// PRODUCT ENDPOINTS
// ==========================================

// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM product_categories
      WHERE is_active = true
      ORDER BY display_order, name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const { category_id, search, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT p.*,
             c.name as category_name,
             COALESCE(AVG(pr.rating), 0) as avg_rating,
             COUNT(DISTINCT pr.id) as review_count,
             COUNT(DISTINCT l.id) as total_sales
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      LEFT JOIN product_reviews pr ON p.id = pr.product_id AND pr.is_approved = true
      LEFT JOIN licenses l ON p.id = l.product_id
      WHERE p.is_active = true
    `;
    const params = [];
    let paramCount = 0;

    if (category_id) {
      paramCount++;
      query += ` AND p.category_id = $${paramCount}`;
      params.push(category_id);
    }

    if (search) {
      paramCount++;
      query += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ' GROUP BY p.id, c.name ORDER BY p.created_at DESC';

    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product
app.get('/api/products/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;

    const result = await pool.query(`
      SELECT p.*,
             c.name as category_name,
             COALESCE(AVG(pr.rating), 0) as avg_rating,
             COUNT(DISTINCT pr.id) as review_count,
             COUNT(DISTINCT l.id) as total_sales
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      LEFT JOIN product_reviews pr ON p.id = pr.product_id AND pr.is_approved = true
      LEFT JOIN licenses l ON p.id = l.product_id
      WHERE (p.id::text = $1 OR p.slug = $1) AND p.is_active = true
      GROUP BY p.id, c.name
    `, [identifier]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = result.rows[0];

    // Get current version
    const versionResult = await pool.query(
      'SELECT * FROM product_versions WHERE product_id = $1 AND is_current = true ORDER BY release_date DESC LIMIT 1',
      [product.id]
    );

    if (versionResult.rows.length > 0) {
      product.current_version = versionResult.rows[0];
    }

    // Get all versions
    const versionsResult = await pool.query(
      'SELECT * FROM product_versions WHERE product_id = $1 ORDER BY release_date DESC',
      [product.id]
    );
    product.versions = versionsResult.rows;

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Get product documentation
app.get('/api/products/:id/docs', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM product_documentation WHERE product_id = $1 AND is_published = true ORDER BY display_order, title',
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching documentation:', error);
    res.status(500).json({ error: 'Failed to fetch documentation' });
  }
});

// ==========================================
// ORDER & PURCHASE ENDPOINTS
// ==========================================

// Create order
app.post('/api/orders', authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const customer_id = req.user.id;
    const { products, payment_method, affiliate_code } = req.body;

    if (!products || products.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No products selected' });
    }

    // Calculate totals
    let subtotal = 0;
    const orderProducts = [];

    for (const item of products) {
      const productResult = await client.query(
        'SELECT * FROM products WHERE id = $1 AND is_active = true',
        [item.product_id]
      );

      if (productResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: `Product ${item.product_id} not found` });
      }

      const product = productResult.rows[0];
      subtotal += product.price * (item.quantity || 1);
      orderProducts.push({ product, quantity: item.quantity || 1 });
    }

    let discount_amount = 0;
    let affiliate_id = null;
    let affiliate_commission = 0;

    // Check affiliate code
    if (affiliate_code) {
      const affiliateResult = await client.query(
        'SELECT * FROM affiliates WHERE affiliate_code = $1 AND status = \'active\'',
        [affiliate_code]
      );

      if (affiliateResult.rows.length > 0) {
        const affiliate = affiliateResult.rows[0];
        affiliate_id = affiliate.id;
        affiliate_commission = (subtotal * affiliate.commission_rate) / 100;
      }
    }

    const tax_amount = subtotal * 0.0; // Digital products often tax-exempt or handled at checkout
    const total_amount = subtotal - discount_amount + tax_amount;

    // Generate order number
    const order_number = `DK-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Create order
    const orderResult = await client.query(`
      INSERT INTO orders
      (customer_id, order_number, order_status, subtotal, discount_amount, tax_amount,
       total_amount, payment_method, payment_status, affiliate_id, affiliate_commission)
      VALUES ($1, $2, 'completed', $3, $4, $5, $6, $7, 'completed', $8, $9)
      RETURNING *
    `, [customer_id, order_number, subtotal, discount_amount, tax_amount, total_amount,
        payment_method, affiliate_id, affiliate_commission]);

    const order = orderResult.rows[0];

    // Create order items and licenses
    for (const { product, quantity } of orderProducts) {
      // Create order item
      await client.query(`
        INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [order.id, product.id, product.name, quantity, product.price, product.price * quantity]);

      // Generate license for each product
      for (let i = 0; i < quantity; i++) {
        const license_key = generateLicenseKey();

        await client.query(`
          INSERT INTO licenses
          (customer_id, product_id, order_id, license_key, license_type, status, max_activations)
          VALUES ($1, $2, $3, $4, 'single', 'active', $5)
        `, [customer_id, product.id, order.id, license_key, product.max_activations || 5]);

        // Update order item with license key
        await client.query(
          'UPDATE order_items SET license_key = $1 WHERE order_id = $2 AND product_id = $3',
          [license_key, order.id, product.id]
        );
      }

      // Update product download count
      await client.query(
        'UPDATE products SET total_downloads = total_downloads + $1 WHERE id = $2',
        [quantity, product.id]
      );
    }

    // Create affiliate commission record
    if (affiliate_id && affiliate_commission > 0) {
      await client.query(`
        INSERT INTO affiliate_commissions (affiliate_id, order_id, commission_amount, commission_rate, status)
        SELECT $1, $2, $3, commission_rate, 'pending'
        FROM affiliates WHERE id = $1
      `, [affiliate_id, order.id, affiliate_commission]);

      // Update affiliate stats
      await client.query(
        'UPDATE affiliates SET total_referrals = total_referrals + 1, total_earnings = total_earnings + $1 WHERE id = $2',
        [affiliate_commission, affiliate_id]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Purchase successful',
      order_number: order.order_number,
      order_id: order.id,
      total: total_amount.toFixed(2)
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    client.release();
  }
});

// Get customer orders
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const customer_id = req.user.id;

    const result = await pool.query(`
      SELECT o.*,
             COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.customer_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [customer_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get order details
app.get('/api/orders/:order_number', authenticateToken, async (req, res) => {
  try {
    const { order_number } = req.params;
    const customer_id = req.user.id;

    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE order_number = $1 AND customer_id = $2',
      [order_number, customer_id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Get order items
    const itemsResult = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [order.id]
    );
    order.items = itemsResult.rows;

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// ==========================================
// LICENSE ENDPOINTS
// ==========================================

// Get customer licenses
app.get('/api/licenses', authenticateToken, async (req, res) => {
  try {
    const customer_id = req.user.id;

    const result = await pool.query(`
      SELECT l.*,
             p.name as product_name,
             p.slug as product_slug,
             pv.version_number as current_version
      FROM licenses l
      JOIN products p ON l.product_id = p.id
      LEFT JOIN product_versions pv ON p.id = pv.product_id AND pv.is_current = true
      WHERE l.customer_id = $1
      ORDER BY l.created_at DESC
    `, [customer_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching licenses:', error);
    res.status(500).json({ error: 'Failed to fetch licenses' });
  }
});

// Validate license
app.post('/api/licenses/validate', async (req, res) => {
  try {
    const { license_key, domain } = req.body;

    const result = await pool.query(
      'SELECT * FROM licenses WHERE license_key = $1',
      [license_key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ valid: false, error: 'Invalid license key' });
    }

    const license = result.rows[0];

    if (license.status !== 'active') {
      return res.status(400).json({ valid: false, error: 'License is not active' });
    }

    if (license.valid_until && new Date(license.valid_until) < new Date()) {
      return res.status(400).json({ valid: false, error: 'License has expired' });
    }

    // Update last validated
    await pool.query(
      'UPDATE licenses SET last_validated = CURRENT_TIMESTAMP WHERE id = $1',
      [license.id]
    );

    res.json({
      valid: true,
      license_type: license.license_type,
      product_id: license.product_id,
      activations_remaining: license.max_activations - license.activation_count
    });
  } catch (error) {
    console.error('Error validating license:', error);
    res.status(500).json({ error: 'Failed to validate license' });
  }
});

// Activate license
app.post('/api/licenses/activate', authenticateToken, async (req, res) => {
  try {
    const { license_key, domain, activation_data } = req.body;
    const customer_id = req.user.id;

    const licenseResult = await pool.query(
      'SELECT * FROM licenses WHERE license_key = $1 AND customer_id = $2',
      [license_key, customer_id]
    );

    if (licenseResult.rows.length === 0) {
      return res.status(404).json({ error: 'License not found' });
    }

    const license = licenseResult.rows[0];

    if (license.activation_count >= license.max_activations) {
      return res.status(400).json({ error: 'Maximum activations reached' });
    }

    // Check if domain already activated
    const existingActivation = await pool.query(
      'SELECT * FROM license_activations WHERE license_id = $1 AND domain = $2 AND is_active = true',
      [license.id, domain]
    );

    if (existingActivation.rows.length > 0) {
      return res.status(400).json({ error: 'Domain already activated' });
    }

    const activation_token = uuidv4();

    await pool.query(`
      INSERT INTO license_activations (license_id, activation_token, domain, activation_data)
      VALUES ($1, $2, $3, $4)
    `, [license.id, activation_token, domain, JSON.stringify(activation_data || {})]);

    await pool.query(
      'UPDATE licenses SET activation_count = activation_count + 1 WHERE id = $1',
      [license.id]
    );

    res.json({
      message: 'License activated successfully',
      activation_token,
      activations_remaining: license.max_activations - license.activation_count - 1
    });
  } catch (error) {
    console.error('Error activating license:', error);
    res.status(500).json({ error: 'Failed to activate license' });
  }
});

// Deactivate license
app.post('/api/licenses/deactivate', authenticateToken, async (req, res) => {
  try {
    const { license_key, activation_token } = req.body;
    const customer_id = req.user.id;

    const licenseResult = await pool.query(
      'SELECT * FROM licenses WHERE license_key = $1 AND customer_id = $2',
      [license_key, customer_id]
    );

    if (licenseResult.rows.length === 0) {
      return res.status(404).json({ error: 'License not found' });
    }

    const license = licenseResult.rows[0];

    await pool.query(`
      UPDATE license_activations
      SET is_active = false, deactivated_at = CURRENT_TIMESTAMP
      WHERE license_id = $1 AND activation_token = $2
    `, [license.id, activation_token]);

    await pool.query(
      'UPDATE licenses SET activation_count = activation_count - 1 WHERE id = $1',
      [license.id]
    );

    res.json({ message: 'License deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating license:', error);
    res.status(500).json({ error: 'Failed to deactivate license' });
  }
});

// ==========================================
// DOWNLOAD ENDPOINTS
// ==========================================

// Get download link
app.post('/api/downloads', authenticateToken, async (req, res) => {
  try {
    const { product_id, version_id } = req.body;
    const customer_id = req.user.id;

    // Verify customer has license
    const licenseResult = await pool.query(
      'SELECT * FROM licenses WHERE customer_id = $1 AND product_id = $2 AND status = \'active\'',
      [customer_id, product_id]
    );

    if (licenseResult.rows.length === 0) {
      return res.status(403).json({ error: 'No active license for this product' });
    }

    const license = licenseResult.rows[0];

    // Get product files
    const filesResult = await pool.query(
      'SELECT * FROM product_files WHERE product_id = $1 AND version_id = $2',
      [product_id, version_id]
    );

    if (filesResult.rows.length === 0) {
      return res.status(404).json({ error: 'No files found for this version' });
    }

    // Log download
    await pool.query(`
      INSERT INTO downloads (customer_id, product_id, version_id, license_id)
      VALUES ($1, $2, $3, $4)
    `, [customer_id, product_id, version_id, license.id]);

    // Update download counts
    await pool.query(
      'UPDATE product_versions SET download_count = download_count + 1 WHERE id = $1',
      [version_id]
    );

    res.json({
      message: 'Download links generated',
      files: filesResult.rows,
      license_key: license.license_key
    });
  } catch (error) {
    console.error('Error generating download:', error);
    res.status(500).json({ error: 'Failed to generate download' });
  }
});

// Get download history
app.get('/api/downloads', authenticateToken, async (req, res) => {
  try {
    const customer_id = req.user.id;

    const result = await pool.query(`
      SELECT d.*,
             p.name as product_name,
             pv.version_number
      FROM downloads d
      JOIN products p ON d.product_id = p.id
      LEFT JOIN product_versions pv ON d.version_id = pv.id
      WHERE d.customer_id = $1
      ORDER BY d.downloaded_at DESC
      LIMIT 50
    `, [customer_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching downloads:', error);
    res.status(500).json({ error: 'Failed to fetch downloads' });
  }
});

// ==========================================
// REVIEW ENDPOINTS
// ==========================================

// Get product reviews
app.get('/api/products/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT pr.*,
             c.first_name,
             c.last_name,
             c.company
      FROM product_reviews pr
      JOIN customers c ON pr.customer_id = c.id
      WHERE pr.product_id = $1 AND pr.is_approved = true
      ORDER BY pr.created_at DESC
    `, [id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Create review
app.post('/api/products/:id/reviews', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const customer_id = req.user.id;
    const { rating, review_title, review_text, pros, cons, order_id } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if customer purchased product
    let is_verified_purchase = false;
    if (order_id) {
      const purchase = await pool.query(`
        SELECT oi.id FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.id = $1 AND o.customer_id = $2 AND oi.product_id = $3
      `, [order_id, customer_id, id]);

      is_verified_purchase = purchase.rows.length > 0;
    }

    const result = await pool.query(`
      INSERT INTO product_reviews
      (product_id, customer_id, order_id, rating, review_title, review_text, pros, cons, is_verified_purchase)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [id, customer_id, order_id, rating, review_title, review_text, pros, cons, is_verified_purchase]);

    res.status(201).json({
      message: 'Review submitted for approval',
      review: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// ==========================================
// AFFILIATE ENDPOINTS
// ==========================================

// Create affiliate account
app.post('/api/affiliates/register', authenticateToken, async (req, res) => {
  try {
    const customer_id = req.user.id;
    const { payout_email, payout_method } = req.body;

    // Check if already an affiliate
    const existing = await pool.query(
      'SELECT * FROM affiliates WHERE customer_id = $1',
      [customer_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Already registered as affiliate' });
    }

    // Generate unique affiliate code
    const affiliate_code = `DKP${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    const commission_rate = process.env.AFFILIATE_DEFAULT_COMMISSION_RATE || 20;

    const result = await pool.query(`
      INSERT INTO affiliates (customer_id, affiliate_code, commission_rate, payout_email, payout_method)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [customer_id, affiliate_code, commission_rate, payout_email, payout_method]);

    res.status(201).json({
      message: 'Affiliate account created',
      affiliate: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating affiliate:', error);
    res.status(500).json({ error: 'Failed to create affiliate account' });
  }
});

// Get affiliate stats
app.get('/api/affiliates/stats', authenticateToken, async (req, res) => {
  try {
    const customer_id = req.user.id;

    const result = await pool.query(
      'SELECT * FROM affiliate_earnings WHERE id = (SELECT id FROM affiliates WHERE customer_id = $1)',
      [customer_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not registered as affiliate' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching affiliate stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ==========================================
// SUPPORT TICKET ENDPOINTS
// ==========================================

// Create support ticket
app.post('/api/support/tickets', authenticateToken, async (req, res) => {
  try {
    const customer_id = req.user.id;
    const { product_id, subject, message, priority = 'normal' } = req.body;

    const ticket_number = `TKT-${Date.now()}`;

    const ticketResult = await pool.query(`
      INSERT INTO support_tickets (customer_id, product_id, ticket_number, subject, priority, status)
      VALUES ($1, $2, $3, $4, $5, 'open')
      RETURNING *
    `, [customer_id, product_id, ticket_number, subject, priority]);

    const ticket = ticketResult.rows[0];

    // Add initial message
    await pool.query(`
      INSERT INTO support_ticket_messages (ticket_id, sender_type, sender_id, message)
      VALUES ($1, 'customer', $2, $3)
    `, [ticket.id, customer_id, message]);

    res.status(201).json({
      message: 'Support ticket created',
      ticket
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// Get customer tickets
app.get('/api/support/tickets', authenticateToken, async (req, res) => {
  try {
    const customer_id = req.user.id;

    const result = await pool.query(`
      SELECT st.*,
             p.name as product_name,
             COUNT(stm.id) as message_count
      FROM support_tickets st
      LEFT JOIN products p ON st.product_id = p.id
      LEFT JOIN support_ticket_messages stm ON st.id = stm.ticket_id
      WHERE st.customer_id = $1
      GROUP BY st.id, p.name
      ORDER BY st.created_at DESC
    `, [customer_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Get ticket messages
app.get('/api/support/tickets/:ticket_number/messages', authenticateToken, async (req, res) => {
  try {
    const { ticket_number } = req.params;
    const customer_id = req.user.id;

    // Verify ticket belongs to customer
    const ticketResult = await pool.query(
      'SELECT * FROM support_tickets WHERE ticket_number = $1 AND customer_id = $2',
      [ticket_number, customer_id]
    );

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = ticketResult.rows[0];

    const messagesResult = await pool.query(
      'SELECT * FROM support_ticket_messages WHERE ticket_id = $1 AND is_internal = false ORDER BY created_at',
      [ticket.id]
    );

    res.json(messagesResult.rows);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Add message to ticket
app.post('/api/support/tickets/:ticket_number/messages', authenticateToken, async (req, res) => {
  try {
    const { ticket_number } = req.params;
    const { message } = req.body;
    const customer_id = req.user.id;

    const ticketResult = await pool.query(
      'SELECT * FROM support_tickets WHERE ticket_number = $1 AND customer_id = $2',
      [ticket_number, customer_id]
    );

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = ticketResult.rows[0];

    await pool.query(`
      INSERT INTO support_ticket_messages (ticket_id, sender_type, sender_id, message)
      VALUES ($1, 'customer', $2, $3)
    `, [ticket.id, customer_id, message]);

    await pool.query(
      'UPDATE support_tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [ticket.id]
    );

    res.json({ message: 'Message added successfully' });
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({ error: 'Failed to add message' });
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
  console.log(`DesignKit Pro API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});
