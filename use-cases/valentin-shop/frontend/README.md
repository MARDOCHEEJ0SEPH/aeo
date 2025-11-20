# Valentin Shop - Frontend

React + TypeScript frontend for Valentin Shop e-commerce platform.

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **React Query** - Server state management
- **Zustand** - Client state management
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Lucide React** - Icons

## Integration

Connects to AEOWEB-refactored microservices:
- Content Service (Port 8082) - Product catalog
- AEO Service (Port 4002) - Optimization scores
- Analytics Service (Port 8083) - Event tracking
- Search Service (Port 8084) - Product search

## Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

Visit http://localhost:5001

## Features

- **Product Catalog** - Browse 50+ AEO-optimized products
- **Product Detail** - View detailed info, AEO scores per platform
- **Shopping Cart** - Add/remove items, persist with localStorage
- **Checkout** - Complete purchase flow
- **AEO Dashboard** - View platform-specific optimization metrics

## Build

```bash
npm run build
```

Output in `dist/` directory.
