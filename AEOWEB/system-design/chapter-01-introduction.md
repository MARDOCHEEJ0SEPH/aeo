# Chapter 1: Introduction to System Design

## What is System Design and Why Does It Matter?

System design is the process of defining the architecture, components, modules, interfaces, and data for a system to satisfy specified requirements. It's the blueprint that determines how your application will perform, scale, and survive in production.

---

## Why System Design Matters for AEOWEB Projects

When you build one of the AEOWEB examples (Coffee Shop, Hair Salon, E-Commerce), you start with a simple architecture. But what happens when:

- **Your traffic grows from 100 to 100,000 users?**
- **Your database reaches 10 million records?**
- **Users expect 99.9% uptime?**
- **You need to process payments securely?**
- **Competitors attack your application?**

**Without good system design:**
- Your app crashes during peak traffic
- Pages load slowly (>5 seconds)
- Data gets corrupted
- Security breaches occur
- Users abandon your platform

**With good system design:**
- Your app scales automatically
- Pages load in <1 second
- Data remains consistent
- Security is robust
- Users trust your platform

---

## Real-World Example: E-Commerce Platform

### Scenario 1: Poor System Design

```
User Traffic: 1,000 concurrent users
Architecture: Single server (CPU: 2 cores, RAM: 4GB)
Database: All on one instance
Caching: None
Load Balancer: None

Results:
- Page load time: 8-12 seconds
- Server crashes at peak hours
- Database locks during high writes
- Downtime: 4 hours/month
- Revenue loss: $50,000/month
```

### Scenario 2: Good System Design

```
User Traffic: 10,000 concurrent users
Architecture: 5 app servers behind load balancer
Database: Primary + 2 replicas
Caching: Redis layer
CDN: Static assets
Load Balancer: Nginx

Results:
- Page load time: 0.8 seconds
- 99.95% uptime
- Handles traffic spikes smoothly
- Downtime: <30 min/month
- Revenue increase: $200,000/month
```

**Cost difference:** $800/month infrastructure
**Revenue difference:** $250,000/month
**ROI:** 312x

---

## Key Principles of System Design

### 1. Scalability

**Definition:** Ability to handle increased load by adding resources.

**Types:**
- **Vertical Scaling (Scale Up):** Add more power to existing server
  - Example: 4GB RAM → 16GB RAM
  - Pros: Simple, no code changes
  - Cons: Hardware limits, single point of failure

- **Horizontal Scaling (Scale Out):** Add more servers
  - Example: 1 server → 5 servers
  - Pros: Nearly unlimited scaling, redundancy
  - Cons: Complexity, distributed system challenges

**When to scale:**
- CPU usage > 70% consistently
- Memory usage > 80%
- Response time > 500ms
- Error rate > 1%

### 2. Reliability

**Definition:** System continues working correctly even when things fail.

**Strategies:**
- **Redundancy:** Multiple copies of critical components
- **Replication:** Duplicate databases across servers
- **Backups:** Regular snapshots of data
- **Failover:** Automatic switching to backup systems

**Example:**
```javascript
// Database with automatic failover
const dbConfig = {
  primary: 'db-primary.example.com',
  replicas: [
    'db-replica-1.example.com',
    'db-replica-2.example.com'
  ],
  failover: true,
  retryAttempts: 3
};
```

### 3. Availability

**Definition:** Percentage of time system is operational and accessible.

**Availability Levels:**
```
99%       = 3.65 days downtime/year    (Unacceptable)
99.9%     = 8.76 hours downtime/year   (Good)
99.99%    = 52 minutes downtime/year   (Great)
99.999%   = 5.26 minutes downtime/year (Excellent)
```

**Achieving High Availability:**
- Load balancers with health checks
- Auto-scaling groups
- Multi-region deployment
- Database replication
- Zero-downtime deployments

### 4. Performance

**Definition:** How fast your system responds to requests.

**Key Metrics:**
- **Latency:** Time to process a request
- **Throughput:** Requests processed per second
- **Response Time:** Total time from request to response

**Performance Targets:**
```
Page Load:        < 2 seconds
API Response:     < 200ms
Database Query:   < 50ms
Cache Hit:        < 10ms
```

**Optimization Techniques:**
- Caching (Redis, CDN)
- Database indexing
- Query optimization
- Code profiling
- Asset compression
- Lazy loading

### 5. Security

**Definition:** Protection against unauthorized access and attacks.

**Security Layers:**

**Layer 1: Network**
- Firewalls
- DDoS protection
- Rate limiting
- IP whitelisting

**Layer 2: Application**
- Input validation
- Output encoding
- CSRF protection
- Security headers

**Layer 3: Data**
- Encryption at rest
- Encryption in transit (HTTPS)
- Secure password hashing
- Access control

**Layer 4: Authentication**
- Multi-factor authentication
- JWT tokens
- OAuth 2.0
- Session management

### 6. Maintainability

**Definition:** Ease of updating, fixing, and extending the system.

**Best Practices:**
- Clean, documented code
- Modular architecture
- Automated testing
- CI/CD pipelines
- Monitoring and logging
- Version control

---

## The System Design Process

### Step 1: Requirements Gathering

**Functional Requirements:**
- What should the system do?
- User stories and use cases
- Features and capabilities

**Example (Coffee Shop App):**
- Users can browse menu
- Users can place orders
- Users can join loyalty program
- Admins can update menu items
- Admins can view sales analytics

**Non-Functional Requirements:**
- How should the system perform?
- Scalability, reliability, performance

**Example:**
- Support 10,000 concurrent users
- 99.9% uptime
- Page load < 2 seconds
- Process payments securely
- GDPR compliant

### Step 2: Capacity Estimation

**Traffic Estimation:**
```
Daily Active Users:     50,000
Requests per user/day:  20
Total requests/day:     1,000,000
Requests per second:    ~12 RPS
Peak traffic (3x):      ~36 RPS
```

**Storage Estimation:**
```
Users:                  50,000 × 1KB     = 50 MB
Products:               1,000 × 5KB      = 5 MB
Orders:                 500,000 × 2KB    = 1 GB
Images:                 1,000 × 500KB    = 500 MB
Total:                                     ~1.5 GB + growth
```

**Bandwidth Estimation:**
```
Average request size:   50 KB
Average response size:  100 KB
Total per request:      150 KB
Daily bandwidth:        150 KB × 1M = 150 GB/day
```

### Step 3: High-Level Design

**Create Architecture Diagram:**

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Load Balancer  │
│     (Nginx)     │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│ App    │ │ App    │
│Server 1│ │Server 2│
└───┬────┘ └───┬────┘
    │          │
    └────┬─────┘
         ▼
  ┌──────────────┐
  │   Database   │
  │ (PostgreSQL) │
  └──────────────┘
```

### Step 4: Component Design

**Define each component:**

**Frontend:**
- Technology: React/Vue/Vanilla JS
- Responsibilities: UI, user interactions
- Communication: REST API calls

**Backend:**
- Technology: Node.js + Express
- Responsibilities: Business logic, data processing
- Endpoints: API routes

**Database:**
- Technology: PostgreSQL
- Responsibilities: Data persistence
- Schema: Tables, relationships

**Cache:**
- Technology: Redis
- Responsibilities: Fast data access
- Strategy: Cache frequently accessed data

### Step 5: Database Schema Design

**Example: Coffee Shop**

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  loyalty_points INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(50),
  image_url VARCHAR(255),
  in_stock BOOLEAN DEFAULT true
);

-- Orders table
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL
);
```

### Step 6: API Design

**RESTful Endpoints:**

```javascript
// Products
GET    /api/products         // List all products
GET    /api/products/:id     // Get single product
POST   /api/products         // Create product (admin)
PUT    /api/products/:id     // Update product (admin)
DELETE /api/products/:id     // Delete product (admin)

// Orders
GET    /api/orders           // List user's orders
GET    /api/orders/:id       // Get order details
POST   /api/orders           // Create new order
PUT    /api/orders/:id       // Update order status

// Authentication
POST   /api/auth/register    // Register new user
POST   /api/auth/login       // Login user
POST   /api/auth/logout      // Logout user
GET    /api/auth/profile     // Get user profile
```

### Step 7: Security Implementation

**Authentication Flow:**

```javascript
// 1. User logs in
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "securePassword123"
}

// 2. Server validates credentials
const user = await User.findByEmail(email);
const valid = await bcrypt.compare(password, user.password_hash);

// 3. Generate JWT token
const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

// 4. Return token
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 1, "email": "user@example.com" }
}

// 5. Client includes token in subsequent requests
GET /api/orders
Headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
}
```

---

## Common System Design Trade-offs

### 1. Consistency vs Availability (CAP Theorem)

**CAP Theorem:** In distributed systems, you can only guarantee 2 of 3:
- **Consistency:** All nodes see the same data
- **Availability:** System responds to all requests
- **Partition Tolerance:** System works despite network failures

**Example Trade-offs:**

**Banking App (Choose Consistency):**
- Account balances must be accurate
- Can tolerate brief unavailability
- PostgreSQL with strong consistency

**Social Media Feed (Choose Availability):**
- Users can always view content
- Slight inconsistencies acceptable (posts may appear out of order)
- MongoDB or Cassandra

### 2. Latency vs Throughput

**Latency:** Time to process one request
**Throughput:** Number of requests processed

**Example:**
- **Low latency:** Real-time chat (< 100ms response)
- **High throughput:** Batch processing (process 1M emails/hour)

### 3. Read vs Write Optimization

**Read-Heavy Applications:**
- Social media feeds
- News websites
- E-commerce product listings

**Optimization:** Caching, read replicas, CDN

**Write-Heavy Applications:**
- Logging systems
- Analytics platforms
- Chat applications

**Optimization:** Write queues, sharding, eventual consistency

---

## System Design Interview Tips

### Common Questions

1. **Design a URL shortener (like bit.ly)**
2. **Design a social media feed (like Twitter)**
3. **Design a file storage system (like Dropbox)**
4. **Design a video streaming platform (like YouTube)**
5. **Design an e-commerce platform (like Amazon)**

### Approach Framework

**Step 1: Clarify Requirements (5 min)**
- Ask clarifying questions
- Define scope
- Identify constraints

**Step 2: Estimate Capacity (5 min)**
- Users, requests, storage
- Peak vs average load

**Step 3: High-Level Design (10 min)**
- Draw architecture diagram
- Identify major components
- Explain data flow

**Step 4: Deep Dive (20 min)**
- Database schema
- API design
- Bottleneck identification
- Scaling strategies

**Step 5: Discussion (5 min)**
- Trade-offs
- Alternative approaches
- Future enhancements

---

## Key Takeaways

✅ **System design** is about building scalable, reliable, and secure applications
✅ **Six key principles:** Scalability, Reliability, Availability, Performance, Security, Maintainability
✅ **Process:** Requirements → Capacity → Design → Components → Implementation
✅ **Trade-offs** are inherent in every design decision
✅ **Start simple**, then scale based on actual needs

---

## Action Items

- [ ] Review the 6 key principles
- [ ] Understand CAP theorem
- [ ] Learn the design process framework
- [ ] Study one AEOWEB example architecture
- [ ] Draw a high-level system diagram for your project

---

## What's Next

Now that you understand system design fundamentals, Chapter 2 walks through implementing a single-server architecture—the foundation for all applications.

**[Continue to Chapter 2: Single Server Setup →](chapter-02-single-server.md)**

---

**Navigation:**
- [← Back to System Design Home](README.md)
- [→ Next: Chapter 2](chapter-02-single-server.md)

---

*Chapter 1 of 15 | AEOWEB System Design Guide*
*Updated November 2025*
