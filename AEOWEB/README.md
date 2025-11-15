# AEO Website Skeleton

## General-Purpose Website Framework Optimized for Answer Engine Optimization

This is a complete, ready-to-customize website skeleton built following 100% of the AEO (Answer Engine Optimization) principles from the AEO marketing book. It works for **any business type** - just customize the content.

## What This Includes

✅ **Complete HTML templates** with semantic structure
✅ **Schema markup** pre-configured (JSON-LD format)
✅ **FAQ pages** optimized for AI citations
✅ **Blog/article templates** for content marketing
✅ **Service/product pages** with structured data
✅ **CSS framework** for clean, accessible design
✅ **JavaScript utilities** for dynamic schema injection
✅ **Sample content** showing best practices
✅ **Implementation guide** (this README)

## Folder Structure

```
AEOWEB/
├── index.html                  # Homepage template
├── pages/
│   ├── about.html             # About page
│   ├── contact.html           # Contact page
│   ├── services.html          # Services overview
│   └── service-single.html    # Individual service page
├── content/
│   ├── blog/
│   │   ├── blog-index.html    # Blog listing page
│   │   └── blog-post.html     # Single blog post template
│   ├── services/
│   │   └── service-template.html
│   └── faq/
│       └── faq-page.html      # FAQ page template
├── templates/
│   ├── header.html            # Reusable header
│   ├── footer.html            # Reusable footer
│   ├── navigation.html        # Navigation component
│   └── schema-templates.html  # Common schema patterns
├── schema/
│   ├── organization.json      # Your business schema
│   ├── website.json           # Website schema
│   ├── faq.json              # FAQ schema examples
│   ├── article.json          # Article schema
│   ├── howto.json            # How-to schema
│   ├── product.json          # Product schema
│   └── localbusiness.json    # Local business schema
├── assets/
│   ├── css/
│   │   ├── aeo-framework.css # Main AEO-optimized styles
│   │   └── components.css    # UI components
│   ├── js/
│   │   ├── schema-injector.js # Dynamic schema insertion
│   │   └── aeo-utils.js      # AEO helper functions
│   └── images/
│       └── .gitkeep
├── implementation-guide.md    # Detailed setup instructions
└── README.md                  # This file
```

## Quick Start (5 Steps)

### Step 1: Customize Your Business Information

Edit `/schema/organization.json` with your business details:
- Business name
- Description
- Logo URL
- Contact information
- Social media profiles

### Step 2: Update Homepage

Edit `index.html`:
- Replace [Your Business Name] with your actual name
- Update hero section with your value proposition
- Modify services/products section
- Update FAQ with your most common questions

### Step 3: Create Your Service/Product Pages

Use `pages/service-single.html` as template:
- Copy for each service/product
- Update title, description, schema
- Include detailed Q&A sections
- Add how-to content if applicable

### Step 4: Start Your Blog

Use `content/blog/blog-post.html` as template:
- Create question-focused articles
- Include Article schema
- Add FAQ sections to each post
- Link related articles together

### Step 5: Deploy and Test

- Upload to your web host
- Test in AI engines (ChatGPT, Perplexity, etc.)
- Monitor citations
- Iterate and improve

## AEO Principles Built Into This Framework

### 1. Schema Markup Throughout

Every page includes appropriate structured data:
- **Homepage**: Organization + WebSite schema
- **About**: Organization + Person schema
- **Services**: Service schema
- **Blog**: Article + Author schema
- **FAQ**: FAQPage schema
- **Contact**: ContactPoint schema

**Why:** AI engines use schema to understand and cite your content.

### 2. Question-Answer Format

All content structured around questions:
- FAQ pages answer common questions
- Blog posts answer search queries
- Service pages answer "what/how/why"
- Clear, direct answers above the fold

**Why:** AI engines look for direct answers to user questions.

### 3. Semantic HTML5

Proper use of semantic tags:
- `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<footer>`
- Heading hierarchy (H1 → H2 → H3)
- `<time>` for dates
- `<address>` for contact info

**Why:** Helps AI understand content structure and importance.

### 4. Entity Optimization

Clear entity definitions:
- Your business name used consistently
- Brand mentioned in context
- Related entities linked
- Breadcrumb navigation

**Why:** AI engines build knowledge graphs from entities.

### 5. Comprehensive Content

Each page provides thorough answers:
- Minimum 800 words for key pages
- Multiple sections covering subtopics
- Internal links to related content
- External links to authoritative sources

**Why:** AI prefers comprehensive, authoritative content.

### 6. Voice Search Optimization

Natural language patterns:
- Conversational headings
- "How to..." and "What is..." structures
- Local business information (if applicable)
- Mobile-friendly responsive design

**Why:** Voice searches use natural language questions.

### 7. Fresh, Updated Content

Date stamps and update tracking:
- Published dates on articles
- Last updated dates
- Year in titles for relevance
- "Updated 2025" indicators

**Why:** AI engines prioritize current information.

### 8. Internal Linking Strategy

Strategic content connections:
- Hub pages linking to spoke pages
- Related articles cross-linked
- Breadcrumb navigation
- Clear site hierarchy

**Why:** Helps AI understand topic relationships and authority.

## Customization Guide

### For E-commerce Businesses

1. Use `schema/product.json` for product pages
2. Add price, availability, reviews to schema
3. Create "Gift Guide" style content
4. Include detailed product specifications

### For Service Businesses

1. Use `schema/service.json` for service pages
2. Add pricing tiers if transparent
3. Create "How-to" guides related to services
4. Include case studies or examples

### For Local Businesses

1. Use `schema/localbusiness.json`
2. Add NAP (Name, Address, Phone) consistently
3. Include hours, service area
4. Create location-specific content pages
5. Optimize for "near me" searches

### For Content Creators/Educators

1. Use `schema/article.json` heavily
2. Create topic clusters (hub and spoke)
3. Include Author schema with credentials
4. Add Course schema if offering courses

### For Professional Services

1. Emphasize expertise and credentials
2. Create FAQ pages for each service
3. Include professional schema (Lawyer, Doctor, etc.)
4. Add review/testimonial schema

## Implementation Checklist

### Before Launch:
- [ ] Customize all schema files with your business info
- [ ] Replace placeholder text in all HTML files
- [ ] Add your logo and images to `/assets/images/`
- [ ] Update navigation links in `templates/navigation.html`
- [ ] Create at least 5 FAQ entries
- [ ] Write 3+ blog posts using templates
- [ ] Test all links work correctly
- [ ] Validate schema using Google's Schema Validator
- [ ] Test mobile responsiveness
- [ ] Check page load speed

### First Week:
- [ ] Submit sitemap to Google Search Console
- [ ] Test site in ChatGPT (ask questions your site answers)
- [ ] Test in Perplexity AI
- [ ] Test in Google AI Overviews (if available)
- [ ] Monitor initial impressions
- [ ] Fix any technical issues

### First Month:
- [ ] Publish 8-12 blog posts
- [ ] Create 5-10 service/product pages
- [ ] Build out comprehensive FAQ (20+ questions)
- [ ] Add customer reviews/testimonials
- [ ] Create "How-to" guides
- [ ] Start internal linking between pages
- [ ] Begin tracking AI citations

### Ongoing:
- [ ] Publish new content weekly
- [ ] Update existing content monthly
- [ ] Monitor AI citations weekly
- [ ] Expand FAQ based on actual questions received
- [ ] Add new schema types as needed
- [ ] Test new AI platforms as they emerge
- [ ] Refresh dates and "year" references

## Technical Requirements

**Browser Support:**
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive (iOS, Android)

**Hosting Requirements:**
- Any standard web host (supports HTML, CSS, JS)
- HTTPS enabled (SSL certificate)
- Fast loading speeds (< 3 seconds)

**No Special Requirements:**
- No database needed
- No server-side code required
- Works with static hosting (Netlify, Vercel, GitHub Pages)
- Can be integrated into WordPress, Shopify, etc.

## Schema Markup Reference

### When to Use Each Schema Type

**Organization Schema** (schema/organization.json)
- Use on: Homepage, About page
- Purpose: Define your business entity
- Required: name, url, logo
- Optional: sameAs (social profiles), contactPoint

**WebSite Schema** (schema/website.json)
- Use on: Every page (in header)
- Purpose: Define your website
- Required: name, url
- Optional: potentialAction (search functionality)

**WebPage Schema** (automatically included)
- Use on: Every page
- Purpose: Define individual page
- Required: name, description, url

**FAQPage Schema** (schema/faq.json)
- Use on: FAQ pages, service pages with FAQs
- Purpose: Get featured in AI answers
- Required: Array of questions and answers
- Note: Each Q&A is a separate entity

**Article Schema** (schema/article.json)
- Use on: Blog posts, guides, tutorials
- Purpose: Establish content authority
- Required: headline, author, datePublished
- Optional: image, publisher, dateModified

**HowTo Schema** (schema/howto.json)
- Use on: Tutorial pages, instructional content
- Purpose: Step-by-step citation
- Required: name, step array
- Optional: tool, supply, time

**Product Schema** (schema/product.json)
- Use on: Product pages (e-commerce)
- Purpose: Shopping recommendations
- Required: name, image, description
- Optional: offers (price), aggregateRating, review

**LocalBusiness Schema** (schema/localbusiness.json)
- Use on: Homepage, contact page (for local businesses)
- Purpose: Local search and "near me" queries
- Required: name, address, telephone
- Optional: openingHours, priceRange, geo

**Service Schema** (included in templates)
- Use on: Service pages
- Purpose: Define services offered
- Required: name, provider, serviceType

**Person/Author Schema** (included in templates)
- Use on: About page, author bio
- Purpose: Establish personal authority
- Required: name
- Optional: jobTitle, worksFor, sameAs

## Content Templates by Business Type

### Professional Services Template
```
- Homepage: Who you serve + How you help
- Services: Individual page per service with FAQ
- About: Credentials, experience, methodology
- Blog: Answer client questions
- Resources: Downloadable guides
- Contact: Clear CTA, multiple contact methods
```

### E-commerce Template
```
- Homepage: Featured products + current promotions
- Category pages: Product collections
- Product pages: Detailed specs + reviews + schema
- Gift guides: "Best X for Y" collections
- Blog: Product tutorials and comparisons
- FAQ: Shipping, returns, product care
```

### Local Business Template
```
- Homepage: Location, hours, services, reviews
- Services: What you offer with pricing
- About: Story, team, community involvement
- Blog: Local tips related to your business
- Contact: Map, form, phone, directions
- FAQ: Common customer questions
```

### Content Creator Template
```
- Homepage: Who you help + What topics
- Learning center: Hub page with topic clusters
- Tutorials: Individual how-to guides
- Resources: Tools, downloads, links
- About: Expertise and credentials
- Blog: Regular educational content
```

## Measuring AEO Success

### Week 1-4: Foundation Metrics
- Pages indexed by Google
- Schema validation (zero errors)
- Site speed (< 3 seconds)
- Mobile usability (100%)

### Month 2-3: Engagement Metrics
- Organic traffic trend
- Average time on page
- Pages per session
- Bounce rate improvement

### Month 3-6: AI Citation Metrics
- Questions where you're cited
- Citation frequency
- Which content gets cited
- Competitor citation comparison

### Month 6+: Business Metrics
- Leads from organic search
- Revenue from organic traffic
- Brand search volume
- Return visitor rate

## Advanced Optimization

Once basic implementation is complete:

### Phase 2: Content Expansion
- Create topic clusters (1 hub + 5-10 spokes)
- Add video content with transcripts
- Build comprehensive resource pages
- Develop original research/data

### Phase 3: Technical Enhancement
- Implement breadcrumb schema
- Add SiteNavigationElement schema
- Create XML sitemap
- Optimize Core Web Vitals
- Add structured data for images

### Phase 4: Authority Building
- Earn backlinks from authoritative sites
- Guest post with schema markup
- Create shareable original content
- Build social proof (reviews, testimonials)

### Phase 5: Multimodal Optimization
- Optimize for voice search
- Add image alt text and schema
- Create video content with metadata
- Implement audio content (podcasts)

## Troubleshooting

### Schema Not Validating
- Use Google's Rich Results Test
- Check for syntax errors (missing commas, brackets)
- Ensure required fields are present
- Validate JSON format

### Not Getting AI Citations
- Ensure content directly answers questions
- Check schema is properly implemented
- Verify pages are indexed by Google
- Content may need more authority signals

### Slow Load Times
- Optimize images (compress, resize)
- Minimize CSS/JS
- Enable browser caching
- Use CDN for assets
- Check hosting performance

### Poor Mobile Experience
- Test with Google Mobile-Friendly Test
- Use responsive CSS (included)
- Check touch targets are large enough
- Ensure text is readable without zooming

## Support and Resources

### Schema Resources
- Schema.org official documentation
- Google's Structured Data Guidelines
- Schema Markup Validator
- Rich Results Test

### AEO Learning
- Refer to main AEO book (all 12 chapters)
- Industry-specific use cases (use-cases folder)
- Test in multiple AI engines regularly
- Join SEO/AEO communities

### Updates and Maintenance
- Review content quarterly
- Update schema as new types emerge
- Test in new AI platforms
- Refresh dates and year references

## Version History

**v1.0 (2025)** - Initial release
- Complete HTML templates
- 10 schema types included
- CSS framework
- JavaScript utilities
- Full documentation

## License

Same license as the AEO book. Free to use and modify for your business.

## Credits

Built based on the 12-chapter AEO (Answer Engine Optimization) marketing book for beginners.

Designed to work for any business type - just customize the content!

---

## Next Steps

1. **Read the implementation guide** (`implementation-guide.md`)
2. **Start with schema setup** (customize `/schema/organization.json`)
3. **Modify the homepage** (`index.html`)
4. **Create your first service page** (use templates)
5. **Write your first blog post** (answer a common question)
6. **Test in AI engines** (ChatGPT, Perplexity)
7. **Monitor and iterate**

Your AEO-optimized website journey starts now!
