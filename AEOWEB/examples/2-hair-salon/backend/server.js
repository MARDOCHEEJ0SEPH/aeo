/**
 * Luxe Hair Studio - Backend API Server
 * AEO-optimized hair salon booking and management system
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'luxe_hair_studio',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('✓ Database connected successfully');
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Luxe Hair Studio API'
  });
});

// ==================== SERVICE CATEGORIES ====================

// Get all service categories
app.get('/api/services/categories', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM service_categories
      ORDER BY display_order, name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching service categories:', error);
    res.status(500).json({ error: 'Failed to fetch service categories' });
  }
});

// ==================== SERVICES ====================

// Get all services
app.get('/api/services', async (req, res) => {
  try {
    const { category_id, available_only } = req.query;

    let query = `
      SELECT s.*, sc.name as category_name, sc.slug as category_slug
      FROM services s
      LEFT JOIN service_categories sc ON s.category_id = sc.id
      WHERE 1=1
    `;
    const params = [];

    if (category_id) {
      params.push(category_id);
      query += ` AND s.category_id = $${params.length}`;
    }

    if (available_only === 'true') {
      query += ` AND s.is_available = true`;
    }

    query += ` ORDER BY sc.display_order, s.name`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Get single service by slug
app.get('/api/services/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await pool.query(`
      SELECT s.*, sc.name as category_name, sc.slug as category_slug
      FROM services s
      LEFT JOIN service_categories sc ON s.category_id = sc.id
      WHERE s.slug = $1
    `, [slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

// ==================== STYLISTS ====================

// Get all stylists
app.get('/api/stylists', async (req, res) => {
  try {
    const { active_only, accepting_clients } = req.query;

    let query = `SELECT * FROM stylists WHERE 1=1`;
    const params = [];

    if (active_only === 'true') {
      query += ` AND is_active = true`;
    }

    if (accepting_clients === 'true') {
      query += ` AND is_accepting_clients = true`;
    }

    query += ` ORDER BY first_name, last_name`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stylists:', error);
    res.status(500).json({ error: 'Failed to fetch stylists' });
  }
});

// Get single stylist by slug
app.get('/api/stylists/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await pool.query(`
      SELECT * FROM stylists WHERE slug = $1
    `, [slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stylist not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching stylist:', error);
    res.status(500).json({ error: 'Failed to fetch stylist' });
  }
});

// Get stylist's services
app.get('/api/stylists/:slug/services', async (req, res) => {
  try {
    const { slug } = req.params;

    const result = await pool.query(`
      SELECT s.*,
             ss.custom_price,
             COALESCE(ss.custom_price, s.price_from) as actual_price
      FROM stylists st
      JOIN stylist_services ss ON st.id = ss.stylist_id
      JOIN services s ON ss.service_id = s.id
      WHERE st.slug = $1 AND s.is_available = true
      ORDER BY s.name
    `, [slug]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stylist services:', error);
    res.status(500).json({ error: 'Failed to fetch stylist services' });
  }
});

// Get stylist availability for a specific date
app.get('/api/stylists/:slug/availability', async (req, res) => {
  try {
    const { slug } = req.params;
    const { date } = req.query; // YYYY-MM-DD format

    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }

    // Get day of week (0=Sunday, 6=Saturday)
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();

    // Get stylist's schedule for that day
    const scheduleResult = await pool.query(`
      SELECT ss.start_time, ss.end_time
      FROM stylists st
      JOIN stylist_schedules ss ON st.id = ss.stylist_id
      WHERE st.slug = $1
        AND ss.day_of_week = $2
        AND ss.is_available = true
    `, [slug, dayOfWeek]);

    if (scheduleResult.rows.length === 0) {
      return res.json({ available: false, message: 'Stylist not available on this day' });
    }

    // Get existing appointments for that date
    const appointmentsResult = await pool.query(`
      SELECT a.start_time, a.end_time
      FROM appointments a
      JOIN stylists st ON a.stylist_id = st.id
      WHERE st.slug = $1
        AND a.appointment_date = $2
        AND a.status IN ('scheduled', 'confirmed', 'in-progress')
    `, [slug, date]);

    res.json({
      available: true,
      schedule: scheduleResult.rows[0],
      booked_slots: appointmentsResult.rows
    });
  } catch (error) {
    console.error('Error checking stylist availability:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

// ==================== CUSTOMERS ====================

// Create or update customer
app.post('/api/customers', async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      hair_type,
      hair_length,
      hair_color,
      allergies,
      notes
    } = req.body;

    // Validation
    if (!first_name || !last_name || !email) {
      return res.status(400).json({ error: 'First name, last name, and email are required' });
    }

    // Check if customer exists
    const existingCustomer = await pool.query(
      'SELECT id FROM customers WHERE email = $1',
      [email]
    );

    let result;
    if (existingCustomer.rows.length > 0) {
      // Update existing customer
      result = await pool.query(`
        UPDATE customers
        SET first_name = $1, last_name = $2, phone = $3,
            hair_type = $4, hair_length = $5, hair_color = $6,
            allergies = $7, notes = $8
        WHERE email = $9
        RETURNING *
      `, [first_name, last_name, phone, hair_type, hair_length, hair_color, allergies, notes, email]);
    } else {
      // Create new customer
      result = await pool.query(`
        INSERT INTO customers
        (first_name, last_name, email, phone, hair_type, hair_length, hair_color, allergies, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [first_name, last_name, email, phone, hair_type, hair_length, hair_color, allergies, notes]);
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating/updating customer:', error);
    res.status(500).json({ error: 'Failed to process customer data' });
  }
});

// Get customer by email
app.get('/api/customers/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const result = await pool.query(`
      SELECT * FROM customers WHERE email = $1
    `, [email]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// ==================== APPOINTMENTS ====================

// Get upcoming appointments
app.get('/api/appointments/upcoming', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM upcoming_appointments
      LIMIT 50
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching upcoming appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Create new appointment
app.post('/api/appointments', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      customer_email,
      stylist_slug,
      service_slug,
      appointment_date,
      start_time,
      customer_notes
    } = req.body;

    // Validation
    if (!customer_email || !stylist_slug || !service_slug || !appointment_date || !start_time) {
      return res.status(400).json({
        error: 'Customer email, stylist, service, date, and time are required'
      });
    }

    // Get customer ID
    const customerResult = await client.query(
      'SELECT id FROM customers WHERE email = $1',
      [customer_email]
    );

    if (customerResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Customer not found. Please create customer profile first.' });
    }
    const customer_id = customerResult.rows[0].id;

    // Get stylist ID
    const stylistResult = await client.query(
      'SELECT id FROM stylists WHERE slug = $1',
      [stylist_slug]
    );

    if (stylistResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Stylist not found' });
    }
    const stylist_id = stylistResult.rows[0].id;

    // Get service ID and duration
    const serviceResult = await client.query(
      'SELECT id, duration_minutes FROM services WHERE slug = $1',
      [service_slug]
    );

    if (serviceResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Service not found' });
    }
    const service_id = serviceResult.rows[0].id;
    const duration_minutes = serviceResult.rows[0].duration_minutes;

    // Calculate end time
    const startDateTime = new Date(`${appointment_date}T${start_time}`);
    const endDateTime = new Date(startDateTime.getTime() + duration_minutes * 60000);
    const end_time = endDateTime.toTimeString().slice(0, 5);

    // Check for conflicts
    const conflictCheck = await client.query(`
      SELECT id FROM appointments
      WHERE stylist_id = $1
        AND appointment_date = $2
        AND status IN ('scheduled', 'confirmed', 'in-progress')
        AND (
          (start_time <= $3 AND end_time > $3)
          OR (start_time < $4 AND end_time >= $4)
          OR (start_time >= $3 AND end_time <= $4)
        )
    `, [stylist_id, appointment_date, start_time, end_time]);

    if (conflictCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Time slot not available' });
    }

    // Create appointment
    const appointmentResult = await client.query(`
      INSERT INTO appointments
      (customer_id, stylist_id, service_id, appointment_date, start_time, end_time, customer_notes, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled')
      RETURNING *
    `, [customer_id, stylist_id, service_id, appointment_date, start_time, end_time, customer_notes]);

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment: appointmentResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  } finally {
    client.release();
  }
});

// Get appointment by ID
app.get('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT
        a.*,
        c.first_name || ' ' || c.last_name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        s.first_name || ' ' || s.last_name as stylist_name,
        srv.name as service_name,
        srv.duration_minutes
      FROM appointments a
      JOIN customers c ON a.customer_id = c.id
      JOIN stylists s ON a.stylist_id = s.id
      JOIN services srv ON a.service_id = srv.id
      WHERE a.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

// Cancel appointment
app.patch('/api/appointments/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;

    const result = await pool.query(`
      UPDATE appointments
      SET status = 'cancelled',
          cancelled_at = NOW(),
          cancellation_reason = $1
      WHERE id = $2
      RETURNING *
    `, [cancellation_reason, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({
      message: 'Appointment cancelled successfully',
      appointment: result.rows[0]
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

// ==================== REVIEWS ====================

// Get approved reviews
app.get('/api/reviews', async (req, res) => {
  try {
    const { stylist_slug } = req.query;

    let query = `
      SELECT
        r.*,
        c.first_name || ' ' || c.last_name as customer_name,
        s.first_name || ' ' || s.last_name as stylist_name
      FROM reviews r
      JOIN customers c ON r.customer_id = c.id
      LEFT JOIN stylists s ON r.stylist_id = s.id
      WHERE r.is_approved = true
    `;
    const params = [];

    if (stylist_slug) {
      params.push(stylist_slug);
      query += ` AND s.slug = $${params.length}`;
    }

    query += ` ORDER BY r.created_at DESC LIMIT 50`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Submit review
app.post('/api/reviews', async (req, res) => {
  try {
    const {
      customer_email,
      stylist_slug,
      appointment_id,
      rating,
      review_title,
      review_text
    } = req.body;

    // Validation
    if (!customer_email || !rating || !review_text) {
      return res.status(400).json({ error: 'Email, rating, and review text are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Get customer ID
    const customerResult = await pool.query(
      'SELECT id FROM customers WHERE email = $1',
      [customer_email]
    );

    if (customerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    const customer_id = customerResult.rows[0].id;

    // Get stylist ID if provided
    let stylist_id = null;
    if (stylist_slug) {
      const stylistResult = await pool.query(
        'SELECT id FROM stylists WHERE slug = $1',
        [stylist_slug]
      );
      if (stylistResult.rows.length > 0) {
        stylist_id = stylistResult.rows[0].id;
      }
    }

    const result = await pool.query(`
      INSERT INTO reviews
      (customer_id, stylist_id, appointment_id, rating, review_title, review_text)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [customer_id, stylist_id, appointment_id, rating, review_title, review_text]);

    res.status(201).json({
      message: 'Review submitted successfully. It will be published after approval.',
      review: result.rows[0]
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// ==================== GIFT CARDS ====================

// Purchase gift card
app.post('/api/gift-cards', async (req, res) => {
  try {
    const {
      purchaser_name,
      purchaser_email,
      recipient_name,
      recipient_email,
      initial_amount
    } = req.body;

    // Validation
    if (!purchaser_name || !purchaser_email || !initial_amount) {
      return res.status(400).json({ error: 'Purchaser name, email, and amount are required' });
    }

    // Generate card number
    const card_number = 'LHS-' + Math.random().toString(36).substring(2, 15).toUpperCase();

    // Set expiration date (1 year from now)
    const expiration_date = new Date();
    expiration_date.setFullYear(expiration_date.getFullYear() + 1);

    const result = await pool.query(`
      INSERT INTO gift_cards
      (card_number, purchaser_name, purchaser_email, recipient_name, recipient_email,
       initial_amount, current_balance, expiration_date)
      VALUES ($1, $2, $3, $4, $5, $6, $6, $7)
      RETURNING *
    `, [card_number, purchaser_name, purchaser_email, recipient_name, recipient_email,
        initial_amount, expiration_date]);

    res.status(201).json({
      message: 'Gift card created successfully',
      gift_card: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating gift card:', error);
    res.status(500).json({ error: 'Failed to create gift card' });
  }
});

// Check gift card balance
app.get('/api/gift-cards/:card_number', async (req, res) => {
  try {
    const { card_number } = req.params;
    const result = await pool.query(`
      SELECT * FROM gift_cards WHERE card_number = $1
    `, [card_number]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Gift card not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching gift card:', error);
    res.status(500).json({ error: 'Failed to fetch gift card' });
  }
});

// ==================== ANALYTICS ====================

// Get stylist performance
app.get('/api/analytics/stylist-performance', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM stylist_performance
      ORDER BY total_appointments DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stylist performance:', error);
    res.status(500).json({ error: 'Failed to fetch stylist performance' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Luxe Hair Studio API Server running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});
