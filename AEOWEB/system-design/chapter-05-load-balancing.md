# Chapter 5: Load Balancing

## Distributing Traffic Intelligently

Load balancing is the art of distributing incoming traffic across multiple servers to ensure no single server becomes overwhelmed. This chapter covers algorithms, configurations, and production implementations.

---

## Load Balancer Fundamentals

### What is a Load Balancer?

```
                   ┌──────────────────┐
        Clients    │  Load Balancer   │
                   │  (Traffic Cop)   │
    ┌──────────────┼──────────────────┼──────────────┐
    │              │                  │              │
┌───▼───┐      ┌───▼───┐         ┌───▼───┐      ┌───▼───┐
│Client1│      │Client2│         │Client3│      │Client4│
└───────┘      └───────┘         └───────┘      └───────┘
                        │
            ┌───────────┼───────────┐
            │           │           │
        ┌───▼───┐   ┌───▼───┐   ┌──▼────┐
        │Server1│   │Server2│   │Server3│
        │ 30%   │   │ 35%   │   │ 35%   │
        └───────┘   └───────┘   └───────┘
```

**Key Functions:**
1. Distribute traffic across multiple servers
2. Monitor server health
3. Remove failed servers from rotation
4. Provide SSL termination
5. Enable zero-downtime deployments

### Types of Load Balancers

**Layer 4 (Transport Layer):**
- Works with TCP/UDP
- Fast and efficient
- No content inspection
- Routes based on IP and port

**Layer 7 (Application Layer):**
- Works with HTTP/HTTPS
- Content-based routing
- Can inspect headers, cookies, URLs
- More features but higher latency

```
┌─────────────────────┬──────────────┬──────────────┐
│      Feature        │   Layer 4    │   Layer 7    │
├─────────────────────┼──────────────┼──────────────┤
│ Speed               │ Very Fast    │ Fast         │
│ Content Inspection  │ No           │ Yes          │
│ URL-based Routing   │ No           │ Yes          │
│ Cookie Persistence  │ No           │ Yes          │
│ SSL Termination     │ Limited      │ Full         │
│ WebSocket Support   │ Yes          │ Yes          │
│ Use Case            │ High traffic │ Complex apps │
└─────────────────────┴──────────────┴──────────────┘
```

---

## Load Balancing Algorithms

### 1. Round Robin

**How it works:** Distributes requests sequentially to each server.

```
Request 1 → Server 1
Request 2 → Server 2
Request 3 → Server 3
Request 4 → Server 1 (cycle repeats)
Request 5 → Server 2
```

**Pros:**
- Simple to implement
- Fair distribution
- No server state required

**Cons:**
- Doesn't account for server capacity
- Doesn't consider current load
- May overload slower servers

**When to use:**
- Servers have identical capacity
- Requests have similar processing time
- Simple applications

**Nginx Configuration:**

```nginx
upstream backend {
    # Round robin (default)
    server 10.0.1.10:3000;
    server 10.0.1.11:3000;
    server 10.0.1.12:3000;
}

server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://backend;
    }
}
```

### 2. Weighted Round Robin

**How it works:** Like round robin, but some servers receive more requests.

```
Server 1 (weight: 3) → Gets 60% of traffic
Server 2 (weight: 1) → Gets 20% of traffic
Server 3 (weight: 1) → Gets 20% of traffic

Request flow:
1 → Server 1
2 → Server 1
3 → Server 1
4 → Server 2
5 → Server 3
6 → Server 1 (cycle repeats)
```

**When to use:**
- Servers have different capacities
- Gradual rollout of new servers
- Cost optimization (use smaller instances)

**Nginx Configuration:**

```nginx
upstream backend {
    server 10.0.1.10:3000 weight=3;  # Powerful server
    server 10.0.1.11:3000 weight=2;  # Medium server
    server 10.0.1.12:3000 weight=1;  # Smaller server
}
```

### 3. Least Connections

**How it works:** Sends requests to server with fewest active connections.

```
Server 1: 5 active connections
Server 2: 3 active connections  ← Next request goes here
Server 3: 7 active connections
```

**Pros:**
- Better load distribution
- Adapts to server performance
- Good for long-lived connections

**Cons:**
- More complex tracking
- Slight overhead

**When to use:**
- Requests have varying processing times
- Long-lived connections (WebSockets)
- Real-time applications

**Nginx Configuration:**

```nginx
upstream backend {
    least_conn;

    server 10.0.1.10:3000;
    server 10.0.1.11:3000;
    server 10.0.1.12:3000;
}
```

### 4. IP Hash

**How it works:** Routes based on client IP address (same client → same server).

```
Client IP: 192.168.1.10 → hash(192.168.1.10) % 3 = 1 → Server 1
Client IP: 192.168.1.11 → hash(192.168.1.11) % 3 = 2 → Server 2
Client IP: 192.168.1.12 → hash(192.168.1.12) % 3 = 0 → Server 0

Same client always goes to same server
```

**Pros:**
- Session persistence without shared storage
- Simple implementation
- Good for caching

**Cons:**
- Uneven distribution possible
- Server removal affects many clients
- Not good for proxy/NAT environments

**When to use:**
- Session-based applications
- Server-side caching
- Legacy applications

**Nginx Configuration:**

```nginx
upstream backend {
    ip_hash;

    server 10.0.1.10:3000;
    server 10.0.1.11:3000;
    server 10.0.1.12:3000;
}
```

### 5. Least Response Time

**How it works:** Sends to server with lowest response time.

```
Server 1: 50ms average response time
Server 2: 120ms average response time
Server 3: 75ms average response time

Next request → Server 1 (fastest)
```

**When to use:**
- Variable server performance
- Mixed workloads
- Geographic distribution

**HAProxy Configuration:**

```cfg
backend app_servers
    balance leasttime
    server app1 10.0.1.10:3000 check
    server app2 10.0.1.11:3000 check
    server app3 10.0.1.12:3000 check
```

---

## Complete Nginx Load Balancer Configuration

### Production-Ready Setup

```nginx
# /etc/nginx/nginx.conf

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 4096;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';

    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript
               text/xml application/xml application/xml+rss text/javascript;

    # Upstream configuration
    upstream app_servers {
        # Algorithm
        least_conn;

        # Servers with health checks
        server 10.0.1.10:3000 max_fails=3 fail_timeout=30s weight=1;
        server 10.0.1.11:3000 max_fails=3 fail_timeout=30s weight=1;
        server 10.0.1.12:3000 max_fails=3 fail_timeout=30s weight=1;

        # Keep-alive connections to backend
        keepalive 32;
    }

    # HTTP Server (redirect to HTTPS)
    server {
        listen 80;
        server_name example.com www.example.com;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$server_name$request_uri;
        }
    }

    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name example.com www.example.com;

        # SSL Configuration
        ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
        ssl_session_timeout 1d;
        ssl_session_cache shared:SSL:50m;
        ssl_session_tickets off;

        # Modern SSL configuration
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # HSTS
        add_header Strict-Transport-Security "max-age=63072000" always;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;

        # Static files
        location /static/ {
            alias /var/www/app/public/;
            expires 30d;
            add_header Cache-Control "public, immutable";
        }

        # API endpoints
        location /api/ {
            proxy_pass http://app_servers;
            proxy_http_version 1.1;

            # Headers
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Host $host;
            proxy_set_header X-Forwarded-Port $server_port;

            # WebSocket support
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";

            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;

            # Buffering
            proxy_buffering on;
            proxy_buffer_size 4k;
            proxy_buffers 8 4k;
            proxy_busy_buffers_size 8k;

            # Keep-alive
            proxy_set_header Connection "";

            # Don't cache by default
            proxy_no_cache 1;
            proxy_cache_bypass 1;
        }

        # Health check endpoint (no auth required)
        location /health {
            access_log off;
            proxy_pass http://app_servers;
        }

        # Frontend application
        location / {
            root /var/www/app/public;
            try_files $uri $uri/ /index.html;
        }

        # Error pages
        error_page 500 502 503 504 /50x.html;
        location = /50x.html {
            root /usr/share/nginx/html;
        }
    }
}
```

---

## HAProxy Configuration

### Complete HAProxy Setup

```cfg
# /etc/haproxy/haproxy.cfg

global
    log /dev/log local0
    log /dev/log local1 notice
    chroot /var/lib/haproxy
    stats socket /run/haproxy/admin.sock mode 660 level admin
    stats timeout 30s
    user haproxy
    group haproxy
    daemon

    # SSL
    ssl-default-bind-ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384
    ssl-default-bind-options ssl-min-ver TLSv1.2 no-tls-tickets

defaults
    log global
    mode http
    option httplog
    option dontlognull
    option http-server-close
    option forwardfor except 127.0.0.0/8
    option redispatch
    retries 3
    timeout connect 5000
    timeout client 50000
    timeout server 50000
    errorfile 400 /etc/haproxy/errors/400.http
    errorfile 403 /etc/haproxy/errors/403.http
    errorfile 408 /etc/haproxy/errors/408.http
    errorfile 500 /etc/haproxy/errors/500.http
    errorfile 502 /etc/haproxy/errors/502.http
    errorfile 503 /etc/haproxy/errors/503.http
    errorfile 504 /etc/haproxy/errors/504.http

# Frontend (receives traffic)
frontend http_front
    bind *:80
    bind *:443 ssl crt /etc/haproxy/certs/example.com.pem

    # Redirect HTTP to HTTPS
    redirect scheme https code 301 if !{ ssl_fc }

    # ACLs for routing
    acl is_api path_beg /api/
    acl is_static path_beg /static/
    acl is_health path /health

    # Use backends
    use_backend static_servers if is_static
    use_backend app_servers if is_api
    use_backend app_servers if is_health
    default_backend app_servers

# Backend (application servers)
backend app_servers
    balance leastconn
    option httpchk GET /health
    http-check expect status 200

    # Servers
    server app1 10.0.1.10:3000 check inter 2000 rise 2 fall 3 maxconn 100
    server app2 10.0.1.11:3000 check inter 2000 rise 2 fall 3 maxconn 100
    server app3 10.0.1.12:3000 check inter 2000 rise 2 fall 3 maxconn 100

    # Session persistence
    cookie SERVERID insert indirect nocache

# Backend (static files)
backend static_servers
    balance roundrobin
    server static1 10.0.2.10:80 check
    server static2 10.0.2.11:80 check

# Statistics page
listen stats
    bind *:8080
    stats enable
    stats uri /stats
    stats refresh 30s
    stats auth admin:SecurePassword123
```

---

## Session Persistence

### Sticky Sessions

**Problem:** User logs in, next request goes to different server without session.

**Solution 1: Cookie-based**

```nginx
upstream backend {
    ip_hash;  # Simple sticky sessions
    server 10.0.1.10:3000;
    server 10.0.1.11:3000;
}
```

**Solution 2: Application-level (Redis)**

```javascript
// session-persistence.js
const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const { createClient } = require('redis');

const app = express();

// Create Redis client
const redisClient = createClient({
  host: process.env.REDIS_HOST,
  port: 6379,
  legacyMode: true
});

redisClient.connect().catch(console.error);

// Configure session middleware
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // HTTPS only
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Session works across all servers
app.get('/login', (req, res) => {
  req.session.userId = 123;
  res.json({ success: true });
});

app.get('/profile', (req, res) => {
  // Works regardless of which server handles request
  const userId = req.session.userId;
  res.json({ userId });
});
```

---

## SSL Termination

### Why SSL Termination at Load Balancer?

**Benefits:**
- Centralized certificate management
- Reduced CPU load on application servers
- Simplified configuration
- Better performance

```
┌─────────┐   HTTPS    ┌──────────────┐   HTTP   ┌─────────┐
│ Client  │ ────────→  │Load Balancer │ ───────→ │ Server  │
└─────────┘  Encrypted  └──────────────┘  Plain   └─────────┘
                         ↑
                    SSL Terminated Here
```

**Nginx SSL Termination:**

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/example.com/chain.pem;
    resolver 8.8.8.8 8.8.4.4 valid=300s;

    location / {
        proxy_pass http://backend;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

---

## AWS Application Load Balancer (ALB)

### Creating ALB via AWS CLI

```bash
# Create target group
aws elbv2 create-target-group \
  --name app-target-group \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-12345678 \
  --health-check-enabled \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3

# Register targets
aws elbv2 register-targets \
  --target-group-arn arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/app-target-group/1234567890abcdef \
  --targets Id=i-1234567890abcdef0 Id=i-0987654321fedcba0

# Create load balancer
aws elbv2 create-load-balancer \
  --name app-load-balancer \
  --subnets subnet-12345678 subnet-87654321 \
  --security-groups sg-12345678 \
  --scheme internet-facing \
  --type application

# Create listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/app-load-balancer/1234567890abcdef \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/app-target-group/1234567890abcdef
```

### ALB with Path-Based Routing

```javascript
// Configure via AWS SDK
const AWS = require('aws-sdk');
const elbv2 = new AWS.ELBv2();

async function createPathBasedRouting() {
  // Create rule for /api/*
  await elbv2.createRule({
    ListenerArn: 'arn:...:listener/app/...',
    Priority: 1,
    Conditions: [
      {
        Field: 'path-pattern',
        Values: ['/api/*']
      }
    ],
    Actions: [
      {
        Type: 'forward',
        TargetGroupArn: 'arn:...:targetgroup/api-servers/...'
      }
    ]
  }).promise();

  // Create rule for /static/*
  await elbv2.createRule({
    ListenerArn: 'arn:...:listener/app/...',
    Priority: 2,
    Conditions: [
      {
        Field: 'path-pattern',
        Values: ['/static/*']
      }
    ],
    Actions: [
      {
        Type: 'forward',
        TargetGroupArn: 'arn:...:targetgroup/static-servers/...'
      }
    ]
  }).promise();
}
```

---

## Health Checks

### Configuring Health Checks

**Nginx:**

```nginx
upstream backend {
    server 10.0.1.10:3000 max_fails=3 fail_timeout=30s;
    server 10.0.1.11:3000 max_fails=3 fail_timeout=30s;
}
```

**HAProxy:**

```cfg
backend app_servers
    option httpchk GET /health
    http-check expect status 200

    server app1 10.0.1.10:3000 check inter 2000 rise 2 fall 3
    # inter: check interval (ms)
    # rise: successful checks before marking up
    # fall: failed checks before marking down
```

**Health Check Endpoint:**

```javascript
// Health check with detailed status
app.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'healthy'
  };

  try {
    // Check database
    await pool.query('SELECT 1');
    health.database = 'connected';

    // Check Redis
    await redis.ping();
    health.redis = 'connected';

    // Check memory
    const memUsage = process.memoryUsage();
    health.memory = {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB'
    };

    res.status(200).json(health);
  } catch (error) {
    health.status = 'unhealthy';
    health.error = error.message;
    res.status(503).json(health);
  }
});
```

---

## Zero-Downtime Deployments

### Rolling Deployment with Load Balancer

```bash
#!/bin/bash
# rolling-deploy.sh

SERVERS=("10.0.1.10" "10.0.1.11" "10.0.1.12")

for SERVER in "${SERVERS[@]}"; do
  echo "Deploying to $SERVER..."

  # 1. Mark server as down in load balancer
  ssh $SERVER "sudo touch /var/www/app/maintenance"
  sleep 10  # Wait for connections to drain

  # 2. Deploy new code
  ssh $SERVER "cd /var/www/app && git pull && npm install --production"

  # 3. Restart application
  ssh $SERVER "pm2 restart app"

  # 4. Wait for health check
  sleep 5

  # 5. Verify health
  HEALTH=$(curl -s http://$SERVER:3000/health | jq -r '.status')

  if [ "$HEALTH" == "healthy" ]; then
    # 6. Mark server as up
    ssh $SERVER "sudo rm /var/www/app/maintenance"
    echo "✅ $SERVER deployed successfully"
  else
    echo "❌ $SERVER deployment failed"
    exit 1
  fi

  # Wait before next server
  sleep 30
done

echo "🎉 Deployment complete!"
```

---

## Key Takeaways

✅ **Load balancers** distribute traffic across multiple servers
✅ **Layer 7** provides more features than Layer 4
✅ **Choose algorithm** based on your use case
✅ **Health checks** ensure traffic goes to healthy servers
✅ **SSL termination** centralizes certificate management
✅ **Session persistence** requires planning for distributed systems
✅ **Zero-downtime** deployments possible with proper configuration

---

## Implementation Checklist

- [ ] Choose load balancing algorithm
- [ ] Decide on Layer 4 vs Layer 7
- [ ] Configure health checks
- [ ] Implement SSL termination
- [ ] Set up session management
- [ ] Configure timeouts appropriately
- [ ] Enable access logging
- [ ] Set up monitoring and alerts
- [ ] Test failover scenarios
- [ ] Document deployment procedures
- [ ] Plan for zero-downtime deployments

---

## Troubleshooting

**502 Bad Gateway:**
- Check backend servers are running
- Verify health check endpoint works
- Check firewall rules
- Review proxy timeout settings

**Uneven Load Distribution:**
- Review algorithm choice
- Check server weights
- Verify health checks are working
- Monitor connection counts

**Session Loss:**
- Implement Redis session store
- Configure sticky sessions if needed
- Check session cookie settings

---

## What's Next

Chapter 6 dives deep into health checks—implementing comprehensive health monitoring for your distributed system.

**[Continue to Chapter 6: Health Checks →](chapter-06-health-checks.md)**

---

**Navigation:**
- [← Back: Chapter 4](chapter-04-scaling.md)
- [→ Next: Chapter 6](chapter-06-health-checks.md)
- [Home](README.md)

---

*Chapter 5 of 15 | AEOWEB System Design Guide*
*Updated November 2025*
