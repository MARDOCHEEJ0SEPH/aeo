# Chapter 3: Databases - Choosing and Optimizing Your Data Layer

## Understanding Database Fundamentals

Your database is the heart of your application. Choose wrong, and you'll face scalability nightmares, performance issues, and migration headaches. Choose right, and your data layer becomes a competitive advantage.

This chapter covers SQL, NoSQL, and Graph databases with real implementations from AEOWEB examples.

---

## Database Types Overview

```
┌─────────────────────────────────────────────────────┐
│              Database Landscape                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  SQL (Relational)          NoSQL                    │
│  ├── PostgreSQL            ├── MongoDB (Document)   │
│  ├── MySQL                 ├── Redis (Key-Value)    │
│  └── SQLite                ├── Cassandra (Column)   │
│                            └── Neo4j (Graph)        │
│                                                      │
│  NewSQL                    Time Series              │
│  ├── CockroachDB           ├── InfluxDB             │
│  └── Google Spanner        └── TimescaleDB          │
└─────────────────────────────────────────────────────┘
```

---

## SQL Databases (Relational)

### PostgreSQL - The Complete Solution

**When to Use:**
- Complex queries with JOINs
- ACID compliance required
- Strong data integrity needs
- Structured data with relationships

**Strengths:**
- Advanced features (JSON, full-text search, GIS)
- Excellent performance
- Strong community support
- Open source

### Complete PostgreSQL Implementation

**1. Installation and Setup:**

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Access PostgreSQL
sudo -u postgres psql
```

**2. Database and User Creation:**

```sql
-- Create database
CREATE DATABASE ecommerce_db;

-- Create user
CREATE USER ecommerce_user WITH ENCRYPTED PASSWORD 'secure_password_123';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ecommerce_db TO ecommerce_user;

-- Connect to database
\c ecommerce_db

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO ecommerce_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO ecommerce_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO ecommerce_user;
```

**3. Schema Design - E-Commerce Example:**

```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Addresses table
CREATE TABLE addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES categories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    compare_at_price DECIMAL(10, 2),
    cost DECIMAL(10, 2),
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100),
    quantity INTEGER DEFAULT 0,
    track_inventory BOOLEAN DEFAULT true,
    weight DECIMAL(10, 2),
    requires_shipping BOOLEAN DEFAULT true,
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product images table
CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) DEFAULT 0,
    shipping DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50),
    shipping_address_id INTEGER REFERENCES addresses(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews table
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    content TEXT,
    verified_purchase BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**4. Indexes for Performance:**

```sql
-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Product indexes
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_published ON products(published);
CREATE INDEX idx_products_price ON products(price);

-- Order indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Order items indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Review indexes
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- Composite indexes for common queries
CREATE INDEX idx_products_category_published ON products(category_id, published);
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
```

**5. PostgreSQL with Node.js:**

```javascript
// database.js
const { Pool } = require('pg');

// Connection pool configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum number of clients in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Query helper
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error', { text, error: error.message });
    throw error;
  }
};

// Transaction helper
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { pool, query, transaction };
```

**6. CRUD Operations:**

```javascript
// models/Product.js
const { query, transaction } = require('../database');

class Product {
  // Create product
  static async create(productData) {
    const {
      category_id, name, slug, description, price,
      compare_at_price, sku, quantity
    } = productData;

    const sql = `
      INSERT INTO products (
        category_id, name, slug, description, price,
        compare_at_price, sku, quantity, published
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      category_id, name, slug, description, price,
      compare_at_price || null, sku, quantity || 0, true
    ];

    const result = await query(sql, values);
    return result.rows[0];
  }

  // Get all products with pagination
  static async findAll(page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const sql = `
      SELECT
        p.*,
        c.name as category_name,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN reviews r ON p.product_id = r.product_id
      WHERE p.published = true
      GROUP BY p.id, c.name
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await query(sql, [limit, offset]);

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) FROM products WHERE published = true'
    );

    return {
      products: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    };
  }

  // Find by ID with related data
  static async findById(id) {
    const sql = `
      SELECT
        p.*,
        c.name as category_name,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as review_count,
        json_agg(DISTINCT jsonb_build_object(
          'id', pi.id,
          'url', pi.url,
          'alt_text', pi.alt_text
        )) FILTER (WHERE pi.id IS NOT NULL) as images
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN reviews r ON p.id = r.product_id
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE p.id = $1
      GROUP BY p.id, c.name
    `;

    const result = await query(sql, [id]);
    return result.rows[0];
  }

  // Update product
  static async update(id, productData) {
    const {
      name, description, price, compare_at_price,
      quantity, published
    } = productData;

    const sql = `
      UPDATE products
      SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        price = COALESCE($3, price),
        compare_at_price = COALESCE($4, compare_at_price),
        quantity = COALESCE($5, quantity),
        published = COALESCE($6, published),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `;

    const values = [name, description, price, compare_at_price, quantity, published, id];
    const result = await query(sql, values);
    return result.rows[0];
  }

  // Delete product
  static async delete(id) {
    const sql = 'DELETE FROM products WHERE id = $1 RETURNING *';
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  // Search products
  static async search(searchTerm, filters = {}) {
    let sql = `
      SELECT
        p.*,
        c.name as category_name,
        ts_rank(to_tsvector('english', p.name || ' ' || p.description), plainto_tsquery($1)) as rank
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.published = true
      AND (
        to_tsvector('english', p.name || ' ' || p.description) @@ plainto_tsquery($1)
        OR p.name ILIKE $2
      )
    `;

    const params = [searchTerm, `%${searchTerm}%`];
    let paramCount = 2;

    // Add category filter
    if (filters.category_id) {
      paramCount++;
      sql += ` AND p.category_id = $${paramCount}`;
      params.push(filters.category_id);
    }

    // Add price range filter
    if (filters.min_price) {
      paramCount++;
      sql += ` AND p.price >= $${paramCount}`;
      params.push(filters.min_price);
    }

    if (filters.max_price) {
      paramCount++;
      sql += ` AND p.price <= $${paramCount}`;
      params.push(filters.max_price);
    }

    sql += ' ORDER BY rank DESC, p.created_at DESC';

    const result = await query(sql, params);
    return result.rows;
  }
}

module.exports = Product;
```

---

## MySQL - The Popular Choice

### MySQL vs PostgreSQL

```
┌────────────────────┬─────────────────┬─────────────────┐
│     Feature        │   PostgreSQL    │      MySQL      │
├────────────────────┼─────────────────┼─────────────────┤
│ ACID Compliance    │ Full            │ InnoDB only     │
│ JSON Support       │ Excellent       │ Good            │
│ Full-Text Search   │ Built-in        │ Built-in        │
│ Replication        │ Streaming       │ Master-Slave    │
│ Performance        │ Complex queries │ Simple reads    │
│ Community          │ Large           │ Larger          │
│ Use Case           │ Complex apps    │ Web apps        │
└────────────────────┴─────────────────┴─────────────────┘
```

### MySQL Implementation

```javascript
// database-mysql.js
const mysql = require('mysql2/promise');

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Query helper
const query = async (sql, params) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

// Transaction helper
const transaction = async (callback) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = { pool, query, transaction };
```

---

## NoSQL Databases

### MongoDB - Document Database

**When to Use:**
- Flexible schema requirements
- Rapid development/prototyping
- Hierarchical data structures
- High write loads
- Real-time analytics

**MongoDB Schema Design:**

```javascript
// User schema
const userSchema = {
  _id: ObjectId,
  email: String,
  passwordHash: String,
  profile: {
    firstName: String,
    lastName: String,
    phone: String,
    avatar: String
  },
  addresses: [{
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    isDefault: Boolean
  }],
  preferences: {
    newsletter: Boolean,
    notifications: Boolean
  },
  createdAt: Date,
  updatedAt: Date
};

// Product schema with embedded reviews
const productSchema = {
  _id: ObjectId,
  name: String,
  slug: String,
  description: String,
  price: Number,
  compareAtPrice: Number,
  category: {
    id: ObjectId,
    name: String,
    slug: String
  },
  images: [{
    url: String,
    altText: String,
    position: Number
  }],
  inventory: {
    sku: String,
    quantity: Number,
    trackInventory: Boolean
  },
  reviews: [{
    userId: ObjectId,
    userName: String,
    rating: Number,
    title: String,
    content: String,
    verifiedPurchase: Boolean,
    createdAt: Date
  }],
  stats: {
    averageRating: Number,
    reviewCount: Number,
    viewCount: Number,
    salesCount: Number
  },
  published: Boolean,
  createdAt: Date,
  updatedAt: Date
};

// Order schema
const orderSchema = {
  _id: ObjectId,
  orderNumber: String,
  userId: ObjectId,
  customer: {
    email: String,
    firstName: String,
    lastName: String,
    phone: String
  },
  items: [{
    productId: ObjectId,
    name: String,
    sku: String,
    quantity: Number,
    price: Number,
    total: Number
  }],
  pricing: {
    subtotal: Number,
    tax: Number,
    shipping: Number,
    total: Number
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  status: String,
  paymentStatus: String,
  paymentMethod: String,
  timeline: [{
    status: String,
    timestamp: Date,
    note: String
  }],
  createdAt: Date,
  updatedAt: Date
};
```

### MongoDB with Node.js

```javascript
// database-mongodb.js
const { MongoClient } = require('mongodb');

let db;
let client;

const connect = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';

    client = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000
    });

    await client.connect();
    db = client.db(process.env.DB_NAME || 'ecommerce');

    console.log('Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};

const close = async () => {
  if (client) {
    await client.close();
  }
};

module.exports = { connect, getDb, close };
```

**MongoDB CRUD Operations:**

```javascript
// models/Product-mongo.js
const { getDb } = require('../database-mongodb');
const { ObjectId } = require('mongodb');

class Product {
  static collection() {
    return getDb().collection('products');
  }

  // Create product
  static async create(productData) {
    const product = {
      ...productData,
      stats: {
        averageRating: 0,
        reviewCount: 0,
        viewCount: 0,
        salesCount: 0
      },
      reviews: [],
      published: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.collection().insertOne(product);
    return { ...product, _id: result.insertedId };
  }

  // Find all with pagination
  static async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const products = await this.collection()
      .find({ published: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await this.collection().countDocuments({ published: true });

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Find by ID
  static async findById(id) {
    return await this.collection().findOne({ _id: new ObjectId(id) });
  }

  // Update product
  static async update(id, productData) {
    const result = await this.collection().findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...productData,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    return result.value;
  }

  // Delete product
  static async delete(id) {
    const result = await this.collection().findOneAndDelete({
      _id: new ObjectId(id)
    });

    return result.value;
  }

  // Search products
  static async search(searchTerm, filters = {}) {
    const query = {
      published: true,
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ]
    };

    // Add filters
    if (filters.categoryId) {
      query['category.id'] = new ObjectId(filters.categoryId);
    }

    if (filters.minPrice || filters.maxPrice) {
      query.price = {};
      if (filters.minPrice) query.price.$gte = filters.minPrice;
      if (filters.maxPrice) query.price.$lte = filters.maxPrice;
    }

    return await this.collection()
      .find(query)
      .sort({ 'stats.averageRating': -1 })
      .toArray();
  }

  // Add review
  static async addReview(productId, review) {
    const reviewData = {
      _id: new ObjectId(),
      ...review,
      createdAt: new Date()
    };

    await this.collection().updateOne(
      { _id: new ObjectId(productId) },
      {
        $push: { reviews: reviewData },
        $inc: { 'stats.reviewCount': 1 }
      }
    );

    // Recalculate average rating
    const product = await this.findById(productId);
    const avgRating = product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length;

    await this.collection().updateOne(
      { _id: new ObjectId(productId) },
      { $set: { 'stats.averageRating': avgRating } }
    );

    return reviewData;
  }

  // Increment view count
  static async incrementViews(productId) {
    await this.collection().updateOne(
      { _id: new ObjectId(productId) },
      { $inc: { 'stats.viewCount': 1 } }
    );
  }
}

module.exports = Product;
```

**Create MongoDB Indexes:**

```javascript
// Create indexes for optimal performance
async function createIndexes() {
  const db = getDb();

  // Products indexes
  await db.collection('products').createIndexes([
    { key: { slug: 1 }, unique: true },
    { key: { 'category.id': 1 } },
    { key: { published: 1 } },
    { key: { price: 1 } },
    { key: { 'stats.averageRating': -1 } },
    { key: { name: 'text', description: 'text' } }, // Text search
    { key: { createdAt: -1 } }
  ]);

  // Orders indexes
  await db.collection('orders').createIndexes([
    { key: { orderNumber: 1 }, unique: true },
    { key: { userId: 1 } },
    { key: { status: 1 } },
    { key: { createdAt: -1 } },
    { key: { 'customer.email': 1 } }
  ]);

  console.log('MongoDB indexes created');
}
```

---

## Choosing the Right Database

### Decision Matrix

```
┌──────────────────────┬─────────────┬─────────────┬─────────────┐
│     Requirement      │ PostgreSQL  │    MySQL    │   MongoDB   │
├──────────────────────┼─────────────┼─────────────┼─────────────┤
│ Complex relationships│     ⭐⭐⭐⭐⭐  │    ⭐⭐⭐⭐   │     ⭐⭐     │
│ Flexible schema      │     ⭐⭐     │     ⭐⭐     │    ⭐⭐⭐⭐⭐  │
│ ACID transactions    │    ⭐⭐⭐⭐⭐  │    ⭐⭐⭐⭐   │     ⭐⭐⭐    │
│ Horizontal scaling   │     ⭐⭐⭐    │     ⭐⭐     │    ⭐⭐⭐⭐⭐  │
│ JSON support         │    ⭐⭐⭐⭐⭐  │     ⭐⭐⭐    │    ⭐⭐⭐⭐⭐  │
│ Real-time analytics  │     ⭐⭐⭐    │     ⭐⭐     │    ⭐⭐⭐⭐⭐  │
│ Learning curve       │     ⭐⭐⭐    │    ⭐⭐⭐⭐   │    ⭐⭐⭐⭐   │
│ Community/Support    │    ⭐⭐⭐⭐   │    ⭐⭐⭐⭐⭐  │    ⭐⭐⭐⭐   │
└──────────────────────┴─────────────┴─────────────┴─────────────┘
```

### Use Case Recommendations

**PostgreSQL:**
- Banking applications
- E-commerce platforms
- Content management systems
- Analytics platforms
- Applications with complex queries

**MongoDB:**
- Real-time applications
- Content management
- IoT applications
- Mobile applications
- Rapid prototyping

**MySQL:**
- Web applications
- WordPress/PHP applications
- Read-heavy workloads
- Simple CRUD applications

---

## Database Performance Optimization

### 1. Query Optimization

**PostgreSQL EXPLAIN:**

```sql
-- Analyze query performance
EXPLAIN ANALYZE
SELECT
  p.name,
  c.name as category,
  COUNT(r.id) as review_count
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN reviews r ON p.id = r.product_id
WHERE p.published = true
GROUP BY p.id, c.name
ORDER BY review_count DESC
LIMIT 10;
```

**Optimization techniques:**

```sql
-- 1. Use appropriate indexes
CREATE INDEX idx_products_published ON products(published) WHERE published = true;

-- 2. Avoid SELECT *
-- Bad
SELECT * FROM products;

-- Good
SELECT id, name, price, quantity FROM products;

-- 3. Use LIMIT for large datasets
SELECT * FROM orders ORDER BY created_at DESC LIMIT 100;

-- 4. Optimize JOINs
-- Use INNER JOIN when possible (faster than LEFT JOIN)
SELECT p.name, c.name
FROM products p
INNER JOIN categories c ON p.category_id = c.id
WHERE p.published = true;

-- 5. Use aggregation efficiently
SELECT
  category_id,
  COUNT(*) as product_count,
  AVG(price) as avg_price
FROM products
WHERE published = true
GROUP BY category_id
HAVING COUNT(*) > 10;
```

### 2. Connection Pooling

```javascript
// Optimal pool configuration
const pool = new Pool({
  // Formula: (max_connections - superuser_reserved_connections) / max_instances
  max: 20, // Maximum pool size
  min: 5,  // Minimum pool size
  idleTimeoutMillis: 30000, // Close idle clients after 30s
  connectionTimeoutMillis: 2000, // Return error after 2s if no connection available
});

// Monitor pool
pool.on('acquire', () => {
  console.log('Client acquired from pool');
});

pool.on('remove', () => {
  console.log('Client removed from pool');
});
```

### 3. Caching Strategies

```javascript
// Redis caching layer
const Redis = require('ioredis');
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: 0,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

// Cache wrapper
const cacheWrapper = async (key, ttl, fetchFunction) => {
  // Try to get from cache
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch from database
  const data = await fetchFunction();

  // Store in cache
  await redis.setex(key, ttl, JSON.stringify(data));

  return data;
};

// Usage
const getProduct = async (productId) => {
  return await cacheWrapper(
    `product:${productId}`,
    3600, // 1 hour TTL
    async () => {
      return await Product.findById(productId);
    }
  );
};
```

### 4. Database Partitioning

```sql
-- Partition large tables by date
CREATE TABLE orders_2024_01 PARTITION OF orders
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE orders_2024_02 PARTITION OF orders
FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Queries automatically use correct partition
SELECT * FROM orders
WHERE created_at >= '2024-01-15' AND created_at < '2024-01-20';
```

---

## Database Replication

### PostgreSQL Streaming Replication

**Primary Server Configuration:**

```bash
# postgresql.conf
wal_level = replica
max_wal_senders = 3
wal_keep_size = 64MB
```

**Setup Replica:**

```bash
# On replica server
pg_basebackup -h primary_host -D /var/lib/postgresql/15/main -U replication -P -v -R
```

### Read Replicas in Application

```javascript
// database-replicas.js
const { Pool } = require('pg');

// Primary pool (writes)
const primaryPool = new Pool({
  host: process.env.PRIMARY_DB_HOST,
  port: 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20
});

// Replica pools (reads)
const replicaPools = [
  new Pool({
    host: process.env.REPLICA1_DB_HOST,
    port: 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20
  }),
  new Pool({
    host: process.env.REPLICA2_DB_HOST,
    port: 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20
  })
];

let replicaIndex = 0;

// Get read pool (round-robin)
const getReadPool = () => {
  const pool = replicaPools[replicaIndex];
  replicaIndex = (replicaIndex + 1) % replicaPools.length;
  return pool;
};

// Query helpers
const write = async (sql, params) => {
  return await primaryPool.query(sql, params);
};

const read = async (sql, params) => {
  return await getReadPool().query(sql, params);
};

module.exports = { write, read, primaryPool };
```

---

## Key Takeaways

✅ **Choose SQL** for complex relationships and ACID compliance
✅ **Choose NoSQL** for flexible schemas and horizontal scaling
✅ **PostgreSQL** is excellent for most applications
✅ **MongoDB** excels at rapid development and hierarchical data
✅ **Indexes** are critical for query performance
✅ **Connection pooling** prevents resource exhaustion
✅ **Caching** reduces database load significantly
✅ **Replication** improves read performance and availability

---

## Implementation Checklist

- [ ] Choose appropriate database for your use case
- [ ] Design normalized schema (SQL) or document structure (NoSQL)
- [ ] Create necessary indexes
- [ ] Implement connection pooling
- [ ] Set up query optimization
- [ ] Configure caching layer
- [ ] Implement database backups
- [ ] Set up monitoring and alerts
- [ ] Consider replication for production
- [ ] Document schema and relationships

---

## Troubleshooting

**Slow Queries:**
1. Use EXPLAIN ANALYZE to identify bottlenecks
2. Add missing indexes
3. Optimize JOIN operations
4. Consider caching frequently accessed data

**Connection Pool Exhaustion:**
1. Increase pool size if resources allow
2. Reduce connection timeout
3. Fix connection leaks in application code
4. Implement connection retry logic

**High Memory Usage:**
1. Optimize queries to return less data
2. Use pagination for large datasets
3. Increase database server memory
4. Tune PostgreSQL shared_buffers

---

## What's Next

Chapter 4 explores vertical vs horizontal scaling—when to scale up versus out.

**[Continue to Chapter 4: Vertical vs Horizontal Scaling →](chapter-04-scaling.md)**

---

**Navigation:**
- [← Back: Chapter 2](chapter-02-single-server.md)
- [→ Next: Chapter 4](chapter-04-scaling.md)
- [Home](README.md)

---

*Chapter 3 of 15 | AEOWEB System Design Guide*
*Updated November 2025*
