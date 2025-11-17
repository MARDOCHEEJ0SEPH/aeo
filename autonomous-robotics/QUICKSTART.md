# 🚀 Quick Start Guide - Autonomous Robotics Website

Get your self-evolving robotics platform running in under 10 minutes!

---

## Prerequisites

Before you begin, ensure you have:

- ✅ **Docker** installed (v20.10+)
- ✅ **Docker Compose** installed (v2.0+)
- ✅ **OpenAI API Key** ([Get one here](https://platform.openai.com/api-keys))
- ✅ **8GB+ RAM** available
- ✅ **20GB+ disk space** free
- ✅ **Optional**: Anthropic API Key for Claude integration

---

## Step 1: Clone & Setup

```bash
# Navigate to the autonomous-robotics directory
cd autonomous-robotics

# Copy environment template
cp .env.example .env
```

---

## Step 2: Configure API Keys

Edit `.env` file and add your API keys:

```env
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here  # Optional but recommended
```

**Important**: Replace `your-openai-key-here` with your actual OpenAI API key!

---

## Step 3: Launch the System

```bash
# Start all services
docker-compose up -d

# This will:
# - Build all microservices
# - Start PostgreSQL, Redis, Elasticsearch
# - Initialize the Neural Core
# - Begin autonomous evolution cycles
```

**First-time startup takes 5-10 minutes** as the system:
1. Builds Docker images
2. Initializes databases
3. Trains neural networks
4. Loads learning data
5. Starts evolution cycles

---

## Step 4: Verify System Health

```bash
# Check all services are running
docker-compose ps

# Check Neural Core health
curl http://localhost:3000/health

# Expected response:
# {
#   "status": "healthy",
#   "services": {
#     "neuralCore": true,
#     "database": true,
#     "redis": true,
#     "elasticsearch": true
#   }
# }
```

---

## Step 5: Access the Platform

Open your browser and visit:

- **🏠 Homepage**: http://localhost:8080
- **🧠 Neural Core API**: http://localhost:3000
- **📊 Analytics Dashboard**: http://localhost:3001
- **🔌 API Documentation**: http://localhost:3000/

---

## Exploring the System

### View System Statistics

```bash
curl http://localhost:3000/api/stats
```

### Get AEO Recommendations

```bash
curl http://localhost:3000/api/aeo/recommendations
```

### Check Learning Status

```bash
curl http://localhost:3000/api/learning/status
```

### View Evolution Metrics

```bash
curl http://localhost:3000/api/evolution/metrics
```

### Trigger Manual Evolution Cycle

```bash
curl -X POST http://localhost:3000/api/evolution/trigger
```

---

## Watching the Logs

### View all logs
```bash
docker-compose logs -f
```

### View Neural Core logs only
```bash
docker-compose logs -f neural-core
```

### View specific service
```bash
docker-compose logs -f [service-name]
# service-name: neural-core, content-generator, analytics-service, etc.
```

---

## What Happens Automatically?

Once running, the system automatically:

### Every Hour
- ✅ Monitors AI platform visibility
- ✅ Generates optimized content
- ✅ Adjusts performance settings
- ✅ Deploys quick improvements

### Every Day
- ✅ Creates A/B tests
- ✅ Evaluates ongoing tests
- ✅ Deploys winning variants
- ✅ Updates learning models

### Every Week
- ✅ Retrains neural networks
- ✅ Adjusts strategic goals
- ✅ Evaluates major features
- ✅ Plans new experiments

### Every Month
- ✅ Reviews business model
- ✅ Updates technology stack
- ✅ Generates comprehensive reports
- ✅ Implements major transformations

---

## Testing the Autonomous Systems

### 1. Content Generation
The system automatically generates robotics content. Check generated content:

```bash
# View generated content in database
docker-compose exec database psql -U postgres -d robotics_brain -c "SELECT title, created_at FROM generated_content ORDER BY created_at DESC LIMIT 10;"
```

### 2. Decision Making
Test the autonomous decision engine:

```bash
curl -X POST http://localhost:3000/api/decision/make \
  -H "Content-Type: application/json" \
  -d '{
    "context": "content",
    "data": {"metrics": {"citationRate": 45}},
    "urgency": "normal"
  }'
```

### 3. Evolution Tracking
Monitor evolution progress:

```bash
# Check evolution metrics
docker-compose exec database psql -U postgres -d robotics_brain -c "SELECT cycle_type, success, cycle_time, created_at FROM evolution_metrics ORDER BY created_at DESC LIMIT 20;"
```

---

## Common Issues & Solutions

### Issue: Services won't start
```bash
# Solution: Check Docker resources
docker system df
docker system prune  # Free up space if needed
```

### Issue: Neural Core shows "initializing"
```bash
# Solution: Wait 5-10 minutes on first run
# Check logs for progress
docker-compose logs -f neural-core
```

### Issue: Database connection errors
```bash
# Solution: Restart database service
docker-compose restart database
docker-compose logs -f database
```

### Issue: Out of memory errors
```bash
# Solution: Increase Docker memory limit
# Docker Desktop → Preferences → Resources → Memory (set to 8GB+)
```

### Issue: Port already in use
```bash
# Solution: Check what's using the port
lsof -i :3000  # Or whichever port
# Either stop the other service or change port in docker-compose.yml
```

---

## Stopping the System

### Graceful shutdown (recommended)
```bash
docker-compose down
```

### Stop and remove all data
```bash
docker-compose down -v
# WARNING: This deletes all learning data!
```

### Stop but keep data
```bash
docker-compose stop
```

### Restart services
```bash
docker-compose restart
```

---

## Scaling the System

### Scale Neural Core instances
```bash
docker-compose up -d --scale neural-core=5
```

### Scale Content Generator
```bash
docker-compose up -d --scale content-generator=3
```

### Scale multiple services
```bash
docker-compose up -d \
  --scale neural-core=5 \
  --scale content-generator=3 \
  --scale analytics-service=2
```

---

## Development Mode

For development with auto-reload:

```bash
# Edit docker-compose.yml and change:
# NODE_ENV=production → NODE_ENV=development

# Start with live logs
docker-compose up
```

---

## Next Steps

1. **Customize Content**
   - Edit content templates in `/services/content-generator/templates/`
   - Add robotics-specific keywords and topics

2. **Adjust Goals**
   - Modify system goals in Neural Core configuration
   - Set custom targets for your business

3. **Configure AEO Platforms**
   - Add/remove AI platforms in `.env`
   - Customize optimization strategies

4. **Integrate Analytics**
   - Connect Google Analytics
   - Set up custom event tracking

5. **Deploy to Production**
   - See [DEPLOYMENT.md](docs/deployment.md)
   - Configure SSL certificates
   - Set up domain names

---

## Monitoring Dashboard

The system includes several monitoring endpoints:

| Endpoint | Purpose | URL |
|----------|---------|-----|
| Health Check | System status | http://localhost:3000/health |
| Statistics | Overall stats | http://localhost:3000/api/stats |
| Evolution | Evolution metrics | http://localhost:3000/api/evolution/metrics |
| Learning | Learning status | http://localhost:3000/api/learning/status |
| Analytics | Real-time data | http://localhost:3001 |

---

## Getting Help

### Check Logs
```bash
docker-compose logs -f [service-name]
```

### Database Access
```bash
docker-compose exec database psql -U postgres -d robotics_brain
```

### Redis Access
```bash
docker-compose exec redis redis-cli
```

### Elasticsearch Access
```bash
curl http://localhost:9200/_cluster/health?pretty
```

---

## Performance Tips

1. **First Run**: Allow 10 minutes for complete initialization
2. **Memory**: Allocate at least 8GB RAM to Docker
3. **Storage**: Monitor disk usage, logs can grow large
4. **API Keys**: Use production-grade API keys for best results
5. **Network**: Ensure stable internet for AI API calls

---

## What You Should See

After successful startup, you should have:

- ✅ 10+ Docker containers running
- ✅ Neural Core status: "healthy"
- ✅ Database tables created (15+ tables)
- ✅ Elasticsearch indices initialized (4 indices)
- ✅ Redis cache operational
- ✅ Evolution cycles running
- ✅ Content generation active
- ✅ Frontend accessible

---

## Verify Everything Works

Run this comprehensive check:

```bash
#!/bin/bash

echo "🔍 Checking Autonomous Robotics System..."

# Check Docker
echo "Docker containers:"
docker-compose ps

# Check Neural Core
echo -e "\n🧠 Neural Core Health:"
curl -s http://localhost:3000/health | jq .

# Check Database
echo -e "\n📊 Database Tables:"
docker-compose exec -T database psql -U postgres -d robotics_brain -c "\dt"

# Check Redis
echo -e "\n🔴 Redis Status:"
docker-compose exec -T redis redis-cli ping

# Check Elasticsearch
echo -e "\n🔍 Elasticsearch Status:"
curl -s http://localhost:9200/_cat/health

echo -e "\n✅ System check complete!"
```

---

## Success Indicators

You'll know the system is working when:

1. **All containers show "Up"** in `docker-compose ps`
2. **Health endpoint returns "healthy"**
3. **Logs show "Evolution cycles started"**
4. **Frontend loads at localhost:8080**
5. **Database has 15+ tables**
6. **Elasticsearch has 4 indices**
7. **No error messages in logs**

---

## Ready to Go!

Your autonomous robotics platform is now:
- 🧠 **Making decisions** independently
- 📝 **Generating content** automatically
- 🔄 **Evolving continuously**
- 📊 **Tracking metrics** in real-time
- 🎯 **Optimizing for AI** search
- 💼 **Running business operations**

**The system is alive and evolving!** 🤖✨

---

## Support

Need help?
- 📖 Read [README.md](README.md) for detailed information
- 🔧 Check [docs/troubleshooting.md](docs/troubleshooting.md)
- 💬 Open an issue on GitHub
- 📧 Email: support@autonomousrobotics.ai

---

**Welcome to the future of autonomous web systems!**
