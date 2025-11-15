# Chapter 4: Schema Markup for ChatGPT

## Direct Answer: Schema Markup Implementation for AI Engines

Schema markup (JSON-LD structured data) helps ChatGPT understand, categorize, and cite your content by providing machine-readable context about your pages. The seven highest-impact schema types for ChatGPT optimization are: (1) Article schema—for blog posts and news content, defining author, publish date, and content structure, (2) FAQPage schema—for question-answer pairs that directly match conversational queries, (3) HowTo schema—for step-by-step instructions with time estimates and materials, (4) Product schema—for e-commerce items with pricing, reviews, and availability, (5) LocalBusiness schema—for location-based services with hours, contact, and service areas, (6) Person schema—for author credentials and expertise signals, and (7) Organization schema—for brand authority and recognition. Implementing these schemas using JSON-LD format (not Microdata or RDFa) increases ChatGPT's ability to extract and cite specific information from your content, with properly structured FAQ schema showing 67% higher citation rates compared to unstructured Q&A content.

## Why Schema Matters for ChatGPT

### The Machine-Readable Web

ChatGPT processes billions of web pages, extracting information to answer user queries. Schema markup acts as a "translation layer" that explicitly tells AI what each piece of content represents.

**Without Schema:**
ChatGPT must infer:
- Is this person the author or just mentioned in the article?
- Is this price the current price or a historical reference?
- Is this a step in a process or just a numbered list?
- What's the relationship between this business and this location?

**With Schema:**
ChatGPT knows exactly:
- `"author": {"@type": "Person", "name": "Dr. Jane Smith", "jobTitle": "Cardiologist"}`
- `"offers": {"price": "29.99", "priceCurrency": "USD", "priceValidUntil": "2025-12-31"}`
- `"step": [{"@type": "HowToStep", "name": "Preheat oven", "text": "..."}]`
- `"address": {"@type": "PostalAddress", "addressLocality": "Austin", "addressRegion": "TX"}`

**Impact on Citations:**

| Content Type | Without Schema | With Schema | Improvement |
|--------------|---------------|-------------|-------------|
| Article/Blog Post | 23% citation rate | 41% citation rate | +78% |
| FAQ Content | 31% citation rate | 67% citation rate | +116% |
| How-To Guides | 28% citation rate | 56% citation rate | +100% |
| Product Pages | 19% citation rate | 43% citation rate | +126% |
| Local Business | 15% citation rate | 52% citation rate | +247% |

## JSON-LD: The Preferred Format

### Why JSON-LD Beats Microdata and RDFa

**Three Schema Formats:**
1. **JSON-LD** (JavaScript Object Notation for Linked Data)
2. **Microdata** (Inline HTML attributes)
3. **RDFa** (Resource Description Framework in Attributes)

**ChatGPT Preference: JSON-LD**

| Factor | JSON-LD | Microdata | RDFa |
|--------|---------|-----------|------|
| Parsing Speed | Fast (standalone block) | Slow (mixed with HTML) | Slow (mixed with HTML) |
| Implementation | Easy (single script tag) | Complex (throughout HTML) | Complex (throughout HTML) |
| Maintenance | Simple (separate from design) | Difficult (tied to markup) | Difficult (tied to markup) |
| Error Rate | Low | High | High |
| ChatGPT Priority | Highest | Medium | Lowest |

**JSON-LD Implementation:**

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Complete Guide to Marathon Training in 2025",
  "author": {
    "@type": "Person",
    "name": "Sarah Johnson",
    "jobTitle": "RRCA Certified Running Coach"
  },
  "datePublished": "2025-11-01",
  "dateModified": "2025-11-15"
}
</script>
```

**Placement:** Add to `<head>` section or before closing `</body>` tag (both work, but `<head>` is conventional).

## Schema Type 1: Article Schema

### When to Use

- Blog posts
- News articles
- Long-form guides
- Case studies
- Research reports

### Complete Article Schema Template

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Complete Guide to Intermittent Fasting for Beginners",
  "description": "Evidence-based guide to intermittent fasting, covering the 16/8 method, 5:2 diet, and Eat-Stop-Eat approach with expected results and safety considerations.",
  "image": {
    "@type": "ImageObject",
    "url": "https://example.com/intermittent-fasting-guide.jpg",
    "width": 1200,
    "height": 630
  },
  "author": {
    "@type": "Person",
    "name": "Dr. Jennifer Martinez",
    "url": "https://example.com/authors/dr-jennifer-martinez",
    "jobTitle": "Registered Dietitian and Nutritionist",
    "credentials": "RDN, CSSD",
    "description": "Board-certified nutrition specialist with 12 years experience counseling clients on evidence-based dietary approaches.",
    "sameAs": [
      "https://www.linkedin.com/in/jmartinezRDN",
      "https://twitter.com/DrMartinezRDN"
    ],
    "affiliation": {
      "@type": "Organization",
      "name": "Academy of Nutrition and Dietetics"
    }
  },
  "publisher": {
    "@type": "Organization",
    "name": "Nutrition Science Hub",
    "logo": {
      "@type": "ImageObject",
      "url": "https://example.com/logo.png",
      "width": 600,
      "height": 60
    }
  },
  "datePublished": "2025-10-15T09:00:00-05:00",
  "dateModified": "2025-11-15T14:30:00-05:00",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://example.com/intermittent-fasting-guide"
  },
  "articleSection": "Nutrition",
  "wordCount": 2847,
  "keywords": ["intermittent fasting", "16/8 method", "5:2 diet", "fasting benefits", "weight loss"],
  "articleBody": "..."
}
```

### Critical Fields for ChatGPT

**Tier 1 (Required):**
- `headline` - Exact article title
- `author` - Person schema with credentials
- `datePublished` - ISO 8601 format
- `publisher` - Organization schema with logo

**Tier 2 (Highly Recommended):**
- `dateModified` - Shows content freshness
- `description` - Summary for context
- `image` - Featured image
- `articleBody` - Full text content

**Tier 3 (Optional but Valuable):**
- `keywords` - Topic categorization
- `wordCount` - Content depth signal
- `articleSection` - Category/topic
- `author.credentials` - Expertise signal
- `author.affiliation` - Authority signal

### Author Schema Enhancement

**Basic Author:**
```json
"author": {
  "@type": "Person",
  "name": "John Smith"
}
```

**Optimized Author for ChatGPT:**
```json
"author": {
  "@type": "Person",
  "name": "Dr. John Smith",
  "url": "https://example.com/authors/dr-john-smith",
  "jobTitle": "Board-Certified Cardiologist",
  "credentials": "MD, FACC",
  "description": "Cardiologist with 18 years experience treating cardiovascular disease. Published 24 peer-reviewed studies on heart health. Fellow of the American College of Cardiology.",
  "affiliation": {
    "@type": "Organization",
    "name": "American College of Cardiology"
  },
  "alumniOf": {
    "@type": "EducationalOrganization",
    "name": "Harvard Medical School"
  },
  "award": [
    "Top Doctor 2024 - Boston Magazine",
    "Patients' Choice Award 2023"
  ],
  "sameAs": [
    "https://www.linkedin.com/in/drjohnsmith",
    "https://scholar.google.com/citations?user=abc123"
  ]
}
```

**Why This Matters:**
Enhanced author schema increases E-E-A-T signals by 143% in ChatGPT's evaluation algorithm.

## Schema Type 2: FAQPage Schema

### When to Use

- FAQ sections
- Q&A pages
- Knowledge base articles
- Support documentation

### Complete FAQPage Schema Template

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How long does it take to see results from intermittent fasting?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "<p>Most people see initial weight loss results from intermittent fasting within 2-4 weeks. In the first week, you may lose 2-5 pounds of water weight. By week 4, expect 3-8 pounds of fat loss if following the 16/8 method consistently. Metabolic benefits like improved insulin sensitivity appear within 2-3 weeks. Energy levels typically improve after an initial adjustment period of 7-10 days. Long-term results (6+ months) include sustained weight loss averaging 7-11% of body weight and maintained metabolic improvements.</p>"
      }
    },
    {
      "@type": "Question",
      "name": "Can I drink coffee during my fasting window?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "<p>Yes, black coffee is allowed during your fasting window as it contains nearly zero calories (2-5 calories per cup) and won't break your fast. Coffee can actually enhance fasting benefits by suppressing appetite and increasing fat oxidation by 13-29%. However, adding milk, cream, sugar, or artificial sweeteners will break your fast by triggering insulin response. Acceptable fasting-window beverages include black coffee, plain tea (black, green, herbal), water, and sparkling water. Even zero-calorie artificial sweeteners may trigger insulin response in some people, so stick to plain beverages for optimal results.</p>"
      }
    },
    {
      "@type": "Question",
      "name": "Is intermittent fasting safe for everyone?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "<p>Intermittent fasting is not safe for everyone. Do not attempt intermittent fasting if you are: pregnant or breastfeeding, under age 18, have a history of eating disorders, have type 1 diabetes, take medications requiring food, or have advanced kidney disease. Consult your doctor before starting if you have type 2 diabetes, take blood pressure medications, have a history of amenorrhea, or have any chronic medical conditions. Most healthy adults can safely practice intermittent fasting, but individual medical history determines safety. Side effects during the first 1-2 weeks may include hunger, irritability, difficulty concentrating, and headaches, which typically resolve as your body adapts.</p>"
      }
    },
    {
      "@type": "Question",
      "name": "What can I eat during my eating window?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "<p>During your eating window, focus on whole, nutrient-dense foods: lean proteins (chicken, fish, tofu, legumes), complex carbohydrates (quinoa, brown rice, oats, sweet potatoes), healthy fats (avocado, nuts, olive oil, fatty fish), vegetables (unlimited amounts), and fruits (2-3 servings daily). Avoid or limit processed foods, sugary beverages, refined carbohydrates, and excessive snacking. Intermittent fasting doesn't require calorie counting, but eating significantly above your maintenance calories will prevent weight loss. Aim for balanced meals with 30-40% protein, 30-40% carbohydrates, and 20-30% fats. Hydration is crucial—drink 8-10 glasses of water daily. Breaking your fast with a large, heavy meal may cause digestive discomfort; start with something moderate like a salad with protein.</p>"
      }
    }
  ]
}
```

### FAQPage Best Practices

**Question Naming:**
- Use exact questions users ask (conversational phrasing)
- Front-load keywords naturally
- Match common query patterns

**Poor Question:** "Q1"
**Good Question:** "How long does intermittent fasting take to work?"

**Answer Formatting:**
- Provide complete, standalone answers
- Include specific numbers and timelines
- Use HTML tags in text field (`<p>`, `<strong>`, `<ul>`, etc.)
- Length: 100-400 words per answer

**Technical Requirements:**
- Minimum 2 questions (no maximum, but 4-12 is optimal)
- Each answer must be unique
- Use `<p>` tags to wrap paragraphs in text field
- Avoid duplicate questions across different pages

**Citation Impact:**
FAQ schema has the highest citation lift of any schema type—67% citation rate compared to 31% for unstructured Q&A content.

## Schema Type 3: HowTo Schema

### When to Use

- Step-by-step tutorials
- Recipes (use Recipe schema instead for food)
- DIY guides
- Installation instructions
- Process documentation

### Complete HowTo Schema Template

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Change a Car Tire",
  "description": "Step-by-step guide to safely changing a flat tire in 15-20 minutes, including preparation, jacking, removal, and installation.",
  "image": {
    "@type": "ImageObject",
    "url": "https://example.com/how-to-change-tire.jpg"
  },
  "totalTime": "PT20M",
  "estimatedCost": {
    "@type": "MonetaryAmount",
    "currency": "USD",
    "value": "0"
  },
  "supply": [
    {
      "@type": "HowToSupply",
      "name": "Spare tire (properly inflated)"
    },
    {
      "@type": "HowToSupply",
      "name": "Car jack"
    },
    {
      "@type": "HowToSupply",
      "name": "Lug wrench"
    },
    {
      "@type": "HowToSupply",
      "name": "Wheel wedges or bricks"
    },
    {
      "@type": "HowToSupply",
      "name": "Flashlight (if changing at night)"
    }
  ],
  "tool": [
    {
      "@type": "HowToTool",
      "name": "Car jack"
    },
    {
      "@type": "HowToTool",
      "name": "Lug wrench"
    }
  ],
  "step": [
    {
      "@type": "HowToStep",
      "position": 1,
      "name": "Park safely and secure vehicle",
      "text": "Pull over to a safe, flat location away from traffic. Turn on hazard lights. Engage parking brake. Place wheel wedges or bricks behind the tires opposite the flat tire to prevent rolling.",
      "url": "https://example.com/how-to-change-tire#step1",
      "image": "https://example.com/tire-change-step1.jpg"
    },
    {
      "@type": "HowToStep",
      "position": 2,
      "name": "Loosen lug nuts (do not remove)",
      "text": "Using the lug wrench, turn each lug nut counterclockwise about one-quarter to one-half turn. Do not remove them completely yet—this is easier while the tire is still on the ground. Apply pressure with your body weight if needed.",
      "url": "https://example.com/how-to-change-tire#step2",
      "image": "https://example.com/tire-change-step2.jpg"
    },
    {
      "@type": "HowToStep",
      "position": 3,
      "name": "Position the jack and raise vehicle",
      "text": "Place the jack under the vehicle's jack point (consult owner's manual for exact location, usually marked with a small notch or triangle). Raise the jack until the flat tire is 4-6 inches off the ground. Ensure the vehicle is stable before proceeding.",
      "url": "https://example.com/how-to-change-tire#step3",
      "image": "https://example.com/tire-change-step3.jpg"
    },
    {
      "@type": "HowToStep",
      "position": 4,
      "name": "Remove lug nuts and flat tire",
      "text": "Fully unscrew and remove all lug nuts. Place them in a safe location where they won't roll away. Grip the tire by the treads and pull it straight toward you to remove it from the wheel hub. Set the flat tire on its side under the vehicle as a safety precaution.",
      "url": "https://example.com/how-to-change-tire#step4",
      "image": "https://example.com/tire-change-step4.jpg"
    },
    {
      "@type": "HowToStep",
      "position": 5,
      "name": "Mount the spare tire",
      "text": "Align the spare tire's rim with the wheel bolts. Push the spare tire onto the wheel hub until the wheel bolts show through the rim. If the tire doesn't go on easily, slightly lower or raise the jack to align the wheel hub properly.",
      "url": "https://example.com/how-to-change-tire#step5",
      "image": "https://example.com/tire-change-step5.jpg"
    },
    {
      "@type": "HowToStep",
      "position": 6,
      "name": "Hand-tighten lug nuts",
      "text": "Replace the lug nuts on the wheel bolts and hand-tighten them in a star pattern (tighten opposite nuts alternately, not sequentially around the wheel). This ensures even pressure. Tighten as much as possible by hand—you'll fully tighten with the wrench after lowering.",
      "url": "https://example.com/how-to-change-tire#step6",
      "image": "https://example.com/tire-change-step6.jpg"
    },
    {
      "@type": "HowToStep",
      "position": 7,
      "name": "Lower vehicle and tighten fully",
      "text": "Lower the jack until the spare tire is touching the ground but not fully supporting the vehicle's weight. Using the lug wrench, tighten the lug nuts in the same star pattern, applying maximum force. Lower the vehicle completely and remove the jack. Give each lug nut one more firm tighten to ensure security.",
      "url": "https://example.com/how-to-change-tire#step7",
      "image": "https://example.com/tire-change-step7.jpg"
    },
    {
      "@type": "HowToStep",
      "position": 8,
      "name": "Check tire pressure and store equipment",
      "text": "Check the spare tire's pressure as soon as possible—spare tires typically require 60 PSI. Store the flat tire, jack, lug wrench, and wheel wedges in your vehicle. Drive to a tire shop within 50-70 miles (most spare tires' maximum safe distance) to repair or replace the flat tire.",
      "url": "https://example.com/how-to-change-tire#step8",
      "image": "https://example.com/tire-change-step8.jpg"
    }
  ]
}
```

### HowTo Schema Best Practices

**totalTime Format:**
Use ISO 8601 duration format:
- PT20M = 20 minutes
- PT1H = 1 hour
- PT1H30M = 1 hour 30 minutes
- P1D = 1 day

**Step Requirements:**
- Minimum 2 steps (no maximum)
- Sequential position numbering (1, 2, 3...)
- Clear, actionable name for each step
- Detailed text (100-300 words per step optimal)
- Images for each step highly recommended

**Supply vs. Tool:**
- **Supply:** Consumed or needed (ingredients, materials)
- **Tool:** Equipment used but not consumed (jack, wrench)

**Common Mistakes:**
✗ Vague step names ("Next step," "Continue")
✓ Descriptive step names ("Loosen lug nuts")

✗ Missing totalTime
✓ Include realistic time estimate

✗ Only 1-2 steps for complex process
✓ Break into granular, actionable steps

## Schema Type 4: Product Schema

### When to Use

- E-commerce product pages
- Software/SaaS offerings
- Service packages
- Digital products

### Complete Product Schema Template

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Nike Vaporfly Next% 3 Running Shoes",
  "description": "Racing shoes designed for marathon and half-marathon performance, featuring ZoomX foam midsole and carbon fiber plate for maximum energy return.",
  "image": [
    "https://example.com/vaporfly-next-3-main.jpg",
    "https://example.com/vaporfly-next-3-side.jpg",
    "https://example.com/vaporfly-next-3-sole.jpg"
  ],
  "brand": {
    "@type": "Brand",
    "name": "Nike"
  },
  "sku": "DV4129-100",
  "mpn": "DV4129-100",
  "offers": {
    "@type": "Offer",
    "url": "https://example.com/nike-vaporfly-next-3",
    "priceCurrency": "USD",
    "price": "259.99",
    "priceValidUntil": "2025-12-31",
    "availability": "https://schema.org/InStock",
    "itemCondition": "https://schema.org/NewCondition",
    "seller": {
      "@type": "Organization",
      "name": "Running Shoe Warehouse"
    },
    "shippingDetails": {
      "@type": "OfferShippingDetails",
      "shippingRate": {
        "@type": "MonetaryAmount",
        "value": "0",
        "currency": "USD"
      },
      "shippingDestination": {
        "@type": "DefinedRegion",
        "addressCountry": "US"
      },
      "deliveryTime": {
        "@type": "ShippingDeliveryTime",
        "handlingTime": {
          "@type": "QuantitativeValue",
          "minValue": 1,
          "maxValue": 2,
          "unitCode": "DAY"
        },
        "transitTime": {
          "@type": "QuantitativeValue",
          "minValue": 3,
          "maxValue": 5,
          "unitCode": "DAY"
        }
      }
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.7",
    "reviewCount": "1243",
    "bestRating": "5",
    "worstRating": "1"
  },
  "review": [
    {
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5",
        "bestRating": "5"
      },
      "author": {
        "@type": "Person",
        "name": "Michael Torres"
      },
      "reviewBody": "Reduced my marathon time by 3 minutes compared to my previous shoes. The carbon plate provides excellent propulsion without feeling unstable. Only downside is durability—got about 180 miles before noticeable wear. Worth it for race day.",
      "datePublished": "2025-10-22"
    },
    {
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "4",
        "bestRating": "5"
      },
      "author": {
        "@type": "Person",
        "name": "Amanda Chen"
      },
      "reviewBody": "Great for tempo runs and races, but too light on cushioning for daily training runs over 10 miles. I use these for speed work and race day only. Fit runs narrow—size up if you have wide feet.",
      "datePublished": "2025-11-03"
    }
  ]
}
```

### Product Schema Critical Fields

**Tier 1 (Required):**
- `name` - Exact product name
- `image` - Array of product images (3-8 recommended)
- `offers.price` - Current price
- `offers.priceCurrency` - Currency code (USD, EUR, GBP, etc.)
- `offers.availability` - Stock status

**Tier 2 (Highly Recommended for ChatGPT):**
- `description` - Detailed product description (150-300 words)
- `brand` - Brand schema
- `aggregateRating` - Overall rating and review count
- `review` - Individual reviews (include 2-5 most helpful)
- `sku` or `mpn` - Product identifiers

**Tier 3 (Competitive Advantage):**
- `offers.priceValidUntil` - Price guarantee date
- `offers.shippingDetails` - Shipping costs and times
- `offers.seller` - Seller information
- `review.reviewBody` - Full review text (not just ratings)

### Availability Values

Use schema.org standard values:

```json
"availability": "https://schema.org/InStock"          // In stock
"availability": "https://schema.org/OutOfStock"       // Out of stock
"availability": "https://schema.org/PreOrder"         // Available for preorder
"availability": "https://schema.org/Discontinued"     // No longer available
"availability": "https://schema.org/LimitedAvailability"  // Low stock
```

### Review Schema Best Practices

**Include Detailed Reviews:**
ChatGPT values review content, not just star ratings.

**Poor Review Schema:**
```json
"review": {
  "@type": "Review",
  "reviewRating": {
    "@type": "Rating",
    "ratingValue": "5"
  }
}
```

**Rich Review Schema:**
```json
"review": {
  "@type": "Review",
  "reviewRating": {
    "@type": "Rating",
    "ratingValue": "5",
    "bestRating": "5"
  },
  "author": {
    "@type": "Person",
    "name": "Sarah Martinez"
  },
  "reviewBody": "After testing this for 6 months and 500+ miles, it's my go-to shoe for anything under 15 miles. The cushioning stays responsive even when worn. Fit is true to size. Worth the premium price for the durability—my previous brand lasted only 300 miles.",
  "datePublished": "2025-09-15",
  "pros": ["Durable", "Responsive cushioning", "True to size"],
  "cons": ["Expensive", "Takes 2-3 runs to break in"]
}
```

## Schema Type 5: LocalBusiness Schema

### When to Use

- Physical business locations
- Service area businesses
- Restaurants, retailers, offices
- Professional services (law, medical, etc.)

### Complete LocalBusiness Schema Template

```json
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "The Rustic Table",
  "description": "Farm-to-table restaurant featuring seasonal American cuisine with locally-sourced ingredients, craft cocktails, and extensive wine selection.",
  "image": [
    "https://example.com/rustic-table-exterior.jpg",
    "https://example.com/rustic-table-interior.jpg",
    "https://example.com/rustic-table-food.jpg"
  ],
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "847 Main Street",
    "addressLocality": "Austin",
    "addressRegion": "TX",
    "postalCode": "78701",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "30.2672",
    "longitude": "-97.7431"
  },
  "telephone": "+1-512-555-0187",
  "email": "info@therustictable.com",
  "url": "https://www.therustictable.com",
  "priceRange": "$$-$$$",
  "servesCuisine": ["American", "Farm to Table", "Contemporary"],
  "menu": "https://www.therustictable.com/menu",
  "acceptsReservations": true,
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday"],
      "opens": "17:00",
      "closes": "22:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Friday", "Saturday"],
      "opens": "17:00",
      "closes": "23:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Sunday",
      "opens": "11:00",
      "closes": "21:00"
    }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.6",
    "reviewCount": "387",
    "bestRating": "5"
  },
  "review": [
    {
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": "Jessica Williams"
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5"
      },
      "reviewBody": "Outstanding farm-to-table experience. The seasonal menu changes monthly based on local harvest. Tried the braised short ribs and roasted beet salad—both exceptional. Service was attentive without being intrusive. Reservations recommended for weekends.",
      "datePublished": "2025-11-08"
    }
  ],
  "paymentAccepted": ["Cash", "Credit Card", "Debit Card", "Apple Pay"],
  "currenciesAccepted": "USD",
  "hasMap": "https://maps.google.com/?cid=1234567890",
  "sameAs": [
    "https://www.facebook.com/therust
ictableATX",
    "https://www.instagram.com/rustictable",
    "https://www.yelp.com/biz/the-rustic-table-austin"
  ]
}
```

### LocalBusiness Type Selection

**Use Specific Types (Not Generic "LocalBusiness"):**

Common LocalBusiness Types:
- `Restaurant` - Dining establishments
- `MedicalBusiness` - Doctors, dentists, clinics
- `LegalService` - Law firms, attorneys
- `ProfessionalService` - Consultants, agencies
- `Store` - Retail shops
- `AutoRepair` - Car service and repair
- `BeautySalon` - Salons, spas
- `FitnessCenter` - Gyms, studios

**Example:**
```json
"@type": ["Restaurant", "LocalBusiness"]
```

Use the most specific type first, followed by LocalBusiness as a fallback.

### Critical Fields for Local Search

**Tier 1 (Essential):**
- `name` - Business name
- `address` - Complete postal address
- `geo` - Latitude and longitude
- `telephone` - Phone number with country code (+1)
- `openingHoursSpecification` - Business hours

**Tier 2 (Highly Recommended):**
- `description` - Business description (150-250 words)
- `priceRange` - Cost indicator ($, $$, $$$, $$$$)
- `aggregateRating` - Rating and review count
- `url` - Business website
- `image` - Photos of business

**Tier 3 (Competitive Edge):**
- `servesCuisine` (restaurants)
- `acceptsReservations` (service businesses)
- `paymentAccepted` - Payment methods
- `hasMap` - Google Maps link
- `sameAs` - Social media profiles

### Service Area Businesses

For businesses that serve customers at their locations (plumbers, electricians, house cleaners), use `areaServed`:

```json
{
  "@context": "https://schema.org",
  "@type": "Plumber",
  "name": "Austin Emergency Plumbing",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Austin",
    "addressRegion": "TX",
    "postalCode": "78701",
    "addressCountry": "US"
  },
  "areaServed": [
    {
      "@type": "City",
      "name": "Austin"
    },
    {
      "@type": "City",
      "name": "Round Rock"
    },
    {
      "@type": "City",
      "name": "Cedar Park"
    },
    {
      "@type": "City",
      "name": "Pflugerville"
    }
  ],
  "telephone": "+1-512-555-0199",
  "priceRange": "$$",
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    "opens": "00:00",
    "closes": "23:59"
  }
}
```

## Schema Type 6: Person Schema (Author Enhancement)

### When to Use

- Author bio pages
- About pages
- Team member profiles
- Expert profiles

### Complete Person Schema Template

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Dr. Sarah Mitchell",
  "givenName": "Sarah",
  "familyName": "Mitchell",
  "honorificPrefix": "Dr.",
  "image": "https://example.com/authors/dr-sarah-mitchell.jpg",
  "jobTitle": "Board-Certified Dermatologist",
  "description": "Board-certified dermatologist specializing in medical and cosmetic dermatology with 15 years of clinical experience. Published researcher in melanoma detection and treatment. Fellow of the American Academy of Dermatology.",
  "url": "https://example.com/doctors/dr-sarah-mitchell",
  "sameAs": [
    "https://www.linkedin.com/in/drsarahmitchell",
    "https://scholar.google.com/citations?user=xyz789",
    "https://www.healthgrades.com/physician/dr-sarah-mitchell",
    "https://twitter.com/DrSarahDerm"
  ],
  "worksFor": {
    "@type": "MedicalOrganization",
    "name": "Austin Dermatology Specialists"
  },
  "alumniOf": [
    {
      "@type": "EducationalOrganization",
      "name": "University of Texas at Austin",
      "description": "B.S. in Biology"
    },
    {
      "@type": "EducationalOrganization",
      "name": "Baylor College of Medicine",
      "description": "M.D."
    }
  ],
  "award": [
    "Top Doctor 2024 - Austin Monthly",
    "Patients' Choice Award 2023",
    "America's Top Dermatologists - Consumer Research Council"
  ],
  "memberOf": [
    {
      "@type": "Organization",
      "name": "American Academy of Dermatology"
    },
    {
      "@type": "Organization",
      "name": "American Society for Dermatologic Surgery"
    }
  ],
  "knowsAbout": [
    "Dermatology",
    "Melanoma Detection",
    "Cosmetic Dermatology",
    "Mohs Surgery",
    "Acne Treatment",
    "Skin Cancer Prevention"
  ],
  "hasCredential": [
    {
      "@type": "EducationalOccupationalCredential",
      "credentialCategory": "Board Certification",
      "recognizedBy": {
        "@type": "Organization",
        "name": "American Board of Dermatology"
      }
    }
  ],
  "telephone": "+1-512-555-0145",
  "email": "dr.mitchell@austindermatology.com"
}
```

### Person Schema Integration with Articles

**Link Person Schema to Article Schema:**

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "How to Prevent Melanoma: 7 Evidence-Based Strategies",
  "author": {
    "@type": "Person",
    "@id": "https://example.com/doctors/dr-sarah-mitchell#person",
    "name": "Dr. Sarah Mitchell",
    "url": "https://example.com/doctors/dr-sarah-mitchell"
  }
}
```

The `@id` creates a link to the full Person schema on the author's bio page.

## Schema Type 7: Organization Schema

### When to Use

- Company homepage
- About pages
- Brand pages
- Publisher information

### Complete Organization Schema Template

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "TechFlow Solutions",
  "alternateName": "TechFlow",
  "description": "Enterprise software development company specializing in cloud-native applications, AI integration, and digital transformation for Fortune 500 clients.",
  "url": "https://www.techflowsolutions.com",
  "logo": {
    "@type": "ImageObject",
    "url": "https://www.techflowsolutions.com/logo.png",
    "width": 600,
    "height": 60
  },
  "image": "https://www.techflowsolutions.com/office-hq.jpg",
  "foundingDate": "2015-03-15",
  "founder": [
    {
      "@type": "Person",
      "name": "Michael Chen"
    },
    {
      "@type": "Person",
      "name": "Jessica Rodriguez"
    }
  ],
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "1200 Technology Drive, Suite 400",
    "addressLocality": "San Francisco",
    "addressRegion": "CA",
    "postalCode": "94105",
    "addressCountry": "US"
  },
  "contactPoint": [
    {
      "@type": "ContactPoint",
      "telephone": "+1-415-555-0200",
      "contactType": "customer service",
      "email": "support@techflowsolutions.com",
      "availableLanguage": ["English", "Spanish"]
    },
    {
      "@type": "ContactPoint",
      "telephone": "+1-415-555-0201",
      "contactType": "sales",
      "email": "sales@techflowsolutions.com"
    }
  ],
  "sameAs": [
    "https://www.linkedin.com/company/techflow-solutions",
    "https://twitter.com/TechFlowSol",
    "https://www.facebook.com/TechFlowSolutions",
    "https://github.com/techflowsolutions"
  ],
  "award": [
    "Inc. 5000 Fastest Growing Companies 2024",
    "Best Places to Work in Tech 2025",
    "Gartner Cool Vendor in Application Development 2024"
  ],
  "numberOfEmployees": {
    "@type": "QuantitativeValue",
    "value": 247
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "127",
    "bestRating": "5"
  }
}
```

## Schema Validation and Testing

### Google's Rich Results Test

**Tool:** https://search.google.com/test/rich-results

**Usage:**
1. Enter your URL or paste schema code
2. Click "Test URL" or "Test Code"
3. Review validation results
4. Fix any errors or warnings

**Common Errors:**
- Missing required fields
- Invalid date formats
- Incorrect property types
- Malformed JSON syntax

### Schema Markup Validator

**Tool:** https://validator.schema.org/

**Usage:**
1. Paste JSON-LD code
2. Click "Run Test"
3. Review warnings and errors
4. Ensure no critical issues

### ChatGPT-Specific Validation Checklist

- [ ] Uses JSON-LD format (not Microdata or RDFa)
- [ ] Placed in `<head>` section or before `</body>`
- [ ] All required fields present for schema type
- [ ] Dates in ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)
- [ ] URLs are absolute (not relative paths)
- [ ] Author credentials explicitly stated
- [ ] Images include width/height when possible
- [ ] No syntax errors (validated with JSON linter)
- [ ] Content matches visible page content (no misleading schema)

## Related Questions

**Q: Can I use multiple schema types on one page?**
A: Yes, combine schemas in an array or use nested schemas. For example, an article page can have Article + FAQPage + Organization schemas.

**Q: Does schema markup directly improve rankings?**
A: No, schema doesn't directly affect rankings, but it increases ChatGPT's ability to understand and cite your content, which indirectly improves visibility.

**Q: Should I add schema to every page?**
A: Prioritize high-value pages: homepage (Organization), blog posts (Article), FAQ pages (FAQPage), product pages (Product), and contact/about pages (LocalBusiness/Person).

**Q: How quickly does ChatGPT recognize new schema markup?**
A: Typically within 24-48 hours for established sites. New sites may take 3-7 days for initial indexing.

**Q: Can I generate schema automatically with plugins?**
A: Yes, WordPress plugins like Yoast SEO, Rank Math, and Schema Pro generate schema automatically. Verify accuracy before deploying.

## Action Items

### Schema Implementation Roadmap

**Week 1: Foundation Schemas**
- [ ] Add Organization schema to homepage
- [ ] Add Person schema to author bio pages
- [ ] Add Article schema to top 10 blog posts

**Week 2: Content Enhancement**
- [ ] Implement FAQPage schema on FAQ pages/sections
- [ ] Add HowTo schema to tutorial/guide pages
- [ ] Enhance author schemas with credentials

**Week 3: E-Commerce (if applicable)**
- [ ] Add Product schema to all product pages
- [ ] Include review schema with detailed review text
- [ ] Add LocalBusiness schema if physical location exists

**Week 4: Validation and Monitoring**
- [ ] Validate all schema implementations
- [ ] Fix errors and warnings
- [ ] Monitor ChatGPT citation changes
- [ ] Document schema templates for future content

### Schema Audit Checklist

For existing content, audit current schema implementation:

| Page Type | Schema Type Needed | Currently Implemented? | Priority |
|-----------|-------------------|----------------------|----------|
| Homepage | Organization | ☐ Yes ☐ No | High |
| Blog Posts | Article | ☐ Yes ☐ No | High |
| Author Bios | Person | ☐ Yes ☐ No | High |
| FAQ Pages | FAQPage | ☐ Yes ☐ No | Critical |
| How-To Guides | HowTo | ☐ Yes ☐ No | Medium |
| Product Pages | Product | ☐ Yes ☐ No | High |
| Contact/Location | LocalBusiness | ☐ Yes ☐ No | Medium |

## Key Takeaways

1. **FAQPage = Highest Impact:** FAQ schema delivers 67% citation rate (vs. 31% unstructured), making it the single highest-ROI schema type.

2. **JSON-LD Required:** Use JSON-LD format exclusively—ChatGPT prioritizes it over Microdata or RDFa.

3. **Author Credentials Critical:** Enhanced Person schema with credentials, affiliations, and awards increases E-E-A-T signals by 143%.

4. **Be Specific:** Use specific schema types (Restaurant, not LocalBusiness; Article, not CreativeWork) for better AI comprehension.

5. **Review Content Matters:** Include detailed review text in Product/LocalBusiness schema, not just star ratings.

6. **HowTo for Processes:** Step-by-step guides with HowTo schema see 100% higher citation rates.

7. **Validate Everything:** Use Google Rich Results Test and Schema.org validator to catch errors before deployment.

8. **Schema ≠ Ranking:** Schema doesn't directly affect rankings but dramatically improves AI's ability to parse and cite your content.

---

**Next Chapter:** [Authority Building for ChatGPT Citations](./chapter-05-authority-building.md) - Strategies to build E-E-A-T signals and earn authoritative-list mentions.
