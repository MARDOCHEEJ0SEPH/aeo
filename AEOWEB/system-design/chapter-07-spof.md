# Chapter 7: Single Point of Failure (SPOF)

## Eliminating Weakest Links in Your Architecture

A Single Point of Failure (SPOF) is any component whose failure brings down your entire system. This chapter teaches you to identify, eliminate, and mitigate SPOFs in your architecture.

---

## Understanding Single Points of Failure

### What is a SPOF?

```
┌─────────────────────────────────────────────┐
│        Single Point of Failure              │
├─────────────────────────────────────────────┤
│                                              │
│  If THIS component fails →                  │
│  The ENTIRE system goes down                │
│                                              │
│  Example:                                    │
│  ┌──────────┐                               │
│  │  Users   │                               │
│  └────┬─────┘                               │
│       │                                      │
│       ▼                                      │
│  ┌──────────┐  ← SPOF: Single Server       │
│  │ Server   │                               │
│  └────┬─────┘                               │
│       │                                      │
│       ▼                                      │
│  ┌──────────┐  ← SPOF: Single Database     │
│  │ Database │                               │
│  └──────────┘                               │
│                                              │
│  If server OR database fails = Total outage │
└─────────────────────────────────────────────┘
```

---

## Common SPOFs in Web Applications

### 1. Single Application Server

**Problem:**
```
┌─────────┐
│ Users   │
└────┬────┘
     │
     ▼
┌──────────┐  ← SPOF
│  Server  │
└──────────┘
```

**Solution: Multiple Servers + Load Balancer**
```
┌─────────┐
│ Users   │
└────┬────┘
     │
     ▼
┌──────────────┐
│Load Balancer │
└──────┬───────┘
       │
   ┌───┼───┐
   │   │   │
   ▼   ▼   ▼
┌────┐┌────┐┌────┐
│S1  ││S2  ││S3  │
└────┘└────┘└────┘
```

**Implementation:**

```bash
# Setup script for redundant servers
#!/bin/bash

# Server 1
ssh server1 "cd /var/www/app && git pull && pm2 restart app"

# Server 2
ssh server2 "cd /var/www/app && git pull && pm2 restart app"

# Server 3
ssh server3 "cd /var/www/app && git pull && pm2 restart app"

echo "All servers updated"
```

### 2. Single Database

**Problem:**
```
Database fails → All data access fails → System down
```

**Solution: Database Replication**

#### PostgreSQL Primary-Replica Setup

**Primary Server Configuration:**

```bash
# postgresql.conf on primary
listen_addresses = '*'
wal_level = replica
max_wal_senders = 5
wal_keep_size = 1GB
synchronous_commit = on
```

```bash
# pg_hba.conf on primary
# Allow replication connections
host replication replicator 10.0.1.11/32 md5
host replication replicator 10.0.1.12/32 md5
```

```sql
-- Create replication user
CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'secure_password';
```

**Replica Server Setup:**

```bash
# Stop PostgreSQL on replica
sudo systemctl stop postgresql

# Remove existing data
sudo rm -rf /var/lib/postgresql/15/main/*

# Backup from primary
sudo -u postgres pg_basebackup -h 10.0.1.10 -D /var/lib/postgresql/15/main -U replicator -P -v -R -X stream -C -S replica1

# Start replica
sudo systemctl start postgresql
```

**Application Configuration with Failover:**

```javascript
// database-with-failover.js
const { Pool } = require('pg');

class DatabaseCluster {
  constructor() {
    // Primary pool (writes)
    this.primaryPool = new Pool({
      host: process.env.PRIMARY_DB_HOST,
      port: 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      max: 20
    });

    // Replica pools (reads)
    this.replicaPools = [
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

    this.replicaIndex = 0;
    this.primaryDown = false;
  }

  // Write to primary with automatic failover
  async write(query, params) {
    try {
      const result = await this.primaryPool.query(query, params);
      this.primaryDown = false;
      return result;
    } catch (error) {
      console.error('Primary database error:', error.message);

      // If primary is down, try to write to first replica
      if (!this.primaryDown) {
        this.primaryDown = true;
        console.log('⚠️  Primary database down, attempting failover...');

        try {
          const result = await this.replicaPools[0].query(query, params);
          console.log('✅ Failover successful');
          return result;
        } catch (failoverError) {
          console.error('❌ Failover failed:', failoverError.message);
          throw failoverError;
        }
      }

      throw error;
    }
  }

  // Read from replicas with round-robin
  async read(query, params) {
    const pool = this.getReadPool();

    try {
      return await pool.query(query, params);
    } catch (error) {
      console.error('Replica read error:', error.message);

      // Try next replica
      const nextPool = this.getReadPool();
      try {
        return await nextPool.query(query, params);
      } catch (retryError) {
        // All replicas failed, try primary
        console.log('All replicas failed, reading from primary');
        return await this.primaryPool.query(query, params);
      }
    }
  }

  getReadPool() {
    const pool = this.replicaPools[this.replicaIndex];
    this.replicaIndex = (this.replicaIndex + 1) % this.replicaPools.length;
    return pool;
  }

  async healthCheck() {
    const health = {
      primary: false,
      replicas: []
    };

    // Check primary
    try {
      await this.primaryPool.query('SELECT 1');
      health.primary = true;
    } catch (error) {
      console.error('Primary health check failed');
    }

    // Check replicas
    for (let i = 0; i < this.replicaPools.length; i++) {
      try {
        await this.replicaPools[i].query('SELECT 1');
        health.replicas[i] = true;
      } catch (error) {
        health.replicas[i] = false;
      }
    }

    return health;
  }
}

module.exports = new DatabaseCluster();
```

### 3. Single Load Balancer

**Problem:**
```
Load balancer fails → No traffic reaches servers → System down
```

**Solution: Redundant Load Balancers**

#### Using Keepalived for HA

```bash
# Install keepalived on both load balancers
sudo apt install keepalived

# LB1 configuration
# /etc/keepalived/keepalived.conf
vrrp_instance VI_1 {
    state MASTER
    interface eth0
    virtual_router_id 51
    priority 101
    advert_int 1

    authentication {
        auth_type PASS
        auth_pass secure_password
    }

    virtual_ipaddress {
        10.0.1.100/24
    }
}

# LB2 configuration
# /etc/keepalived/keepalived.conf
vrrp_instance VI_1 {
    state BACKUP
    interface eth0
    virtual_router_id 51
    priority 100
    advert_int 1

    authentication {
        auth_type PASS
        auth_pass secure_password
    }

    virtual_ipaddress {
        10.0.1.100/24
    }
}
```

**Architecture:**
```
Users → Virtual IP (10.0.1.100)
        ↓
        ├─→ LB1 (MASTER) → App Servers
        │
        └─→ LB2 (BACKUP) → App Servers
                           (Takes over if LB1 fails)
```

### 4. Single Region/Data Center

**Problem:**
```
Data center outage → Entire system down
```

**Solution: Multi-Region Deployment**

```
┌────────────────────────────────────────────┐
│           Global Load Balancer             │
│         (Route53, Cloudflare)              │
└───────────┬────────────────────────────────┘
            │
    ┌───────┴────────┐
    │                │
    ▼                ▼
┌─────────┐      ┌─────────┐
│ Region  │      │ Region  │
│ US-East │      │ EU-West │
└─────────┘      └─────────┘
```

**AWS Multi-Region Setup:**

```javascript
// config/multi-region.js
const regions = {
  'us-east-1': {
    primary: true,
    database: 'db-us-east.example.com',
    redis: 'redis-us-east.example.com',
    s3Bucket: 'assets-us-east'
  },
  'eu-west-1': {
    primary: false,
    database: 'db-eu-west.example.com',
    redis: 'redis-eu-west.example.com',
    s3Bucket: 'assets-eu-west'
  }
};

// Determine closest region based on user location
function getRegion(userLocation) {
  // Simple geolocation routing
  if (userLocation.continent === 'Europe') {
    return regions['eu-west-1'];
  }
  return regions['us-east-1'];
}

module.exports = { regions, getRegion };
```

---

## Disaster Recovery Planning

### Recovery Objectives

**RTO (Recovery Time Objective):**
- How long can you be down?
- Target: < 1 hour for critical systems

**RPO (Recovery Point Objective):**
- How much data can you lose?
- Target: < 5 minutes for critical data

```
┌──────────────────────────────────────────┐
│        Disaster Recovery Tiers           │
├──────────────────────────────────────────┤
│                                           │
│ Tier 1: Backup and Restore               │
│ RTO: 24 hours | RPO: 24 hours            │
│ Cost: Low                                 │
│                                           │
│ Tier 2: Pilot Light                      │
│ RTO: Hours | RPO: Minutes                │
│ Cost: Medium                              │
│                                           │
│ Tier 3: Warm Standby                     │
│ RTO: Minutes | RPO: Seconds              │
│ Cost: High                                │
│                                           │
│ Tier 4: Hot Standby (Active-Active)      │
│ RTO: Seconds | RPO: None                 │
│ Cost: Very High                           │
│                                           │
└──────────────────────────────────────────┘
```

### Automated Backup System

```javascript
// scripts/backup-automation.js
const { exec } = require('child_process');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

const s3 = new AWS.S3();

class BackupSystem {
  constructor() {
    this.backupDir = '/var/backups';
    this.s3Bucket = process.env.BACKUP_S3_BUCKET;
    this.retentionDays = 30;
  }

  async backupDatabase() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `db-backup-${timestamp}.sql.gz`;
    const filepath = path.join(this.backupDir, filename);

    console.log('Starting database backup...');

    // Create backup
    await this.execCommand(
      `pg_dump ${process.env.DB_NAME} | gzip > ${filepath}`
    );

    // Upload to S3
    await this.uploadToS3(filepath, filename);

    // Cleanup old backups
    await this.cleanupOldBackups();

    console.log(`✅ Backup complete: ${filename}`);
  }

  async uploadToS3(filepath, filename) {
    const fileContent = fs.readFileSync(filepath);

    const params = {
      Bucket: this.s3Bucket,
      Key: `database/${filename}`,
      Body: fileContent,
      ServerSideEncryption: 'AES256'
    };

    await s3.putObject(params).promise();
    console.log(`Uploaded to S3: ${filename}`);
  }

  async cleanupOldBackups() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    // List S3 objects
    const params = {
      Bucket: this.s3Bucket,
      Prefix: 'database/'
    };

    const data = await s3.listObjectsV2(params).promise();

    // Delete old backups
    const toDelete = data.Contents.filter(obj => {
      return new Date(obj.LastModified) < cutoffDate;
    });

    for (const obj of toDelete) {
      await s3.deleteObject({
        Bucket: this.s3Bucket,
        Key: obj.Key
      }).promise();

      console.log(`Deleted old backup: ${obj.Key}`);
    }
  }

  async restoreBackup(backupFilename) {
    console.log(`Restoring backup: ${backupFilename}`);

    // Download from S3
    const params = {
      Bucket: this.s3Bucket,
      Key: `database/${backupFilename}`
    };

    const data = await s3.getObject(params).promise();
    const filepath = path.join(this.backupDir, backupFilename);

    fs.writeFileSync(filepath, data.Body);

    // Restore database
    await this.execCommand(
      `gunzip < ${filepath} | psql ${process.env.DB_NAME}`
    );

    console.log('✅ Restore complete');
  }

  execCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }
}

// Schedule daily backups
const backup = new BackupSystem();

// Run at 2 AM daily
const schedule = require('node-schedule');
schedule.scheduleJob('0 2 * * *', () => {
  backup.backupDatabase().catch(console.error);
});

module.exports = BackupSystem;
```

---

## Failover Strategies

### Automatic Failover

```javascript
// services/failover-manager.js
class FailoverManager {
  constructor() {
    this.services = new Map();
    this.healthCheckInterval = 5000;
    this.failureThreshold = 3;
  }

  registerService(name, primary, backup) {
    this.services.set(name, {
      name,
      primary,
      backup,
      currentEndpoint: primary,
      failureCount: 0,
      usingBackup: false
    });

    this.startHealthCheck(name);
  }

  startHealthCheck(name) {
    setInterval(async () => {
      await this.checkService(name);
    }, this.healthCheckInterval);
  }

  async checkService(name) {
    const service = this.services.get(name);

    try {
      const axios = require('axios');
      await axios.get(`${service.currentEndpoint}/health`, {
        timeout: 3000
      });

      // Service is healthy
      service.failureCount = 0;

      // If we were using backup, try to switch back to primary
      if (service.usingBackup) {
        try {
          await axios.get(`${service.primary}/health`, { timeout: 3000 });
          console.log(`✅ ${name}: Switching back to primary`);
          service.currentEndpoint = service.primary;
          service.usingBackup = false;
        } catch (error) {
          // Primary still down, continue using backup
        }
      }
    } catch (error) {
      service.failureCount++;

      console.log(`❌ ${name}: Health check failed (${service.failureCount}/${this.failureThreshold})`);

      // Failover after threshold
      if (service.failureCount >= this.failureThreshold && !service.usingBackup) {
        console.log(`🔄 ${name}: Failing over to backup`);
        service.currentEndpoint = service.backup;
        service.usingBackup = true;
        service.failureCount = 0;

        // Send alert
        await this.sendFailoverAlert(name);
      }
    }
  }

  getEndpoint(name) {
    const service = this.services.get(name);
    return service ? service.currentEndpoint : null;
  }

  async sendFailoverAlert(serviceName) {
    // Send email/SMS alert
    console.log(`🚨 ALERT: ${serviceName} failover activated`);
  }
}

// Usage
const failoverManager = new FailoverManager();

failoverManager.registerService(
  'payment-api',
  'https://payment-primary.example.com',
  'https://payment-backup.example.com'
);

// Use in application
async function processPayment(data) {
  const endpoint = failoverManager.getEndpoint('payment-api');
  const response = await axios.post(`${endpoint}/charge`, data);
  return response.data;
}

module.exports = FailoverManager;
```

---

## Network Redundancy

### Multiple Network Paths

```
┌──────────────────────────────────────────┐
│      Redundant Network Architecture      │
├──────────────────────────────────────────┤
│                                           │
│         Internet                          │
│            │                              │
│    ┌───────┴───────┐                     │
│    │               │                     │
│    ▼               ▼                     │
│ ┌─────┐         ┌─────┐                 │
│ │ISP 1│         │ISP 2│                 │
│ └──┬──┘         └──┬──┘                 │
│    │               │                     │
│    └───────┬───────┘                     │
│            │                              │
│    ┌───────▼────────┐                    │
│    │  Edge Router   │                    │
│    │  (BGP Failover)│                    │
│    └───────┬────────┘                    │
│            │                              │
│         Servers                           │
│                                           │
└──────────────────────────────────────────┘
```

---

## Monitoring for SPOFs

### SPOF Detection Script

```javascript
// monitoring/spof-detector.js
class SPOFDetector {
  async analyze() {
    const report = {
      timestamp: new Date().toISOString(),
      spofs: [],
      warnings: [],
      recommendations: []
    };

    // Check for single application server
    const serverCount = await this.countApplicationServers();
    if (serverCount === 1) {
      report.spofs.push({
        component: 'Application Server',
        severity: 'CRITICAL',
        impact: 'Complete system outage if server fails',
        recommendation: 'Add at least 2 more servers with load balancer'
      });
    }

    // Check for single database
    const dbReplicas = await this.checkDatabaseReplicas();
    if (dbReplicas === 0) {
      report.spofs.push({
        component: 'Database',
        severity: 'CRITICAL',
        impact: 'Data access loss if database fails',
        recommendation: 'Set up database replication'
      });
    }

    // Check for single load balancer
    const lbCount = await this.countLoadBalancers();
    if (lbCount === 1) {
      report.warnings.push({
        component: 'Load Balancer',
        severity: 'HIGH',
        impact: 'Traffic routing failure',
        recommendation: 'Add redundant load balancer with keepalived'
      });
    }

    // Check for single region
    const regions = await this.checkRegions();
    if (regions === 1) {
      report.warnings.push({
        component: 'Region',
        severity: 'MEDIUM',
        impact: 'Regional outage affects entire system',
        recommendation: 'Consider multi-region deployment'
      });
    }

    return report;
  }

  async countApplicationServers() {
    // Implementation depends on your infrastructure
    // This is a placeholder
    return 1;
  }

  async checkDatabaseReplicas() {
    try {
      const result = await pool.query(`
        SELECT count(*) as replicas
        FROM pg_stat_replication
      `);
      return parseInt(result.rows[0].replicas);
    } catch (error) {
      return 0;
    }
  }

  async countLoadBalancers() {
    // Check your infrastructure
    return 1;
  }

  async checkRegions() {
    // Check deployment regions
    return 1;
  }
}

module.exports = SPOFDetector;
```

---

## Key Takeaways

✅ **SPOFs** are components whose failure brings down entire system
✅ **Database replication** eliminates database as SPOF
✅ **Multiple servers** with load balancer eliminates server SPOF
✅ **Redundant load balancers** using keepalived for HA
✅ **Multi-region** deployment protects against regional outages
✅ **Automated backups** enable disaster recovery
✅ **Failover strategies** minimize downtime
✅ **Monitor and alert** on potential SPOFs

---

## Implementation Checklist

- [ ] Identify all SPOFs in current architecture
- [ ] Set up database replication
- [ ] Deploy multiple application servers
- [ ] Configure load balancer
- [ ] Implement redundant load balancers
- [ ] Set up automated backups
- [ ] Test failover scenarios
- [ ] Document recovery procedures
- [ ] Monitor for new SPOFs
- [ ] Plan for multi-region deployment
- [ ] Create disaster recovery plan

---

## Troubleshooting

**Failover not working:**
- Verify health checks are configured
- Check network connectivity between servers
- Review failover thresholds
- Test manually

**Replication lag:**
- Check network bandwidth
- Review database write load
- Consider more powerful replica servers
- Optimize queries

**Backup failures:**
- Verify disk space
- Check permissions
- Review backup logs
- Test restore procedures regularly

---

## What's Next

Chapter 8 covers API Design Fundamentals—creating clean, maintainable APIs.

**[Continue to Chapter 8: API Design Fundamentals →](chapter-08-api-design.md)**

---

**Navigation:**
- [← Back: Chapter 6](chapter-06-health-checks.md)
- [→ Next: Chapter 8](chapter-08-api-design.md)
- [Home](README.md)

---

*Chapter 7 of 15 | AEOWEB System Design Guide*
*Updated November 2025*
