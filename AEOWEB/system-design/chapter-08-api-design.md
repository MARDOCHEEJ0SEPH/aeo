# Chapter 8: API Design Fundamentals

## Building Clean, Maintainable APIs

Well-designed APIs are intuitive, consistent, and future-proof. This chapter covers RESTful principles, versioning strategies, error handling, pagination, and complete implementations.

---

## RESTful Principles

### What is REST?

**REST (Representational State Transfer)** is an architectural style for designing networked applications.

**Core Principles:**

```
┌────────────────────────────────────────────┐
│         REST Principles                     │
├────────────────────────────────────────────┤
│                                             │
│ 1. Client-Server Separation                │
│    Client and server are independent       │
│                                             │
│ 2. Stateless                                │
│    Each request contains all information   │
│                                             │
│ 3. Cacheable                                │
│    Responses can be cached                 │
│                                             │
│ 4. Uniform Interface                        │
│    Consistent resource naming              │
│                                             │
│ 5. Layered System                           │
│    Can add intermediaries (load balancers) │
│                                             │
│ 6. Resource-Based                           │
│    URLs represent resources, not actions   │
│                                             │
└────────────────────────────────────────────┘
```

---

## URL Structure Best Practices

### Resource Naming

**Good:**
```
GET    /api/v1/products
GET    /api/v1/products/123
POST   /api/v1/products
PUT    /api/v1/products/123
DELETE /api/v1/products/123

GET    /api/v1/products/123/reviews
POST   /api/v1/products/123/reviews
```

**Bad:**
```
❌ GET  /api/v1/getAllProducts
❌ GET  /api/v1/product-list
❌ POST /api/v1/createProduct
❌ GET  /api/v1/deleteProduct/123
```

### URL Design Rules

**1. Use nouns, not verbs:**
```
✅ /products
❌ /getProducts
```

**2. Use plural nouns:**
```
✅ /products
❌ /product
```

**3. Use hyphens for readability:**
```
✅ /product-categories
❌ /product_categories
❌ /productCategories
```

**4. Use lowercase:**
```
✅ /products
❌ /Products
❌ /PRODUCTS
```

**5. Never use file extensions:**
```
✅ /products/123
❌ /products/123.json
```

**6. Use query parameters for filtering:**
```
✅ /products?category=electronics&price_min=100
❌ /products/electronics/price-min-100
```

---

## API Versioning Strategies

### URL Path Versioning (Recommended)

```javascript
// Version in URL path
GET /api/v1/products
GET /api/v2/products

// Implementation
app.use('/api/v1', require('./routes/v1'));
app.use('/api/v2', require('./routes/v2'));
```

**Pros:**
- Clear and explicit
- Easy to test
- Simple routing

**Cons:**
- URL changes
- Duplicate code possible

### Header Versioning

```javascript
GET /api/products
Headers: {
  'API-Version': '1.0'
}

// Implementation
app.use((req, res, next) => {
  const version = req.headers['api-version'] || '1.0';
  req.apiVersion = version;
  next();
});
```

**Pros:**
- Clean URLs
- More RESTful

**Cons:**
- Less visible
- Harder to test

### Complete Versioning Implementation

```javascript
// api-version-manager.js
class APIVersionManager {
  constructor() {
    this.versions = {
      'v1': require('./routes/v1'),
      'v2': require('./routes/v2')
    };
    this.defaultVersion = 'v1';
    this.deprecatedVersions = ['v1'];
  }

  getRouter(version) {
    if (!this.versions[version]) {
      throw new Error(`API version ${version} not found`);
    }

    return this.versions[version];
  }

  isDeprecated(version) {
    return this.deprecatedVersions.includes(version);
  }
}

// server.js
const express = require('express');
const app = express();
const versionManager = new APIVersionManager();

// Version from URL
app.use('/api/:version', (req, res, next) => {
  const version = req.params.version;

  try {
    // Check if deprecated
    if (versionManager.isDeprecated(version)) {
      res.setHeader('Warning', '299 - "This API version is deprecated"');
      res.setHeader('Sunset', 'Sat, 31 Dec 2024 23:59:59 GMT');
    }

    // Get router for version
    const router = versionManager.getRouter(version);
    router(req, res, next);
  } catch (error) {
    res.status(400).json({
      error: 'Invalid API version',
      message: error.message,
      supportedVersions: ['v1', 'v2']
    });
  }
});
```

---

## Request/Response Design

### Request Structure

```javascript
// POST /api/v1/products
{
  "name": "Wireless Mouse",
  "description": "Ergonomic wireless mouse with USB receiver",
  "price": 29.99,
  "category": "electronics",
  "inventory": {
    "quantity": 150,
    "sku": "WM-001"
  },
  "tags": ["wireless", "computer", "accessories"]
}
```

### Response Structure

**Success Response:**
```javascript
// 200 OK
{
  "success": true,
  "data": {
    "id": 123,
    "name": "Wireless Mouse",
    "description": "Ergonomic wireless mouse with USB receiver",
    "price": 29.99,
    "category": "electronics",
    "inventory": {
      "quantity": 150,
      "sku": "WM-001"
    },
    "tags": ["wireless", "computer", "accessories"],
    "createdAt": "2024-11-20T10:30:00Z",
    "updatedAt": "2024-11-20T10:30:00Z"
  },
  "meta": {
    "timestamp": "2024-11-20T10:30:00Z",
    "version": "v1"
  }
}
```

**Error Response:**
```javascript
// 400 Bad Request
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "price",
        "message": "Price must be a positive number"
      },
      {
        "field": "name",
        "message": "Name is required"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-11-20T10:30:00Z",
    "version": "v1"
  }
}
```

---

## HTTP Status Codes

### Complete Status Code Guide

**2xx Success:**
```javascript
200 OK              // Successful GET, PUT, PATCH
201 Created         // Successful POST
202 Accepted        // Request accepted, processing async
204 No Content      // Successful DELETE

// Examples
app.get('/api/v1/products/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);
  res.status(200).json({ success: true, data: product });
});

app.post('/api/v1/products', async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, data: product });
});

app.delete('/api/v1/products/:id', async (req, res) => {
  await Product.delete(req.params.id);
  res.status(204).send();
});
```

**4xx Client Errors:**
```javascript
400 Bad Request         // Invalid request data
401 Unauthorized        // Authentication required
403 Forbidden           // Authenticated but not authorized
404 Not Found           // Resource doesn't exist
409 Conflict            // Conflict with current state
422 Unprocessable Entity // Validation errors
429 Too Many Requests   // Rate limit exceeded

// Examples
app.post('/api/v1/products', validate, async (req, res) => {
  if (!req.isValid) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_REQUEST', message: 'Invalid data' }
    });
  }
});

app.get('/api/v1/admin/products', authenticate, authorize, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
    });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Admin access required' }
    });
  }
});
```

**5xx Server Errors:**
```javascript
500 Internal Server Error  // Generic server error
502 Bad Gateway           // Invalid response from upstream
503 Service Unavailable   // Server temporarily unavailable
504 Gateway Timeout       // Upstream timeout

// Example
app.use((error, req, res, next) => {
  console.error(error);

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  });
});
```

---

## Pagination Implementation

### Offset-Based Pagination

```javascript
// GET /api/v1/products?page=2&limit=20

app.get('/api/v1/products', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  // Get total count
  const totalResult = await pool.query('SELECT COUNT(*) FROM products');
  const total = parseInt(totalResult.rows[0].count);

  // Get products
  const result = await pool.query(
    'SELECT * FROM products ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );

  res.json({
    success: true,
    data: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    }
  });
});
```

### Cursor-Based Pagination (Better for large datasets)

```javascript
// GET /api/v1/products?cursor=eyJpZCI6MTIzfQ&limit=20

app.get('/api/v1/products', async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  let cursor = null;

  // Decode cursor
  if (req.query.cursor) {
    cursor = JSON.parse(Buffer.from(req.query.cursor, 'base64').toString());
  }

  // Build query
  let query = 'SELECT * FROM products';
  const params = [limit + 1]; // Fetch one extra to determine if more exist

  if (cursor) {
    query += ' WHERE id > $2';
    params.push(cursor.id);
  }

  query += ' ORDER BY id ASC LIMIT $1';

  const result = await pool.query(query, params);

  // Check if more results exist
  const hasMore = result.rows.length > limit;
  const products = hasMore ? result.rows.slice(0, -1) : result.rows;

  // Generate next cursor
  let nextCursor = null;
  if (hasMore) {
    const lastProduct = products[products.length - 1];
    nextCursor = Buffer.from(JSON.stringify({ id: lastProduct.id })).toString('base64');
  }

  res.json({
    success: true,
    data: products,
    pagination: {
      nextCursor,
      hasMore,
      limit
    }
  });
});
```

---

## Filtering and Sorting

### Complete Filtering Implementation

```javascript
// GET /api/v1/products?category=electronics&price_min=100&price_max=500&sort=-price&search=mouse

app.get('/api/v1/products', async (req, res) => {
  const {
    category,
    price_min,
    price_max,
    search,
    sort,
    page = 1,
    limit = 20
  } = req.query;

  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];
  let paramCount = 0;

  // Category filter
  if (category) {
    paramCount++;
    query += ` AND category = $${paramCount}`;
    params.push(category);
  }

  // Price range filter
  if (price_min) {
    paramCount++;
    query += ` AND price >= $${paramCount}`;
    params.push(parseFloat(price_min));
  }

  if (price_max) {
    paramCount++;
    query += ` AND price <= $${paramCount}`;
    params.push(parseFloat(price_max));
  }

  // Search filter
  if (search) {
    paramCount++;
    query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
    params.push(`%${search}%`);
  }

  // Sorting
  const validSortFields = ['price', 'name', 'created_at'];
  let sortField = 'created_at';
  let sortOrder = 'DESC';

  if (sort) {
    const isDescending = sort.startsWith('-');
    const field = isDescending ? sort.substring(1) : sort;

    if (validSortFields.includes(field)) {
      sortField = field;
      sortOrder = isDescending ? 'DESC' : 'ASC';
    }
  }

  query += ` ORDER BY ${sortField} ${sortOrder}`;

  // Pagination
  const offset = (parseInt(page) - 1) * parseInt(limit);
  paramCount += 2;
  query += ` LIMIT $${paramCount - 1} OFFSET $${paramCount}`;
  params.push(parseInt(limit), offset);

  // Execute query
  const result = await pool.query(query, params);

  // Get total count for pagination
  let countQuery = 'SELECT COUNT(*) FROM products WHERE 1=1';
  const countParams = params.slice(0, -2); // Remove limit and offset

  if (category) countQuery += ' AND category = $1';
  if (price_min) countQuery += ` AND price >= $${countParams.length}`;
  if (price_max) countQuery += ` AND price <= $${countParams.length}`;
  if (search) countQuery += ` AND (name ILIKE $${countParams.length} OR description ILIKE $${countParams.length})`;

  const countResult = await pool.query(countQuery, countParams);
  const total = parseInt(countResult.rows[0].count);

  res.json({
    success: true,
    data: result.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    },
    filters: {
      category,
      price_min,
      price_max,
      search,
      sort
    }
  });
});
```

---

## Rate Limiting

### Implementation with express-rate-limit

```javascript
// middleware/rate-limit.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379
});

// General API rate limit
const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:api:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later'
    }
  }
});

// Strict rate limit for auth endpoints
const authLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:auth:'
  }),
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 login attempts per 15 minutes
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_LOGIN_ATTEMPTS',
      message: 'Too many login attempts, please try again later'
    }
  }
});

// Usage
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);

module.exports = { apiLimiter, authLimiter };
```

---

## API Documentation (Swagger/OpenAPI)

### Complete Swagger Setup

```javascript
// swagger.js
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-Commerce API',
      version: '1.0.0',
      description: 'A comprehensive e-commerce API',
      contact: {
        name: 'API Support',
        email: 'api@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.example.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Product: {
          type: 'object',
          required: ['name', 'price'],
          properties: {
            id: {
              type: 'integer',
              description: 'Product ID'
            },
            name: {
              type: 'string',
              description: 'Product name'
            },
            description: {
              type: 'string',
              description: 'Product description'
            },
            price: {
              type: 'number',
              format: 'float',
              description: 'Product price'
            },
            category: {
              type: 'string',
              description: 'Product category'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string'
                },
                message: {
                  type: 'string'
                }
              }
            }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = { specs, swaggerUi };
```

**Documented Route:**

```javascript
/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/v1/products', async (req, res) => {
  // Implementation
});

// Mount Swagger UI
const { specs, swaggerUi } = require('./swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
```

---

## Complete API Example

### Product API Implementation

```javascript
// routes/products.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// Validation middleware
const validateProduct = [
  body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be positive'),
  body('category').optional().isString(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: errors.array()
        }
      });
    }
    next();
  }
];

// GET /api/v1/products
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND name ILIKE $${params.length}`;
    }

    params.push(limit, offset);
    query += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: { page, limit }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// GET /api/v1/products/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM products WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' }
      });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// POST /api/v1/products
router.post('/', validateProduct, async (req, res) => {
  try {
    const { name, description, price, category } = req.body;

    const result = await pool.query(
      'INSERT INTO products (name, description, price, category) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, price, category]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// PUT /api/v1/products/:id
router.put('/:id', validateProduct, async (req, res) => {
  try {
    const { name, description, price, category } = req.body;

    const result = await pool.query(
      'UPDATE products SET name = $1, description = $2, price = $3, category = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
      [name, description, price, category, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' }
      });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// DELETE /api/v1/products/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' }
      });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

module.exports = router;
```

---

## Key Takeaways

✅ **RESTful design** makes APIs intuitive and predictable
✅ **URL versioning** is simple and explicit
✅ **Consistent responses** improve developer experience
✅ **Proper status codes** communicate intent clearly
✅ **Pagination** is essential for large datasets
✅ **Rate limiting** protects against abuse
✅ **Documentation** is critical for adoption

---

## Implementation Checklist

- [ ] Design RESTful URL structure
- [ ] Implement API versioning
- [ ] Standardize response format
- [ ] Use appropriate HTTP status codes
- [ ] Add pagination to list endpoints
- [ ] Implement filtering and sorting
- [ ] Add rate limiting
- [ ] Create API documentation
- [ ] Add request validation
- [ ] Implement error handling
- [ ] Test all endpoints

---

## What's Next

Chapter 9 covers API Protocols—HTTP, WebSockets, gRPC, and GraphQL.

**[Continue to Chapter 9: API Protocols →](chapter-09-api-protocols.md)**

---

**Navigation:**
- [← Back: Chapter 7](chapter-07-spof.md)
- [→ Next: Chapter 9](chapter-09-api-protocols.md)
- [Home](README.md)

---

*Chapter 8 of 15 | AEOWEB System Design Guide*
*Updated November 2025*
