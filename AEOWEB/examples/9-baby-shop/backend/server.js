const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const validator = require('validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3009;

// Database connection pool
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'baby_shop',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Database connection error:', err);
    } else {
        console.log('✅ Database connected:', res.rows[0].now);
    }
});

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, process.env.UPLOAD_PATH || './uploads');
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
        }
    }
});

// JWT middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// ==================== AUTHENTICATION ENDPOINTS ====================

// Register new customer
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, first_name, last_name, phone } = req.body;

        // Validation
        if (!email || !password || !first_name || !last_name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ error: 'Invalid email address' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        // Check if email already exists
        const existingUser = await pool.query(
            'SELECT id FROM customers WHERE email = $1',
            [email.toLowerCase()]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create customer
        const result = await pool.query(
            `INSERT INTO customers (email, password_hash, first_name, last_name, phone)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, email, first_name, last_name, created_at`,
            [email.toLowerCase(), hashedPassword, first_name, last_name, phone]
        );

        const customer = result.rows[0];

        // Generate JWT
        const token = jwt.sign(
            { id: customer.id, email: customer.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(201).json({
            message: 'Registration successful',
            customer: {
                id: customer.id,
                email: customer.email,
                first_name: customer.first_name,
                last_name: customer.last_name
            },
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const result = await pool.query(
            'SELECT id, email, password_hash, first_name, last_name FROM customers WHERE email = $1',
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const customer = result.rows[0];
        const validPassword = await bcrypt.compare(password, customer.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        await pool.query(
            'UPDATE customers SET last_login = NOW() WHERE id = $1',
            [customer.id]
        );

        const token = jwt.sign(
            { id: customer.id, email: customer.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
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
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// ==================== PRODUCT ENDPOINTS ====================

// Get all products (with filters)
app.get('/api/products', async (req, res) => {
    try {
        const {
            category,
            age_range,
            min_price,
            max_price,
            brand,
            organic,
            in_stock,
            sort = 'featured',
            limit = 20,
            offset = 0
        } = req.query;

        let query = `
            SELECT
                p.*,
                b.name as brand_name,
                c.name as category_name,
                AVG(r.rating) as avg_rating,
                COUNT(r.id) as review_count,
                i.quantity as stock_quantity
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN reviews r ON p.id = r.product_id
            LEFT JOIN inventory i ON p.id = i.product_id
            WHERE p.active = true
        `;
        const params = [];
        let paramIndex = 1;

        if (category) {
            query += ` AND c.slug = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }

        if (age_range) {
            query += ` AND p.age_range = $${paramIndex}`;
            params.push(age_range);
            paramIndex++;
        }

        if (min_price) {
            query += ` AND p.price >= $${paramIndex}`;
            params.push(parseFloat(min_price));
            paramIndex++;
        }

        if (max_price) {
            query += ` AND p.price <= $${paramIndex}`;
            params.push(parseFloat(max_price));
            paramIndex++;
        }

        if (brand) {
            query += ` AND b.slug = $${paramIndex}`;
            params.push(brand);
            paramIndex++;
        }

        if (organic === 'true') {
            query += ` AND p.is_organic = true`;
        }

        if (in_stock === 'true') {
            query += ` AND i.quantity > 0`;
        }

        query += ` GROUP BY p.id, b.name, c.name, i.quantity`;

        // Sorting
        switch (sort) {
            case 'price_asc':
                query += ' ORDER BY p.price ASC';
                break;
            case 'price_desc':
                query += ' ORDER BY p.price DESC';
                break;
            case 'rating':
                query += ' ORDER BY avg_rating DESC NULLS LAST';
                break;
            case 'newest':
                query += ' ORDER BY p.created_at DESC';
                break;
            default:
                query += ' ORDER BY p.featured DESC, p.created_at DESC';
        }

        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        // Get total count
        const countResult = await pool.query(
            'SELECT COUNT(*) FROM products WHERE active = true'
        );

        res.json({
            products: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Get single product by ID
app.get('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT
                p.*,
                b.name as brand_name,
                b.slug as brand_slug,
                c.name as category_name,
                c.slug as category_slug,
                i.quantity as stock_quantity,
                i.last_restocked,
                AVG(r.rating) as avg_rating,
                COUNT(r.id) as review_count
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN inventory i ON p.id = i.product_id
            LEFT JOIN reviews r ON p.id = r.product_id
            WHERE p.id = $1 AND p.active = true
            GROUP BY p.id, b.name, b.slug, c.name, c.slug, i.quantity, i.last_restocked`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Get product images
        const images = await pool.query(
            'SELECT * FROM product_images WHERE product_id = $1 ORDER BY display_order',
            [id]
        );

        // Get recent reviews
        const reviews = await pool.query(
            `SELECT r.*, c.first_name, c.last_name
             FROM reviews r
             LEFT JOIN customers c ON r.customer_id = c.id
             WHERE r.product_id = $1 AND r.approved = true
             ORDER BY r.created_at DESC
             LIMIT 10`,
            [id]
        );

        res.json({
            product: result.rows[0],
            images: images.rows,
            reviews: reviews.rows
        });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// Get categories
app.get('/api/categories', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                c.*,
                COUNT(p.id) as product_count
             FROM categories c
             LEFT JOIN products p ON c.id = p.category_id AND p.active = true
             WHERE c.active = true
             GROUP BY c.id
             ORDER BY c.display_order, c.name`
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// ==================== CART ENDPOINTS ====================

// Get cart
app.get('/api/cart', authenticateToken, async (req, res) => {
    try {
        const customerId = req.user.id;

        const result = await pool.query(
            `SELECT
                ci.*,
                p.name,
                p.price,
                p.sku,
                p.image_url,
                i.quantity as stock_quantity
             FROM cart_items ci
             JOIN products p ON ci.product_id = p.id
             LEFT JOIN inventory i ON p.id = i.product_id
             WHERE ci.customer_id = $1`,
            [customerId]
        );

        const items = result.rows;
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * (parseFloat(process.env.TAX_RATE) || 0.0875);
        const total = subtotal + tax;

        res.json({
            items,
            summary: {
                subtotal: subtotal.toFixed(2),
                tax: tax.toFixed(2),
                shipping: subtotal >= parseFloat(process.env.FREE_SHIPPING_THRESHOLD || 50) ? 0 : 5.99,
                total: (total + (subtotal >= 50 ? 0 : 5.99)).toFixed(2)
            }
        });
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ error: 'Failed to fetch cart' });
    }
});

// Add to cart
app.post('/api/cart', authenticateToken, async (req, res) => {
    try {
        const customerId = req.user.id;
        const { product_id, quantity = 1 } = req.body;

        if (!product_id) {
            return res.status(400).json({ error: 'Product ID required' });
        }

        // Check if product exists and has stock
        const productCheck = await pool.query(
            `SELECT p.id, i.quantity as stock
             FROM products p
             LEFT JOIN inventory i ON p.id = i.product_id
             WHERE p.id = $1 AND p.active = true`,
            [product_id]
        );

        if (productCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (productCheck.rows[0].stock < quantity) {
            return res.status(400).json({ error: 'Insufficient stock' });
        }

        // Check if item already in cart
        const existingItem = await pool.query(
            'SELECT id, quantity FROM cart_items WHERE customer_id = $1 AND product_id = $2',
            [customerId, product_id]
        );

        if (existingItem.rows.length > 0) {
            // Update quantity
            const newQuantity = existingItem.rows[0].quantity + quantity;
            await pool.query(
                'UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2',
                [newQuantity, existingItem.rows[0].id]
            );
        } else {
            // Add new item
            await pool.query(
                'INSERT INTO cart_items (customer_id, product_id, quantity) VALUES ($1, $2, $3)',
                [customerId, product_id, quantity]
            );
        }

        res.json({ message: 'Item added to cart' });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ error: 'Failed to add to cart' });
    }
});

// Update cart item quantity
app.put('/api/cart/:itemId', authenticateToken, async (req, res) => {
    try {
        const customerId = req.user.id;
        const { itemId } = req.params;
        const { quantity } = req.body;

        if (quantity < 1) {
            return res.status(400).json({ error: 'Quantity must be at least 1' });
        }

        await pool.query(
            'UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2 AND customer_id = $3',
            [quantity, itemId, customerId]
        );

        res.json({ message: 'Cart updated' });
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({ error: 'Failed to update cart' });
    }
});

// Remove from cart
app.delete('/api/cart/:itemId', authenticateToken, async (req, res) => {
    try {
        const customerId = req.user.id;
        const { itemId } = req.params;

        await pool.query(
            'DELETE FROM cart_items WHERE id = $1 AND customer_id = $2',
            [itemId, customerId]
        );

        res.json({ message: 'Item removed from cart' });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({ error: 'Failed to remove from cart' });
    }
});

// ==================== ORDER ENDPOINTS ====================

// Create order
app.post('/api/orders', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const customerId = req.user.id;
        const { shipping_address, billing_address, payment_method } = req.body;

        // Get cart items
        const cartItems = await client.query(
            `SELECT ci.*, p.price, i.quantity as stock
             FROM cart_items ci
             JOIN products p ON ci.product_id = p.id
             LEFT JOIN inventory i ON p.id = i.product_id
             WHERE ci.customer_id = $1`,
            [customerId]
        );

        if (cartItems.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Check stock availability
        for (const item of cartItems.rows) {
            if (item.stock < item.quantity) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    error: `Insufficient stock for ${item.name}`
                });
            }
        }

        // Calculate totals
        const subtotal = cartItems.rows.reduce((sum, item) =>
            sum + (item.price * item.quantity), 0
        );
        const tax = subtotal * 0.0875;
        const shipping = subtotal >= 50 ? 0 : 5.99;
        const total = subtotal + tax + shipping;

        // Create order
        const orderResult = await client.query(
            `INSERT INTO orders (
                customer_id, status, subtotal, tax, shipping, total,
                shipping_address, billing_address, payment_method
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, order_number`,
            [customerId, 'pending', subtotal, tax, shipping, total,
             JSON.stringify(shipping_address), JSON.stringify(billing_address), payment_method]
        );

        const orderId = orderResult.rows[0].id;
        const orderNumber = orderResult.rows[0].order_number;

        // Create order items and update inventory
        for (const item of cartItems.rows) {
            await client.query(
                `INSERT INTO order_items (order_id, product_id, quantity, price)
                 VALUES ($1, $2, $3, $4)`,
                [orderId, item.product_id, item.quantity, item.price]
            );

            await client.query(
                'UPDATE inventory SET quantity = quantity - $1 WHERE product_id = $2',
                [item.quantity, item.product_id]
            );
        }

        // Clear cart
        await client.query(
            'DELETE FROM cart_items WHERE customer_id = $1',
            [customerId]
        );

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Order created successfully',
            order_id: orderId,
            order_number: orderNumber,
            total: total.toFixed(2)
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Failed to create order' });
    } finally {
        client.release();
    }
});

// Get customer orders
app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        const customerId = req.user.id;

        const result = await pool.query(
            `SELECT
                o.*,
                json_agg(
                    json_build_object(
                        'product_id', oi.product_id,
                        'name', p.name,
                        'quantity', oi.quantity,
                        'price', oi.price,
                        'image_url', p.image_url
                    )
                ) as items
             FROM orders o
             LEFT JOIN order_items oi ON o.id = oi.order_id
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE o.customer_id = $1
             GROUP BY o.id
             ORDER BY o.created_at DESC`,
            [customerId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// ==================== REVIEW ENDPOINTS ====================

// Add product review
app.post('/api/reviews', authenticateToken, async (req, res) => {
    try {
        const customerId = req.user.id;
        const { product_id, rating, title, comment } = req.body;

        if (!product_id || !rating) {
            return res.status(400).json({ error: 'Product ID and rating required' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        // Check if customer purchased this product
        const purchased = await pool.query(
            `SELECT 1 FROM orders o
             JOIN order_items oi ON o.id = oi.order_id
             WHERE o.customer_id = $1 AND oi.product_id = $2 AND o.status = 'delivered'
             LIMIT 1`,
            [customerId, product_id]
        );

        if (purchased.rows.length === 0) {
            return res.status(403).json({
                error: 'You can only review products you have purchased'
            });
        }

        const result = await pool.query(
            `INSERT INTO reviews (customer_id, product_id, rating, title, comment)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            [customerId, product_id, rating, title, comment]
        );

        res.status(201).json({
            message: 'Review submitted for approval',
            review_id: result.rows[0].id
        });
    } catch (error) {
        console.error('Add review error:', error);
        res.status(500).json({ error: 'Failed to submit review' });
    }
});

// ==================== NEWSLETTER ENDPOINT ====================

app.post('/api/newsletter', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !validator.isEmail(email)) {
            return res.status(400).json({ error: 'Valid email required' });
        }

        // Check if already subscribed
        const existing = await pool.query(
            'SELECT id FROM newsletter_subscribers WHERE email = $1',
            [email.toLowerCase()]
        );

        if (existing.rows.length > 0) {
            return res.json({ message: 'Already subscribed' });
        }

        await pool.query(
            'INSERT INTO newsletter_subscribers (email) VALUES ($1)',
            [email.toLowerCase()]
        );

        res.status(201).json({ message: 'Successfully subscribed to newsletter' });
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        res.status(500).json({ error: 'Failed to subscribe' });
    }
});

// ==================== CONTACT ENDPOINT ====================

app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: 'All fields required except phone' });
        }

        await pool.query(
            `INSERT INTO contact_messages (name, email, phone, subject, message)
             VALUES ($1, $2, $3, $4, $5)`,
            [name, email, phone, subject, message]
        );

        res.status(201).json({ message: 'Message received. We\'ll respond within 24 hours.' });
    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🍼 Little Wonders Baby Shop API running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health\n`);
});
