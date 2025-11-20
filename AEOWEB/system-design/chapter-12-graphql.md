# Chapter 12: GraphQL Implementation

## Flexible Data Querying with GraphQL

GraphQL provides a powerful alternative to REST, allowing clients to request exactly the data they need. This chapter covers schema design, queries, mutations, subscriptions, and complete implementations.

---

## GraphQL vs REST

```
┌──────────────────────────────────────────────────────┐
│            GraphQL vs REST                            │
├──────────────────────────────────────────────────────┤
│                                                       │
│ REST:                                                 │
│ GET /api/products/123                                │
│ {                                                     │
│   "id": 123,                                         │
│   "name": "Product",                                 │
│   "price": 99.99,                                    │
│   "category": {...},    ← Over-fetching             │
│   "inventory": {...},   ← Over-fetching             │
│   "reviews": [...]      ← Over-fetching             │
│ }                                                     │
│                                                       │
│ GraphQL:                                              │
│ query {                                               │
│   product(id: 123) {                                 │
│     name                 ← Request exactly what you  │
│     price                   need                     │
│   }                                                   │
│ }                                                     │
│ {                                                     │
│   "data": {                                          │
│     "product": {                                     │
│       "name": "Product",                            │
│       "price": 99.99                                │
│     }                                                │
│   }                                                   │
│ }                                                     │
│                                                       │
└──────────────────────────────────────────────────────┘
```

### Key Differences

```
┌─────────────────┬──────────────────┬──────────────────┐
│    Feature      │      REST        │     GraphQL      │
├─────────────────┼──────────────────┼──────────────────┤
│ Endpoints       │ Multiple         │ Single           │
│ Data Fetching   │ Fixed structure  │ Flexible         │
│ Over-fetching   │ Common           │ None             │
│ Under-fetching  │ Common (N+1)     │ None             │
│ Versioning      │ Required         │ Optional         │
│ Learning Curve  │ Low              │ Medium           │
│ Caching         │ Easy (HTTP)      │ Complex          │
│ File Upload     │ Easy             │ Complex          │
└─────────────────┴──────────────────┴──────────────────┘
```

---

## GraphQL Schema Definition

### Basic Types

```graphql
# schema.graphql

# Scalar Types
scalar DateTime
scalar Upload

# Object Types
type Product {
  id: ID!
  name: String!
  description: String
  price: Float!
  compareAtPrice: Float
  category: Category
  images: [Image!]!
  reviews: [Review!]!
  avgRating: Float
  reviewCount: Int!
  inStock: Boolean!
  quantity: Int!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Category {
  id: ID!
  name: String!
  slug: String!
  products: [Product!]!
}

type Image {
  id: ID!
  url: String!
  altText: String
  position: Int!
}

type Review {
  id: ID!
  product: Product!
  user: User!
  rating: Int!
  title: String
  content: String
  verifiedPurchase: Boolean!
  createdAt: DateTime!
}

type User {
  id: ID!
  email: String!
  firstName: String
  lastName: String
  orders: [Order!]!
  reviews: [Review!]!
}

type Order {
  id: ID!
  orderNumber: String!
  user: User!
  items: [OrderItem!]!
  subtotal: Float!
  tax: Float!
  shipping: Float!
  total: Float!
  status: OrderStatus!
  createdAt: DateTime!
}

type OrderItem {
  id: ID!
  product: Product!
  quantity: Int!
  price: Float!
  total: Float!
}

# Enums
enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

# Input Types
input ProductInput {
  name: String!
  description: String
  price: Float!
  compareAtPrice: Float
  categoryId: ID
  quantity: Int
}

input ProductFilter {
  categoryId: ID
  minPrice: Float
  maxPrice: Float
  search: String
  inStock: Boolean
}

# Pagination
type ProductConnection {
  edges: [ProductEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type ProductEdge {
  node: Product!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

# Root Types
type Query {
  # Products
  products(
    first: Int
    after: String
    filter: ProductFilter
  ): ProductConnection!

  product(id: ID!): Product

  # Categories
  categories: [Category!]!
  category(id: ID!): Category

  # User
  me: User
  user(id: ID!): User

  # Orders
  orders: [Order!]!
  order(id: ID!): Order
}

type Mutation {
  # Products
  createProduct(input: ProductInput!): Product!
  updateProduct(id: ID!, input: ProductInput!): Product!
  deleteProduct(id: ID!): Boolean!

  # Reviews
  createReview(
    productId: ID!
    rating: Int!
    title: String
    content: String
  ): Review!

  # Orders
  createOrder(items: [OrderItemInput!]!): Order!
  updateOrderStatus(id: ID!, status: OrderStatus!): Order!

  # Auth
  register(
    email: String!
    password: String!
    firstName: String
    lastName: String
  ): AuthPayload!

  login(email: String!, password: String!): AuthPayload!
}

type Subscription {
  productUpdated(productId: ID): Product!
  orderStatusChanged(orderId: ID!): Order!
  newReview(productId: ID!): Review!
}

type AuthPayload {
  token: String!
  user: User!
}

input OrderItemInput {
  productId: ID!
  quantity: Int!
}
```

---

## Complete Apollo Server Implementation

### Server Setup

```javascript
// server.js
const { ApolloServer } = require('apollo-server-express');
const express = require('express');
const { readFileSync } = require('fs');
const { join } = require('path');
const jwt = require('jsonwebtoken');
const resolvers = require('./resolvers');
const { pool } = require('./database');

// Load schema
const typeDefs = readFileSync(join(__dirname, 'schema.graphql'), 'utf8');

// Context function
const context = async ({ req }) => {
  // Get token from header
  const token = req.headers.authorization?.replace('Bearer ', '');

  let user = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const result = await pool.query(
        'SELECT id, email, first_name, last_name FROM users WHERE id = $1',
        [decoded.userId]
      );
      user = result.rows[0];
    } catch (error) {
      console.error('Invalid token:', error.message);
    }
  }

  return {
    user,
    pool
  };
};

// Create Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context,
  formatError: (error) => {
    console.error(error);
    return {
      message: error.message,
      code: error.extensions?.code || 'INTERNAL_SERVER_ERROR'
    };
  }
});

// Create Express app
const app = express();

// Start server
async function startServer() {
  await server.start();
  server.applyMiddleware({ app });

  const PORT = process.env.PORT || 4000;

  app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
  });
}

startServer();
```

### Resolvers Implementation

```javascript
// resolvers/index.js
const { AuthenticationError, UserInputError } = require('apollo-server-express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { GraphQLDateTime } = require('graphql-iso-date');

const resolvers = {
  DateTime: GraphQLDateTime,

  Query: {
    // ========== Products ==========
    async products(_, { first = 20, after, filter }, { pool }) {
      let query = 'SELECT * FROM products WHERE 1=1';
      const params = [];
      let paramCount = 0;

      // Apply filters
      if (filter) {
        if (filter.categoryId) {
          paramCount++;
          query += ` AND category_id = $${paramCount}`;
          params.push(filter.categoryId);
        }

        if (filter.minPrice) {
          paramCount++;
          query += ` AND price >= $${paramCount}`;
          params.push(filter.minPrice);
        }

        if (filter.maxPrice) {
          paramCount++;
          query += ` AND price <= $${paramCount}`;
          params.push(filter.maxPrice);
        }

        if (filter.search) {
          paramCount++;
          query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
          params.push(`%${filter.search}%`);
        }

        if (filter.inStock !== undefined) {
          paramCount++;
          query += ` AND quantity > 0`;
        }
      }

      // Cursor pagination
      if (after) {
        const cursorId = Buffer.from(after, 'base64').toString('utf8');
        paramCount++;
        query += ` AND id > $${paramCount}`;
        params.push(cursorId);
      }

      query += ` ORDER BY id ASC LIMIT ${first + 1}`;

      const result = await pool.query(query, params);
      const hasNextPage = result.rows.length > first;
      const products = hasNextPage ? result.rows.slice(0, -1) : result.rows;

      const edges = products.map(product => ({
        node: product,
        cursor: Buffer.from(product.id.toString()).toString('base64')
      }));

      return {
        edges,
        pageInfo: {
          hasNextPage,
          hasPreviousPage: !!after,
          startCursor: edges[0]?.cursor,
          endCursor: edges[edges.length - 1]?.cursor
        },
        totalCount: products.length
      };
    },

    async product(_, { id }, { pool }) {
      const result = await pool.query(
        'SELECT * FROM products WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        throw new UserInputError('Product not found');
      }

      return result.rows[0];
    },

    // ========== Categories ==========
    async categories(_, __, { pool }) {
      const result = await pool.query('SELECT * FROM categories ORDER BY name');
      return result.rows;
    },

    async category(_, { id }, { pool }) {
      const result = await pool.query(
        'SELECT * FROM categories WHERE id = $1',
        [id]
      );
      return result.rows[0];
    },

    // ========== User ==========
    async me(_, __, { user, pool }) {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      return user;
    },

    // ========== Orders ==========
    async orders(_, __, { user, pool }) {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const result = await pool.query(
        'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
        [user.id]
      );

      return result.rows;
    },

    async order(_, { id }, { user, pool }) {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const result = await pool.query(
        'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
        [id, user.id]
      );

      if (result.rows.length === 0) {
        throw new UserInputError('Order not found');
      }

      return result.rows[0];
    }
  },

  Mutation: {
    // ========== Products ==========
    async createProduct(_, { input }, { user, pool }) {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const { name, description, price, compareAtPrice, categoryId, quantity } = input;

      const result = await pool.query(
        `INSERT INTO products (name, description, price, compare_at_price, category_id, quantity)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [name, description, price, compareAtPrice, categoryId, quantity || 0]
      );

      return result.rows[0];
    },

    async updateProduct(_, { id, input }, { user, pool }) {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const updates = [];
      const values = [];
      let paramCount = 0;

      Object.keys(input).forEach(key => {
        if (input[key] !== undefined) {
          paramCount++;
          updates.push(`${key} = $${paramCount}`);
          values.push(input[key]);
        }
      });

      paramCount++;
      values.push(id);

      const result = await pool.query(
        `UPDATE products SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw new UserInputError('Product not found');
      }

      return result.rows[0];
    },

    async deleteProduct(_, { id }, { user, pool }) {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const result = await pool.query(
        'DELETE FROM products WHERE id = $1 RETURNING *',
        [id]
      );

      return result.rows.length > 0;
    },

    // ========== Reviews ==========
    async createReview(_, { productId, rating, title, content }, { user, pool }) {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      if (rating < 1 || rating > 5) {
        throw new UserInputError('Rating must be between 1 and 5');
      }

      const result = await pool.query(
        `INSERT INTO reviews (product_id, user_id, rating, title, content)
        VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [productId, user.id, rating, title, content]
      );

      return result.rows[0];
    },

    // ========== Auth ==========
    async register(_, { email, password, firstName, lastName }, { pool }) {
      // Check if user exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        throw new UserInputError('Email already registered');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name)
        VALUES ($1, $2, $3, $4) RETURNING id, email, first_name, last_name`,
        [email, passwordHash, firstName, lastName]
      );

      const user = result.rows[0];

      // Generate token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return { token, user };
    },

    async login(_, { email, password }, { pool }) {
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        throw new UserInputError('Invalid credentials');
      }

      const user = result.rows[0];

      const valid = await bcrypt.compare(password, user.password_hash);

      if (!valid) {
        throw new UserInputError('Invalid credentials');
      }

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name
        }
      };
    }
  },

  // ========== Field Resolvers ==========
  Product: {
    async category(product, _, { pool }) {
      if (!product.category_id) return null;

      const result = await pool.query(
        'SELECT * FROM categories WHERE id = $1',
        [product.category_id]
      );

      return result.rows[0];
    },

    async images(product, _, { pool }) {
      const result = await pool.query(
        'SELECT * FROM product_images WHERE product_id = $1 ORDER BY position',
        [product.id]
      );

      return result.rows;
    },

    async reviews(product, _, { pool }) {
      const result = await pool.query(
        'SELECT * FROM reviews WHERE product_id = $1 ORDER BY created_at DESC',
        [product.id]
      );

      return result.rows;
    },

    async avgRating(product, _, { pool }) {
      const result = await pool.query(
        'SELECT AVG(rating) as avg FROM reviews WHERE product_id = $1',
        [product.id]
      );

      return parseFloat(result.rows[0].avg) || 0;
    },

    async reviewCount(product, _, { pool }) {
      const result = await pool.query(
        'SELECT COUNT(*) as count FROM reviews WHERE product_id = $1',
        [product.id]
      );

      return parseInt(result.rows[0].count);
    },

    inStock(product) {
      return product.quantity > 0;
    }
  },

  Order: {
    async user(order, _, { pool }) {
      const result = await pool.query(
        'SELECT id, email, first_name, last_name FROM users WHERE id = $1',
        [order.user_id]
      );

      return result.rows[0];
    },

    async items(order, _, { pool }) {
      const result = await pool.query(
        'SELECT * FROM order_items WHERE order_id = $1',
        [order.id]
      );

      return result.rows;
    }
  },

  OrderItem: {
    async product(orderItem, _, { pool }) {
      const result = await pool.query(
        'SELECT * FROM products WHERE id = $1',
        [orderItem.product_id]
      );

      return result.rows[0];
    }
  },

  Review: {
    async product(review, _, { pool }) {
      const result = await pool.query(
        'SELECT * FROM products WHERE id = $1',
        [review.product_id]
      );

      return result.rows[0];
    },

    async user(review, _, { pool }) {
      const result = await pool.query(
        'SELECT id, email, first_name, last_name FROM users WHERE id = $1',
        [review.user_id]
      );

      return result.rows[0];
    }
  }
};

module.exports = resolvers;
```

---

## Client Implementation

### Using Apollo Client

```javascript
// apollo-client.js
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql'
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : ''
    }
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache()
});

export default client;
```

### Queries

```javascript
// queries.js
import { gql } from '@apollo/client';

export const GET_PRODUCTS = gql`
  query GetProducts($first: Int, $after: String, $filter: ProductFilter) {
    products(first: $first, after: $after, filter: $filter) {
      edges {
        node {
          id
          name
          price
          images {
            url
            altText
          }
          avgRating
          reviewCount
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const GET_PRODUCT = gql`
  query GetProduct($id: ID!) {
    product(id: $id) {
      id
      name
      description
      price
      compareAtPrice
      category {
        id
        name
      }
      images {
        url
        altText
      }
      reviews {
        id
        rating
        title
        content
        user {
          firstName
          lastName
        }
        createdAt
      }
      avgRating
      reviewCount
      inStock
      quantity
    }
  }
`;
```

### Using Queries in React

```javascript
// ProductList.jsx
import { useQuery } from '@apollo/client';
import { GET_PRODUCTS } from './queries';

function ProductList() {
  const { loading, error, data, fetchMore } = useQuery(GET_PRODUCTS, {
    variables: {
      first: 20,
      filter: {
        inStock: true
      }
    }
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const loadMore = () => {
    fetchMore({
      variables: {
        after: data.products.pageInfo.endCursor
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;

        return {
          products: {
            ...fetchMoreResult.products,
            edges: [
              ...prev.products.edges,
              ...fetchMoreResult.products.edges
            ]
          }
        };
      }
    });
  };

  return (
    <div>
      {data.products.edges.map(({ node: product }) => (
        <div key={product.id}>
          <h3>{product.name}</h3>
          <p>${product.price}</p>
          <p>Rating: {product.avgRating} ({product.reviewCount} reviews)</p>
        </div>
      ))}

      {data.products.pageInfo.hasNextPage && (
        <button onClick={loadMore}>Load More</button>
      )}
    </div>
  );
}
```

### Mutations

```javascript
// mutations.js
import { gql } from '@apollo/client';

export const CREATE_REVIEW = gql`
  mutation CreateReview(
    $productId: ID!
    $rating: Int!
    $title: String
    $content: String
  ) {
    createReview(
      productId: $productId
      rating: $rating
      title: $title
      content: $content
    ) {
      id
      rating
      title
      content
      createdAt
    }
  }
`;

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        firstName
        lastName
      }
    }
  }
`;
```

### Using Mutations in React

```javascript
// LoginForm.jsx
import { useMutation } from '@apollo/client';
import { LOGIN } from './mutations';

function LoginForm() {
  const [login, { loading, error }] = useMutation(LOGIN, {
    onCompleted: (data) => {
      localStorage.setItem('token', data.login.token);
      // Redirect or update UI
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    login({
      variables: {
        email: formData.get('email'),
        password: formData.get('password')
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
      {error && <div>Error: {error.message}</div>}
    </form>
  );
}
```

---

## Key Takeaways

✅ **GraphQL** allows clients to request exactly what they need
✅ **Single endpoint** for all queries and mutations
✅ **Strong typing** with schema definition
✅ **Nested queries** eliminate N+1 problems
✅ **Real-time updates** with subscriptions
✅ **Better for complex** data requirements
✅ **More complex** than REST but more flexible

---

## Implementation Checklist

- [ ] Design GraphQL schema
- [ ] Implement resolvers
- [ ] Add authentication
- [ ] Implement pagination
- [ ] Add error handling
- [ ] Set up Apollo Server
- [ ] Configure Apollo Client
- [ ] Write queries and mutations
- [ ] Test with GraphQL Playground
- [ ] Add subscriptions if needed
- [ ] Document schema

---

## What's Next

Chapter 13 covers Authentication—implementing secure user authentication systems.

**[Continue to Chapter 13: Authentication →](chapter-13-authentication.md)**

---

**Navigation:**
- [← Back: Chapter 11](chapter-11-restful-apis.md)
- [→ Next: Chapter 13](chapter-13-authentication.md)
- [Home](README.md)

---

*Chapter 12 of 15 | AEOWEB System Design Guide*
*Updated November 2025*
