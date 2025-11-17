#!/bin/bash

set -e

echo "🛑 Stopping all services..."

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Stop use case applications
echo -e "${BLUE}Stopping use case applications...${NC}"
cd ../
docker-compose down
echo -e "${GREEN}✓ Use cases stopped${NC}"

# Stop AEOWEB-refactored
echo -e "${BLUE}Stopping AEOWEB-refactored...${NC}"
cd ../AEOWEB-refactored
docker-compose down
echo -e "${GREEN}✓ AEOWEB-refactored stopped${NC}"

echo ""
echo -e "${GREEN}✓ All services stopped${NC}"
