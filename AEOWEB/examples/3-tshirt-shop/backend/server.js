/**
 * Urban Threads T-Shirt Shop - Backend Server
 * Full-Stack AEO-Optimized E-commerce Application
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
const PORT = process.env.PORT || 3003;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'urban_threads',
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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
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
  res.json({ status: 'ok', service: 'Urban Threads API' });
});

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

// Register new customer
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Check if email already exists
    const existing = await pool.query(
      'SELECT id FROM customers WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create customer
    const result = await pool.query(`
      INSERT INTO customers (email, password_hash, first_name, last_name, phone)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, first_name, last_name
    `, [email, password_hash, first_name, last_name, phone]);

    const customer = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { id: customer.id, email: customer.email },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Customer registered successfully',
      customer,
      token
    });
  } catch (error) {
    console.error('Error registering customer:', error);
    res.status(500).json({ error: 'Failed to register customer' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find customer
    const result = await pool.query(
      'SELECT * FROM customers WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const customer = result.rows[0];

    // Verify password
    const valid = await bcrypt.compare(password, customer.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await pool.query(
      'UPDATE customers SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [customer.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { id: customer.id, email: customer.email },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
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

// Get all product categories
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

// Get all products (with optional filtering)
app.get('/api/products', async (req, res) => {
  try {
    const { category_id, search, min_price, max_price, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT p.*, c.name as category_name,
             COALESCE(AVG(pr.rating), 0) as avg_rating,
             COUNT(DISTINCT pr.id) as review_count
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      LEFT JOIN product_reviews pr ON p.id = pr.product_id AND pr.is_approved = true
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

    if (min_price) {
      paramCount++;
      query += ` AND p.base_price >= $${paramCount}`;
      params.push(min_price);
    }

    if (max_price) {
      paramCount++;
      query += ` AND p.base_price <= $${paramCount}`;
      params.push(max_price);
    }

    query += ' GROUP BY p.id, c.name ORDER BY p.name';

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

// Get single product by ID or slug
app.get('/api/products/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;

    // Try to get by ID first, then by slug
    let result = await pool.query(`
      SELECT p.*, c.name as category_name,
             COALESCE(AVG(pr.rating), 0) as avg_rating,
             COUNT(DISTINCT pr.id) as review_count
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      LEFT JOIN product_reviews pr ON p.id = pr.product_id AND pr.is_approved = true
      WHERE p.id = $1 OR p.slug = $1
      GROUP BY p.id, c.name
    `, [identifier]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = result.rows[0];

    // Get variants
    const variants = await pool.query(
      'SELECT * FROM product_variants WHERE product_id = $1 AND is_active = true ORDER BY size, color',
      [product.id]
    );

    // Get images
    const images = await pool.query(
      'SELECT * FROM product_images WHERE product_id = $1 ORDER BY display_order, is_primary DESC',
      [product.id]
    );

    product.variants = variants.rows;
    product.images = images.rows;

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Get product variants
app.get('/api/products/:id/variants', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM product_variants WHERE product_id = $1 AND is_active = true ORDER BY size, color',
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching variants:', error);
    res.status(500).json({ error: 'Failed to fetch variants' });
  }
});

// ==========================================
// CART ENDPOINTS
// ==========================================

// Get or create cart for session/customer
app.get('/api/cart', async (req, res) => {
  try {
    const { session_id } = req.query;
    const customer_id = req.user?.id;

    if (!session_id && !customer_id) {
      return res.status(400).json({ error: 'Session ID or authentication required' });
    }

    let cart;

    // Try to find existing cart
    if (customer_id) {
      const result = await pool.query(
        'SELECT * FROM carts WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 1',
        [customer_id]
      );
      cart = result.rows[0];
    } else {
      const result = await pool.query(
        'SELECT * FROM carts WHERE session_id = $1 ORDER BY created_at DESC LIMIT 1',
        [session_id]
      );
      cart = result.rows[0];
    }

    // Create new cart if none exists
    if (!cart) {
      const result = await pool.query(`
        INSERT INTO carts (customer_id, session_id, expires_at)
        VALUES ($1, $2, NOW() + INTERVAL '7 days')
        RETURNING *
      `, [customer_id || null, session_id || null]);
      cart = result.rows[0];
    }

    // Get cart items with product details
    const items = await pool.query(`
      SELECT ci.*, p.name as product_name, p.slug as product_slug,
             pv.size, pv.color, pv.stock_quantity,
             (ci.price_at_add + COALESCE(pv.price_modifier, 0)) * ci.quantity as total_price
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN product_variants pv ON ci.variant_id = pv.id
      WHERE ci.cart_id = $1
    `, [cart.id]);

    cart.items = items.rows;
    cart.item_count = items.rows.reduce((sum, item) => sum + item.quantity, 0);
    cart.subtotal = items.rows.reduce((sum, item) => sum + parseFloat(item.total_price), 0);

    res.json(cart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// Add item to cart
app.post('/api/cart/items', async (req, res) => {
  try {
    const { cart_id, session_id, product_id, variant_id, quantity = 1, custom_design_data } = req.body;
    const customer_id = req.user?.id;

    // Get or create cart
    let cart;
    if (cart_id) {
      const result = await pool.query('SELECT * FROM carts WHERE id = $1', [cart_id]);
      cart = result.rows[0];
    } else if (customer_id || session_id) {
      const query = customer_id
        ? 'SELECT * FROM carts WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 1'
        : 'SELECT * FROM carts WHERE session_id = $1 ORDER BY created_at DESC LIMIT 1';
      const param = customer_id || session_id;
      const result = await pool.query(query, [param]);

      if (result.rows.length === 0) {
        const newCart = await pool.query(`
          INSERT INTO carts (customer_id, session_id, expires_at)
          VALUES ($1, $2, NOW() + INTERVAL '7 days')
          RETURNING *
        `, [customer_id || null, session_id || null]);
        cart = newCart.rows[0];
      } else {
        cart = result.rows[0];
      }
    } else {
      return res.status(400).json({ error: 'Cart ID, session ID, or authentication required' });
    }

    // Get product price
    const productResult = await pool.query(
      'SELECT base_price FROM products WHERE id = $1',
      [product_id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const price = productResult.rows[0].base_price;

    // Check if item already in cart
    const existing = await pool.query(
      'SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2 AND variant_id IS NOT DISTINCT FROM $3',
      [cart.id, product_id, variant_id]
    );

    let cartItem;
    if (existing.rows.length > 0) {
      // Update quantity
      const result = await pool.query(`
        UPDATE cart_items
        SET quantity = quantity + $1, custom_design_data = COALESCE($2, custom_design_data)
        WHERE id = $3
        RETURNING *
      `, [quantity, custom_design_data ? JSON.stringify(custom_design_data) : null, existing.rows[0].id]);
      cartItem = result.rows[0];
    } else {
      // Add new item
      const result = await pool.query(`
        INSERT INTO cart_items (cart_id, product_id, variant_id, quantity, custom_design_data, price_at_add)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [cart.id, product_id, variant_id, quantity, custom_design_data ? JSON.stringify(custom_design_data) : null, price]);
      cartItem = result.rows[0];
    }

    // Update cart timestamp
    await pool.query('UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [cart.id]);

    res.status(201).json({
      message: 'Item added to cart',
      cart_id: cart.id,
      item: cartItem
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

// Update cart item quantity
app.patch('/api/cart/items/:item_id', async (req, res) => {
  try {
    const { item_id } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    const result = await pool.query(
      'UPDATE cart_items SET quantity = $1 WHERE id = $2 RETURNING *',
      [quantity, item_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ error: 'Failed to update cart item' });
  }
});

// Remove item from cart
app.delete('/api/cart/items/:item_id', async (req, res) => {
  try {
    const { item_id } = req.params;

    const result = await pool.query(
      'DELETE FROM cart_items WHERE id = $1 RETURNING *',
      [item_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(500).json({ error: 'Failed to remove cart item' });
  }
});

// Clear cart
app.delete('/api/cart/:cart_id', async (req, res) => {
  try {
    const { cart_id } = req.params;

    await pool.query('DELETE FROM cart_items WHERE cart_id = $1', [cart_id]);
    await pool.query('DELETE FROM carts WHERE id = $1', [cart_id]);

    res.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

// ==========================================
// ORDER ENDPOINTS
// ==========================================

// Create order from cart
app.post('/api/orders', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      cart_id,
      shipping_address,
      billing_address,
      payment_method = 'card',
      customer_notes
    } = req.body;

    const customer_id = req.user?.id;

    // Get cart items
    const cartItems = await client.query(
      'SELECT * FROM cart_items WHERE cart_id = $1',
      [cart_id]
    );

    if (cartItems.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Calculate totals
    let subtotal = 0;
    for (const item of cartItems.rows) {
      const product = await client.query(
        'SELECT base_price FROM products WHERE id = $1',
        [item.product_id]
      );

      let price = product.rows[0].base_price;

      if (item.variant_id) {
        const variant = await client.query(
          'SELECT price_modifier FROM product_variants WHERE id = $1',
          [item.variant_id]
        );
        price += variant.rows[0].price_modifier || 0;
      }

      subtotal += price * item.quantity;
    }

    const shipping_cost = subtotal > 50 ? 0 : 8.99; // Free shipping over $50
    const tax_amount = subtotal * 0.08; // 8% tax
    const total_amount = subtotal + shipping_cost + tax_amount;

    // Create shipping address
    let shipping_address_id = null;
    if (shipping_address) {
      const addrResult = await client.query(`
        INSERT INTO customer_addresses
        (customer_id, address_type, first_name, last_name, company, address_line1,
         address_line2, city, state, postal_code, country, phone)
        VALUES ($1, 'shipping', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `, [
        customer_id,
        shipping_address.first_name,
        shipping_address.last_name,
        shipping_address.company,
        shipping_address.address_line1,
        shipping_address.address_line2,
        shipping_address.city,
        shipping_address.state,
        shipping_address.postal_code,
        shipping_address.country || 'US',
        shipping_address.phone
      ]);
      shipping_address_id = addrResult.rows[0].id;
    }

    // Create billing address
    let billing_address_id = shipping_address_id; // Default to same as shipping
    if (billing_address && billing_address !== 'same') {
      const addrResult = await client.query(`
        INSERT INTO customer_addresses
        (customer_id, address_type, first_name, last_name, address_line1,
         address_line2, city, state, postal_code, country, phone)
        VALUES ($1, 'billing', $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `, [
        customer_id,
        billing_address.first_name,
        billing_address.last_name,
        billing_address.address_line1,
        billing_address.address_line2,
        billing_address.city,
        billing_address.state,
        billing_address.postal_code,
        billing_address.country || 'US',
        billing_address.phone
      ]);
      billing_address_id = addrResult.rows[0].id;
    }

    // Generate order number
    const order_number = `UT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Create order
    const orderResult = await client.query(`
      INSERT INTO orders
      (customer_id, order_number, order_status, subtotal, shipping_cost, tax_amount,
       total_amount, payment_method, payment_status, shipping_address_id, billing_address_id, customer_notes)
      VALUES ($1, $2, 'pending', $3, $4, $5, $6, $7, 'pending', $8, $9, $10)
      RETURNING *
    `, [
      customer_id,
      order_number,
      subtotal,
      shipping_cost,
      tax_amount,
      total_amount,
      payment_method,
      shipping_address_id,
      billing_address_id,
      customer_notes
    ]);

    const order = orderResult.rows[0];

    // Create order items
    for (const item of cartItems.rows) {
      const product = await client.query(
        'SELECT base_price FROM products WHERE id = $1',
        [item.product_id]
      );

      let unit_price = product.rows[0].base_price;

      if (item.variant_id) {
        const variant = await client.query(
          'SELECT price_modifier FROM product_variants WHERE id = $1',
          [item.variant_id]
        );
        unit_price += variant.rows[0].price_modifier || 0;
      }

      const total_price = unit_price * item.quantity;

      await client.query(`
        INSERT INTO order_items
        (order_id, product_id, variant_id, quantity, unit_price, total_price, custom_design_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        order.id,
        item.product_id,
        item.variant_id,
        item.quantity,
        unit_price,
        total_price,
        item.custom_design_data
      ]);

      // Update variant stock
      if (item.variant_id) {
        await client.query(
          'UPDATE product_variants SET stock_quantity = stock_quantity - $1 WHERE id = $2',
          [item.quantity, item.variant_id]
        );
      }
    }

    // Clear cart
    await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cart_id]);

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Order created successfully',
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
    const { status, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT o.*,
             COUNT(oi.id) as item_count,
             sa.address_line1 as shipping_address
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN customer_addresses sa ON o.shipping_address_id = sa.id
      WHERE o.customer_id = $1
    `;
    const params = [customer_id];

    if (status) {
      params.push(status);
      query += ` AND o.order_status = $${params.length}`;
    }

    query += ' GROUP BY o.id, sa.address_line1 ORDER BY o.created_at DESC';

    params.push(limit);
    query += ` LIMIT $${params.length}`;

    params.push(offset);
    query += ` OFFSET $${params.length}`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order details
app.get('/api/orders/:order_number', async (req, res) => {
  try {
    const { order_number } = req.params;
    const customer_id = req.user?.id;

    // Get order
    let query = 'SELECT * FROM orders WHERE order_number = $1';
    const params = [order_number];

    if (customer_id) {
      query += ' AND customer_id = $2';
      params.push(customer_id);
    }

    const orderResult = await pool.query(query, params);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Get order items
    const items = await pool.query(`
      SELECT oi.*, p.name as product_name, p.slug as product_slug,
             pv.size, pv.color
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      LEFT JOIN product_variants pv ON oi.variant_id = pv.id
      WHERE oi.order_id = $1
    `, [order.id]);

    order.items = items.rows;

    // Get addresses
    if (order.shipping_address_id) {
      const shipping = await pool.query(
        'SELECT * FROM customer_addresses WHERE id = $1',
        [order.shipping_address_id]
      );
      order.shipping_address = shipping.rows[0];
    }

    if (order.billing_address_id) {
      const billing = await pool.query(
        'SELECT * FROM customer_addresses WHERE id = $1',
        [order.billing_address_id]
      );
      order.billing_address = billing.rows[0];
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// ==========================================
// REVIEW ENDPOINTS
// ==========================================

// Get product reviews
app.get('/api/products/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const { approved = 'true', limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT pr.*, c.first_name, c.last_name,
             CASE WHEN pr.order_id IS NOT NULL THEN true ELSE false END as is_verified
      FROM product_reviews pr
      LEFT JOIN customers c ON pr.customer_id = c.id
      WHERE pr.product_id = $1
    `;
    const params = [id];

    if (approved === 'true') {
      query += ' AND pr.is_approved = true';
    }

    query += ' ORDER BY pr.created_at DESC';

    params.push(limit);
    query += ` LIMIT $${params.length}`;

    params.push(offset);
    query += ` OFFSET $${params.length}`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Create product review
app.post('/api/products/:id/reviews', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const customer_id = req.user.id;
    const { rating, review_title, review_text, order_id } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if customer purchased this product
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
      (product_id, customer_id, order_id, rating, review_title, review_text, is_verified_purchase, is_approved)
      VALUES ($1, $2, $3, $4, $5, $6, $7, false)
      RETURNING *
    `, [id, customer_id, order_id, rating, review_title, review_text, is_verified_purchase]);

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
// DISCOUNT CODE ENDPOINTS
// ==========================================

// Validate discount code
app.post('/api/discounts/validate', async (req, res) => {
  try {
    const { code, order_total } = req.body;

    const result = await pool.query(`
      SELECT * FROM discount_codes
      WHERE code = $1
        AND is_active = true
        AND valid_from <= CURRENT_TIMESTAMP
        AND valid_until >= CURRENT_TIMESTAMP
        AND (usage_limit IS NULL OR usage_count < usage_limit)
    `, [code.toUpperCase()]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid or expired discount code' });
    }

    const discount = result.rows[0];

    // Check minimum order amount
    if (discount.min_order_amount && order_total < discount.min_order_amount) {
      return res.status(400).json({
        error: `Minimum order of $${discount.min_order_amount} required for this discount`
      });
    }

    // Calculate discount amount
    let discount_amount = 0;
    if (discount.discount_type === 'percentage') {
      discount_amount = (order_total * discount.discount_value) / 100;
    } else if (discount.discount_type === 'fixed') {
      discount_amount = discount.discount_value;
    }

    // Apply maximum discount limit
    if (discount.max_discount_amount && discount_amount > discount.max_discount_amount) {
      discount_amount = discount.max_discount_amount;
    }

    res.json({
      valid: true,
      discount_code: discount.code,
      discount_type: discount.discount_type,
      discount_value: discount.discount_value,
      discount_amount: discount_amount.toFixed(2),
      description: discount.description
    });
  } catch (error) {
    console.error('Error validating discount:', error);
    res.status(500).json({ error: 'Failed to validate discount code' });
  }
});

// ==========================================
// SHIPPING METHODS
// ==========================================

// Get shipping methods
app.get('/api/shipping/methods', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM shipping_methods WHERE is_active = true ORDER BY base_rate'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching shipping methods:', error);
    res.status(500).json({ error: 'Failed to fetch shipping methods' });
  }
});

// Calculate shipping cost
app.post('/api/shipping/calculate', async (req, res) => {
  try {
    const { method_id, item_count, subtotal } = req.body;

    // Free shipping over $50
    if (subtotal >= 50) {
      return res.json({
        shipping_cost: 0,
        message: 'Free shipping on orders over $50'
      });
    }

    const result = await pool.query(
      'SELECT * FROM shipping_methods WHERE id = $1 AND is_active = true',
      [method_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shipping method not found' });
    }

    const method = result.rows[0];
    const shipping_cost = method.base_rate + (method.per_item_rate * item_count);

    res.json({
      shipping_cost: shipping_cost.toFixed(2),
      estimated_days: `${method.estimated_days_min}-${method.estimated_days_max}`,
      method_name: method.name
    });
  } catch (error) {
    console.error('Error calculating shipping:', error);
    res.status(500).json({ error: 'Failed to calculate shipping' });
  }
});

// ==========================================
// CUSTOM DESIGN ENDPOINTS
// ==========================================

// Save custom design
app.post('/api/designs', authenticateToken, async (req, res) => {
  try {
    const customer_id = req.user.id;
    const { design_name, design_data, is_public = false } = req.body;

    const result = await pool.query(`
      INSERT INTO custom_designs (customer_id, design_name, design_data, is_public)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [customer_id, design_name, JSON.stringify(design_data), is_public]);

    res.status(201).json({
      message: 'Design saved successfully',
      design: result.rows[0]
    });
  } catch (error) {
    console.error('Error saving design:', error);
    res.status(500).json({ error: 'Failed to save design' });
  }
});

// Get customer designs
app.get('/api/designs', authenticateToken, async (req, res) => {
  try {
    const customer_id = req.user.id;

    const result = await pool.query(
      'SELECT * FROM custom_designs WHERE customer_id = $1 ORDER BY created_at DESC',
      [customer_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching designs:', error);
    res.status(500).json({ error: 'Failed to fetch designs' });
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
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(`Urban Threads API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});
