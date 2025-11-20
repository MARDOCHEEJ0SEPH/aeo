# Chapter 2: Single Server Setup

## Building Your First Production-Ready Application

Every application starts somewhere. For most projects, that somewhere is a single server running your frontend, backend, and database. This chapter teaches you how to set up a robust single-server architecture—and when it's time to scale beyond it.

---

## Single Server Architecture Overview

### The Complete Stack on One Machine

```
┌─────────────────────────────────────┐
│         Single Server               │
│  ┌─────────────────────────────┐   │
│  │      Web Server (Nginx)     │   │
│  │   Serves static files       │   │
│  │   Reverse proxy to backend  │   │
│  └─────────────────────────────┘   │
│                ↓                    │
│  ┌─────────────────────────────┐   │
│  │   Application Server        │   │
│  │   (Node.js + Express)       │   │
│  │   Business logic & APIs     │   │
│  └─────────────────────────────┘   │
│                ↓                    │
│  ┌─────────────────────────────┐   │
│  │   Database (PostgreSQL)     │   │
│  │   Data persistence          │   │
│  └─────────────────────────────┘   │
│                                     │
│  Server: 4 vCPU, 8GB RAM, 80GB SSD │
└─────────────────────────────────────┘
```

**Components:**
1. **Nginx:** Web server handling HTTP requests
2. **Node.js/Express:** Application server processing business logic
3. **PostgreSQL:** Database storing application data
4. **PM2:** Process manager keeping Node.js running

---

## When Single Server Works

### Perfect For:
- ✅ **MVP and early-stage startups**
- ✅ **Small businesses (< 10K monthly users)**
- ✅ **Internal tools and dashboards**
- ✅ **Personal projects and portfolios**
- ✅ **Proof of concept applications**
- ✅ **Applications with predictable, low traffic**

### Example Use Cases:
```
Coffee Shop Website:
- 500 daily visitors
- 50 orders per day
- Single location
→ Single server handles easily

Hair Salon Booking:
- 200 appointments per week
- 3 stylists
- Local clientele
→ Single server is sufficient

Small E-Commerce:
- 100-500 products
- 50-200 daily visitors
- $5K-$20K monthly revenue
→ Single server works well
```

---

## Setting Up Your Single Server

### Step 1: Choose Your Server

**Cloud Provider Options:**

**DigitalOcean Droplet:**
```bash
Recommended: Basic Droplet
- 2 vCPU
- 4GB RAM
- 80GB SSD
- $24/month
```

**AWS EC2:**
```bash
Recommended: t3.small or t3.medium
- t3.small: 2 vCPU, 2GB RAM ($15/month)
- t3.medium: 2 vCPU, 4GB RAM ($30/month)
```

**Linode:**
```bash
Recommended: Linode 4GB
- 2 vCPU
- 4GB RAM
- 80GB SSD
- $24/month
```

**Vultr:**
```bash
Recommended: Cloud Compute
- 2 vCPU
- 4GB RAM
- 80GB SSD
- $24/month
```

### Step 2: Initial Server Configuration

**Connect to your server:**
```bash
ssh root@your_server_ip
```

**Update system packages:**
```bash
apt update && apt upgrade -y
```

**Create a non-root user:**
```bash
adduser appuser
usermod -aG sudo appuser
```

**Configure firewall:**
```bash
# Install UFW (Uncomplicated Firewall)
apt install ufw

# Allow SSH
ufw allow OpenSSH

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable
ufw status
```

### Step 3: Install Required Software

**Install Node.js:**
```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

**Install PostgreSQL:**
```bash
# Install PostgreSQL 15
apt install -y postgresql postgresql-contrib

# Start PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Verify installation
sudo -u postgres psql --version
```

**Install Nginx:**
```bash
# Install Nginx
apt install -y nginx

# Start Nginx
systemctl start nginx
systemctl enable nginx

# Verify installation
nginx -v
```

**Install PM2 (Process Manager):**
```bash
# Install PM2 globally
npm install -g pm2

# Verify installation
pm2 --version
```

### Step 4: Configure PostgreSQL

**Create database and user:**
```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE coffeeshop_db;
CREATE USER coffeeshop_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE coffeeshop_db TO coffeeshop_user;
\q
```

**Configure PostgreSQL for remote connections (if needed):**
```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/15/main/postgresql.conf

# Find and modify:
listen_addresses = 'localhost'  # Only local connections for security

# Edit pg_hba.conf
sudo nano /etc/postgresql/15/main/pg_hba.conf

# Add line:
local   all             coffeeshop_user                        md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## Deploying Your Application

### Complete Application Setup

**1. Create application directory:**
```bash
sudo mkdir -p /var/www/coffeeshop
sudo chown -R appuser:appuser /var/www/coffeeshop
```

**2. Clone or upload your code:**
```bash
cd /var/www/coffeeshop
git clone https://github.com/yourusername/coffeeshop-app.git .
# Or use scp/sftp to upload files
```

**3. Install dependencies:**
```bash
npm install --production
```

**4. Create environment configuration:**
```bash
nano .env
```

```bash
# .env file
NODE_ENV=production
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coffeeshop_db
DB_USER=coffeeshop_user
DB_PASSWORD=your_secure_password

# JWT Secret
JWT_SECRET=your_very_long_random_secret_key_here

# Application
APP_URL=https://coffeeshop.example.com
```

**5. Initialize database schema:**
```bash
# Run migrations
npm run migrate

# Or manually:
psql -U coffeeshop_user -d coffeeshop_db -f database/schema.sql
```

**6. Start application with PM2:**
```bash
# Start the app
pm2 start server.js --name "coffeeshop-api"

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup systemd
# Run the command PM2 outputs
```

**7. Check application status:**
```bash
pm2 status
pm2 logs coffeeshop-api
```

---

## Nginx Configuration

### Basic Nginx Setup

**Create Nginx configuration file:**
```bash
sudo nano /etc/nginx/sites-available/coffeeshop
```

```nginx
# /etc/nginx/sites-available/coffeeshop

server {
    listen 80;
    server_name coffeeshop.example.com www.coffeeshop.example.com;

    # Serve static files
    location /static/ {
        alias /var/www/coffeeshop/public/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Proxy API requests to Node.js
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Serve frontend
    location / {
        root /var/www/coffeeshop/public;
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/coffeeshop-access.log;
    error_log /var/log/nginx/coffeeshop-error.log;
}
```

**Enable the site:**
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/coffeeshop /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Add SSL/HTTPS with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d coffeeshop.example.com -d www.coffeeshop.example.com

# Test automatic renewal
sudo certbot renew --dry-run
```

**Nginx will automatically be updated to:**
```nginx
server {
    listen 443 ssl http2;
    server_name coffeeshop.example.com www.coffeeshop.example.com;

    ssl_certificate /etc/letsencrypt/live/coffeeshop.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/coffeeshop.example.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # ... rest of configuration
}

# HTTP redirect to HTTPS
server {
    listen 80;
    server_name coffeeshop.example.com www.coffeeshop.example.com;
    return 301 https://$server_name$request_uri;
}
```

---

## Complete Application Code Example

### Backend Server (server.js)

```javascript
// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum number of clients in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully');
  }
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
// Products
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM products WHERE in_stock = true ORDER BY name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Orders
app.post('/api/orders', async (req, res) => {
  const client = await pool.connect();

  try {
    const { userId, items } = req.body;

    // Validate input
    if (!userId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Invalid order data' });
    }

    await client.query('BEGIN');

    // Calculate total
    let totalAmount = 0;
    for (const item of items) {
      const result = await client.query(
        'SELECT price FROM products WHERE id = $1',
        [item.productId]
      );
      totalAmount += result.rows[0].price * item.quantity;
    }

    // Create order
    const orderResult = await client.query(
      'INSERT INTO orders (user_id, total_amount, status) VALUES ($1, $2, $3) RETURNING *',
      [userId, totalAmount, 'pending']
    );

    const orderId = orderResult.rows[0].id;

    // Create order items
    for (const item of items) {
      const productResult = await client.query(
        'SELECT price FROM products WHERE id = $1',
        [item.productId]
      );

      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [orderId, item.productId, item.quantity, productResult.rows[0].price]
      );
    }

    await client.query('COMMIT');

    res.status(201).json(orderResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    client.release();
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});
```

### Package.json

```json
{
  "name": "coffeeshop-api",
  "version": "1.0.0",
  "description": "Coffee shop API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "migrate": "node database/migrate.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

---

## Monitoring Your Single Server

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Application logs
pm2 logs coffeeshop-api

# Application metrics
pm2 show coffeeshop-api

# Restart application
pm2 restart coffeeshop-api

# Stop application
pm2 stop coffeeshop-api
```

### System Resource Monitoring

**Install htop:**
```bash
sudo apt install htop
htop
```

**Monitor disk usage:**
```bash
df -h
```

**Monitor database:**
```bash
sudo -u postgres psql -d coffeeshop_db

-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check database size
SELECT pg_size_pretty(pg_database_size('coffeeshop_db'));

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Performance Optimization for Single Server

### 1. Database Indexing

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
```

### 2. Connection Pooling

Already implemented in our code above with `pg.Pool`:
```javascript
const pool = new Pool({
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 3. Nginx Caching

```nginx
# Add to /etc/nginx/sites-available/coffeeshop

http {
    # Cache configuration
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m inactive=60m;

    server {
        # ... existing configuration

        location /api/products {
            proxy_pass http://localhost:3000;
            proxy_cache api_cache;
            proxy_cache_valid 200 10m;
            proxy_cache_key "$scheme$request_method$host$request_uri";
            add_header X-Cache-Status $upstream_cache_status;
        }
    }
}
```

### 4. Compression

```nginx
# Add to /etc/nginx/nginx.conf

http {
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml+rss text/javascript;
}
```

---

## Backup Strategy

### Automated Database Backups

```bash
# Create backup script
sudo nano /usr/local/bin/backup-db.sh
```

```bash
#!/bin/bash
# Database backup script

BACKUP_DIR="/var/backups/postgresql"
DB_NAME="coffeeshop_db"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create backup
sudo -u postgres pg_dump $DB_NAME | gzip > $BACKUP_FILE

# Delete backups older than 7 days
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-db.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e

# Add line:
0 2 * * * /usr/local/bin/backup-db.sh
```

---

## When to Scale Beyond Single Server

### Warning Signs:

**Performance Issues:**
- ❌ Response times > 2 seconds
- ❌ CPU usage consistently > 80%
- ❌ Memory usage > 85%
- ❌ Disk I/O bottlenecks

**Traffic Growth:**
- ❌ More than 10,000 concurrent users
- ❌ More than 100 requests per second
- ❌ Database reaching connection limits

**Availability Concerns:**
- ❌ Single point of failure unacceptable
- ❌ Need for zero-downtime deployments
- ❌ Geographic distribution required

**Next Steps:**
1. Add caching layer (Redis)
2. Implement database replication
3. Add load balancer with multiple app servers
4. Consider CDN for static assets

---

## Key Takeaways

✅ **Single server** is perfect for MVPs and small applications
✅ **Proper setup** includes Nginx, Node.js, PostgreSQL, PM2
✅ **Security** is critical even on single server (SSL, rate limiting, firewall)
✅ **Monitoring** helps identify when to scale
✅ **Optimization** can extend single-server viability
✅ **Backups** are essential for data protection

---

## Action Items

- [ ] Set up a server on your preferred cloud provider
- [ ] Configure firewall and security
- [ ] Install required software (Node.js, PostgreSQL, Nginx)
- [ ] Deploy one AEOWEB example application
- [ ] Configure SSL with Let's Encrypt
- [ ] Set up automated backups
- [ ] Implement monitoring

---

## What's Next

Chapter 3 covers database selection—choosing between SQL, NoSQL, and Graph databases for your specific needs.

**[Continue to Chapter 3: Databases →](chapter-03-databases.md)**

---

**Navigation:**
- [← Back: Chapter 1](chapter-01-introduction.md)
- [→ Next: Chapter 3](chapter-03-databases.md)
- [Home](README.md)

---

*Chapter 2 of 15 | AEOWEB System Design Guide*
*Updated November 2025*
