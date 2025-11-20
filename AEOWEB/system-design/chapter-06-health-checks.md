# Chapter 6: Health Checks

## Monitoring System Health and Availability

Health checks are your early warning system. They detect failures before users notice, enable automatic recovery, and provide visibility into system health. This chapter covers comprehensive health check implementation.

---

## Health Check Fundamentals

### What Are Health Checks?

Automated tests that verify your application and its dependencies are functioning correctly.

```
┌─────────────────────────────────────────────────┐
│         Health Check Hierarchy                   │
├─────────────────────────────────────────────────┤
│                                                  │
│  Level 1: Application Alive?                    │
│  └─ Simple HTTP 200 response                    │
│                                                  │
│  Level 2: Application Ready?                    │
│  └─ Database connected                          │
│  └─ Cache available                             │
│  └─ External APIs responding                    │
│                                                  │
│  Level 3: Application Healthy?                  │
│  └─ Resource utilization normal                 │
│  └─ Error rates acceptable                      │
│  └─ Response times within SLA                   │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## Active vs Passive Health Checks

### Active Health Checks

**How it works:** Periodically probe endpoints to verify health.

```
┌──────────────┐       GET /health       ┌──────────┐
│Load Balancer │ ─────────────────────→  │  Server  │
│              │ ←───────────────────────│          │
└──────────────┘     200 OK / 503        └──────────┘
     Every 5s
```

**Pros:**
- Proactive failure detection
- Configurable check frequency
- Can test specific functionality

**Cons:**
- Additional network traffic
- Resource consumption
- False positives possible

### Passive Health Checks

**How it works:** Monitor actual request success/failure.

```
Real user request fails → Mark server unhealthy
After N failures → Remove from rotation
```

**Pros:**
- No additional traffic
- Based on real requests
- Lower resource usage

**Cons:**
- Reactive (after user impact)
- Slower detection
- Harder to configure

### Hybrid Approach (Recommended)

```javascript
// Combine both approaches
const healthCheck = {
  active: {
    interval: 5000,      // Check every 5 seconds
    timeout: 2000,       // Timeout after 2 seconds
    unhealthyThreshold: 3 // Mark unhealthy after 3 failures
  },
  passive: {
    errorThreshold: 5,   // After 5 errors
    timeWindow: 60000    // In 60 seconds
  }
};
```

---

## Implementing Health Endpoints

### Basic Health Check

```javascript
// routes/health.js
const express = require('express');
const router = express.Router();

// Simple liveness probe
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
```

### Comprehensive Health Check

```javascript
// routes/health.js
const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const redis = require('../redis');

// Detailed health check
router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {}
  };

  let isHealthy = true;

  // 1. Check Database
  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    const duration = Date.now() - start;

    health.checks.database = {
      status: 'healthy',
      responseTime: duration + 'ms'
    };
  } catch (error) {
    isHealthy = false;
    health.checks.database = {
      status: 'unhealthy',
      error: error.message
    };
  }

  // 2. Check Redis
  try {
    const start = Date.now();
    await redis.ping();
    const duration = Date.now() - start;

    health.checks.redis = {
      status: 'healthy',
      responseTime: duration + 'ms'
    };
  } catch (error) {
    isHealthy = false;
    health.checks.redis = {
      status: 'unhealthy',
      error: error.message
    };
  }

  // 3. Check Memory
  const memUsage = process.memoryUsage();
  const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

  health.checks.memory = {
    status: memUsagePercent < 90 ? 'healthy' : 'warning',
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
    percentage: memUsagePercent.toFixed(2) + '%'
  };

  if (memUsagePercent >= 95) {
    isHealthy = false;
  }

  // 4. Check Disk Space
  const diskUsage = await checkDiskSpace();
  health.checks.disk = diskUsage;

  if (diskUsage.percentage >= 90) {
    isHealthy = false;
  }

  // Set overall status
  health.status = isHealthy ? 'healthy' : 'unhealthy';

  // Return appropriate status code
  res.status(isHealthy ? 200 : 503).json(health);
});

// Liveness probe (basic)
router.get('/health/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

// Readiness probe (comprehensive)
router.get('/health/ready', async (req, res) => {
  try {
    // Check all critical dependencies
    await pool.query('SELECT 1');
    await redis.ping();

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Helper function
async function checkDiskSpace() {
  const { execSync } = require('child_process');

  try {
    const output = execSync('df -h / | tail -1').toString();
    const parts = output.split(/\s+/);
    const percentage = parseInt(parts[4]);

    return {
      status: percentage < 90 ? 'healthy' : 'warning',
      used: parts[2],
      available: parts[3],
      percentage: percentage + '%'
    };
  } catch (error) {
    return {
      status: 'unknown',
      error: error.message
    };
  }
}

module.exports = router;
```

---

## Database Health Checks

### PostgreSQL Connection Health

```javascript
// health/database.js
const { Pool } = require('pg');

class DatabaseHealth {
  constructor(pool) {
    this.pool = pool;
  }

  async check() {
    const health = {
      status: 'healthy',
      checks: {}
    };

    try {
      // 1. Basic connectivity
      const start = Date.now();
      await this.pool.query('SELECT 1');
      health.checks.connectivity = {
        status: 'healthy',
        responseTime: Date.now() - start + 'ms'
      };

      // 2. Check connection pool
      const poolStats = {
        total: this.pool.totalCount,
        idle: this.pool.idleCount,
        waiting: this.pool.waitingCount
      };

      health.checks.pool = {
        status: poolStats.waiting > 5 ? 'warning' : 'healthy',
        ...poolStats
      };

      // 3. Check database size
      const sizeResult = await this.pool.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `);

      health.checks.size = {
        status: 'healthy',
        value: sizeResult.rows[0].size
      };

      // 4. Check active connections
      const connResult = await this.pool.query(`
        SELECT count(*) as active_connections
        FROM pg_stat_activity
        WHERE state = 'active'
      `);

      const activeConns = parseInt(connResult.rows[0].active_connections);

      health.checks.connections = {
        status: activeConns > 50 ? 'warning' : 'healthy',
        active: activeConns
      };

      // 5. Check replication lag (if replica)
      try {
        const lagResult = await this.pool.query(`
          SELECT
            CASE
              WHEN pg_last_wal_receive_lsn() = pg_last_wal_replay_lsn()
              THEN 0
              ELSE EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))
            END AS lag_seconds
        `);

        const lag = parseFloat(lagResult.rows[0].lag_seconds);

        health.checks.replicationLag = {
          status: lag > 10 ? 'warning' : 'healthy',
          seconds: lag
        };
      } catch (error) {
        // Not a replica or error checking
        health.checks.replicationLag = {
          status: 'n/a',
          message: 'Not a replica or unable to check'
        };
      }

    } catch (error) {
      health.status = 'unhealthy';
      health.error = error.message;
    }

    return health;
  }
}

module.exports = DatabaseHealth;
```

### MongoDB Health Check

```javascript
// health/mongodb.js
class MongoDBHealth {
  constructor(client) {
    this.client = client;
  }

  async check() {
    const health = {
      status: 'healthy',
      checks: {}
    };

    try {
      // 1. Ping database
      const start = Date.now();
      await this.client.db().admin().ping();
      health.checks.connectivity = {
        status: 'healthy',
        responseTime: Date.now() - start + 'ms'
      };

      // 2. Check server status
      const serverStatus = await this.client.db().admin().serverStatus();

      health.checks.connections = {
        status: serverStatus.connections.current > 100 ? 'warning' : 'healthy',
        current: serverStatus.connections.current,
        available: serverStatus.connections.available
      };

      health.checks.memory = {
        status: 'healthy',
        resident: Math.round(serverStatus.mem.resident) + 'MB',
        virtual: Math.round(serverStatus.mem.virtual) + 'MB'
      };

      // 3. Check replication status (if replica set)
      try {
        const replStatus = await this.client.db().admin().replSetGetStatus();
        const primary = replStatus.members.find(m => m.stateStr === 'PRIMARY');

        health.checks.replication = {
          status: 'healthy',
          state: replStatus.myState === 1 ? 'PRIMARY' : 'SECONDARY',
          members: replStatus.members.length
        };
      } catch (error) {
        // Not in replica set
        health.checks.replication = {
          status: 'n/a',
          message: 'Not in replica set'
        };
      }

    } catch (error) {
      health.status = 'unhealthy';
      health.error = error.message;
    }

    return health;
  }
}

module.exports = MongoDBHealth;
```

---

## External Service Health Checks

### API Dependency Health

```javascript
// health/external-services.js
const axios = require('axios');

class ExternalServicesHealth {
  constructor() {
    this.services = [
      {
        name: 'payment-api',
        url: process.env.PAYMENT_API_URL + '/health',
        critical: true
      },
      {
        name: 'email-service',
        url: process.env.EMAIL_SERVICE_URL + '/health',
        critical: false
      },
      {
        name: 'sms-service',
        url: process.env.SMS_SERVICE_URL + '/health',
        critical: false
      }
    ];
  }

  async check() {
    const health = {
      status: 'healthy',
      services: {}
    };

    const checks = this.services.map(async (service) => {
      try {
        const start = Date.now();
        const response = await axios.get(service.url, {
          timeout: 5000,
          validateStatus: (status) => status === 200
        });

        health.services[service.name] = {
          status: 'healthy',
          responseTime: Date.now() - start + 'ms',
          critical: service.critical
        };
      } catch (error) {
        const serviceHealth = {
          status: 'unhealthy',
          error: error.message,
          critical: service.critical
        };

        health.services[service.name] = serviceHealth;

        // Mark overall health as unhealthy if critical service fails
        if (service.critical) {
          health.status = 'unhealthy';
        }
      }
    });

    await Promise.all(checks);

    return health;
  }

  async checkService(serviceName) {
    const service = this.services.find(s => s.name === serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    try {
      const start = Date.now();
      await axios.get(service.url, { timeout: 5000 });

      return {
        status: 'healthy',
        responseTime: Date.now() - start + 'ms'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = ExternalServicesHealth;
```

---

## Kubernetes Health Checks

### Liveness and Readiness Probes

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: app
        image: myapp:latest
        ports:
        - containerPort: 3000

        # Liveness probe (restart if fails)
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3

        # Readiness probe (remove from service if fails)
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2

        # Startup probe (for slow-starting apps)
        startupProbe:
          httpGet:
            path: /health/live
            port: 3000
          initialDelaySeconds: 0
          periodSeconds: 10
          timeoutSeconds: 3
          failureThreshold: 30
```

---

## Monitoring and Alerting

### Health Check Monitoring Service

```javascript
// monitoring/health-monitor.js
const axios = require('axios');
const nodemailer = require('nodemailer');

class HealthMonitor {
  constructor(config) {
    this.servers = config.servers;
    this.alertEmail = config.alertEmail;
    this.checkInterval = config.checkInterval || 30000; // 30 seconds
    this.failureCount = new Map();

    this.mailer = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async start() {
    console.log('Starting health monitor...');
    this.intervalId = setInterval(() => {
      this.checkAllServers();
    }, this.checkInterval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      console.log('Health monitor stopped');
    }
  }

  async checkAllServers() {
    for (const server of this.servers) {
      await this.checkServer(server);
    }
  }

  async checkServer(server) {
    try {
      const start = Date.now();
      const response = await axios.get(`${server.url}/health`, {
        timeout: 5000
      });

      const duration = Date.now() - start;

      // Server is healthy
      if (response.status === 200) {
        // Reset failure count
        if (this.failureCount.has(server.name)) {
          console.log(`✅ ${server.name} recovered`);
          await this.sendRecoveryAlert(server);
          this.failureCount.delete(server.name);
        }

        // Log slow response
        if (duration > 1000) {
          console.log(`⚠️  ${server.name} slow response: ${duration}ms`);
        }
      }
    } catch (error) {
      // Server is unhealthy
      const count = (this.failureCount.get(server.name) || 0) + 1;
      this.failureCount.set(server.name, count);

      console.log(`❌ ${server.name} health check failed (${count}): ${error.message}`);

      // Alert after 3 consecutive failures
      if (count === 3) {
        await this.sendAlert(server, error);
      }
    }
  }

  async sendAlert(server, error) {
    const subject = `🚨 ALERT: ${server.name} is unhealthy`;
    const body = `
Server: ${server.name}
URL: ${server.url}
Status: UNHEALTHY
Error: ${error.message}
Time: ${new Date().toISOString()}
Consecutive Failures: ${this.failureCount.get(server.name)}

Please investigate immediately.
    `;

    await this.mailer.sendMail({
      from: process.env.ALERT_FROM_EMAIL,
      to: this.alertEmail,
      subject,
      text: body
    });

    console.log(`📧 Alert sent for ${server.name}`);
  }

  async sendRecoveryAlert(server) {
    const subject = `✅ RECOVERY: ${server.name} is healthy`;
    const body = `
Server: ${server.name}
URL: ${server.url}
Status: HEALTHY
Time: ${new Date().toISOString()}

Server has recovered and is now healthy.
    `;

    await this.mailer.sendMail({
      from: process.env.ALERT_FROM_EMAIL,
      to: this.alertEmail,
      subject,
      text: body
    });
  }
}

// Usage
const monitor = new HealthMonitor({
  servers: [
    { name: 'App Server 1', url: 'http://10.0.1.10:3000' },
    { name: 'App Server 2', url: 'http://10.0.1.11:3000' },
    { name: 'App Server 3', url: 'http://10.0.1.12:3000' }
  ],
  alertEmail: 'alerts@example.com',
  checkInterval: 30000
});

monitor.start();

module.exports = HealthMonitor;
```

---

## Graceful Degradation

### Handling Partial Failures

```javascript
// services/product-service.js
const axios = require('axios');
const NodeCache = require('node-cache');

class ProductService {
  constructor() {
    // Cache for graceful degradation
    this.cache = new NodeCache({ stdTTL: 3600 });
    this.recommendationServiceUrl = process.env.RECOMMENDATION_SERVICE_URL;
  }

  async getProductWithRecommendations(productId) {
    const product = await this.getProduct(productId);

    try {
      // Try to get recommendations
      const recommendations = await this.getRecommendations(productId);
      product.recommendations = recommendations;
    } catch (error) {
      console.error('Recommendation service unavailable:', error.message);

      // Graceful degradation: use cached recommendations
      const cached = this.cache.get(`recommendations:${productId}`);
      if (cached) {
        product.recommendations = cached;
        product.recommendationsFromCache = true;
      } else {
        // No recommendations available
        product.recommendations = [];
        product.recommendationsUnavailable = true;
      }
    }

    return product;
  }

  async getRecommendations(productId) {
    const response = await axios.get(
      `${this.recommendationServiceUrl}/recommendations/${productId}`,
      { timeout: 2000 }
    );

    const recommendations = response.data;

    // Cache for future use
    this.cache.set(`recommendations:${productId}`, recommendations);

    return recommendations;
  }

  async getProduct(productId) {
    // Get product from database
    const result = await pool.query(
      'SELECT * FROM products WHERE id = $1',
      [productId]
    );

    return result.rows[0];
  }
}

module.exports = ProductService;
```

---

## Circuit Breaker Pattern

### Preventing Cascading Failures

```javascript
// utils/circuit-breaker.js
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.successThreshold = options.successThreshold || 2;
    this.timeout = options.timeout || 60000; // 1 minute
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      // Try to recover
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await fn();

      // Success
      this.onSuccess();
      return result;
    } catch (error) {
      // Failure
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;

    if (this.state === 'HALF_OPEN') {
      this.successCount++;

      if (this.successCount >= this.successThreshold) {
        this.state = 'CLOSED';
        this.successCount = 0;
        console.log('Circuit breaker: HALF_OPEN → CLOSED');
      }
    }
  }

  onFailure() {
    this.failureCount++;

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
      console.log(`Circuit breaker: OPEN for ${this.timeout}ms`);
    }
  }

  getState() {
    return this.state;
  }
}

// Usage
const paymentServiceBreaker = new CircuitBreaker({
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000
});

async function processPayment(paymentData) {
  try {
    return await paymentServiceBreaker.execute(async () => {
      const response = await axios.post(
        `${process.env.PAYMENT_API_URL}/charge`,
        paymentData,
        { timeout: 5000 }
      );
      return response.data;
    });
  } catch (error) {
    // Handle circuit breaker open or payment failure
    if (error.message === 'Circuit breaker is OPEN') {
      // Use fallback payment method or queue for later
      return { status: 'queued', message: 'Payment queued for processing' };
    }
    throw error;
  }
}

module.exports = CircuitBreaker;
```

---

## Key Takeaways

✅ **Health checks** enable automatic failure detection
✅ **Liveness probes** check if application is alive
✅ **Readiness probes** check if application is ready for traffic
✅ **Check dependencies** (database, cache, external APIs)
✅ **Graceful degradation** maintains service during partial failures
✅ **Circuit breakers** prevent cascading failures
✅ **Monitor and alert** on health check failures

---

## Implementation Checklist

- [ ] Implement basic health endpoint
- [ ] Add liveness probe endpoint
- [ ] Add readiness probe endpoint
- [ ] Check database connectivity
- [ ] Check cache connectivity
- [ ] Monitor external service dependencies
- [ ] Implement graceful degradation
- [ ] Add circuit breakers for external services
- [ ] Set up health monitoring
- [ ] Configure alerting
- [ ] Test failure scenarios
- [ ] Document health check endpoints

---

## Troubleshooting

**Health checks failing intermittently:**
- Increase timeout values
- Check network connectivity
- Review resource usage
- Implement retry logic

**False positive failures:**
- Adjust failure thresholds
- Verify check logic
- Monitor for resource constraints

**Cascading failures:**
- Implement circuit breakers
- Add timeouts to all external calls
- Use graceful degradation

---

## What's Next

Chapter 7 covers Single Points of Failure—identifying and eliminating them from your architecture.

**[Continue to Chapter 7: Single Point of Failure →](chapter-07-spof.md)**

---

**Navigation:**
- [← Back: Chapter 5](chapter-05-load-balancing.md)
- [→ Next: Chapter 7](chapter-07-spof.md)
- [Home](README.md)

---

*Chapter 6 of 15 | AEOWEB System Design Guide*
*Updated November 2025*
