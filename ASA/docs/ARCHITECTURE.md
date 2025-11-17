# ASA Platform - Architecture Documentation

## System Overview

ASA (Answer Engine Optimization) is a production-ready, cloud-native platform built with Rust that optimizes content for AI-powered search engines including ChatGPT, Claude, Perplexity, Google Gemini, and Bing Chat.

### Design Principles

1. **Microservices Architecture**: Independently deployable, scalable services
2. **Event-Driven**: Asynchronous communication with real-time updates
3. **Cloud-Native**: Kubernetes-ready with infrastructure as code
4. **Observable**: Built-in monitoring, tracing, and metrics
5. **Type-Safe**: 100% Rust with compile-time guarantees
6. **AEO-First**: Every component optimized for AI platforms

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Browser    │  │  Mobile App  │  │  AI Platforms│      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────┐
│                      Load Balancer (NGINX)                   │
└────────────────────────────┼────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────┐
│                     API Gateway (8080)                       │
│  • Authentication Middleware                                 │
│  • Rate Limiting                                            │
│  • Request Routing                                          │
│  • WebSocket Support                                        │
└─────┬──────┬──────┬────────┬──────────────────────────────┘
      │      │      │        │
┌─────┴──┐ ┌─┴────┐ ┌┴──────┐ ┌┴─────────┐
│  Auth  │ │Content│ │Analytics│ │ Search   │
│ (8081) │ │(8082) │ │ (8083)  │ │ (8084)   │
└────────┘ └───────┘ └─────────┘ └──────────┘
     │         │          │            │
     └─────────┴──────────┴────────────┘
                      │
┌─────────────────────┼──────────────────────────────────────┐
│                 Data Layer                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
│  │PostgreSQL│  │  Redis   │  │ ScyllaDB │  │MeiliSearch│ │
│  │ (Primary)│  │  (Cache) │  │(TimeSerie│  │  (Search) │ │
│  └──────────┘  └──────────┘  └──────────┘  └───────────┘ │
└───────────────────────────────────────────────────────────┘
                      │
┌─────────────────────┼──────────────────────────────────────┐
│             Observability Layer                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │Prometheus│  │  Grafana │  │  Jaeger  │                 │
│  │ (Metrics)│  │(Dashboard│  │ (Tracing)│                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
└───────────────────────────────────────────────────────────┘
```

---

## Service Details

### 1. API Gateway (Port 8080)

**Technology**: Rust + Axum + Tower

**Responsibilities**:
- HTTP request routing to backend services
- Authentication middleware (JWT verification)
- Rate limiting (100 req/s general, 10 req/s auth)
- CORS handling
- WebSocket connection management
- Request/response transformation

**Key Components**:
```rust
// Middleware stack
AuthLayer -> RateLimitLayer -> CorsLayer -> TraceLayer

// Routing
/api/auth/*      -> Auth Service
/api/content/*   -> Content Service
/api/analytics/* -> Analytics Service
/api/search/*    -> Search Service
/ws              -> WebSocket Handler
```

**Endpoints**:
- `GET /health`: Health check
- `GET /`: API documentation
- `GET /ws`: WebSocket connection for real-time updates
- `/*`: Proxied to backend services

---

### 2. Auth Service (Port 8081)

**Technology**: Rust + Axum + SQLx + Argon2 + JWT

**Responsibilities**:
- User registration and authentication
- JWT token generation (access + refresh)
- OAuth integration (Google, GitHub)
- WebAuthn passwordless authentication
- Session management

**Database Schema**:
```sql
users (id, email, username, password_hash, role, created_at)
sessions (id, user_id, token, expires_at, created_at)
oauth_connections (id, user_id, provider, provider_user_id)
webauthn_credentials (id, user_id, credential_id, public_key)
```

**Endpoints**:
- `POST /register`: Create new user
- `POST /login`: Authenticate user
- `POST /refresh`: Refresh access token
- `GET /verify`: Verify JWT token
- `POST /logout`: Invalidate session
- `GET /oauth/{provider}/authorize`: OAuth flow start
- `GET /oauth/{provider}/callback`: OAuth callback

**Security**:
- Argon2 password hashing (PHC string format)
- JWT with RS256 algorithm
- Refresh token rotation
- Rate limiting on auth endpoints
- HTTPS only (production)

---

### 3. Content Service (Port 8082)

**Technology**: Rust + Axum + SQLx + OpenAI + Anthropic

**Responsibilities**:
- Content CRUD operations
- AI content generation (GPT-4, Claude)
- AEO optimization engine
- Schema.org markup generation
- Publishing workflow
- Content versioning

**AEO Optimizer**:
```rust
pub struct AEOOptimizer {
    // Platform-specific scoring
    ChatGPT:    structure + examples + clarity
    Claude:     depth + context + nuance
    Perplexity: citations + sources + data
    Gemini:     multimedia + local + conversational
    Bing:       concise + authoritative + fresh
}

// Scoring algorithm
fn calculate_score(&self, content: &str, platform: &AIPlatform) -> f64 {
    structure_score    (30 points) +
    quality_score      (25 points) +
    platform_specific  (25 points) +
    readability_score  (20 points)
}
```

**Database Schema**:
```sql
content (id, title, slug, body, content_type, status, author_id, metadata)
content_versions (id, content_id, version, body, created_at)
content_optimizations (id, content_id, platform, before_score, after_score)
```

**Endpoints**:
- `POST /content`: Create content
- `GET /content`: List content
- `GET /content/:id`: Get content
- `PUT /content/:id`: Update content
- `DELETE /content/:id`: Delete content
- `POST /generate`: AI generate content
- `POST /optimize/:id`: Optimize for AEO
- `GET /schema/:id`: Get schema.org markup
- `POST /publish/:id`: Publish content

---

### 4. Analytics Service (Port 8083)

**Technology**: Rust + Axum + PostgreSQL + ScyllaDB + Redis

**Responsibilities**:
- Event tracking (page views, clicks, etc.)
- AEO citation tracking across platforms
- Real-time metrics aggregation
- Performance analytics
- User behavior analysis

**Real-Time Aggregator**:
```rust
pub struct EventAggregator {
    event_counts: DashMap<String, AtomicI64>,
    user_sessions: DashMap<String, i64>,
}

// Aggregation loop (every 60 seconds)
async fn run_aggregation_loop(&self) {
    - Collect event counts
    - Calculate active users
    - Store in ScyllaDB (time-series)
    - Update Redis (real-time queries)
    - Clean up old sessions
}
```

**Data Storage**:
- **PostgreSQL**: Events, citations, aggregated data
- **ScyllaDB**: Time-series metrics (high write throughput)
- **Redis**: Real-time counters and caching

**Database Schema**:
```sql
analytics_events (id, event_type, user_id, properties, created_at)
  PARTITION BY RANGE (created_at)

citations (id, platform, content_id, query, cited, position, created_at)

metrics_rollups (metric_name, time_bucket, value, count)
```

**Endpoints**:
- `POST /track`: Track event
- `POST /track/batch`: Batch track events
- `POST /citations/track`: Track citation
- `GET /citations/:content_id`: Get citation stats
- `GET /aeo/performance/:content_id`: AEO metrics
- `GET /metrics/real-time`: Real-time metrics
- `GET /dashboard/overview`: Dashboard data

---

### 5. Search Service (Port 8084)

**Technology**: Rust + Axum + MeiliSearch

**Responsibilities**:
- Full-text search
- AEO-optimized search
- Autocomplete suggestions
- Content indexing
- Search analytics

**MeiliSearch Configuration**:
```rust
// Searchable attributes
["title", "searchable_text", "body"]

// Filterable attributes
["content_type", "status", "author_id", "published_at"]

// Ranking rules
["words", "typo", "proximity", "attribute", "sort", "exactness"]
```

**AEO Search Features**:
- Direct answer generation
- Featured content selection
- Platform-specific relevance scoring
- Suggested questions
- Related results

**Endpoints**:
- `POST /search`: Standard search
- `POST /search/aeo`: AEO-optimized search
- `POST /suggest`: Autocomplete
- `POST /index/:id`: Index content
- `POST /index/batch`: Batch index
- `POST /reindex`: Reindex all
- `GET /analytics/top-queries`: Top searches

---

## Data Flow

### Content Creation Flow
```
1. User creates content (Frontend)
   ↓
2. Gateway authenticates request
   ↓
3. Content Service validates and stores
   ↓
4. Search Service indexes content
   ↓
5. Analytics Service tracks event
   ↓
6. Response returned to user
```

### AEO Optimization Flow
```
1. User requests optimization
   ↓
2. Content Service retrieves content
   ↓
3. AEO Optimizer analyzes for target platform
   ↓
4. Generates score and improvements
   ↓
5. Stores optimization metadata
   ↓
6. Returns optimized version
```

### Citation Tracking Flow
```
1. AI platform queries content
   ↓
2. Analytics Service records query
   ↓
3. If cited: record citation with position
   ↓
4. Update real-time aggregates
   ↓
5. Calculate platform performance metrics
```

---

## Technology Stack

### Backend

**Language**: Rust 1.75+
- **Why**: Memory safety, performance, concurrency, type safety

**Web Framework**: Axum 0.7
- Async/await with Tokio
- Type-safe extractors
- Tower middleware
- WebSocket support

**Database**:
- **PostgreSQL 16**: Primary database (ACID, relations)
- **Redis 7**: Cache and sessions
- **ScyllaDB**: Time-series data (analytics)
- **MeiliSearch**: Full-text search

### Frontend

**Framework**: Leptos 0.5
- Rust WebAssembly
- Reactive signals
- Server-side rendering capable
- Zero-cost abstractions

### Infrastructure

**Containerization**: Docker + Docker Compose
**Orchestration**: Kubernetes 1.28
**IaC**: Terraform
**Load Balancer**: NGINX
**Monitoring**: Prometheus + Grafana
**Tracing**: Jaeger
**CI/CD**: GitHub Actions

---

## Deployment Architectures

### Development (Docker Compose)
```
Single machine, all services as containers
- Easy setup
- Fast iteration
- Limited scalability
Cost: Free (local)
```

### Staging (Kubernetes on AWS)
```
EKS cluster with 3-5 nodes
- Auto-scaling
- High availability
- Production-like
Cost: ~$200-300/month
```

### Production (Multi-Region AWS)
```
Multi-AZ EKS clusters
- Global load balancing
- Disaster recovery
- Maximum reliability
Cost: ~$1000+/month
```

---

## Security

### Authentication & Authorization
- JWT tokens (access + refresh)
- Argon2 password hashing
- OAuth 2.0 (Google, GitHub)
- WebAuthn (passwordless)
- Role-based access control (RBAC)

### Data Protection
- TLS 1.3 for all traffic
- Database encryption at rest
- Secrets managed via Kubernetes secrets/AWS Secrets Manager
- Regular security audits (cargo-audit)

### Network Security
- VPC isolation
- Security groups
- Network policies
- Rate limiting
- DDoS protection (Cloudflare)

---

## Scalability

### Horizontal Scaling
All services are stateless and can scale independently:
```bash
kubectl scale deployment content-service --replicas=10 -n asa
```

### Auto-Scaling
Based on CPU/memory usage:
```bash
kubectl autoscale deployment content-service \
  --cpu-percent=70 --min=3 --max=20 -n asa
```

### Database Scaling
- **PostgreSQL**: Read replicas, connection pooling
- **Redis**: Redis Cluster or Sentinel
- **ScyllaDB**: Automatically scales horizontally
- **MeiliSearch**: Can run in cluster mode

### Performance Targets
- **Latency**: p95 < 100ms, p99 < 200ms
- **Throughput**: 10,000+ req/s
- **Availability**: 99.9% uptime
- **Scalability**: 100M+ documents indexed

---

## Monitoring & Observability

### Metrics (Prometheus)
```promql
# Request rate
rate(http_requests_total[5m])

# Error rate
rate(http_requests_total{status=~"5.."}[5m]) /
rate(http_requests_total[5m])

# Latency (p95)
histogram_quantile(0.95,
  rate(http_request_duration_seconds_bucket[5m]))

# AEO Citations
rate(aeo_citations_total[1h])
```

### Dashboards (Grafana)
1. **Platform Overview**: Services, requests, errors, latency
2. **AEO Metrics**: Citations, scores, platform performance
3. **Database**: Connections, queries, slow queries
4. **Infrastructure**: CPU, memory, disk, network

### Tracing (Jaeger)
- Distributed tracing across all services
- Request flow visualization
- Performance bottleneck identification
- Error root cause analysis

### Logging
- Structured JSON logs
- Centralized via ELK stack or CloudWatch
- Trace ID correlation
- Log levels: DEBUG, INFO, WARN, ERROR

---

## Disaster Recovery

### Backup Strategy
- **PostgreSQL**: Daily full backups, 7-day retention
- **Redis**: AOF persistence + RDB snapshots
- **Kubernetes**: GitOps with version control

### Recovery Time Objectives
- **RTO** (Recovery Time): < 1 hour
- **RPO** (Recovery Point): < 5 minutes

### High Availability
- Multi-AZ database deployment
- 3+ replicas per service
- Health checks and auto-restart
- Graceful degradation

---

## Cost Optimization

### AWS Production Estimate
```
EKS Control Plane:       $73/month
EC2 Instances (3x):      $150-300/month
RDS PostgreSQL:          $200-400/month
ElastiCache Redis:       $50/month
Load Balancer:           $25/month
S3 Storage:              $10/month
CloudWatch:              $30/month
Data Transfer:           $50/month

Total: ~$588-938/month
```

### Optimization Strategies
1. Use Spot instances for non-critical workloads
2. Right-size instances based on metrics
3. Enable auto-scaling to reduce waste
4. Use S3 lifecycle policies
5. Implement caching aggressively
6. Optimize database queries

---

## Future Enhancements

### Planned Features
- [ ] GraphQL API
- [ ] Real-time collaboration
- [ ] Multi-tenant support
- [ ] Content recommendation engine
- [ ] A/B testing framework
- [ ] Advanced AEO scoring ML models
- [ ] Mobile apps (iOS/Android)
- [ ] Plugin ecosystem

### Technical Debt
- [ ] Increase test coverage to 90%+
- [ ] Implement circuit breakers
- [ ] Add canary deployments
- [ ] Implement blue-green deployments
- [ ] Add chaos engineering tests

---

For deployment instructions, see [DEPLOYMENT.md](../DEPLOYMENT.md).
For API documentation, see [API.md](API.md).
