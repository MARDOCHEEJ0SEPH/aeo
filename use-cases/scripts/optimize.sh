#!/bin/bash

set -e

echo "🎯 Running AEO Optimization..."

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Optimizing Valentin Shop products...${NC}"
curl -X POST http://localhost:4002/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "Valentin Shop",
    "platforms": ["CHATGPT", "CLAUDE", "PERPLEXITY", "GEMINI", "BING"]
  }'

echo -e "${GREEN}✓ Valentin Shop optimized${NC}"

echo -e "${BLUE}Optimizing Hairwave products...${NC}"
curl -X POST http://localhost:4002/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "Hairwave",
    "platforms": ["CHATGPT", "CLAUDE", "PERPLEXITY", "GEMINI", "BING"]
  }'

echo -e "${GREEN}✓ Hairwave optimized${NC}"

echo ""
echo -e "${GREEN}🎉 AEO Optimization complete!${NC}"
echo ""
echo "View optimization results:"
echo "  Valentin Shop: http://localhost:5001/aeo-dashboard"
echo "  Hairwave:      http://localhost:5003/aeo-dashboard"
