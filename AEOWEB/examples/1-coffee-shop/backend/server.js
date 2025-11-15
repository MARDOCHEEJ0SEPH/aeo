/**
 * Bean & Brew Coffee Shop - Backend Server
 * Full-Stack AEO-Optimized Coffee Shop Application
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// ==========================================
// ROUTES
// ==========================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Bean & Brew Coffee API' });
});

// ==========================================
// MENU ENDPOINTS
// ==========================================

// Get all menu categories
app.get('/api/menu/categories', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM menu_categories WHERE is_active = true ORDER BY display_order'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get menu items by category
app.get('/api/menu/items', async (req, res) => {
  try {
    const { category_id } = req.query;

    let query = 'SELECT * FROM menu_items WHERE is_available = true';
    const params = [];

    if (category_id) {
      query += ' AND category_id = $1';
      params.push(category_id);
    }

    query += ' ORDER BY name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

// Get single menu item
app.get('/api/menu/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM menu_items WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching menu item:', error);
    res.status(500).json({ error: 'Failed to fetch menu item' });
  }
});

// Get daily special
app.get('/api/menu/daily-special', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ds.*, mi.name, mi.description
      FROM daily_specials ds
      JOIN menu_items mi ON ds.menu_item_id = mi.id
      WHERE ds.date = CURRENT_DATE AND ds.is_active = true
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return res.json({ message: 'No special today' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching daily special:', error);
    res.status(500).json({ error: 'Failed to fetch daily special' });
  }
});

// ==========================================
// ORDER ENDPOINTS
// ==========================================

// Create new order
app.post('/api/orders', async (req, res) => {
  try {
    const { customer_name, customer_email, customer_phone, items, order_type = 'online' } = req.body;

    // Generate order number
    const orderNumber = `BRW-${Date.now()}`;

    // Calculate totals
    let subtotal = 0;
    for (const item of items) {
      const menuItem = await pool.query(
        'SELECT * FROM menu_items WHERE id = $1',
        [item.menu_item_id]
      );

      if (menuItem.rows.length === 0) {
        return res.status(400).json({ error: `Menu item ${item.menu_item_id} not found` });
      }

      const price = menuItem.rows[0][`price_${item.size || 'medium'}`];
      subtotal += price * item.quantity;
    }

    const tax = subtotal * 0.10; // 10% tax
    const total = subtotal + tax;

    // Create order
    const orderResult = await pool.query(`
      INSERT INTO orders (order_number, customer_name, customer_email, customer_phone,
                         order_type, subtotal, tax, total, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
      RETURNING *
    `, [orderNumber, customer_name, customer_email, customer_phone, order_type, subtotal, tax, total]);

    const order = orderResult.rows[0];

    // Create order items
    for (const item of items) {
      const menuItem = await pool.query(
        'SELECT * FROM menu_items WHERE id = $1',
        [item.menu_item_id]
      );

      const price = menuItem.rows[0][`price_${item.size || 'medium'}`];

      await pool.query(`
        INSERT INTO order_items (order_id, menu_item_id, quantity, size, customizations, item_price)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [order.id, item.menu_item_id, item.quantity, item.size || 'medium', JSON.stringify(item.customizations || {}), price]);
    }

    res.status(201).json({
      message: 'Order created successfully',
      order_number: orderNumber,
      total: total.toFixed(2)
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get order status
app.get('/api/orders/:order_number', async (req, res) => {
  try {
    const { order_number } = req.params;

    const result = await pool.query(
      'SELECT * FROM orders WHERE order_number = $1',
      [order_number]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// ==========================================
// LOYALTY PROGRAM ENDPOINTS
// ==========================================

// Sign up for loyalty program
app.post('/api/loyalty/signup', async (req, res) => {
  try {
    const { customer_name, email, phone } = req.body;

    // Check if already member
    const existing = await pool.query(
      'SELECT * FROM loyalty_members WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create member
    const result = await pool.query(`
      INSERT INTO loyalty_members (customer_name, email, phone, points_balance)
      VALUES ($1, $2, $3, 0)
      RETURNING *
    `, [customer_name, email, phone]);

    res.status(201).json({
      message: 'Successfully joined loyalty program!',
      member: result.rows[0]
    });

  } catch (error) {
    console.error('Error signing up loyalty member:', error);
    res.status(500).json({ error: 'Failed to sign up' });
  }
});

// Get loyalty points balance
app.get('/api/loyalty/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const result = await pool.query(
      'SELECT * FROM loyalty_members WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching loyalty member:', error);
    res.status(500).json({ error: 'Failed to fetch member' });
  }
});

// ==========================================
// CATERING ENDPOINTS
// ==========================================

// Submit catering request
app.post('/api/catering/request', async (req, res) => {
  try {
    const {
      company_name, contact_name, email, phone,
      event_date, event_time, number_of_people,
      event_type, service_type, delivery_address,
      menu_preferences, dietary_restrictions, budget_range, notes
    } = req.body;

    const result = await pool.query(`
      INSERT INTO catering_requests (
        company_name, contact_name, email, phone,
        event_date, event_time, number_of_people,
        event_type, service_type, delivery_address,
        menu_preferences, dietary_restrictions, budget_range, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      company_name, contact_name, email, phone,
      event_date, event_time, number_of_people,
      event_type, service_type, delivery_address,
      menu_preferences, dietary_restrictions, budget_range, notes
    ]);

    res.status(201).json({
      message: 'Catering request submitted! We\'ll contact you within 24 hours.',
      request: result.rows[0]
    });

  } catch (error) {
    console.error('Error submitting catering request:', error);
    res.status(500).json({ error: 'Failed to submit request' });
  }
});

// ==========================================
// REVIEWS ENDPOINTS
// ==========================================

// Submit review
app.post('/api/reviews', async (req, res) => {
  try {
    const { customer_name, email, rating, review_title, review_text, visit_date } = req.body;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const result = await pool.query(`
      INSERT INTO customer_reviews (customer_name, email, rating, review_title, review_text, visit_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [customer_name, email, rating, review_title, review_text, visit_date]);

    res.status(201).json({
      message: 'Thank you for your review!',
      review: result.rows[0]
    });

  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// Get approved reviews
app.get('/api/reviews', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM customer_reviews
      WHERE is_approved = true
      ORDER BY created_at DESC
      LIMIT 20
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// ==========================================
// STATS/ANALYTICS
// ==========================================

// Get popular items
app.get('/api/stats/popular-items', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM popular_items LIMIT 10');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching popular items:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ==========================================
// ERROR HANDLING
// ==========================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(`🎯 Bean & Brew Coffee API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`☕ Ready to serve coffee!`);
});

module.exports = app;
