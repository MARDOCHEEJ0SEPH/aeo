#!/bin/bash

set -e

echo "🚀 Setting up AEOWEB Use Cases..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Start AEOWEB-refactored
echo -e "${BLUE}Step 1: Starting AEOWEB-refactored platform...${NC}"
cd ../AEOWEB-refactored
docker-compose up -d
echo -e "${GREEN}✓ AEOWEB-refactored started${NC}"

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to initialize...${NC}"
sleep 15

# Step 2: Import Valentin Shop products
echo -e "${BLUE}Step 2: Importing Valentin Shop products...${NC}"
curl -X POST http://localhost:8082/content \
  -H "Content-Type: application/json" \
  -d @../use-cases/valentin-shop/products/catalog.json \
  || echo -e "${YELLOW}Content service might not be ready yet${NC}"

# Step 3: Import Hairwave products
echo -e "${BLUE}Step 3: Importing Hairwave products...${NC}"
curl -X POST http://localhost:8082/content \
  -H "Content-Type: application/json" \
  -d @../use-cases/hairwave/products/hairwave-catalog.json \
  || echo -e "${YELLOW}Content service might not be ready yet${NC}"

# Step 4: Index products in Elasticsearch
echo -e "${BLUE}Step 4: Indexing products in Elasticsearch...${NC}"
curl -X POST http://localhost:8084/index/bulk \
  -H "Content-Type: application/json" \
  -d @../use-cases/valentin-shop/products/catalog.json \
  || echo -e "${YELLOW}Search service might not be ready yet${NC}"

curl -X POST http://localhost:8084/index/bulk \
  -H "Content-Type: application/json" \
  -d @../use-cases/hairwave/products/hairwave-catalog.json \
  || echo -e "${YELLOW}Search service might not be ready yet${NC}"

echo -e "${GREEN}✓ Products indexed${NC}"

# Step 5: Start use case applications
echo -e "${BLUE}Step 5: Starting use case applications...${NC}"
cd ../use-cases
docker-compose up -d

echo -e "${GREEN}✓ Use case applications started${NC}"

echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo "Available services:"
echo -e "  ${BLUE}Valentin Shop:${NC}     http://localhost:5001"
echo -e "  ${BLUE}Hairwave:${NC}          http://localhost:5003"
echo -e "  ${BLUE}AEOWEB Gateway:${NC}    http://localhost:4000"
echo -e "  ${BLUE}AEOWEB GraphQL:${NC}    http://localhost:4001"
echo -e "  ${BLUE}AEO Service:${NC}       http://localhost:4002"
echo -e "  ${BLUE}Content Service:${NC}   http://localhost:8082"
echo -e "  ${BLUE}Analytics Service:${NC} http://localhost:8083"
echo -e "  ${BLUE}Search Service:${NC}    http://localhost:8084"
echo -e "  ${BLUE}Prometheus:${NC}        http://localhost:9090"
echo -e "  ${BLUE}Grafana:${NC}           http://localhost:3001"
echo ""
echo "To stop all services:"
echo "  cd use-cases && docker-compose down"
echo "  cd AEOWEB-refactored && docker-compose down"
