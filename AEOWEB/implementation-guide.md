# AEO Website Implementation Guide

## Step-by-Step Setup Instructions

This guide walks you through implementing your AEO-optimized website from start to finish.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (Static Site)](#quick-start-static-site)
3. [Full-Stack Setup](#full-stack-setup)
4. [Customization Guide](#customization-guide)
5. [Deployment](#deployment)
6. [Testing](#testing)
7. [Maintenance](#maintenance)

## Prerequisites

### Required Knowledge
- Basic HTML/CSS
- Basic understanding of web hosting
- (Optional) JavaScript basics
- (Optional) Node.js for full-stack

### Required Tools
- Code editor (VS Code recommended)
- Web browser
- (Optional) Node.js 18+ and npm
- (Optional) PostgreSQL 14+
- (Optional) Git

## Quick Start (Static Site)

### Option 1: HTML Files Only (Beginner-Friendly)

**Time to complete: 1-2 hours**

#### Step 1: Customize Your Business Information

1. Open `schema/organization.json`
2. Replace all placeholder text with your business info:
```json
{
  "name": "Your Actual Business Name",
  "url": "https://youractualdomain.com",
  "email": "contact@yourdomain.com",
  ...
}
```

#### Step 2: Update Homepage

1. Open `index.html`
2. Find and replace:
   - `[Your Business Name]` → Your actual business name
   - `[What You Do]` → Your value proposition
   - `[target audience]` → Who you serve
   - `[achieve specific outcome]` → What results you deliver

3. Update the FAQ section with your actual questions/answers

4. Replace placeholder images:
   - Add your logo to `assets/images/logo.png`
   - Add hero image to `assets/images/hero-image.jpg`
   - Add service icons to `assets/images/service-*-icon.svg`

#### Step 3: Customize Colors & Styling

1. Open `assets/css/aeo-framework.css`
2. Find the `:root` section at the top
3. Change these variables to match your brand:
```css
:root {
  --primary-color: #2563eb;  /* Your brand color */
  --secondary-color: #64748b;
  ...
}
```

#### Step 4: Test Locally

1. Open `index.html` in your web browser
2. Check that everything displays correctly
3. Test all links work
4. Verify schema markup using [Google's Rich Results Test](https://search.google.com/test/rich-results)

#### Step 5: Deploy

**Option A: Netlify (Easiest)**
1. Go to [Netlify.com](https://netlify.com)
2. Drag and drop your AEOWEB folder
3. Done! Your site is live

**Option B: GitHub Pages (Free)**
1. Create GitHub account
2. Create new repository
3. Upload all files
4. Enable GitHub Pages in settings

**Option C: Traditional Hosting**
1. Connect to your web host via FTP
2. Upload all files to public_html or www directory
3. Done!

## Full-Stack Setup

### For Dynamic Content, CMS, and Advanced Features

**Time to complete: 4-8 hours (initial setup)**

#### Step 1: Database Setup

1. Install PostgreSQL:
```bash
# Ubuntu/Debian
sudo apt-get install postgresql

# macOS
brew install postgresql

# Start PostgreSQL
sudo service postgresql start  # Ubuntu
brew services start postgresql  # macOS
```

2. Create database:
```bash
sudo -u postgres psql
CREATE DATABASE aeo_website;
CREATE USER aeo_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE aeo_website TO aeo_user;
\q
```

3. Import schema:
```bash
psql -U aeo_user -d aeo_website -f database/schema.sql
```

#### Step 2: Redis Setup (Optional but Recommended)

```bash
# Ubuntu/Debian
sudo apt-get install redis-server
sudo service redis-server start

# macOS
brew install redis
brew services start redis
```

#### Step 3: Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Edit `.env` with your actual values:
```bash
nano .env
```

Update at minimum:
- `DB_PASSWORD` - your database password
- `JWT_SECRET` - generate a random secret
- `REDIS_PASSWORD` - if you set one

5. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

Server should be running at `http://localhost:3000`

#### Step 4: Frontend Integration

1. Update API endpoints in JavaScript files
2. Point frontend to backend URL
3. Test API connectivity

#### Step 5: Test Everything

```bash
# Test database connection
npm test

# Test API endpoints
curl http://localhost:3000/api/health

# Check schema generation
curl http://localhost:3000/api/schema/organization
```

## Customization Guide

### For Different Business Types

#### E-commerce Store

1. Use product schema templates heavily
2. Create product pages using `pages/product-template.html`
3. Add shopping cart functionality
4. Implement product reviews
5. Set up payment processing

**Key Files to Modify:**
- `schema/product.json` - Product schema
- `pages/product-single.html` - Product page template
- Add e-commerce specific API endpoints

#### Service Business

1. Focus on service pages
2. Emphasize case studies/examples
3. Clear pricing (if transparent)
4. Booking/contact forms
5. FAQ for each service

**Key Files to Modify:**
- `pages/service-single.html` - Service template
- `schema/service.json` - Service schema
- Add booking system if needed

#### Local Business (Restaurant, Shop, etc.)

1. Use LocalBusiness schema
2. Add Google Maps integration
3. Highlight hours, location
4. Menu/inventory if applicable
5. Reviews and testimonials

**Key Files to Modify:**
- `schema/localbusiness.json` - Critical!
- Add location-specific content
- Create "near me" optimized pages

#### Content Creator / Blog

1. Focus on article templates
2. Build topic clusters
3. Author schema and credentials
4. Newsletter signup
5. Course schema if applicable

**Key Files to Modify:**
- `content/blog/blog-post.html` - Article template
- `schema/article.json` - Article schema
- Build hub-and-spoke content structure

### Color Scheme Customization

Edit `assets/css/aeo-framework.css`:

```css
:root {
  /* Professional Blue (Default) */
  --primary-color: #2563eb;

  /* Other Options: */
  /* Tech Startup: */
  /* --primary-color: #8b5cf6; */

  /* Natural/Eco: */
  /* --primary-color: #10b981; */

  /* Creative/Bold: */
  /* --primary-color: #f59e0b; */

  /* Professional Red: */
  /* --primary-color: #dc2626; */
}
```

### Typography Customization

Change fonts by updating the CSS variables:

```css
:root {
  --font-primary: "Your Font", sans-serif;
  --font-heading: "Your Heading Font", sans-serif;
}
```

Add font import in `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
```

## Deployment

### Option 1: Static Site Deployment

**Netlify:**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd AEOWEB
netlify deploy

# Production deploy
netlify deploy --prod
```

**Vercel:**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel deploy
```

### Option 2: Full-Stack Deployment

See `FULLSTACK-GUIDE.md` for comprehensive deployment instructions including:
- AWS setup
- DigitalOcean setup
- Docker deployment
- CI/CD pipelines

## Testing

### 1. Schema Validation

Test all schema markup:
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org Validator](https://validator.schema.org/)

Paste each page URL and verify:
- ✓ No errors
- ✓ All expected types detected
- ✓ Required fields present

### 2. AEO Testing

Test in AI engines:

**ChatGPT:**
1. Ask question your content answers
2. Check if your content is cited
3. Document which questions work

**Perplexity:**
1. Same as above
2. Note citation frequency

**Google AI Overviews:**
1. Search for your target keywords
2. Check if you appear in AI overview
3. Track over time

### 3. Performance Testing

**PageSpeed Insights:**
- Target: 90+ score
- Check mobile and desktop
- Fix any issues found

**GTmetrix:**
- Target: A/B grade
- Optimize images if needed
- Enable compression

### 4. Accessibility

**WAVE Tool:**
- 0 errors
- Address contrast issues
- Alt text on all images

## Maintenance

### Weekly Tasks

- [ ] Review citation tracking data
- [ ] Check for broken links
- [ ] Test site speed
- [ ] Review analytics
- [ ] Backup database

### Monthly Tasks

- [ ] Update content (refresh dates)
- [ ] Add new FAQ questions
- [ ] Publish new blog posts
- [ ] Review and improve low-performing content
- [ ] Update schema if needed
- [ ] Security updates

### Quarterly Tasks

- [ ] Comprehensive SEO/AEO audit
- [ ] Competitive analysis
- [ ] Content gap analysis
- [ ] Schema validation review
- [ ] Performance optimization
- [ ] Backup verification

## Content Creation Workflow

### For New Blog Posts

1. Research target question
2. Check AI engines for current answers
3. Outline your article
4. Write comprehensive content (800+ words)
5. Add FAQ section
6. Generate schema
7. Test in AI engines
8. Publish and promote

### For New Service Pages

1. Define service clearly
2. List key benefits
3. Add pricing (if transparent)
4. Create FAQ for that service
5. Add schema markup
6. Include examples/case studies
7. Clear call to action

## Troubleshooting

### Schema Not Validating

**Problem:** Schema markup has errors

**Solutions:**
- Check JSON syntax (commas, brackets)
- Verify required fields present
- Use validator tool
- Check for typos in @type values

### Poor Page Speed

**Problem:** Site loads slowly

**Solutions:**
- Optimize images (compress, resize)
- Enable browser caching
- Minimize CSS/JS
- Use CDN for assets
- Check hosting performance

### Not Getting AI Citations

**Problem:** Content not cited by AI engines

**Solutions:**
- Ensure content directly answers questions
- Verify schema is properly implemented
- Check pages are indexed (Google Search Console)
- Improve content quality/comprehensiveness
- Build more topical authority

### Forms Not Working

**Problem:** Contact form doesn't submit

**Solutions:**
- Check backend is running
- Verify API endpoints
- Check CORS settings
- Review browser console for errors

## Getting Help

### Documentation
- Main README: `README.md`
- Full-Stack Guide: `FULLSTACK-GUIDE.md`
- Database Schema: `database/schema.sql`
- This Guide: `implementation-guide.md`

### Resources
- AEO Book: `/chapters/` (12 chapters)
- Use Cases: `/use-cases/` (3 industry examples)
- Schema Examples: `/schema/` folder

### Community
- Open an issue on GitHub
- Consult the AEO book chapters
- Test in AI engines for real-time feedback

## Success Checklist

Before launching:

- [ ] All placeholder text replaced
- [ ] Business information updated in schema
- [ ] Logo and images added
- [ ] FAQ section customized
- [ ] Schema validated (0 errors)
- [ ] All links work
- [ ] Mobile responsive
- [ ] Page speed 90+
- [ ] HTTPS enabled
- [ ] Google Search Console set up
- [ ] Analytics installed
- [ ] Tested in AI engines
- [ ] Backup system in place

## Next Steps After Launch

1. Week 1-4: Monitor indexing, fix technical issues
2. Month 2-3: Create content, build citations
3. Month 3-6: Analyze what works, scale up
4. Month 6+: Advanced optimization, expansion

Your AEO-optimized website is ready to launch!

For business-specific guidance, see:
- `/use-cases/ai-learning-influencer/` - For educators/content creators
- `/use-cases/barbecue-restaurant/` - For local businesses
- `/use-cases/christmas-etsy-shop/` - For e-commerce

Good luck! 🚀
