# Chapter 11: RESTful APIs Deep Dive

## Building Production-Ready REST APIs

REST (Representational State Transfer) is the de facto standard for web APIs. This chapter provides complete CRUD implementations, testing strategies, and best practices.

---

## HTTP Methods in Detail

### Complete Method Guide

```
┌─────────────────────────────────────────────────┐
│         HTTP Methods                             │
├─────────────────────────────────────────────────┤
│                                                  │
│ GET - Retrieve resource(s)                       │
│ ├─ Safe: Yes (no side effects)                  │
│ ├─ Idempotent: Yes                              │
│ └─ Cacheable: Yes                               │
│                                                  │
│ POST - Create new resource                       │
│ ├─ Safe: No                                     │
│ ├─ Idempotent: No                               │
│ └─ Cacheable: Sometimes                         │
│                                                  │
│ PUT - Replace entire resource                    │
│ ├─ Safe: No                                     │
│ ├─ Idempotent: Yes                              │
│ └─ Cacheable: No                                │
│                                                  │
│ PATCH - Update part of resource                  │
│ ├─ Safe: No                                     │
│ ├─ Idempotent: Yes*                             │
│ └─ Cacheable: No                                │
│                                                  │
│ DELETE - Remove resource                         │
│ ├─ Safe: No                                     │
│ ├─ Idempotent: Yes                              │
│ └─ Cacheable: No                                │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## Complete CRUD Implementation

### Resource: Products

```javascript
// routes/products.js
const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const { body, param, query, validationResult } = require('express-validator');

// ============================================
// GET /api/products - List products
// ============================================
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('sort').optional().isIn(['price', '-price', 'name', '-name', 'created_at', '-created_at']),
    query('category').optional().isString(),
    query('min_price').optional().isFloat({ min: 0 }),
    query('max_price').optional().isFloat({ min: 0 }),
    query('search').optional().isString()
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: errors.array()
          }
        });
      }

      // Parse query parameters
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      const { category, min_price, max_price, search, sort } = req.query;

      // Build query
      let query = 'SELECT * FROM products WHERE 1=1';
      const params = [];
      let paramCount = 0;

      if (category) {
        paramCount++;
        query += ` AND category = $${paramCount}`;
        params.push(category);
      }

      if (min_price) {
        paramCount++;
        query += ` AND price >= $${paramCount}`;
        params.push(parseFloat(min_price));
      }

      if (max_price) {
        paramCount++;
        query += ` AND price <= $${paramCount}`;
        params.push(parseFloat(max_price));
      }

      if (search) {
        paramCount++;
        query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
        params.push(`%${search}%`);
      }

      // Sorting
      const sortMap = {
        'price': 'price ASC',
        '-price': 'price DESC',
        'name': 'name ASC',
        '-name': 'name DESC',
        'created_at': 'created_at ASC',
        '-created_at': 'created_at DESC'
      };

      const orderBy = sortMap[sort] || 'created_at DESC';
      query += ` ORDER BY ${orderBy}`;

      // Pagination
      paramCount += 2;
      query += ` LIMIT $${paramCount - 1} OFFSET $${paramCount}`;
      params.push(limit, offset);

      // Execute query
      const result = await pool.query(query, params);

      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM products WHERE 1=1';
      const countParams = [];
      let countParamCount = 0;

      if (category) {
        countParamCount++;
        countQuery += ` AND category = $${countParamCount}`;
        countParams.push(category);
      }

      if (min_price) {
        countParamCount++;
        countQuery += ` AND price >= $${countParamCount}`;
        countParams.push(parseFloat(min_price));
      }

      if (max_price) {
        countParamCount++;
        countQuery += ` AND price <= $${countParamCount}`;
        countParams.push(parseFloat(max_price));
      }

      if (search) {
        countParamCount++;
        countQuery += ` AND (name ILIKE $${countParamCount} OR description ILIKE $${countParamCount})`;
        countParams.push(`%${search}%`);
      }

      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);

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
        },
        filters: {
          category,
          min_price,
          max_price,
          search,
          sort
        }
      });

    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch products'
        }
      });
    }
  }
);

// ============================================
// GET /api/products/:id - Get single product
// ============================================
router.get('/:id',
  [
    param('id').isInt({ min: 1 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid product ID',
            details: errors.array()
          }
        });
      }

      const result = await pool.query(
        `SELECT
          p.*,
          json_agg(
            json_build_object(
              'id', pi.id,
              'url', pi.url,
              'alt_text', pi.alt_text,
              'position', pi.position
            )
          ) FILTER (WHERE pi.id IS NOT NULL) as images,
          COALESCE(AVG(r.rating), 0) as avg_rating,
          COUNT(DISTINCT r.id) as review_count
        FROM products p
        LEFT JOIN product_images pi ON p.id = pi.product_id
        LEFT JOIN reviews r ON p.id = r.product_id
        WHERE p.id = $1
        GROUP BY p.id`,
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Product not found'
          }
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch product'
        }
      });
    }
  }
);

// ============================================
// POST /api/products - Create product
// ============================================
router.post('/',
  [
    body('name').trim().isLength({ min: 1, max: 255 }),
    body('description').optional().trim(),
    body('price').isFloat({ min: 0 }),
    body('compare_at_price').optional().isFloat({ min: 0 }),
    body('category').optional().trim(),
    body('sku').optional().trim(),
    body('quantity').optional().isInt({ min: 0 }),
    body('images').optional().isArray(),
    body('images.*.url').optional().isURL(),
    body('images.*.alt_text').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid product data',
            details: errors.array()
          }
        });
      }

      const {
        name,
        description,
        price,
        compare_at_price,
        category,
        sku,
        quantity,
        images
      } = req.body;

      // Start transaction
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // Insert product
        const productResult = await client.query(
          `INSERT INTO products (
            name, description, price, compare_at_price,
            category, sku, quantity
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *`,
          [name, description, price, compare_at_price || null, category, sku, quantity || 0]
        );

        const product = productResult.rows[0];

        // Insert images if provided
        if (images && images.length > 0) {
          for (let i = 0; i < images.length; i++) {
            await client.query(
              `INSERT INTO product_images (product_id, url, alt_text, position)
              VALUES ($1, $2, $3, $4)`,
              [product.id, images[i].url, images[i].alt_text || '', i]
            );
          }
        }

        await client.query('COMMIT');

        res.status(201).json({
          success: true,
          data: product
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Error creating product:', error);

      // Handle unique constraint violations
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_ERROR',
            message: 'Product with this SKU already exists'
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create product'
        }
      });
    }
  }
);

// ============================================
// PUT /api/products/:id - Replace product
// ============================================
router.put('/:id',
  [
    param('id').isInt({ min: 1 }),
    body('name').trim().isLength({ min: 1, max: 255 }),
    body('description').optional().trim(),
    body('price').isFloat({ min: 0 }),
    body('compare_at_price').optional().isFloat({ min: 0 }),
    body('category').optional().trim(),
    body('sku').optional().trim(),
    body('quantity').optional().isInt({ min: 0 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid product data',
            details: errors.array()
          }
        });
      }

      const {
        name,
        description,
        price,
        compare_at_price,
        category,
        sku,
        quantity
      } = req.body;

      const result = await pool.query(
        `UPDATE products
        SET name = $1, description = $2, price = $3,
            compare_at_price = $4, category = $5,
            sku = $6, quantity = $7, updated_at = NOW()
        WHERE id = $8
        RETURNING *`,
        [name, description, price, compare_at_price || null,
         category, sku, quantity || 0, req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Product not found'
          }
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update product'
        }
      });
    }
  }
);

// ============================================
// PATCH /api/products/:id - Partial update
// ============================================
router.patch('/:id',
  [
    param('id').isInt({ min: 1 }),
    body('name').optional().trim().isLength({ min: 1, max: 255 }),
    body('description').optional().trim(),
    body('price').optional().isFloat({ min: 0 }),
    body('compare_at_price').optional().isFloat({ min: 0 }),
    body('category').optional().trim(),
    body('sku').optional().trim(),
    body('quantity').optional().isInt({ min: 0 }),
    body('published').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid product data',
            details: errors.array()
          }
        });
      }

      // Build dynamic UPDATE query
      const updates = [];
      const values = [];
      let paramCount = 0;

      const allowedFields = [
        'name', 'description', 'price', 'compare_at_price',
        'category', 'sku', 'quantity', 'published'
      ];

      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          paramCount++;
          updates.push(`${field} = $${paramCount}`);
          values.push(req.body[field]);
        }
      });

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NO_UPDATES',
            message: 'No valid fields to update'
          }
        });
      }

      // Add updated_at
      paramCount++;
      updates.push(`updated_at = NOW()`);

      // Add WHERE clause
      paramCount++;
      values.push(req.params.id);

      const query = `
        UPDATE products
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Product not found'
          }
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update product'
        }
      });
    }
  }
);

// ============================================
// DELETE /api/products/:id - Delete product
// ============================================
router.delete('/:id',
  [
    param('id').isInt({ min: 1 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid product ID',
            details: errors.array()
          }
        });
      }

      const result = await pool.query(
        'DELETE FROM products WHERE id = $1 RETURNING *',
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Product not found'
          }
        });
      }

      // 204 No Content (successful deletion)
      res.status(204).send();

    } catch (error) {
      console.error('Error deleting product:', error);

      // Check for foreign key violations
      if (error.code === '23503') {
        return res.status(409).json({
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'Cannot delete product with existing orders'
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete product'
        }
      });
    }
  }
);

module.exports = router;
```

---

## HTTP Status Codes - Complete Guide

### Success Codes (2xx)

```javascript
// 200 OK - Standard success response
res.status(200).json({ data: resource });

// 201 Created - Resource successfully created
res.status(201)
   .location(`/api/products/${newProduct.id}`)
   .json({ data: newProduct });

// 202 Accepted - Request accepted for processing
res.status(202).json({
  message: 'Processing started',
  jobId: 'job_123'
});

// 204 No Content - Success with no response body
res.status(204).send();
```

### Client Error Codes (4xx)

```javascript
// 400 Bad Request - Invalid request data
res.status(400).json({
  error: {
    code: 'INVALID_REQUEST',
    message: 'Invalid data provided'
  }
});

// 401 Unauthorized - Authentication required
res.status(401).json({
  error: {
    code: 'UNAUTHORIZED',
    message: 'Authentication required'
  }
});

// 403 Forbidden - Authenticated but not authorized
res.status(403).json({
  error: {
    code: 'FORBIDDEN',
    message: 'Insufficient permissions'
  }
});

// 404 Not Found - Resource doesn't exist
res.status(404).json({
  error: {
    code: 'NOT_FOUND',
    message: 'Resource not found'
  }
});

// 409 Conflict - Request conflicts with current state
res.status(409).json({
  error: {
    code: 'CONFLICT',
    message: 'Resource already exists'
  }
});

// 422 Unprocessable Entity - Validation errors
res.status(422).json({
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    details: validationErrors
  }
});

// 429 Too Many Requests - Rate limit exceeded
res.status(429)
   .header('Retry-After', '60')
   .json({
     error: {
       code: 'RATE_LIMIT_EXCEEDED',
       message: 'Too many requests'
     }
   });
```

### Server Error Codes (5xx)

```javascript
// 500 Internal Server Error - Generic server error
res.status(500).json({
  error: {
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred'
  }
});

// 502 Bad Gateway - Invalid response from upstream
res.status(502).json({
  error: {
    code: 'BAD_GATEWAY',
    message: 'Invalid response from upstream service'
  }
});

// 503 Service Unavailable - Service temporarily unavailable
res.status(503)
   .header('Retry-After', '120')
   .json({
     error: {
       code: 'SERVICE_UNAVAILABLE',
       message: 'Service temporarily unavailable'
     }
   });

// 504 Gateway Timeout - Upstream timeout
res.status(504).json({
  error: {
    code: 'GATEWAY_TIMEOUT',
    message: 'Upstream service timeout'
  }
});
```

---

## Testing REST APIs

### Using Jest and Supertest

```javascript
// __tests__/products.test.js
const request = require('supertest');
const app = require('../app');
const { pool } = require('../database');

describe('Products API', () => {
  let productId;

  beforeAll(async () => {
    // Setup test database
    await pool.query('DELETE FROM products');
  });

  afterAll(async () => {
    // Cleanup
    await pool.end();
  });

  // ==================== CREATE ====================
  describe('POST /api/products', () => {
    it('should create a new product', async () => {
      const response = await request(app)
        .post('/api/products')
        .send({
          name: 'Test Product',
          description: 'Test description',
          price: 99.99,
          category: 'electronics',
          sku: 'TEST-001',
          quantity: 100
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('Test Product');

      productId = response.body.data.id;
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/products')
        .send({
          name: '',
          price: -10
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 409 for duplicate SKU', async () => {
      const response = await request(app)
        .post('/api/products')
        .send({
          name: 'Another Product',
          price: 49.99,
          sku: 'TEST-001' // Duplicate
        });

      expect(response.status).toBe(409);
    });
  });

  // ==================== READ ====================
  describe('GET /api/products', () => {
    it('should list all products', async () => {
      const response = await request(app)
        .get('/api/products');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/products?category=electronics');

      expect(response.status).toBe(200);
      expect(response.body.data.every(p => p.category === 'electronics')).toBe(true);
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/products?page=1&limit=10');

      expect(response.status).toBe(200);
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 10);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should get single product', async () => {
      const response = await request(app)
        .get(`/api/products/${productId}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(productId);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/products/99999');

      expect(response.status).toBe(404);
    });
  });

  // ==================== UPDATE ====================
  describe('PUT /api/products/:id', () => {
    it('should replace product', async () => {
      const response = await request(app)
        .put(`/api/products/${productId}`)
        .send({
          name: 'Updated Product',
          description: 'Updated description',
          price: 149.99,
          category: 'electronics',
          sku: 'TEST-001',
          quantity: 50
        });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Updated Product');
      expect(response.body.data.price).toBe('149.99');
    });
  });

  describe('PATCH /api/products/:id', () => {
    it('should partially update product', async () => {
      const response = await request(app)
        .patch(`/api/products/${productId}`)
        .send({
          price: 199.99
        });

      expect(response.status).toBe(200);
      expect(response.body.data.price).toBe('199.99');
      expect(response.body.data.name).toBe('Updated Product');
    });
  });

  // ==================== DELETE ====================
  describe('DELETE /api/products/:id', () => {
    it('should delete product', async () => {
      const response = await request(app)
        .delete(`/api/products/${productId}`);

      expect(response.status).toBe(204);
    });

    it('should return 404 for already deleted product', async () => {
      const response = await request(app)
        .delete(`/api/products/${productId}`);

      expect(response.status).toBe(404);
    });
  });
});
```

---

## REST API Best Practices

### 1. Content Negotiation

```javascript
// Accept different content types
app.get('/api/products/:id', async (req, res) => {
  const product = await getProduct(req.params.id);

  if (req.accepts('json')) {
    res.json(product);
  } else if (req.accepts('xml')) {
    res.type('xml').send(toXML(product));
  } else {
    res.status(406).send('Not Acceptable');
  }
});
```

### 2. Conditional Requests

```javascript
// ETag for caching
app.get('/api/products/:id', async (req, res) => {
  const product = await getProduct(req.params.id);
  const etag = generateETag(product);

  if (req.headers['if-none-match'] === etag) {
    return res.status(304).send(); // Not Modified
  }

  res.set('ETag', etag).json(product);
});
```

### 3. Range Requests

```javascript
// Support partial responses
app.get('/api/products', async (req, res) => {
  const total = await getProductCount();
  const range = req.headers.range;

  if (range) {
    const [start, end] = parseRange(range, total);
    const products = await getProducts(start, end);

    res.status(206)
       .header('Content-Range', `items ${start}-${end}/${total}`)
       .json(products);
  } else {
    const products = await getProducts();
    res.json(products);
  }
});
```

---

## Key Takeaways

✅ **REST** uses HTTP methods for CRUD operations
✅ **Status codes** communicate operation results
✅ **Validation** prevents invalid data
✅ **Pagination** is essential for large datasets
✅ **Filtering and sorting** improve usability
✅ **Testing** ensures API reliability
✅ **Documentation** improves adoption

---

## Implementation Checklist

- [ ] Implement all CRUD operations
- [ ] Use appropriate HTTP methods
- [ ] Return correct status codes
- [ ] Add input validation
- [ ] Implement pagination
- [ ] Add filtering and sorting
- [ ] Write comprehensive tests
- [ ] Add error handling
- [ ] Document all endpoints
- [ ] Implement rate limiting
- [ ] Add caching headers

---

## What's Next

Chapter 12 covers GraphQL implementation—an alternative to REST for complex data requirements.

**[Continue to Chapter 12: GraphQL Implementation →](chapter-12-graphql.md)**

---

**Navigation:**
- [← Back: Chapter 10](chapter-10-transport-layer.md)
- [→ Next: Chapter 12](chapter-12-graphql.md)
- [Home](README.md)

---

*Chapter 11 of 15 | AEOWEB System Design Guide*
*Updated November 2025*
