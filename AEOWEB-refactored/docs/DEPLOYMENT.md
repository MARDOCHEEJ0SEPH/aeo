# AEOWEB Deployment Guide

Complete guide for deploying AEOWEB to production.

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Kubernetes cluster (for production)
- PostgreSQL 16
- MongoDB 7
- Redis 7
- Domain name with SSL certificate

## Environment Variables

Create `.env` file in project root:

```bash
# Application
NODE_ENV=production
APP_URL=https://aeoweb.com
API_URL=https://api.aeoweb.com

# Database
DATABASE_URL=postgresql://user:pass@host:5432/aeoweb
MONGODB_URI=mongodb://user:pass@host:27017/aeoweb
REDIS_URL=redis://host:6379

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# AI APIs
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Monitoring
SENTRY_DSN=https://...
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001

# AWS (if using AWS)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=aeoweb-assets
```

---

## Local Development

### 1. Install Dependencies

```bash
# Install all workspace dependencies
npm install

# Or install per service
cd frontend && npm install
cd backend/gateway && npm install
cd backend/graphql && npm install
cd backend/services/aeo && npm install
```

### 2. Start Databases

```bash
docker-compose up -d postgres mongo redis elasticsearch
```

### 3. Run Migrations

```bash
psql $DATABASE_URL < database/init.sql
```

### 4. Start Development Servers

```bash
# Start all services in parallel
npm run dev

# Or start individually
npm run dev:frontend    # Port 3000
npm run dev:gateway     # Port 4000
npm run dev:graphql     # Port 4001
npm run dev:aeo         # Port 4002
```

### 5. Access Applications

- Frontend: http://localhost:3000
- API Gateway: http://localhost:4000
- GraphQL Playground: http://localhost:4001/graphql
- AEO Service: http://localhost:4002

---

## Docker Deployment

### 1. Build Images

```bash
# Build all services
docker-compose build

# Or build specific service
docker build -t aeoweb/frontend:latest ./frontend
docker build -t aeoweb/gateway:latest ./backend/gateway
docker build -t aeoweb/graphql:latest ./backend/graphql
docker build -t aeoweb/aeo-service:latest ./backend/services/aeo
```

### 2. Start Services

```bash
docker-compose up -d
```

### 3. View Logs

```bash
docker-compose logs -f frontend
docker-compose logs -f gateway
```

### 4. Stop Services

```bash
docker-compose down
```

---

## Kubernetes Deployment

### Prerequisites

- Kubernetes 1.28+
- kubectl configured
- Helm 3+ (optional)

### 1. Create Namespace

```bash
kubectl create namespace aeoweb
```

### 2. Create Secrets

```bash
# Database secrets
kubectl create secret generic db-secrets -n aeoweb \
  --from-literal=postgres-password=your-password \
  --from-literal=database-url=postgresql://aeoweb:password@postgres:5432/aeoweb

# API keys
kubectl create secret generic api-keys -n aeoweb \
  --from-literal=openai-key=sk-... \
  --from-literal=anthropic-key=sk-ant-...

# App secrets
kubectl create secret generic app-secrets -n aeoweb \
  --from-literal=jwt-secret=your-jwt-secret
```

### 3. Apply Configurations

```bash
# Apply all manifests
kubectl apply -f infrastructure/kubernetes/

# Or apply individually
kubectl apply -f infrastructure/kubernetes/deployment.yaml
kubectl apply -f infrastructure/kubernetes/services.yaml
kubectl apply -f infrastructure/kubernetes/ingress.yaml
```

### 4. Verify Deployment

```bash
# Check pods
kubectl get pods -n aeoweb

# Check services
kubectl get services -n aeoweb

# Check ingress
kubectl get ingress -n aeoweb

# View logs
kubectl logs -f deployment/frontend -n aeoweb
```

### 5. Scale Services

```bash
# Manual scaling
kubectl scale deployment frontend --replicas=5 -n aeoweb

# Auto-scaling is configured via HorizontalPodAutoscaler
kubectl get hpa -n aeoweb
```

---

## AWS Deployment

### Using EKS (Elastic Kubernetes Service)

#### 1. Create EKS Cluster

```bash
# Install eksctl
brew install eksctl  # macOS
# Or download from https://eksctl.io

# Create cluster
eksctl create cluster \
  --name aeoweb-production \
  --region us-east-1 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 3 \
  --nodes-max 10 \
  --managed
```

#### 2. Configure kubectl

```bash
aws eks update-kubeconfig \
  --region us-east-1 \
  --name aeoweb-production
```

#### 3. Install AWS Load Balancer Controller

```bash
# Install Helm
brew install helm  # macOS

# Add EKS repository
helm repo add eks https://aws.github.io/eks-charts
helm repo update

# Install AWS Load Balancer Controller
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=aeoweb-production
```

#### 4. Deploy Application

```bash
# Follow Kubernetes deployment steps above
kubectl apply -f infrastructure/kubernetes/
```

#### 5. Configure RDS (Optional)

```bash
# Create PostgreSQL RDS instance
aws rds create-db-instance \
  --db-instance-identifier aeoweb-postgres \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 16.1 \
  --master-username aeoweb \
  --master-user-password your-secure-password \
  --allocated-storage 100 \
  --storage-type gp3 \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name your-subnet-group
```

---

## Monitoring Setup

### Prometheus

```bash
# Deploy Prometheus
kubectl apply -f infrastructure/monitoring/prometheus-deployment.yaml

# Access Prometheus UI
kubectl port-forward svc/prometheus 9090:9090 -n aeoweb
# Open http://localhost:9090
```

### Grafana

```bash
# Deploy Grafana
kubectl apply -f infrastructure/monitoring/grafana-deployment.yaml

# Get admin password
kubectl get secret grafana -n aeoweb -o jsonpath="{.data.admin-password}" | base64 --decode

# Access Grafana UI
kubectl port-forward svc/grafana 3001:3000 -n aeoweb
# Open http://localhost:3001
```

### Configure Dashboards

1. Login to Grafana (admin/password)
2. Add Prometheus data source: http://prometheus:9090
3. Import dashboards from `infrastructure/monitoring/grafana/dashboards/`

---

## SSL/TLS Configuration

### Using cert-manager (Kubernetes)

#### 1. Install cert-manager

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

#### 2. Create ClusterIssuer

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@aeoweb.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```

```bash
kubectl apply -f infrastructure/kubernetes/cert-issuer.yaml
```

#### 3. Update Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: aeoweb-ingress
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - aeoweb.com
    - api.aeoweb.com
    secretName: aeoweb-tls
  rules:
  - host: aeoweb.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 80
```

---

## Database Migrations

### Production Migration Strategy

```bash
# 1. Backup database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# 2. Run migrations
psql $DATABASE_URL < database/migrations/001_initial.sql

# 3. Verify
psql $DATABASE_URL -c "SELECT version FROM schema_migrations;"

# 4. If rollback needed
psql $DATABASE_URL < backup-YYYYMMDD.sql
```

### Automated Migrations (CI/CD)

Migrations run automatically in GitHub Actions pipeline:

```yaml
- name: Run migrations
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
  run: |
    psql $DATABASE_URL < database/init.sql
```

---

## Performance Optimization

### 1. Enable CDN

Configure CloudFlare or AWS CloudFront for:
- Static assets
- Edge caching
- DDoS protection

### 2. Database Optimization

```sql
-- Create indexes for common queries
CREATE INDEX CONCURRENTLY idx_content_published ON content(published_at DESC) WHERE status = 'PUBLISHED';
CREATE INDEX CONCURRENTLY idx_citations_platform_date ON citations(platform, created_at DESC);

-- Analyze tables
ANALYZE content;
ANALYZE citations;
ANALYZE aeo_scores;
```

### 3. Redis Caching

```typescript
// Cache AEO scores
await redis.setex(
  `aeo:score:${contentId}:${platform}`,
  3600, // 1 hour
  JSON.stringify(score)
);
```

### 4. Connection Pooling

```typescript
// PostgreSQL pool configuration
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

## Backup Strategy

### Database Backups

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup
pg_dump $DATABASE_URL | gzip > $BACKUP_DIR/aeoweb_$DATE.sql.gz

# Upload to S3
aws s3 cp $BACKUP_DIR/aeoweb_$DATE.sql.gz s3://aeoweb-backups/

# Keep only last 7 days locally
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
```

### Kubernetes Backups

```bash
# Backup Kubernetes resources
kubectl get all -n aeoweb -o yaml > k8s-backup-$(date +%Y%m%d).yaml

# Backup secrets
kubectl get secrets -n aeoweb -o yaml > secrets-backup-$(date +%Y%m%d).yaml
```

---

## Troubleshooting

### Pod Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n aeoweb

# Check logs
kubectl logs <pod-name> -n aeoweb

# Get events
kubectl get events -n aeoweb --sort-by=.metadata.creationTimestamp
```

### Database Connection Issues

```bash
# Test connection from pod
kubectl exec -it <pod-name> -n aeoweb -- sh
psql $DATABASE_URL -c "SELECT 1"
```

### High Memory Usage

```bash
# Check pod resource usage
kubectl top pods -n aeoweb

# Increase memory limits
kubectl set resources deployment frontend -n aeoweb --limits=memory=1Gi
```

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Configure JWT secret
- [ ] Enable HTTPS/TLS
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Set up security headers (Helmet)
- [ ] Enable database encryption
- [ ] Set up secrets management (Vault/AWS Secrets Manager)
- [ ] Configure audit logging
- [ ] Set up intrusion detection
- [ ] Regular security updates
- [ ] Vulnerability scanning

---

## Post-Deployment

### 1. Health Checks

```bash
# Check all services
curl https://api.aeoweb.com/health
curl https://aeoweb.com/

# Check metrics
curl https://api.aeoweb.com/metrics
```

### 2. Load Testing

```bash
# Install k6
brew install k6  # macOS

# Run load test
k6 run tests/performance/load-test.js
```

### 3. Monitoring

- Set up alerts in Grafana
- Configure Sentry for error tracking
- Enable uptime monitoring (UptimeRobot, Pingdom)

---

## Estimated Costs

### AWS (Monthly)

- EKS Control Plane: $73
- EC2 Instances (3x t3.medium): $100
- RDS PostgreSQL (db.t3.medium): $150
- ElastiCache Redis: $50
- Load Balancer: $25
- S3 Storage: $10
- CloudWatch: $30
- Data Transfer: $50

**Total: ~$488/month**

### Optimization Tips

- Use Spot Instances for dev/staging (50-90% savings)
- Use Reserved Instances for production (up to 72% savings)
- Enable auto-scaling to match demand
- Use S3 lifecycle policies for old backups

---

## Support

- Documentation: https://docs.aeoweb.com
- GitHub Issues: https://github.com/aeoweb/issues
- Discord Community: https://discord.gg/aeoweb
- Email: support@aeoweb.com

---

## Rollback Procedure

```bash
# Rollback Kubernetes deployment
kubectl rollout undo deployment/frontend -n aeoweb

# Rollback to specific revision
kubectl rollout history deployment/frontend -n aeoweb
kubectl rollout undo deployment/frontend --to-revision=2 -n aeoweb

# Verify rollback
kubectl rollout status deployment/frontend -n aeoweb
```
