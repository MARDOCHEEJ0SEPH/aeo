# Chapter 4: Technical Setup for Local Restaurants

## Schema Markup, Google Business Profile, and Technical Implementation

This chapter covers the technical aspects that make your BBQ restaurant discoverable by AI engines.

## Google Business Profile Optimization (Critical)

###Complete Profile Checklist

**Basic Information:**
- [ ] Business name (exact match to signage)
- [ ] Category: "Barbecue restaurant" (primary)
- [ ] Additional categories: Restaurant, American restaurant, etc.
- [ ] Address (exactly as it appears)
- [ ] Service area (if delivery/catering)
- [ ] Phone number (local, tracks to your restaurant)
- [ ] Website URL
- [ ] Hours (including special hours for holidays)

**Detailed Information:**
- [ ] Opening date
- [ ] Attributes (outdoor seating, takeout, dine-in, etc.)
- [ ] Payment methods accepted
- [ ] Accessibility features
- [ ] Parking options
- [ ] Wi-Fi availability
- [ ] Reservations policy
- [ ] Wait time estimates

**Menu Upload:**
- [ ] Full menu with prices
- [ ] Menu sections organized
- [ ] Item descriptions
- [ ] Photos for each popular item

**Photos (Minimum 50):**
- [ ] Logo/cover photo
- [ ] Exterior (5+)
- [ ] Interior (10+)
- [ ] Food items (25+)
- [ ] Team/kitchen (5+)
- [ ] Menu boards (3+)

**Posts (Weekly):**
- [ ] Weekly specials
- [ ] Events
- [ ] Updates
- [ ] Offers

**Messaging:**
- [ ] Enable messaging
- [ ] Set up auto-replies
- [ ] Respond within 24 hours

**Q&A:**
- [ ] Answer all questions
- [ ] Seed your own questions (common FAQs)

**Reviews:**
- [ ] Respond to ALL reviews (positive and negative)
- [ ] Within 48 hours of posting

## Schema Markup Implementation

### LocalBusiness Schema (Required)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "Your BBQ Restaurant Name",
  "image": "https://yoursite.com/images/restaurant-photo.jpg",
  "@id": "https://yoursite.com",
  "url": "https://yoursite.com",
  "telephone": "+1-512-555-0123",
  "priceRange": "$$",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Main Street",
    "addressLocality": "Austin",
    "addressRegion": "TX",
    "postalCode": "78701",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 30.2672,
    "longitude": -97.7431
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday"],
      "opens": "11:00",
      "closes": "21:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Friday", "Saturday"],
      "opens": "11:00",
      "closes": "22:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Sunday",
      "opens": "12:00",
      "closes": "20:00"
    }
  ],
  "servesCuisine": "American, Barbecue",
  "acceptsReservations": "False",
  "menu": "https://yoursite.com/menu",
  "sameAs": [
    "https://facebook.com/yourrestaurant",
    "https://instagram.com/yourrestaurant",
    "https://twitter.com/yourrestaurant"
  ]
}
</script>
```

### Menu Schema

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Menu",
  "name": "[Your Restaurant] Menu",
  "description": "Authentic Texas BBQ menu",
  "hasMenuSection": [
    {
      "@type": "MenuSection",
      "name": "Meats",
      "hasMenuItem": [
        {
          "@type": "MenuItem",
          "name": "14-Hour Smoked Brisket",
          "description": "Our signature brisket smoked for 14 hours over post oak",
          "offers": {
            "@type": "Offer",
            "price": "16.00",
            "priceCurrency": "USD"
          }
        }
      ]
    }
  ]
}
</script>
```

### Review/Rating Schema

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "Your Restaurant",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "127"
  }
}
</script>
```

## NAP Consistency (Name, Address, Phone)

### Citation Audit Checklist

Ensure identical information on:

**Essential Platforms:**
- [ ] Google Business Profile
- [ ] Yelp
- [ ] Facebook Business Page
- [ ] TripAdvisor
- [ ] Your website
- [ ] Bing Places

**Additional Citations:**
- [ ] Yellow Pages
- [ ] BBB (Better Business Bureau)
- [ ] Chamber of Commerce
- [ ] City/local directories
- [ ] Zomato
- [ ] OpenTable (if applicable)

**Format Consistency:**

**Correct:**
"Joe's BBQ"
"123 Main Street"
"(512) 555-0123"

**Incorrect Variations:**
"Joe's BBQ Restaurant" ❌
"123 Main St" ❌
"512-555-0123" ❌
"512.555.0123" ❌

Pick ONE format, use everywhere.

## Website Technical Requirements

### Mobile Optimization

**Test on:**
- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] Tablet

**Required:**
- [ ] Text readable without zooming
- [ ] Buttons easy to tap (not too small)
- [ ] No horizontal scrolling
- [ ] Forms work properly
- [ ] Phone number clickable (calls when tapped)
- [ ] Address clickable (opens maps)

### Page Speed

**Target:** Under 3 seconds load time

**Quick Fixes:**
- Compress images
- Enable caching
- Minimize code
- Use fast hosting

**Test at:** PageSpeed Insights (Google)

### Core Pages Needed

**Minimum:**
1. Homepage
2. Menu
3. Location/Contact
4. About
5. FAQ

**Recommended:**
6. Catering
7. Gallery
8. Reviews/Testimonials
9. Specials/Events

### Embedded Google Map

```html
<iframe
  src="https://www.google.com/maps/embed?pb=YOUR_EMBED_CODE"
  width="600"
  height="450"
  style="border:0;"
  allowfullscreen=""
  loading="lazy">
</iframe>
```

Improves local relevance.

## Local SEO Technical Elements

### Title Tags

**Homepage:**
"[Restaurant Name] | Best BBQ in [City], [State] | Authentic [Style] BBQ"

**Menu Page:**
"Menu | [Restaurant Name] | [City] BBQ Restaurant"

**Location Page:**
"Visit Us | [Restaurant Name] | [Address], [City], [State]"

### Meta Descriptions

```
"[Restaurant Name] serves authentic [style] BBQ in [City]. Our 14-hour smoked brisket and award-winning ribs make us [City]'s favorite BBQ destination. Visit us at [address]."
```

150-160 characters, includes:
- Restaurant name
- Cuisine/specialty
- Location
- Unique selling point
- Call-to-action

### Header Tags

```html
<h1>[Restaurant Name] - Best BBQ in [City]</h1>
<h2>Authentic [Style] BBQ Since [Year]</h2>
<h3>Our Signature Dishes</h3>
```

Only ONE H1 per page (main title).

## Action Items

- [ ] Complete Google Business Profile to 100%
- [ ] Add LocalBusiness schema to homepage
- [ ] Add Menu schema to menu page
- [ ] Audit NAP consistency across 15+ platforms
- [ ] Fix any discrepancies immediately
- [ ] Test website on mobile devices
- [ ] Check page load speed, optimize if needed
- [ ] Embed Google Map on contact page
- [ ] Upload menu to Google Business Profile
- [ ] Set up weekly Google Business posting schedule

## Chapter Summary

- Google Business Profile is your #1 priority for local AEO
- Schema markup helps AI understand your restaurant details
- NAP consistency across all platforms is critical
- Mobile optimization is non-negotiable
- Fast page speed improves both user experience and AI crawling
- Technical setup enables everything else to work

---

[← Previous: Chapter 3](chapter-03-content.md) | [Module Home](README.md) | [Next: Chapter 5 - Measurement →](chapter-05-measurement.md)
