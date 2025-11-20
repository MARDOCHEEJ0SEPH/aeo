# Chapter 9: API Protocols

## Choosing the Right Communication Protocol

Different use cases require different protocols. This chapter covers HTTP/HTTPS, WebSockets, gRPC, GraphQL, and Server-Sent Events with complete implementations and use case analysis.

---

## Protocol Overview

```
┌──────────────────────────────────────────────────┐
│           Protocol Comparison                     │
├──────────────────────────────────────────────────┤
│                                                   │
│ HTTP/REST                                         │
│ ├─ Request-Response                              │
│ ├─ Stateless                                     │
│ └─ Best for: Traditional web APIs                │
│                                                   │
│ WebSockets                                        │
│ ├─ Bi-directional                                │
│ ├─ Persistent connection                         │
│ └─ Best for: Real-time apps, chat                │
│                                                   │
│ gRPC                                              │
│ ├─ Binary protocol                               │
│ ├─ High performance                              │
│ └─ Best for: Microservices                       │
│                                                   │
│ GraphQL                                           │
│ ├─ Query language                                │
│ ├─ Client specifies needs                        │
│ └─ Best for: Complex data requirements           │
│                                                   │
│ Server-Sent Events (SSE)                         │
│ ├─ Unidirectional (server → client)             │
│ ├─ Over HTTP                                     │
│ └─ Best for: Live updates, notifications         │
│                                                   │
└──────────────────────────────────────────────────┘
```

---

## HTTP/HTTPS Deep Dive

### HTTPS Request/Response Cycle

```
┌─────────┐                                    ┌─────────┐
│ Client  │                                    │ Server  │
└────┬────┘                                    └────┬────┘
     │                                              │
     │ 1. TCP Handshake (SYN, SYN-ACK, ACK)        │
     ├─────────────────────────────────────────────>│
     │                                              │
     │ 2. TLS Handshake (Certificate exchange)     │
     ├─────────────────────────────────────────────>│
     │<────────────────────────────────────────────┤
     │                                              │
     │ 3. HTTP Request                              │
     │ GET /api/v1/products HTTP/1.1               │
     │ Host: api.example.com                        │
     │ Authorization: Bearer token                  │
     ├─────────────────────────────────────────────>│
     │                                              │
     │ 4. Server Processing                         │
     │                                              │
     │ 5. HTTP Response                             │
     │ HTTP/1.1 200 OK                             │
     │ Content-Type: application/json               │
     │ {"data": [...]}                             │
     │<────────────────────────────────────────────┤
     │                                              │
     │ 6. Connection Close (or Keep-Alive)         │
     │                                              │
```

### HTTP Methods in Detail

```javascript
// GET - Retrieve resource
app.get('/api/products/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);
  res.json({ data: product });
});

// POST - Create resource
app.post('/api/products', async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ data: product });
});

// PUT - Complete update (replace entire resource)
app.put('/api/products/:id', async (req, res) => {
  const product = await Product.update(req.params.id, req.body);
  res.json({ data: product });
});

// PATCH - Partial update (update specific fields)
app.patch('/api/products/:id', async (req, res) => {
  const product = await Product.updatePartial(req.params.id, req.body);
  res.json({ data: product });
});

// DELETE - Remove resource
app.delete('/api/products/:id', async (req, res) => {
  await Product.delete(req.params.id);
  res.status(204).send();
});

// HEAD - Get headers only (no body)
app.head('/api/products/:id', async (req, res) => {
  const exists = await Product.exists(req.params.id);
  res.status(exists ? 200 : 404).end();
});

// OPTIONS - Get allowed methods
app.options('/api/products', (req, res) => {
  res.set('Allow', 'GET, POST, OPTIONS');
  res.status(200).end();
});
```

---

## WebSockets - Real-Time Communication

### When to Use WebSockets

**Perfect for:**
- Chat applications
- Live notifications
- Real-time dashboards
- Multiplayer games
- Collaborative editing
- Live sports scores

**Not ideal for:**
- Simple request-response
- RESTful APIs
- File uploads
- SEO-dependent pages

### Complete WebSocket Implementation

**Server:**

```javascript
// server-websocket.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Store active connections
const clients = new Map();

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');

  let userId = null;

  // Handle messages
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'auth':
          // Authenticate user
          try {
            const decoded = jwt.verify(data.token, process.env.JWT_SECRET);
            userId = decoded.userId;
            clients.set(userId, ws);

            ws.send(JSON.stringify({
              type: 'auth_success',
              message: 'Authenticated successfully'
            }));
          } catch (error) {
            ws.send(JSON.stringify({
              type: 'auth_error',
              message: 'Invalid token'
            }));
            ws.close();
          }
          break;

        case 'chat_message':
          // Broadcast to all clients
          const chatMessage = {
            type: 'chat_message',
            userId,
            message: data.message,
            timestamp: new Date().toISOString()
          };

          broadcast(chatMessage);
          break;

        case 'private_message':
          // Send to specific user
          const recipientWs = clients.get(data.recipientId);
          if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
            recipientWs.send(JSON.stringify({
              type: 'private_message',
              senderId: userId,
              message: data.message,
              timestamp: new Date().toISOString()
            }));
          }
          break;

        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  // Handle disconnection
  ws.on('close', () => {
    if (userId) {
      clients.delete(userId);
      console.log(`User ${userId} disconnected`);

      // Notify others
      broadcast({
        type: 'user_disconnected',
        userId,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to WebSocket server'
  }));
});

// Broadcast to all connected clients
function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Heartbeat to detect dead connections
setInterval(() => {
  clients.forEach((ws, userId) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    } else {
      clients.delete(userId);
    }
  });
}, 30000);

server.listen(3000, () => {
  console.log('WebSocket server running on port 3000');
});
```

**Client:**

```javascript
// client-websocket.js
class ChatClient {
  constructor(url, token) {
    this.url = url;
    this.token = token;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('Connected to WebSocket server');
      this.reconnectAttempts = 0;

      // Authenticate
      this.send({
        type: 'auth',
        token: this.token
      });
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('Disconnected from WebSocket server');
      this.reconnect();
    };
  }

  handleMessage(data) {
    switch (data.type) {
      case 'welcome':
        console.log(data.message);
        break;

      case 'auth_success':
        console.log('Authenticated');
        break;

      case 'chat_message':
        console.log(`${data.userId}: ${data.message}`);
        break;

      case 'private_message':
        console.log(`Private from ${data.senderId}: ${data.message}`);
        break;

      case 'pong':
        console.log('Pong received');
        break;
    }
  }

  send(data) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.error('WebSocket not connected');
    }
  }

  sendMessage(message) {
    this.send({
      type: 'chat_message',
      message
    });
  }

  sendPrivateMessage(recipientId, message) {
    this.send({
      type: 'private_message',
      recipientId,
      message
    });
  }

  reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

      console.log(`Reconnecting in ${delay}ms...`);

      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Usage
const client = new ChatClient('ws://localhost:3000', 'your-jwt-token');
client.connect();

// Send messages
client.sendMessage('Hello everyone!');
client.sendPrivateMessage(123, 'Hi there!');
```

---

## gRPC - High-Performance RPC

### When to Use gRPC

**Perfect for:**
- Microservices communication
- High-performance APIs
- Streaming data
- Internal APIs
- Language-agnostic services

**Not ideal for:**
- Browser clients (limited support)
- Public-facing APIs
- Simple CRUD operations

### gRPC Implementation

**Protocol Buffer Definition:**

```protobuf
// product.proto
syntax = "proto3";

package product;

service ProductService {
  rpc GetProduct (ProductRequest) returns (Product);
  rpc ListProducts (ListProductsRequest) returns (stream Product);
  rpc CreateProduct (CreateProductRequest) returns (Product);
}

message Product {
  int32 id = 1;
  string name = 2;
  string description = 3;
  double price = 4;
  string category = 5;
}

message ProductRequest {
  int32 id = 1;
}

message ListProductsRequest {
  int32 page = 1;
  int32 limit = 2;
  string category = 3;
}

message CreateProductRequest {
  string name = 1;
  string description = 2;
  double price = 3;
  string category = 4;
}
```

**Server:**

```javascript
// grpc-server.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { pool } = require('./database');

// Load proto file
const packageDefinition = protoLoader.loadSync('product.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const productProto = grpc.loadPackageDefinition(packageDefinition).product;

// Implement service methods
const productService = {
  async getProduct(call, callback) {
    try {
      const result = await pool.query(
        'SELECT * FROM products WHERE id = $1',
        [call.request.id]
      );

      if (result.rows.length === 0) {
        callback({
          code: grpc.status.NOT_FOUND,
          details: 'Product not found'
        });
        return;
      }

      callback(null, result.rows[0]);
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        details: error.message
      });
    }
  },

  async listProducts(call) {
    try {
      const { page = 1, limit = 20, category } = call.request;
      const offset = (page - 1) * limit;

      let query = 'SELECT * FROM products WHERE 1=1';
      const params = [];

      if (category) {
        params.push(category);
        query += ` AND category = $${params.length}`;
      }

      params.push(limit, offset);
      query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

      const result = await pool.query(query, params);

      // Stream products to client
      for (const product of result.rows) {
        call.write(product);
      }

      call.end();
    } catch (error) {
      call.emit('error', {
        code: grpc.status.INTERNAL,
        details: error.message
      });
    }
  },

  async createProduct(call, callback) {
    try {
      const { name, description, price, category } = call.request;

      const result = await pool.query(
        'INSERT INTO products (name, description, price, category) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, description, price, category]
      );

      callback(null, result.rows[0]);
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        details: error.message
      });
    }
  }
};

// Create and start server
const server = new grpc.Server();
server.addService(productProto.ProductService.service, productService);

server.bindAsync(
  '0.0.0.0:50051',
  grpc.ServerCredentials.createInsecure(),
  (error, port) => {
    if (error) {
      console.error('Failed to start server:', error);
      return;
    }
    console.log(`gRPC server running on port ${port}`);
    server.start();
  }
);
```

**Client:**

```javascript
// grpc-client.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const packageDefinition = protoLoader.loadSync('product.proto');
const productProto = grpc.loadPackageDefinition(packageDefinition).product;

// Create client
const client = new productProto.ProductService(
  'localhost:50051',
  grpc.credentials.createInsecure()
);

// Get single product
client.getProduct({ id: 1 }, (error, product) => {
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Product:', product);
});

// List products (streaming)
const call = client.listProducts({ page: 1, limit: 10 });

call.on('data', (product) => {
  console.log('Received product:', product);
});

call.on('end', () => {
  console.log('Stream ended');
});

call.on('error', (error) => {
  console.error('Stream error:', error);
});

// Create product
client.createProduct({
  name: 'New Product',
  description: 'Product description',
  price: 99.99,
  category: 'electronics'
}, (error, product) => {
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Created product:', product);
});
```

---

## Server-Sent Events (SSE)

### When to Use SSE

**Perfect for:**
- Live notifications
- Stock tickers
- News feeds
- Progress updates
- Server-to-client only updates

**Not ideal for:**
- Bi-directional communication
- Binary data
- Complex protocols

### SSE Implementation

**Server:**

```javascript
// sse-server.js
const express = require('express');
const app = express();

// Store active SSE connections
const clients = new Set();

// SSE endpoint
app.get('/api/events', (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Send initial connection message
  res.write('data: {"type":"connected","message":"SSE connected"}\n\n');

  // Add client to active connections
  clients.add(res);

  // Handle client disconnect
  req.on('close', () => {
    clients.delete(res);
    console.log('Client disconnected');
  });
});

// Function to send event to all clients
function broadcastEvent(event, data) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

  clients.forEach((client) => {
    client.write(message);
  });
}

// Example: Send notification every 10 seconds
setInterval(() => {
  broadcastEvent('notification', {
    title: 'New Update',
    message: 'Something interesting happened',
    timestamp: new Date().toISOString()
  });
}, 10000);

// Example: Send stock price updates
setInterval(() => {
  const stockPrice = (Math.random() * 100).toFixed(2);

  broadcastEvent('stock_update', {
    symbol: 'AAPL',
    price: stockPrice,
    timestamp: new Date().toISOString()
  });
}, 2000);

app.listen(3000, () => {
  console.log('SSE server running on port 3000');
});
```

**Client (Browser):**

```javascript
// sse-client.js
class SSEClient {
  constructor(url) {
    this.url = url;
    this.eventSource = null;
    this.reconnectDelay = 1000;
  }

  connect() {
    this.eventSource = new EventSource(this.url);

    this.eventSource.onopen = () => {
      console.log('SSE connection opened');
      this.reconnectDelay = 1000;
    };

    this.eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received:', data);
    };

    // Listen to custom events
    this.eventSource.addEventListener('notification', (event) => {
      const data = JSON.parse(event.data);
      this.showNotification(data);
    });

    this.eventSource.addEventListener('stock_update', (event) => {
      const data = JSON.parse(event.data);
      this.updateStockPrice(data);
    });

    this.eventSource.onerror = (error) => {
      console.error('SSE error:', error);

      // Reconnect with exponential backoff
      setTimeout(() => {
        this.reconnectDelay *= 2;
        this.connect();
      }, Math.min(this.reconnectDelay, 30000));
    };
  }

  showNotification(data) {
    console.log(`Notification: ${data.title} - ${data.message}`);
    // Display notification to user
  }

  updateStockPrice(data) {
    console.log(`${data.symbol}: $${data.price}`);
    // Update UI with new stock price
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
    }
  }
}

// Usage
const sseClient = new SSEClient('http://localhost:3000/api/events');
sseClient.connect();
```

---

## Protocol Selection Guide

```
┌──────────────────────────────────────────────────────────┐
│             When to Use Each Protocol                     │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ REST (HTTP)                                               │
│ ✅ Traditional CRUD operations                            │
│ ✅ Public APIs                                            │
│ ✅ Cacheable resources                                    │
│ ✅ Browser compatibility                                  │
│ ❌ Real-time updates                                      │
│                                                           │
│ WebSockets                                                │
│ ✅ Real-time bi-directional communication                │
│ ✅ Chat applications                                      │
│ ✅ Live dashboards                                        │
│ ✅ Gaming                                                 │
│ ❌ Simple request-response                                │
│                                                           │
│ gRPC                                                      │
│ ✅ Microservices communication                            │
│ ✅ High performance required                             │
│ ✅ Streaming data                                         │
│ ✅ Strong typing                                          │
│ ❌ Browser clients                                        │
│                                                           │
│ GraphQL                                                   │
│ ✅ Complex data requirements                             │
│ ✅ Multiple data sources                                  │
│ ✅ Mobile applications                                    │
│ ✅ Flexible querying                                      │
│ ❌ Simple CRUD                                            │
│                                                           │
│ SSE                                                       │
│ ✅ Server-to-client updates                              │
│ ✅ Live notifications                                     │
│ ✅ Progress tracking                                      │
│ ✅ Simple implementation                                  │
│ ❌ Client-to-server messages                             │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## Key Takeaways

✅ **HTTP/REST** is best for traditional web APIs
✅ **WebSockets** enable real-time bi-directional communication
✅ **gRPC** provides high-performance microservice communication
✅ **SSE** is simple for server-to-client streaming
✅ **Choose protocol** based on specific use case
✅ **Multiple protocols** can coexist in one application

---

## Implementation Checklist

- [ ] Identify communication requirements
- [ ] Choose appropriate protocol(s)
- [ ] Implement error handling
- [ ] Add reconnection logic
- [ ] Implement authentication
- [ ] Add monitoring and logging
- [ ] Test under load
- [ ] Document protocol usage
- [ ] Plan for scaling
- [ ] Handle disconnections gracefully

---

## What's Next

Chapter 10 covers the Transport Layer—TCP vs UDP fundamentals and implementations.

**[Continue to Chapter 10: Transport Layer →](chapter-10-transport-layer.md)**

---

**Navigation:**
- [← Back: Chapter 8](chapter-08-api-design.md)
- [→ Next: Chapter 10](chapter-10-transport-layer.md)
- [Home](README.md)

---

*Chapter 9 of 15 | AEOWEB System Design Guide*
*Updated November 2025*
