# Bean & Brew Coffee Shop - Complete AEO Website Example

## Overview

A complete, production-ready website for a local coffee shop optimized for Answer Engine Optimization (AEO). This example demonstrates how to dominate local "coffee shop near me" searches and get cited by AI engines.

## Business Profile

**Name:** Bean & Brew Coffee
**Type:** Local Coffee Shop
**Location:** Downtown Seattle, WA
**Specialties:** Artisan coffee, fresh pastries, coworking space
**Target Customers:** Coffee enthusiasts, remote workers, students
**Revenue Model:** In-store sales, catering, subscription boxes

## AEO Strategy Focus

### Target Questions
- "Best coffee shop near me"
- "Coffee shop with WiFi in Seattle"
- "Where to get pour over coffee in downtown Seattle"
- "Coffee shop with outdoor seating near me"
- "Best latte in Seattle"
- "Coffee shop for remote work"

### AI Engines Targeting
- **Google AI Overviews** (local queries)
- **ChatGPT** (recommendations)
- **Perplexity** (local business discovery)
- **Google Maps AI** (location-based)
- **Voice Assistants** (Siri, Google Assistant)

## Features Implemented

### Frontend
✅ Homepage with location, hours, menu preview
✅ Full menu page with prices and descriptions
✅ Location page with map and directions
✅ About page with story and values
✅ Catering page for corporate orders
✅ FAQ page optimized for voice search
✅ Blog with coffee guides and recipes

### Schema Markup
✅ LocalBusiness schema with geo-coordinates
✅ Restaurant schema with menu items
✅ FAQPage schema
✅ Product schema for coffee beans
✅ OpeningHours specification
✅ Review/Rating schema

### Backend Features
✅ Menu management system
✅ Order tracking
✅ Customer loyalty program
✅ Catering request forms
✅ Newsletter signup
✅ Google Business Profile integration
✅ Citation tracking from AI engines

### Database Tables
- **products** - Menu items (coffee, pastries, etc.)
- **orders** - Online and in-store orders
- **customers** - Loyalty program members
- **catering_requests** - Corporate catering inquiries
- **locations** - Store locations (supports multi-location)
- **reviews** - Customer reviews
- **daily_specials** - Rotating specials

## Quick Start

### 1. Basic Setup (Static Site)

```bash
# Copy to your project
cp -r examples/1-coffee-shop/* /path/to/your/project/

# Customize
# - Update business info in schema/localbusiness.json
# - Replace placeholder images
# - Update hours and menu
# - Deploy to Netlify or Vercel
```

### 2. Full-Stack Setup

```bash
# Database setup
cd database
psql -U your_user -d coffee_shop_db -f schema.sql
psql -U your_user -d coffee_shop_db -f seed.sql

# Backend setup
cd ../backend
npm install
cp .env.example .env
# Edit .env with your settings
npm run dev

# Frontend
# Serve index.html with your preferred method
```

## Customization Guide

### Update Business Information

**1. schema/localbusiness.json**
```json
{
  "name": "Your Coffee Shop Name",
  "address": {
    "streetAddress": "123 Main St",
    "addressLocality": "Your City",
    ...
  },
  "telephone": "+1-555-555-5555",
  "openingHoursSpecification": [...]
}
```

**2. Update Menu (database/seed.sql)**
- Modify product entries
- Update prices
- Add seasonal specials

**3. Colors & Branding (assets/css/custom.css)**
```css
:root {
  --primary-color: #6F4E37; /* Coffee brown */
  --secondary-color: #D4AF37; /* Golden */
}
```

## AEO Optimization Checklist

- [x] LocalBusiness schema with accurate NAP (Name, Address, Phone)
- [x] Geo-coordinates for map accuracy
- [x] Opening hours specification
- [x] Menu with detailed descriptions
- [x] FAQ answering common questions
- [x] Reviews and ratings schema
- [x] High-quality images with alt text
- [x] Mobile-responsive design
- [x] Fast loading speed (<3 seconds)
- [x] HTTPS enabled
- [x] Google Business Profile linked
- [x] Voice search optimized content

## Expected Results

**30 Days:**
- Indexed by Google
- Appearing in local pack for branded searches
- First AI citations

**90 Days:**
- Top 3 for "coffee shop near me" (local)
- 10+ AI citations per month
- 20% increase in foot traffic

**180 Days:**
- Dominant local presence
- Cited by AI for specific coffee questions
- 40%+ increase in new customers

## Deployment

### Option 1: Netlify (Static)
```bash
netlify deploy --dir=. --prod
```

### Option 2: Full-Stack (DigitalOcean)
See `deployment/digitalocean-setup.md`

### Option 3: WordPress Integration
Import content into WordPress with AEO plugin

## Maintenance

**Daily:**
- Update daily special
- Respond to reviews

**Weekly:**
- Post blog article
- Check AI citations
- Update social media

**Monthly:**
- Review menu
- Analyze performance
- Update seasonal items

## Files Included

```
1-coffee-shop/
├── index.html                    # Homepage
├── pages/
│   ├── menu.html                # Full menu
│   ├── location.html            # Map & directions
│   ├── about.html               # Story & values
│   ├── catering.html            # Corporate catering
│   ├── blog.html                # Coffee guides
│   └── contact.html             # Contact form
├── schema/
│   ├── localbusiness.json       # Main schema
│   ├── menu.json                # Menu items
│   └── faq.json                 # Common questions
├── assets/
│   ├── css/custom.css           # Brand-specific styles
│   └── js/menu-loader.js        # Dynamic menu
├── backend/
│   ├── server.js                # Express server
│   ├── routes/
│   │   ├── menu.js             # Menu API
│   │   ├── orders.js           # Order management
│   │   └── catering.js         # Catering requests
│   └── .env.example             # Environment template
├── database/
│   ├── schema.sql               # Database structure
│   └── seed.sql                 # Sample data
└── README.md                    # This file
```

## Support

For questions about implementing this example:
- Review main AEOWEB documentation
- Check barbecue-restaurant use case (similar local business)
- Consult AEO book Chapter 10 (Use Cases)

## License

Same as main AEOWEB project

---

**Your coffee shop's journey to AI-powered local dominance starts here!** ☕
