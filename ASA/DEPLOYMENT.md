# ASA Platform - Deployment Guide

Complete deployment guide for the ASA (Answer Engine Optimization) platform.

## Table of Contents

1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [Kubernetes Deployment](#kubernetes-deployment)
4. [AWS Production Deployment](#aws-production-deployment)
5. [Monitoring Setup](#monitoring-setup)
6. [Troubleshooting](#troubleshooting)

---

## Local Development

### Prerequisites

- Rust 1.75+
- Docker & Docker Compose
- PostgreSQL 16
- Redis 7
- Node.js 18+ (for Trunk)

### Setup

1. **Clone and setup environment**:
```bash
git clone https://github.com/MARDOCHEEJ0SEPH/aeo
cd aeo/ASA
cp .env.example .env
```

2. **Edit `.env` with your configuration**:
```bash
# Required: Add your API keys
OPENAI_API_KEY=sk-your-key
ANTHROPIC_API_KEY=sk-ant-your-key

# Required: Change JWT secret
JWT_SECRET=your-super-secret-key-change-this
```

3. **Start infrastructure**:
```bash
docker-compose up -d postgres redis meilisearch scylla
```

4. **Run database migrations**:
```bash
cd tools/migrations
cargo run
```

5. **Start services** (in separate terminals):
```bash
# Terminal 1: Auth Service
cd backend/services/auth
cargo run

# Terminal 2: Content Service
cd backend/services/content
cargo run

# Terminal 3: Analytics Service
cd backend/services/analytics
cargo run

# Terminal 4: Search Service
cd backend/services/search
cargo run

# Terminal 5: Gateway
cd backend/gateway
cargo run

# Terminal 6: Frontend
cd frontend/app
trunk serve
```

6. **Access the platform**:
- Frontend: http://localhost:3000
- API Gateway: http://localhost:8080
- API Docs: http://localhost:8080/docs

---

## Docker Deployment

### Quick Start

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build
```

### Service URLs

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Jaeger**: http://localhost:16686
- **MeiliSearch**: http://localhost:7700

### Health Checks

```bash
# Check all services
curl http://localhost:8080/health

# Check specific services
curl http://localhost:8081/health  # Auth
curl http://localhost:8082/health  # Content
curl http://localhost:8083/health  # Analytics
curl http://localhost:8084/health  # Search
```

---

## Kubernetes Deployment

### Prerequisites

- kubectl configured
- Kubernetes cluster (1.28+)
- Helm 3+ (optional)

### Deploy to Kubernetes

1. **Create namespace and secrets**:
```bash
kubectl apply -f infrastructure/kubernetes/namespace.yaml

# Edit secrets file with your values
vi infrastructure/kubernetes/secrets.yaml

kubectl apply -f infrastructure/kubernetes/secrets.yaml
kubectl apply -f infrastructure/kubernetes/configmap.yaml
```

2. **Deploy databases**:
```bash
kubectl apply -f infrastructure/kubernetes/postgres.yaml
kubectl apply -f infrastructure/kubernetes/redis.yaml
```

3. **Wait for databases to be ready**:
```bash
kubectl wait --for=condition=ready pod -l app=postgres -n asa --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n asa --timeout=300s
```

4. **Run migrations**:
```bash
kubectl run migrations --rm -it --restart=Never \
  --image=asa/migrations:latest \
  --namespace=asa \
  --env="DATABASE_URL=postgresql://asa:password@postgres:5432/asa"
```

5. **Deploy services**:
```bash
kubectl apply -f infrastructure/kubernetes/auth-service.yaml
kubectl apply -f infrastructure/kubernetes/content-service.yaml
kubectl apply -f infrastructure/kubernetes/analytics-service.yaml
kubectl apply -f infrastructure/kubernetes/search-service.yaml
kubectl apply -f infrastructure/kubernetes/gateway.yaml
```

6. **Verify deployment**:
```bash
kubectl get pods -n asa
kubectl get services -n asa

# Check logs
kubectl logs -f deployment/gateway -n asa
```

7. **Access the platform**:
```bash
# Get load balancer IP
kubectl get service gateway -n asa

# Port forward for local access
kubectl port-forward service/gateway 8080:80 -n asa
```

### Scaling

```bash
# Scale a service
kubectl scale deployment content-service --replicas=5 -n asa

# Autoscaling
kubectl autoscale deployment content-service \
  --cpu-percent=70 \
  --min=3 \
  --max=10 \
  -n asa
```

---

## AWS Production Deployment

### Prerequisites

- AWS CLI configured
- Terraform 1.0+
- kubectl

### Deploy with Terraform

1. **Initialize Terraform**:
```bash
cd infrastructure/terraform
terraform init
```

2. **Create terraform.tfvars**:
```hcl
aws_region   = "us-east-1"
environment  = "production"
cluster_name = "asa-production"
db_password  = "your-secure-password"
```

3. **Plan deployment**:
```bash
terraform plan
```

4. **Apply infrastructure**:
```bash
terraform apply
```

5. **Configure kubectl**:
```bash
aws eks update-kubeconfig --region us-east-1 --name asa-production
```

6. **Deploy application** (follow K8s steps above)

### Infrastructure Created

- **EKS Cluster**: 3+ nodes (t3.large + c6i.2xlarge spot)
- **RDS PostgreSQL**: Multi-AZ, 100GB storage, automatic backups
- **ElastiCache Redis**: cache.t3.medium
- **VPC**: 3 AZs, public + private subnets
- **Security Groups**: Properly configured
- **Auto-scaling**: Enabled for compute nodes

### Cost Estimation

Approximate monthly cost:
- EKS Control Plane: $73
- EC2 Instances: $150-300
- RDS PostgreSQL: $200-400
- ElastiCache Redis: $50
- **Total**: ~$473-823/month

---

## Monitoring Setup

### Prometheus

Prometheus automatically scrapes metrics from all services.

Access: http://localhost:9090

**Useful queries**:
```promql
# Request rate
rate(http_requests_total[5m])

# Error rate
rate(http_requests_total{status=~"5.."}[5m])

# P95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Database connections
pg_stat_database_numbackends
```

### Grafana

Access: http://localhost:3001 (admin/admin)

Pre-configured dashboards:
1. **ASA Platform Overview**: System metrics, request rates, errors
2. **AEO Performance Metrics**: Citations, scores, AI generation

Import additional dashboards:
```bash
# Via UI: Configuration -> Dashboards -> Import
# Dashboard IDs:
# - 1860 (Node Exporter Full)
# - 9628 (PostgreSQL Database)
# - 11835 (Redis Dashboard)
```

### Jaeger (Distributed Tracing)

Access: http://localhost:16686

Search for traces by:
- Service name
- Operation
- Tags
- Duration

### Alerts

Prometheus alerts are configured in `infrastructure/monitoring/prometheus/rules/alerts.yml`

Critical alerts:
- Service Down
- High Error Rate (>5%)
- High Latency (>1s p95)
- Database/Redis Down
- High CPU/Memory Usage
- Low Disk Space

---

## Troubleshooting

### Common Issues

**1. Services won't start**
```bash
# Check logs
docker-compose logs service-name

# In Kubernetes
kubectl logs -f deployment/service-name -n asa

# Common fixes:
# - Verify DATABASE_URL is correct
# - Check if database is ready
# - Verify environment variables are set
```

**2. Database connection errors**
```bash
# Test database connectivity
docker-compose exec postgres psql -U asa -d asa

# Check migrations
cd tools/migrations && cargo run -- status

# Re-run migrations
cargo run -- up
```

**3. High memory usage**
```bash
# Check resource usage
kubectl top pods -n asa

# Adjust resource limits in K8s manifests
# See: infrastructure/kubernetes/*-service.yaml
```

**4. Slow responses**
```bash
# Check Prometheus metrics
# Look for high latency in http_request_duration_seconds

# Check database performance
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;

# Check Redis
redis-cli INFO stats
```

**5. Build failures**
```bash
# Clear cargo cache
cargo clean

# Update dependencies
cargo update

# Check Rust version
rustc --version  # Should be 1.75+
```

### Getting Help

1. Check logs first (most issues are environment-related)
2. Review this documentation
3. Check GitHub issues
4. Verify all prerequisites are installed
5. Ensure correct environment variables are set

### Performance Tuning

**Database**:
```sql
-- Increase connection pool
ALTER SYSTEM SET max_connections = 200;

-- Tune work memory
ALTER SYSTEM SET work_mem = '64MB';

-- Enable parallel queries
ALTER SYSTEM SET max_parallel_workers_per_gather = 4;
```

**Redis**:
```bash
# Increase max memory
redis-cli CONFIG SET maxmemory 4gb

# Set eviction policy
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

**Services**:
- Adjust replica counts based on load
- Enable horizontal pod autoscaling
- Use connection pooling
- Implement caching strategies

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Generate new JWT secret
- [ ] Enable HTTPS/TLS
- [ ] Configure firewall rules
- [ ] Enable database encryption
- [ ] Rotate credentials regularly
- [ ] Enable audit logging
- [ ] Set up backup strategy
- [ ] Configure rate limiting
- [ ] Review security groups

---

## Maintenance

### Backups

**Database**:
```bash
# Backup
pg_dump -U asa -h localhost asa > backup.sql

# Restore
psql -U asa -h localhost asa < backup.sql
```

**Kubernetes**:
```bash
# Backup all resources
kubectl get all -n asa -o yaml > backup.yaml
```

### Updates

```bash
# Update services
docker-compose pull
docker-compose up -d

# In Kubernetes
kubectl set image deployment/service-name \
  service-name=asa/service-name:new-tag \
  -n asa

# Rollback if needed
kubectl rollout undo deployment/service-name -n asa
```

---

For more information, see the [README.md](README.md) and [Architecture Documentation](docs/ARCHITECTURE.md).
