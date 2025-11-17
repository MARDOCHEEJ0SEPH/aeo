# 🍼 Little Wonders Baby Shop

A comprehensive, AEO-optimized e-commerce platform for baby products built with modern web technologies and 100% Answer Engine Optimization implementation.

## Overview

Little Wonders Baby Shop is a full-featured baby products e-commerce website demonstrating best practices for AEO (Answer Engine Optimization). The platform includes everything needed to run a professional online baby store: product catalog, shopping cart, baby registry, customer accounts, and order management.

## Features

### Frontend Features
- ✅ **100% AEO-Optimized Pages**
  - Comprehensive Schema.org markup (Store, Product, FAQPage, Organization)
  - Semantic HTML5 structure
  - Optimized meta tags and Open Graph
  - Structured data for all products
  - Breadcrumb navigation with schema

- 🛍️ **Complete E-commerce Experience**
  - 8 product categories (Newborn, Clothing, Furniture, Feeding, Diapers, Travel, Toys, Bath)
  - Advanced product filtering (category, age, price, brand, features)
  - Shopping cart with real-time updates
  - Customer reviews and ratings
  - Product search and sorting

- 👶 **Baby Registry System**
  - Create and manage baby registries
  - Share registry with friends/family
  - Track purchased items
  - Completion discount feature

- 📱 **Responsive Design**
  - Mobile-first approach
  - Touch-friendly interfaces
  - Optimized for all devices

### Backend Features
- 🔐 **Authentication & Security**
  - JWT-based authentication
  - Bcrypt password hashing
  - Rate limiting
  - Helmet.js security headers
  - Input validation with Validator.js

- 🛒 **Shopping Cart & Orders**
  - Session-based cart management
  - Real-time inventory checking
  - Order processing with transactions
  - Order history and tracking
  - Payment integration ready

- 📦 **Product Management**
  - 20+ sample products across 8 categories
  - Product variants (size, color, age range)
  - Inventory tracking
  - Low stock alerts
  - Product images and reviews

- 👥 **Customer Management**
  - User registration and login
  - Profile management
  - Address book
  - Wishlist functionality
  - Order history

### Database Features
- 📊 **Comprehensive Schema**
  - 20+ interconnected tables
  - Products, Categories, Brands
  - Customers, Orders, Reviews
  - Cart, Wishlist, Addresses
  - Baby Registry system
  - Newsletter subscribers
  - Discount codes

- 🔄 **Advanced Features**
  - JSONB for flexible data (addresses, certifications)
  - Triggers for automatic updates
  - Views for complex queries
  - Foreign key relationships
  - Indexes for performance

## Tech Stack

### Frontend
- HTML5 with semantic markup
- CSS3 (using framework styles)
- Vanilla JavaScript (ES6+)
- Schema.org structured data

### Backend
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Database:** PostgreSQL
- **Authentication:** JWT + Bcrypt
- **Security:** Helmet, CORS, Rate Limiting
- **File Upload:** Multer
- **Validation:** Validator.js

## Installation

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 12+
- Git

### Quick Start

1. **Clone the repository:**
   ```bash
   cd AEOWEB/examples/9-baby-shop
   ```

2. **Set up the database:**
   ```bash
   # Create database and tables
   psql -U postgres -f database/schema.sql

   # Load sample data
   psql -U postgres -d baby_shop -f database/seed.sql
   ```

3. **Configure environment variables:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Install dependencies:**
   ```bash
   npm install
   ```

5. **Start the server:**
   ```bash
   npm run dev  # Development mode with nodemon
   # or
   npm start    # Production mode
   ```

6. **Open the website:**
   - Frontend: Open `index.html` in your browser
   - API: http://localhost:3009/health

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new customer
- `POST /api/auth/login` - Login and get JWT token

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:id` - Get single product details
- `GET /api/categories` - Get all categories

### Shopping Cart
- `GET /api/cart` - Get customer's cart (requires auth)
- `POST /api/cart` - Add item to cart (requires auth)
- `PUT /api/cart/:itemId` - Update cart item quantity (requires auth)
- `DELETE /api/cart/:itemId` - Remove item from cart (requires auth)

### Orders
- `POST /api/orders` - Create new order (requires auth)
- `GET /api/orders` - Get customer's orders (requires auth)

### Reviews
- `POST /api/reviews` - Add product review (requires auth)

### Other
- `POST /api/newsletter` - Subscribe to newsletter
- `POST /api/contact` - Send contact message

## AEO Implementation

This example demonstrates **100% AEO optimization** including:

### 1. Schema.org Structured Data
```json
{
  "@context": "https://schema.org",
  "@type": "Store",
  "name": "Little Wonders Baby Shop",
  "address": { ... },
  "aggregateRating": { ... }
}
```

### 2. Product Schema
Every product includes:
- Product schema with offers
- Brand information
- Aggregate ratings
- Availability status
- Price and currency

### 3. FAQPage Schema
8 common questions with detailed answers optimized for AI engines:
- Store hours
- Shipping policy
- Return policy
- Organic products
- Baby registry
- Price matching
- Payment methods
- Gift wrapping

### 4. Semantic HTML
- Proper heading hierarchy (H1-H4)
- Article tags for products/categories
- Address tags for location
- Time tags for hours
- Navigation landmarks

### 5. Meta Tags Optimization
- Descriptive title tags (60-70 chars)
- Meta descriptions (150-160 chars)
- Open Graph tags
- Twitter Card tags
- Geo tags for local business

## Database Schema

### Core Tables
- `customers` - Customer accounts
- `products` - Product catalog
- `categories` - Product categories
- `brands` - Product brands
- `inventory` - Stock management
- `orders` - Order records
- `order_items` - Order line items
- `cart_items` - Shopping cart
- `reviews` - Product reviews
- `addresses` - Customer addresses
- `wishlists` - Wishlist functionality
- `baby_registries` - Baby registry system
- `newsletter_subscribers` - Email marketing
- `discount_codes` - Promotional codes

## Sample Data

The seed data includes:
- **20 Products** across 8 categories
- **5 Brands** (Little Wonders, GreenBaby, Urban Baby Gear, etc.)
- **8 Categories** (Newborn, Clothing, Furniture, etc.)
- **5 Sample Customers** (password: `password123`)
- **8 Product Reviews**
- **4 Discount Codes**

### Test User
```
Email: sarah.johnson@email.com
Password: password123
```

## Product Categories

1. **Newborn Essentials** - Onesies, swaddles, pacifiers
2. **Baby Clothing** - Organic cotton, sleep sacks, shoes
3. **Nursery Furniture** - Cribs, mattresses, gliders
4. **Feeding Essentials** - Breast pumps, bottles, high chairs
5. **Diapers & Wipes** - Eco-friendly diapers, wipes
6. **Strollers & Car Seats** - Travel systems, car seats
7. **Toys & Books** - Educational toys, teethers, books
8. **Bath & Skincare** - Organic bath products, eczema relief

## Features Highlights

### Organic & Eco-Friendly
- GOTS-certified organic products
- Eco-friendly alternatives
- Non-toxic materials
- Sustainable sourcing

### Safety First
- JPMA certification
- CPSC compliance
- Safety testing
- Detailed certifications

### Customer Service
- Free shipping over $50
- 30-day returns (90 days furniture)
- Price match guarantee
- Expert advice available
- Baby registry service

## Development

### Running Tests
```bash
npm test
```

### Database Management
```bash
# Reset database
npm run db:setup

# Reseed data
npm run db:seed
```

### Environment Variables
See `.env.example` for all configuration options:
- Database connection
- JWT settings
- CORS configuration
- File upload settings
- Email/payment integrations

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure JWT_SECRET
4. Enable HTTPS
5. Configure payment gateway (Stripe recommended)
6. Set up email service (SendGrid, etc.)
7. Configure CDN for product images

## Security Considerations

- All passwords are hashed with bcrypt (10 rounds)
- JWT tokens expire after 7 days
- Rate limiting on all API endpoints
- Helmet.js for security headers
- Input validation on all forms
- SQL injection protection via parameterized queries
- XSS protection
- CORS configuration

## Performance

- Database indexes on frequently queried fields
- Connection pooling for PostgreSQL
- Lazy loading for product images
- Pagination for product listings
- Caching headers for static assets

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

MIT License - See LICENSE file for details

## Credits

Built as part of the AEOWEB project demonstrating best practices for Answer Engine Optimization in e-commerce.

## Support

For questions or issues:
- Check the FAQ section
- Review API documentation
- Contact: hello@littlewondersbaby.com

---

**Note:** This is a demonstration project. For production use, additional features should be implemented:
- Payment processing (Stripe, PayPal)
- Email notifications (order confirmations, shipping updates)
- Advanced search (Elasticsearch)
- Product recommendations
- Analytics integration
- CDN for images
- Automated backups
- Monitoring and logging
