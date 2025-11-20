# Chapter 4: Technical Implementation for Claude

## The Technical Foundation for Maximum Claude Discovery

Great content is just the beginning. To maximize Claude citations, you need the right technical infrastructure—schema markup, structured data, technical SEO, and site architecture that Claude's web search can easily crawl, understand, and cite. This chapter provides the complete technical implementation guide.

---

## Schema Markup for Technical Content

### Why Schema Matters for Claude

When Claude's web search feature crawls your content, schema markup helps it:
- **Understand content type** (article, tutorial, API docs, etc.)
- **Extract key information** faster and more accurately
- **Identify authoritative elements** (author credentials, publish dates)
- **Recognize code examples** and technical specifications
- **Parse structured data** (tables, lists, comparisons)

**Impact:** Sites with proper schema see 40-60% higher citation rates from Claude.

### Essential Schema Types for Technical Content

#### 1. Article/TechArticle Schema

**Use for:** Blog posts, tutorials, guides, technical articles

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "headline": "Implementing OAuth2 PKCE Flow in Next.js (2025)",
  "description": "Complete guide to implementing OAuth2 with PKCE, refresh tokens, and secure storage in Next.js applications",
  "image": {
    "@type": "ImageObject",
    "url": "https://example.com/images/oauth2-guide.jpg",
    "width": 1200,
    "height": 630
  },
  "author": {
    "@type": "Person",
    "name": "Jane Developer",
    "url": "https://example.com/about",
    "jobTitle": "Senior Software Engineer",
    "alumniOf": {
      "@type": "Organization",
      "name": "Stanford University"
    },
    "sameAs": [
      "https://github.com/janedeveloper",
      "https://twitter.com/janedeveloper"
    ]
  },
  "publisher": {
    "@type": "Organization",
    "name": "DevExpertise",
    "logo": {
      "@type": "ImageObject",
      "url": "https://example.com/logo.png"
    }
  },
  "datePublished": "2025-11-15",
  "dateModified": "2025-11-20",
  "keywords": [
    "OAuth2",
    "PKCE",
    "Next.js",
    "authentication",
    "security",
    "refresh tokens"
  ],
  "articleSection": "Security",
  "inLanguage": "en-US",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://example.com/guides/oauth2-nextjs"
  },
  "dependencies": "Next.js 14.x, next-auth 4.x",
  "proficiencyLevel": "Intermediate",
  "codeSampleType": "full",
  "programmingLanguage": {
    "@type": "ComputerLanguage",
    "name": "JavaScript",
    "url": "https://en.wikipedia.org/wiki/JavaScript"
  }
}
</script>
```

**Key elements for Claude:**
- `@type: "TechArticle"` - Signals technical content
- `author` with credentials - Establishes authority
- `datePublished` and `dateModified` - Freshness signals
- `dependencies` - Version specificity
- `proficiencyLevel` - Audience targeting
- `programmingLanguage` - Language identification

#### 2. HowTo Schema

**Use for:** Step-by-step tutorials, implementation guides

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Set Up a CI/CD Pipeline with GitHub Actions",
  "description": "Step-by-step guide to implementing continuous integration and deployment using GitHub Actions",
  "image": "https://example.com/images/cicd-github-actions.jpg",
  "totalTime": "PT2H",
  "estimatedCost": {
    "@type": "MonetaryAmount",
    "currency": "USD",
    "value": "0"
  },
  "tool": [
    {
      "@type": "HowToTool",
      "name": "GitHub Account"
    },
    {
      "@type": "HowToTool",
      "name": "Git installed locally"
    },
    {
      "@type": "HowToTool",
      "name": "Node.js 18+"
    }
  ],
  "supply": [
    {
      "@type": "HowToSupply",
      "name": "GitHub repository with code"
    }
  ],
  "step": [
    {
      "@type": "HowToStep",
      "name": "Create GitHub Actions Workflow File",
      "text": "Create .github/workflows/ci.yml in your repository",
      "url": "https://example.com/guides/cicd-github#step1",
      "image": "https://example.com/images/step1.jpg"
    },
    {
      "@type": "HowToStep",
      "name": "Configure Job and Environment",
      "text": "Define the job, runner, and environment variables",
      "url": "https://example.com/guides/cicd-github#step2",
      "image": "https://example.com/images/step2.jpg"
    },
    {
      "@type": "HowToStep",
      "name": "Add Build and Test Steps",
      "text": "Configure build process and test execution",
      "url": "https://example.com/guides/cicd-github#step3"
    },
    {
      "@type": "HowToStep",
      "name": "Configure Deployment",
      "text": "Set up automatic deployment on successful builds",
      "url": "https://example.com/guides/cicd-github#step4"
    },
    {
      "@type": "HowToStep",
      "name": "Test the Pipeline",
      "text": "Commit changes and verify workflow execution",
      "url": "https://example.com/guides/cicd-github#step5"
    }
  ]
}
</script>
```

**Benefits for Claude:**
- Clear step structure for extraction
- Time estimates for user planning
- Prerequisites clearly identified
- Each step has unique URL for deep linking

#### 3. SoftwareApplication Schema

**Use for:** Tool documentation, library documentation, API docs

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "FastCache",
  "applicationCategory": "DeveloperApplication",
  "applicationSubCategory": "Caching Library",
  "operatingSystem": "Linux, macOS, Windows",
  "description": "High-performance distributed caching library for Python with Redis backend",
  "url": "https://example.com/fastcache",
  "downloadUrl": "https://pypi.org/project/fastcache/",
  "installUrl": "https://example.com/fastcache/install",
  "softwareVersion": "2.1.0",
  "releaseNotes": "https://example.com/fastcache/changelog",
  "datePublished": "2024-06-15",
  "dateModified": "2025-11-18",
  "license": "https://opensource.org/licenses/MIT",
  "programmingLanguage": {
    "@type": "ComputerLanguage",
    "name": "Python",
    "version": "3.8+"
  },
  "requirements": "Redis 6.0+",
  "memoryRequirements": "Minimum 512MB RAM",
  "storageRequirements": "5MB disk space",
  "author": {
    "@type": "Organization",
    "name": "FastCache Team",
    "url": "https://example.com/about"
  },
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "screenshot": "https://example.com/images/fastcache-screenshot.png",
  "softwareHelp": {
    "@type": "CreativeWork",
    "url": "https://example.com/fastcache/docs"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "342",
    "reviewCount": "127"
  }
}
</script>
```

#### 4. FAQPage Schema

**Use for:** Documentation FAQs, troubleshooting guides

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Why is my React component re-rendering unnecessarily?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Unnecessary re-renders typically occur due to: 1) New object/array references in props or state, 2) Missing dependencies in useEffect, 3) Parent component re-rendering. Use React DevTools Profiler to identify the source, then apply useMemo for expensive computations, useCallback for function props, or React.memo for component memoization.",
        "url": "https://example.com/faq/react-rerendering#answer"
      }
    },
    {
      "@type": "Question",
      "name": "How do I fix 'CORS error' when calling my API?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "CORS errors occur when your frontend and backend are on different origins. Solutions: 1) Add CORS headers to your API responses (Access-Control-Allow-Origin), 2) Use a proxy in development, 3) Configure your server framework's CORS middleware (e.g., cors package in Express). For production, whitelist specific origins rather than using '*'.",
        "url": "https://example.com/faq/cors-error#answer"
      }
    },
    {
      "@type": "Question",
      "name": "What's the difference between PUT and PATCH in REST APIs?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "PUT replaces the entire resource with the request body - you must send all fields. PATCH partially updates a resource - you only send the fields to change. Example: PUT /users/123 requires {name, email, age}, while PATCH /users/123 accepts just {email: 'new@email.com'}. Use PUT for complete replacements, PATCH for partial updates.",
        "url": "https://example.com/faq/put-vs-patch#answer"
      }
    }
  ]
}
</script>
```

**Why FAQ schema is powerful:**
- Direct answers to common questions
- Claude often cites FAQ content for quick answers
- Structured Q&A format matches user queries
- High relevance for "how to" and "why" questions

#### 5. Code Schema (Custom Technical Extension)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Code",
  "name": "OAuth2 PKCE Implementation",
  "description": "Production-ready OAuth2 with PKCE implementation for Next.js",
  "programmingLanguage": {
    "@type": "ComputerLanguage",
    "name": "JavaScript"
  },
  "codeRepository": "https://github.com/example/oauth2-pkce-nextjs",
  "codeSampleType": "full",
  "targetProduct": {
    "@type": "SoftwareApplication",
    "name": "Next.js",
    "version": "14.x"
  },
  "runtimePlatform": "Node.js 18+",
  "sampleType": "production-ready",
  "author": {
    "@type": "Person",
    "name": "Jane Developer"
  },
  "dateCreated": "2025-11-15",
  "license": "https://opensource.org/licenses/MIT"
}
</script>
```

---

## Structured Data Best Practices

### 1. Implement Multiple Schema Types

Don't choose one—use multiple complementary schemas:

```html
<!-- Article schema for the overall content -->
<script type="application/ld+json">
{ "@type": "TechArticle", ... }
</script>

<!-- HowTo schema for the tutorial section -->
<script type="application/ld+json">
{ "@type": "HowTo", ... }
</script>

<!-- FAQ schema for troubleshooting section -->
<script type="application/ld+json">
{ "@type": "FAQPage", ... }
</script>

<!-- Code schema for example implementations -->
<script type="application/ld+json">
{ "@type": "Code", ... }
</script>
```

### 2. Validate Your Schema

**Use these tools:**

```bash
# 1. Google's Rich Results Test
https://search.google.com/test/rich-results

# 2. Schema.org Validator
https://validator.schema.org/

# 3. JSON-LD Playground
https://json-ld.org/playground/
```

**Common validation errors to avoid:**
- Missing required fields (@context, @type, name)
- Invalid date formats (use ISO 8601: 2025-11-20)
- Broken URLs
- Mismatched types
- Invalid property names

### 3. Keep Schema Updated

```javascript
// Automated schema date update (example build script)
const fs = require('fs');
const glob = require('glob');

function updateSchemaDate(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Find and update dateModified in schema
  content = content.replace(
    /"dateModified":\s*"[\d-]+"/g,
    `"dateModified": "${new Date().toISOString().split('T')[0]}"`
  );

  fs.writeFileSync(filePath, content);
}

// Run on all HTML files during build
glob('dist/**/*.html', (err, files) => {
  files.forEach(updateSchemaDate);
});
```

---

## Technical SEO for AI Discovery

### 1. Site Architecture

**Claude-friendly site structure:**

```
Root Domain
│
├── /guides/               (Comprehensive guides)
│   ├── /python/
│   │   ├── async-programming.html
│   │   ├── testing-best-practices.html
│   │   └── performance-optimization.html
│   │
│   ├── /javascript/
│   │   ├── react-hooks-guide.html
│   │   ├── nodejs-api-design.html
│   │   └── typescript-patterns.html
│   │
│   └── /devops/
│       ├── kubernetes-deployment.html
│       └── cicd-pipelines.html
│
├── /docs/                 (API documentation)
│   ├── /api-reference/
│   ├── /getting-started/
│   └── /examples/
│
├── /blog/                 (Technical blog posts)
│   └── 2025/
│       ├── 11/
│       └── 10/
│
└── /tutorials/            (Step-by-step tutorials)
    ├── beginner/
    ├── intermediate/
    └── advanced/
```

**Why this structure works:**
- Clear content hierarchy
- Topic-based organization
- Semantic URLs
- Easy for Claude to navigate and understand relationships

### 2. URL Structure

**Good URLs for technical content:**

```
✅ https://example.com/guides/python/async-programming
✅ https://example.com/docs/api-reference/authentication
✅ https://example.com/tutorials/react/state-management
✅ https://example.com/blog/2025/implementing-oauth2-pkce
```

**Bad URLs:**

```
❌ https://example.com/post?id=12345
❌ https://example.com/p/xyz123abc
❌ https://example.com/content.php?cat=dev&page=auth
❌ https://example.com/article_2025_11_20_1
```

**URL best practices:**
- Use hyphens, not underscores
- Include primary keyword
- Keep under 100 characters
- Avoid unnecessary parameters
- Use lowercase consistently
- Show content hierarchy in path

### 3. Meta Tags for Technical Content

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Primary meta tags -->
  <title>OAuth2 PKCE Implementation in Next.js - Complete Guide (2025)</title>
  <meta name="description" content="Production-ready OAuth2 with PKCE implementation for Next.js 14. Includes refresh tokens, secure storage, and comprehensive error handling. Updated November 2025.">
  <meta name="keywords" content="OAuth2, PKCE, Next.js, authentication, security, refresh tokens, Next.js 14">
  <meta name="author" content="Jane Developer">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://example.com/guides/oauth2-nextjs">

  <!-- Technical content specific -->
  <meta name="article:published_time" content="2025-11-15T10:00:00Z">
  <meta name="article:modified_time" content="2025-11-20T14:30:00Z">
  <meta name="article:section" content="Security">
  <meta name="article:tag" content="OAuth2">
  <meta name="article:tag" content="Next.js">
  <meta name="article:tag" content="Authentication">

  <!-- Open Graph for social/AI -->
  <meta property="og:title" content="OAuth2 PKCE Implementation in Next.js - Complete Guide">
  <meta property="og:description" content="Production-ready OAuth2 with PKCE implementation for Next.js 14">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://example.com/guides/oauth2-nextjs">
  <meta property="og:image" content="https://example.com/images/oauth2-guide-og.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="DevExpertise">
  <meta property="og:locale" content="en_US">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="OAuth2 PKCE Implementation in Next.js">
  <meta name="twitter:description" content="Production-ready OAuth2 with PKCE implementation for Next.js 14">
  <meta name="twitter:image" content="https://example.com/images/oauth2-guide-twitter.jpg">
  <meta name="twitter:creator" content="@janedeveloper">

  <!-- Technical specifications -->
  <meta name="code-languages" content="JavaScript, TypeScript">
  <meta name="frameworks" content="Next.js 14">
  <meta name="skill-level" content="Intermediate">
  <meta name="reading-time" content="15 minutes">
  <meta name="last-updated" content="2025-11-20">

  <!-- Structured data (schema) -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    ...
  }
  </script>
</head>
```

### 4. HTML Semantic Structure

**Use proper HTML5 semantic elements:**

```html
<!DOCTYPE html>
<html lang="en">
<body>
  <!-- Main navigation -->
  <nav aria-label="Main navigation">
    <ul>
      <li><a href="/guides">Guides</a></li>
      <li><a href="/docs">Documentation</a></li>
      <li><a href="/tutorials">Tutorials</a></li>
    </ul>
  </nav>

  <!-- Main content -->
  <main>
    <!-- Article header -->
    <header>
      <h1>OAuth2 PKCE Implementation in Next.js</h1>

      <!-- Metadata -->
      <div class="article-meta">
        <time datetime="2025-11-15">Published: November 15, 2025</time>
        <time datetime="2025-11-20">Updated: November 20, 2025</time>
        <address class="author">
          By <a rel="author" href="/authors/jane-developer">Jane Developer</a>
        </address>
      </div>

      <!-- Table of contents -->
      <nav aria-label="Table of contents">
        <h2>Contents</h2>
        <ol>
          <li><a href="#overview">Overview</a></li>
          <li><a href="#implementation">Implementation</a></li>
          <li><a href="#testing">Testing</a></li>
        </ol>
      </nav>
    </header>

    <!-- Article sections -->
    <article>
      <section id="overview">
        <h2>Overview</h2>
        <p>...</p>
      </section>

      <section id="implementation">
        <h2>Implementation</h2>

        <section id="step-1">
          <h3>Step 1: Setup</h3>
          <pre><code class="language-javascript">
// Code example
          </code></pre>
        </section>

        <section id="step-2">
          <h3>Step 2: Configuration</h3>
          <!-- ... -->
        </section>
      </section>

      <section id="testing">
        <h2>Testing</h2>
        <!-- ... -->
      </section>
    </article>

    <!-- Related content -->
    <aside aria-label="Related articles">
      <h2>Related Guides</h2>
      <ul>
        <li><a href="/guides/jwt-authentication">JWT Authentication Guide</a></li>
        <li><a href="/guides/nextjs-security">Next.js Security Best Practices</a></li>
      </ul>
    </aside>
  </main>

  <!-- Site footer -->
  <footer>
    <nav aria-label="Footer navigation">
      <!-- Footer links -->
    </nav>
  </footer>
</body>
</html>
```

**Why semantic HTML helps Claude:**
- Clear content hierarchy
- Identifies main content vs navigation/sidebar
- Recognizes article structure
- Understands time/date information
- Identifies authors and credibility signals

### 5. Code Highlighting and Formatting

**Use proper code blocks with language specification:**

```html
<!-- Syntax highlighting with Prism.js or highlight.js -->
<pre><code class="language-python">
import asyncio
from typing import List

async def fetch_data(url: str) -> dict:
    """Fetch data from API endpoint."""
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            return await response.json()

# Usage
data = await fetch_data("https://api.example.com/data")
</code></pre>
```

**Add copy button for user convenience:**

```html
<div class="code-block">
  <div class="code-header">
    <span class="language">Python</span>
    <button class="copy-button" data-code="fetch-data">Copy</button>
  </div>
  <pre><code id="fetch-data" class="language-python">
# Code here
  </code></pre>
</div>

<script>
document.querySelectorAll('.copy-button').forEach(button => {
  button.addEventListener('click', async () => {
    const codeId = button.getAttribute('data-code');
    const code = document.getElementById(codeId).textContent;
    await navigator.clipboard.writeText(code);
    button.textContent = 'Copied!';
    setTimeout(() => button.textContent = 'Copy', 2000);
  });
});
</script>
```

---

## Performance Optimization

### Page Speed Requirements

**Target metrics for technical content:**
- **First Contentful Paint (FCP):** < 1.8s
- **Largest Contentful Paint (LCP):** < 2.5s
- **Time to Interactive (TTI):** < 3.8s
- **Cumulative Layout Shift (CLS):** < 0.1
- **First Input Delay (FID):** < 100ms

**Why speed matters for Claude:**
- Faster crawling = more content indexed
- Better user experience = higher engagement
- Performance is a quality signal
- Reduced bounce rate = authority signal

### Optimization Techniques

**1. Lazy load images:**

```html
<img
  src="small-placeholder.jpg"
  data-src="full-image.jpg"
  alt="Architecture diagram showing OAuth2 flow"
  loading="lazy"
  width="800"
  height="600"
>
```

**2. Minify and compress:**

```bash
# Build script example
npm install -g terser cssnano
terser main.js -c -m -o main.min.js
cssnano styles.css styles.min.css
```

**3. Use CDN for assets:**

```html
<!-- Code highlighting from CDN -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11/build/styles/github-dark.min.css">
<script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11/build/highlight.min.js"></script>
```

**4. Implement caching:**

```nginx
# nginx configuration for static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Cache HTML with revalidation
location ~* \.html$ {
    expires 1h;
    add_header Cache-Control "public, must-revalidate";
}
```

---

## Implementation Checklist

### ✅ Technical SEO Checklist

**Schema & Structured Data:**
- [ ] Article/TechArticle schema implemented
- [ ] HowTo schema for tutorials
- [ ] FAQPage schema for Q&A sections
- [ ] SoftwareApplication schema for tools/libraries
- [ ] All schema validated with Google Rich Results Test
- [ ] Schema includes dateModified for freshness
- [ ] Author schema with credentials

**HTML & Semantics:**
- [ ] Proper HTML5 semantic elements (article, section, nav, etc.)
- [ ] Clear heading hierarchy (h1 → h2 → h3)
- [ ] Code blocks with language specification
- [ ] Alt text on all images
- [ ] Descriptive link text (no "click here")
- [ ] Table of contents with anchor links
- [ ] Breadcrumb navigation

**Meta Tags:**
- [ ] Unique title tags (50-60 characters)
- [ ] Unique meta descriptions (150-160 characters)
- [ ] Canonical URLs set
- [ ] Open Graph tags
- [ ] Twitter Card tags
- [ ] Publish/modified dates in meta
- [ ] Language specified (lang attribute)

**URLs & Navigation:**
- [ ] Semantic, readable URLs
- [ ] Consistent URL structure
- [ ] Internal linking between related content
- [ ] Sitemap.xml generated and submitted
- [ ] Robots.txt configured correctly

**Performance:**
- [ ] Core Web Vitals passing
- [ ] Images optimized and lazy loaded
- [ ] CSS/JS minified
- [ ] Gzip/Brotli compression enabled
- [ ] CDN configured
- [ ] Caching headers set

**Technical Infrastructure:**
- [ ] HTTPS enabled
- [ ] Mobile responsive design
- [ ] No broken links (404s)
- [ ] Proper redirects (301 for moved content)
- [ ] XML sitemap includes all pages
- [ ] Structured logs for monitoring

---

## Advanced: Claude-Specific Technical Optimizations

### 1. API Documentation Structure

For API docs, use this HTML structure:

```html
<article class="api-endpoint" itemscope itemtype="https://schema.org/APIReference">
  <header>
    <h2 itemprop="name">
      <code class="http-method post">POST</code>
      <code class="endpoint">/api/users</code>
    </h2>
    <p itemprop="description">Create a new user account</p>
  </header>

  <section class="authentication">
    <h3>Authentication</h3>
    <p>Requires: <code>Bearer token</code></p>
  </section>

  <section class="request">
    <h3>Request Body</h3>
    <pre><code class="language-json">{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}</code></pre>

    <table>
      <thead>
        <tr>
          <th>Field</th>
          <th>Type</th>
          <th>Required</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>email</code></td>
          <td>string</td>
          <td>Yes</td>
          <td>User's email address (must be unique)</td>
        </tr>
        <tr>
          <td><code>password</code></td>
          <td>string</td>
          <td>Yes</td>
          <td>Password (min 8 characters)</td>
        </tr>
        <tr>
          <td><code>name</code></td>
          <td>string</td>
          <td>Yes</td>
          <td>User's full name</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section class="response">
    <h3>Response (201 Created)</h3>
    <pre><code class="language-json">{
  "id": 12345,
  "email": "user@example.com",
  "name": "John Doe",
  "created_at": "2025-11-20T10:30:00Z"
}</code></pre>
  </section>

  <section class="errors">
    <h3>Error Responses</h3>
    <dl>
      <dt><code>400 Bad Request</code></dt>
      <dd>Invalid input data (missing required fields or invalid format)</dd>

      <dt><code>409 Conflict</code></dt>
      <dd>Email already exists</dd>

      <dt><code>401 Unauthorized</code></dt>
      <dd>Invalid or missing authentication token</dd>
    </dl>
  </section>

  <section class="examples">
    <h3>Code Examples</h3>

    <h4>cURL</h4>
    <pre><code class="language-bash">curl -X POST https://api.example.com/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123",
    "name": "John Doe"
  }'</code></pre>

    <h4>Python</h4>
    <pre><code class="language-python">import requests

response = requests.post(
    'https://api.example.com/users',
    headers={'Authorization': 'Bearer YOUR_TOKEN'},
    json={
        'email': 'user@example.com',
        'password': 'securepassword123',
        'name': 'John Doe'
    }
)
user = response.json()</code></pre>

    <h4>JavaScript</h4>
    <pre><code class="language-javascript">const response = await fetch('https://api.example.com/users', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securepassword123',
    name: 'John Doe'
  })
});
const user = await response.json();</code></pre>
  </section>
</article>
```

### 2. Version-Specific Documentation

```html
<!-- Version switcher -->
<div class="version-selector">
  <label for="version">Documentation Version:</label>
  <select id="version" onchange="switchVersion(this.value)">
    <option value="2.1" selected>v2.1 (Latest - Nov 2025)</option>
    <option value="2.0">v2.0 (June 2025)</option>
    <option value="1.9">v1.9 (Legacy)</option>
  </select>
</div>

<!-- Version-specific content -->
<div class="version-content" data-version="2.1">
  <div class="version-badge">Current Version: 2.1.0 (November 2025)</div>
  <!-- v2.1 content -->
</div>

<div class="version-content hidden" data-version="2.0">
  <div class="version-badge deprecated">Older Version: 2.0.0 (June 2025)</div>
  <!-- v2.0 content -->
</div>
```

---

## Key Takeaways

### Technical Implementation Essentials:

✅ **Schema markup** on all technical content (Article, HowTo, FAQ)
✅ **Semantic HTML** with proper structure
✅ **Meta tags** complete and accurate
✅ **Performance optimized** (Core Web Vitals passing)
✅ **Code formatting** with syntax highlighting
✅ **API documentation** structured consistently
✅ **Version information** clearly labeled
✅ **Mobile responsive** design

### Action Items for This Chapter

- [ ] Implement TechArticle schema on all guides/tutorials
- [ ] Add HowTo schema to step-by-step content
- [ ] Create FAQPage schema for troubleshooting sections
- [ ] Validate all schema with Google Rich Results Test
- [ ] Optimize page speed (target LCP < 2.5s)
- [ ] Add semantic HTML5 elements throughout
- [ ] Implement code syntax highlighting
- [ ] Create consistent API documentation structure
- [ ] Add version labels to all code examples
- [ ] Generate and submit XML sitemap

---

## What's Next

Your technical foundation is now solid. Chapter 5 dives deep into optimizing developer-specific content—API docs, code tutorials, GitHub repositories, and technical blog posts.

**[Continue to Chapter 5: Claude for Developer Content →](chapter-05-developer-content.md)**

---

**Navigation:**
- [← Back to Chapter 3](chapter-03-content-optimization.md)
- [→ Next: Chapter 5](chapter-05-developer-content.md)
- [↑ Back to Module Home](README.md)

---

*Chapter 4 of 12 | AEO with Claude Module*
*Updated November 2025 | Technical implementation for Claude discovery*
