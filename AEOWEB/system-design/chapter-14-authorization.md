# Chapter 14: Authorization

## Implementing Access Control Systems

Authorization determines what authenticated users can do. This chapter covers Role-Based Access Control (RBAC), Attribute-Based Access Control (ABAC), and complete permission systems.

---

## Authentication vs Authorization

```
┌──────────────────────────────────────────────────┐
│    Authentication vs Authorization                │
├──────────────────────────────────────────────────┤
│                                                   │
│ Authentication:                                   │
│ "Who are you?"                                    │
│ ├─ Verifies identity                             │
│ ├─ Login with credentials                        │
│ └─ Gets user information                         │
│                                                   │
│ Authorization:                                    │
│ "What can you do?"                                │
│ ├─ Checks permissions                            │
│ ├─ Role-based access                             │
│ └─ Resource-level control                        │
│                                                   │
│ Example:                                          │
│ User logs in (Authentication) ✓                  │
│ User tries to delete product:                    │
│   - Is user an admin? (Authorization)            │
│   - Does user own this resource?                 │
│                                                   │
└──────────────────────────────────────────────────┘
```

---

## Role-Based Access Control (RBAC)

### RBAC Concepts

```
┌──────────────────────────────────────────┐
│         RBAC Hierarchy                    │
├──────────────────────────────────────────┤
│                                           │
│  Users → Roles → Permissions             │
│                                           │
│  User: john@example.com                  │
│    ↓                                      │
│  Role: Admin                              │
│    ↓                                      │
│  Permissions:                             │
│    - products:create                      │
│    - products:read                        │
│    - products:update                      │
│    - products:delete                      │
│    - users:manage                         │
│                                           │
└──────────────────────────────────────────┘
```

### Database Schema for RBAC

```sql
-- Roles table
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissions table
CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User roles (many-to-many)
CREATE TABLE user_roles (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id)
);

-- Role permissions (many-to-many)
CREATE TABLE role_permissions (
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id)
);

-- Seed data
INSERT INTO roles (name, description) VALUES
  ('admin', 'Full system access'),
  ('manager', 'Manage products and orders'),
  ('customer', 'Standard customer access');

INSERT INTO permissions (name, resource, action, description) VALUES
  ('products:create', 'products', 'create', 'Create new products'),
  ('products:read', 'products', 'read', 'View products'),
  ('products:update', 'products', 'update', 'Update existing products'),
  ('products:delete', 'products', 'delete', 'Delete products'),
  ('orders:create', 'orders', 'create', 'Create orders'),
  ('orders:read', 'orders', 'read', 'View orders'),
  ('orders:update', 'orders', 'update', 'Update order status'),
  ('orders:delete', 'orders', 'delete', 'Cancel orders'),
  ('users:manage', 'users', 'manage', 'Manage users and roles');

-- Assign permissions to roles
-- Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- Manager gets product and order management
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions
WHERE resource IN ('products', 'orders');

-- Customer gets basic read and create
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions
WHERE name IN ('products:read', 'orders:create', 'orders:read');
```

### Complete RBAC Implementation

```javascript
// authorization/rbac.js
const { pool } = require('../database');

class RBAC {
  // Get user's roles
  static async getUserRoles(userId) {
    const result = await pool.query(
      `SELECT r.id, r.name, r.description
      FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = $1`,
      [userId]
    );

    return result.rows;
  }

  // Get user's permissions
  static async getUserPermissions(userId) {
    const result = await pool.query(
      `SELECT DISTINCT p.name, p.resource, p.action
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = $1`,
      [userId]
    );

    return result.rows;
  }

  // Check if user has permission
  static async hasPermission(userId, permissionName) {
    const result = await pool.query(
      `SELECT EXISTS(
        SELECT 1
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        JOIN user_roles ur ON rp.role_id = ur.role_id
        WHERE ur.user_id = $1 AND p.name = $2
      ) as has_permission`,
      [userId, permissionName]
    );

    return result.rows[0].has_permission;
  }

  // Check if user has role
  static async hasRole(userId, roleName) {
    const result = await pool.query(
      `SELECT EXISTS(
        SELECT 1
        FROM roles r
        JOIN user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = $1 AND r.name = $2
      ) as has_role`,
      [userId, roleName]
    );

    return result.rows[0].has_role;
  }

  // Assign role to user
  static async assignRole(userId, roleName) {
    const roleResult = await pool.query(
      'SELECT id FROM roles WHERE name = $1',
      [roleName]
    );

    if (roleResult.rows.length === 0) {
      throw new Error('Role not found');
    }

    await pool.query(
      'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, roleResult.rows[0].id]
    );
  }

  // Remove role from user
  static async removeRole(userId, roleName) {
    await pool.query(
      `DELETE FROM user_roles
      WHERE user_id = $1 AND role_id = (
        SELECT id FROM roles WHERE name = $2
      )`,
      [userId, roleName]
    );
  }

  // Create new role
  static async createRole(name, description, permissionNames = []) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Create role
      const roleResult = await client.query(
        'INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING id',
        [name, description]
      );

      const roleId = roleResult.rows[0].id;

      // Assign permissions
      if (permissionNames.length > 0) {
        for (const permName of permissionNames) {
          await client.query(
            `INSERT INTO role_permissions (role_id, permission_id)
            SELECT $1, id FROM permissions WHERE name = $2`,
            [roleId, permName]
          );
        }
      }

      await client.query('COMMIT');
      return roleId;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = RBAC;
```

### Authorization Middleware

```javascript
// middleware/authorize.js
const RBAC = require('../authorization/rbac');

// Check if user has specific permission
function requirePermission(permissionName) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const hasPermission = await RBAC.hasPermission(req.user.userId, permissionName);

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        required: permissionName
      });
    }

    next();
  };
}

// Check if user has specific role
function requireRole(roleName) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const hasRole = await RBAC.hasRole(req.user.userId, roleName);

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        required: `Role: ${roleName}`
      });
    }

    next();
  };
}

// Check if user has any of the specified permissions
function requireAnyPermission(...permissionNames) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    for (const permName of permissionNames) {
      const hasPermission = await RBAC.hasPermission(req.user.userId, permName);
      if (hasPermission) {
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions',
      required: `One of: ${permissionNames.join(', ')}`
    });
  };
}

module.exports = {
  requirePermission,
  requireRole,
  requireAnyPermission
};
```

### Using Authorization in Routes

```javascript
// routes/products.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../auth/jwt');
const { requirePermission, requireRole } = require('../middleware/authorize');

// Public endpoint - no auth required
router.get('/', async (req, res) => {
  // List products
});

// Requires authentication
router.get('/:id', authenticateToken, async (req, res) => {
  // Get product details
});

// Requires specific permission
router.post('/',
  authenticateToken,
  requirePermission('products:create'),
  async (req, res) => {
    // Create product
  }
);

// Requires specific role
router.put('/:id',
  authenticateToken,
  requireRole('admin'),
  async (req, res) => {
    // Update product
  }
);

// Multiple permission options
router.delete('/:id',
  authenticateToken,
  requireAnyPermission('products:delete', 'admin:all'),
  async (req, res) => {
    // Delete product
  }
);

module.exports = router;
```

---

## Resource-Based Authorization

### Ownership Check

```javascript
// middleware/resource-auth.js

// Check if user owns the resource
async function requireOwnership(resourceType, resourceIdParam = 'id') {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const resourceId = req.params[resourceIdParam];

    let query;
    let params;

    switch (resourceType) {
      case 'order':
        query = 'SELECT user_id FROM orders WHERE id = $1';
        params = [resourceId];
        break;

      case 'review':
        query = 'SELECT user_id FROM reviews WHERE id = $1';
        params = [resourceId];
        break;

      case 'address':
        query = 'SELECT user_id FROM addresses WHERE id = $1';
        params = [resourceId];
        break;

      default:
        return res.status(500).json({
          success: false,
          error: 'Unknown resource type'
        });
    }

    try {
      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Resource not found'
        });
      }

      const ownerId = result.rows[0].user_id;

      // Check ownership or admin role
      const isOwner = ownerId === req.user.userId;
      const isAdmin = await RBAC.hasRole(req.user.userId, 'admin');

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Access denied - not resource owner'
        });
      }

      // Attach ownership info to request
      req.resourceOwner = ownerId;
      req.isResourceOwner = isOwner;

      next();

    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify ownership'
      });
    }
  };
}

// Usage
router.put('/orders/:id',
  authenticateToken,
  requireOwnership('order'),
  async (req, res) => {
    // Update order - only owner or admin can access
  }
);

module.exports = { requireOwnership };
```

---

## Attribute-Based Access Control (ABAC)

### ABAC Concepts

```
┌────────────────────────────────────────────────┐
│         ABAC Decision Factors                  │
├────────────────────────────────────────────────┤
│                                                │
│ Subject Attributes:                            │
│ ├─ User role: "manager"                       │
│ ├─ User department: "sales"                   │
│ └─ User clearance: "confidential"             │
│                                                │
│ Resource Attributes:                           │
│ ├─ Document type: "contract"                  │
│ ├─ Document owner: user_123                   │
│ └─ Document classification: "confidential"    │
│                                                │
│ Action:                                        │
│ └─ "read", "write", "delete"                  │
│                                                │
│ Environment:                                   │
│ ├─ Time: business hours                       │
│ ├─ Location: office IP                        │
│ └─ Device: trusted                            │
│                                                │
└────────────────────────────────────────────────┘
```

### ABAC Implementation

```javascript
// authorization/abac.js
class ABAC {
  // Policy evaluation
  static async evaluate(subject, resource, action, environment = {}) {
    const policies = await this.getApplicablePolicies(action);

    for (const policy of policies) {
      const result = await this.evaluatePolicy(
        policy,
        subject,
        resource,
        action,
        environment
      );

      if (result.effect === 'deny') {
        return { allowed: false, reason: result.reason };
      }

      if (result.effect === 'allow') {
        return { allowed: true };
      }
    }

    // Default deny
    return { allowed: false, reason: 'No matching policy' };
  }

  static async evaluatePolicy(policy, subject, resource, action, environment) {
    // Check all conditions
    for (const condition of policy.conditions) {
      const satisfied = await this.evaluateCondition(
        condition,
        subject,
        resource,
        environment
      );

      if (!satisfied) {
        return { effect: 'none' };
      }
    }

    return { effect: policy.effect, reason: policy.description };
  }

  static async evaluateCondition(condition, subject, resource, environment) {
    const { attribute, operator, value } = condition;

    // Get attribute value
    let actualValue;

    if (attribute.startsWith('subject.')) {
      const attr = attribute.substring(8);
      actualValue = subject[attr];
    } else if (attribute.startsWith('resource.')) {
      const attr = attribute.substring(9);
      actualValue = resource[attr];
    } else if (attribute.startsWith('environment.')) {
      const attr = attribute.substring(12);
      actualValue = environment[attr];
    }

    // Evaluate operator
    switch (operator) {
      case 'equals':
        return actualValue === value;
      case 'notEquals':
        return actualValue !== value;
      case 'in':
        return Array.isArray(value) && value.includes(actualValue);
      case 'contains':
        return Array.isArray(actualValue) && actualValue.includes(value);
      case 'greaterThan':
        return actualValue > value;
      case 'lessThan':
        return actualValue < value;
      default:
        return false;
    }
  }

  static async getApplicablePolicies(action) {
    // Load policies from database or config
    return [
      {
        id: 1,
        name: 'Department access',
        effect: 'allow',
        description: 'Users can access resources in their department',
        conditions: [
          {
            attribute: 'subject.department',
            operator: 'equals',
            value: 'resource.department'
          }
        ]
      },
      {
        id: 2,
        name: 'Manager override',
        effect: 'allow',
        description: 'Managers can access all department resources',
        conditions: [
          {
            attribute: 'subject.role',
            operator: 'equals',
            value: 'manager'
          }
        ]
      },
      {
        id: 3,
        name: 'Business hours only',
        effect: 'deny',
        description: 'Access denied outside business hours',
        conditions: [
          {
            attribute: 'environment.hour',
            operator: 'lessThan',
            value: 9
          }
        ]
      }
    ];
  }
}

// Middleware
async function enforceABAC(getResource) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Get resource
    const resource = await getResource(req);

    // Build subject
    const subject = {
      id: req.user.userId,
      role: req.user.role,
      department: req.user.department
    };

    // Build environment
    const environment = {
      hour: new Date().getHours(),
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    // Evaluate
    const result = await ABAC.evaluate(
      subject,
      resource,
      req.method.toLowerCase(),
      environment
    );

    if (!result.allowed) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        reason: result.reason
      });
    }

    next();
  };
}

module.exports = { ABAC, enforceABAC };
```

---

## Permission Caching

### Redis-Based Permission Cache

```javascript
// authorization/permission-cache.js
const Redis = require('ioredis');
const RBAC = require('./rbac');

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379
});

class PermissionCache {
  static async getUserPermissions(userId) {
    const cacheKey = `permissions:${userId}`;

    // Try cache first
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // Get from database
    const permissions = await RBAC.getUserPermissions(userId);

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(permissions));

    return permissions;
  }

  static async hasPermission(userId, permissionName) {
    const permissions = await this.getUserPermissions(userId);
    return permissions.some(p => p.name === permissionName);
  }

  static async invalidateUserPermissions(userId) {
    await redis.del(`permissions:${userId}`);
  }

  static async invalidateAllPermissions() {
    const keys = await redis.keys('permissions:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}

module.exports = PermissionCache;
```

---

## Hierarchical Permissions

### Parent-Child Permission Structure

```javascript
// authorization/hierarchical-permissions.js

const permissionHierarchy = {
  'admin:all': [
    'products:*',
    'orders:*',
    'users:*'
  ],
  'products:*': [
    'products:create',
    'products:read',
    'products:update',
    'products:delete'
  ],
  'orders:*': [
    'orders:create',
    'orders:read',
    'orders:update',
    'orders:delete'
  ]
};

function expandPermissions(permissions) {
  const expanded = new Set();

  function expand(perm) {
    expanded.add(perm);

    if (permissionHierarchy[perm]) {
      permissionHierarchy[perm].forEach(childPerm => {
        if (!expanded.has(childPerm)) {
          expand(childPerm);
        }
      });
    }
  }

  permissions.forEach(perm => expand(perm));

  return Array.from(expanded);
}

// Usage
const userPermissions = ['products:*'];
const allPermissions = expandPermissions(userPermissions);
// Result: ['products:*', 'products:create', 'products:read', 'products:update', 'products:delete']
```

---

## Key Takeaways

✅ **RBAC** is simple and effective for most applications
✅ **Resource-based** authorization checks ownership
✅ **ABAC** provides fine-grained control
✅ **Cache permissions** to improve performance
✅ **Hierarchical permissions** reduce complexity
✅ **Always check** authorization server-side
✅ **Log authorization** failures for security

---

## Implementation Checklist

- [ ] Design role and permission structure
- [ ] Create database schema
- [ ] Implement RBAC class
- [ ] Create authorization middleware
- [ ] Add permission checking to routes
- [ ] Implement resource ownership checks
- [ ] Add permission caching
- [ ] Implement admin role management
- [ ] Add hierarchical permissions (optional)
- [ ] Implement ABAC (if needed)
- [ ] Test all permission scenarios
- [ ] Log authorization events

---

## What's Next

Chapter 15 covers Security Best Practices—comprehensive security implementation for production systems.

**[Continue to Chapter 15: Security Best Practices →](chapter-15-security.md)**

---

**Navigation:**
- [← Back: Chapter 13](chapter-13-authentication.md)
- [→ Next: Chapter 15](chapter-15-security.md)
- [Home](README.md)

---

*Chapter 14 of 15 | AEOWEB System Design Guide*
*Updated November 2025*
