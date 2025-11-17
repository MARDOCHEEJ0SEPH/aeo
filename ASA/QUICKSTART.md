# 🚀 ASA Quick Start Guide

Get your full-stack Rust AEO platform running in under 15 minutes!

---

## Prerequisites

- ✅ **Rust 1.75+** - `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- ✅ **Docker & Docker Compose** - For infrastructure
- ✅ **wasm-pack** - `cargo install wasm-pack`
- ✅ **trunk** - `cargo install --locked trunk`
- ✅ **8GB+ RAM** available
- ✅ **20GB+ disk space**

---

## Step 1: Clone & Setup

```bash
# Navigate to ASA directory
cd ASA

# Copy environment template
cp .env.example .env

# Edit .env and add your API keys (optional for basic testing)
nano .env
```

---

## Step 2: Start Infrastructure

```bash
# Start all infrastructure services
docker-compose up -d postgres redis meilisearch

# Wait for services to be healthy (30-60 seconds)
docker-compose ps

# Expected output: All services showing "healthy" status
```

---

## Step 3: Run Database Migrations

```bash
# Create database schema
cd tools/migrations
cargo run --release

# Verify tables created
docker-compose exec postgres psql -U asa_user -d asa -c "\dt"
```

---

## Step 4: Start Backend Gateway

```bash
# Navigate to gateway
cd backend/gateway

# Run in development mode
cargo run

# Or with auto-reload
cargo watch -x run

# Expected output:
# 🚀 Starting ASA API Gateway
# ✅ ASA Gateway ready on 0.0.0.0:3000
```

---

## Step 5: Test the API

```bash
# Health check
curl http://localhost:3000/health

# Expected response:
# {
#   "status": "healthy",
#   "version": "0.1.0",
#   "environment": "development"
# }

# Root endpoint
curl http://localhost:3000/

# AEO score endpoint
curl http://localhost:3000/api/v1/aeo/score
```

---

## Step 6: Build Frontend (Optional)

```bash
# Navigate to frontend
cd frontend/app

# Build WASM bundle
trunk build --release

# Serve with trunk
trunk serve --open

# Access at http://localhost:8080
```

---

## Access Points

Once everything is running:

| Service | URL | Purpose |
|---------|-----|---------|
| API Gateway | http://localhost:3000 | Main API |
| Health Check | http://localhost:3000/health | System status |
| Frontend | http://localhost:8080 | Web UI |
| Prometheus | http://localhost:9090 | Metrics |
| Grafana | http://localhost:3001 | Dashboards |
| Jaeger | http://localhost:16686 | Tracing |
| MeiliSearch | http://localhost:7700 | Search UI |

**Default Grafana credentials**: admin / admin

---

## Quick Test Suite

### Test API Endpoints

```bash
# Content API
curl -X POST http://localhost:3000/api/v1/content \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Article", "body": "Content here"}'

# AEO Optimization
curl -X POST http://localhost:3000/api/v1/aeo/optimize \
  -H "Content-Type: application/json" \
  -d '{"content_id": "123", "platforms": ["chatgpt", "claude"]}'

# Analytics
curl http://localhost:3000/api/v1/analytics/metrics
```

### Test Database Connectivity

```bash
# PostgreSQL
docker-compose exec postgres psql -U asa_user -d asa -c "SELECT version();"

# Redis
docker-compose exec redis redis-cli ping
# Expected: PONG

# MeiliSearch
curl http://localhost:7700/health
```

---

## Development Workflow

### Run All Tests

```bash
# Unit tests
cargo test --workspace

# Integration tests
cargo test --test integration

# With coverage
cargo tarpaulin --workspace
```

### Code Quality

```bash
# Format code
cargo fmt --all

# Lint code
cargo clippy --workspace -- -D warnings

# Check compilation
cargo check --workspace
```

### Watch Mode

```bash
# Auto-reload on file changes
cargo watch -x "run --bin gateway"

# With tests
cargo watch -x test
```

---

## Common Issues & Solutions

### Issue: Port already in use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=3001
```

### Issue: Database connection failed

```bash
# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres

# Verify connection
docker-compose exec postgres pg_isready -U asa_user
```

### Issue: Rust compilation errors

```bash
# Update Rust toolchain
rustup update

# Clean build cache
cargo clean

# Rebuild
cargo build --release
```

### Issue: WASM build fails

```bash
# Ensure wasm-pack is installed
cargo install wasm-pack --force

# Add wasm target
rustup target add wasm32-unknown-unknown

# Rebuild
cd frontend/app
trunk build
```

---

## Stopping the System

### Graceful Shutdown

```bash
# Stop Docker services
docker-compose down

# Stop and remove volumes (WARNING: Deletes data!)
docker-compose down -v
```

### Stop Rust Services

```bash
# Ctrl+C in terminal running cargo
# Or find and kill process
pkill -f "cargo run"
```

---

## Next Steps

### 1. **Explore the Architecture**
- Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Review [docs/AEO_INTEGRATION.md](docs/AEO_INTEGRATION.md)

### 2. **Configure AEO**
- Add OpenAI/Anthropic API keys in `.env`
- Configure target platforms
- Set optimization levels

### 3. **Customize Content**
- Modify content schemas in `shared/models/src/aeo/schema.rs`
- Add custom optimization rules
- Configure platform strategies

### 4. **Deploy to Production**
- See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- Configure Kubernetes
- Set up CI/CD

### 5. **Monitor Performance**
- Access Grafana dashboards
- Check Jaeger traces
- Review Prometheus metrics

---

## Architecture Quick Reference

### Request Flow

```
Browser → NGINX → API Gateway → Microservice → Database
                     │
                     └→ Redis (Cache)
                     └→ MeiliSearch (Search)
```

### AEO Optimization Flow

```
Content Creation → AEO Analysis → Platform Optimization → Schema Generation → Citation Tracking
```

### Data Flow

```
PostgreSQL (Primary) ← Write
    │
    ├→ Redis (Cache) ← Read
    ├→ ScyllaDB (Time-series)
    └→ MeiliSearch (Search Index)
```

---

## Performance Expectations

After successful startup, you should have:

| Metric | Expected Value |
|--------|---------------|
| API Response Time (P99) | <50ms |
| WASM Bundle Size | <200KB (gzipped) |
| Memory Usage (Gateway) | ~50MB |
| Database Connections | 10-20 |
| Throughput | 10K+ RPS |

---

## Getting Help

### Check Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f postgres

# Gateway logs
tail -f backend/gateway/logs/*.log
```

### Verify Installation

```bash
# Run diagnostic script
./tools/scripts/diagnose.sh

# Check all dependencies
cargo --version
docker --version
docker-compose --version
rustc --version
```

### Resources

- 📖 **Documentation**: [docs/](docs/)
- 🐛 **Issues**: GitHub Issues
- 💬 **Discussions**: GitHub Discussions
- 📧 **Email**: support@asa-platform.dev

---

## Success Indicators

You'll know everything is working when:

1. ✅ **All containers show "healthy"** in `docker-compose ps`
2. ✅ **Gateway starts without errors**
3. ✅ **Health endpoint returns 200 OK**
4. ✅ **Can create and fetch content via API**
5. ✅ **Frontend loads in browser**
6. ✅ **Metrics visible in Grafana**
7. ✅ **No errors in logs**

---

## Development Tips

### Hot Reload

```bash
# Backend with cargo-watch
cargo install cargo-watch
cargo watch -x "run --bin gateway"

# Frontend with trunk
cd frontend/app
trunk serve
# Auto-reloads on file changes
```

### Database Management

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U asa_user -d asa

# Run SQL file
docker-compose exec -T postgres psql -U asa_user -d asa < schema.sql

# Backup database
docker-compose exec postgres pg_dump -U asa_user asa > backup.sql
```

### Redis Operations

```bash
# Connect to Redis CLI
docker-compose exec redis redis-cli

# Common commands
# KEYS * - List all keys
# GET key - Get value
# FLUSHALL - Clear all data
```

---

## Ready to Go!

Your ASA platform is now running! 🎉

**Key URLs to bookmark:**
- 🏠 Frontend: http://localhost:8080
- 🔌 API: http://localhost:3000
- 📊 Grafana: http://localhost:3001
- 🔍 Jaeger: http://localhost:16686

**Next:** Read the [Architecture Guide](docs/ARCHITECTURE.md) to understand how everything works together.

---

**Built with 🦀 Rust • Optimized for 🤖 AI Search**
