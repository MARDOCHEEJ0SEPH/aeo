# AEOWEB API Documentation

Complete API reference for AEOWEB - Answer Engine Optimization Platform

## Base URLs

- **Production**: `https://api.aeoweb.com`
- **Staging**: `https://staging-api.aeoweb.com`
- **Local**: `http://localhost:4000`

## Authentication

All API requests require authentication using JWT tokens.

### Get Access Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "role": "EDITOR"
  }
}
```

### Using Tokens

Include the access token in the Authorization header:

```http
Authorization: Bearer eyJhbGc...
```

---

## Content API

### Create Content

```http
POST /api/content
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Getting Started with AEO",
  "body": "<h1>Introduction</h1><p>Content here...</p>",
  "contentType": "article",
  "metadata": {
    "tags": ["aeo", "guide"],
    "category": "tutorials"
  }
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "title": "Getting Started with AEO",
  "slug": "getting-started-with-aeo",
  "body": "<h1>Introduction</h1>...",
  "contentType": "article",
  "status": "DRAFT",
  "authorId": "uuid",
  "metadata": {...},
  "createdAt": "2025-01-17T10:00:00Z",
  "updatedAt": "2025-01-17T10:00:00Z"
}
```

### Get Content List

```http
GET /api/content?status=PUBLISHED&limit=20&offset=0
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` (optional): `DRAFT`, `PUBLISHED`, `ARCHIVED`
- `contentType` (optional): Filter by content type
- `authorId` (optional): Filter by author
- `search` (optional): Search in title and body
- `limit` (optional, default 20): Results per page
- `offset` (optional, default 0): Pagination offset

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Content title",
      "slug": "content-title",
      "status": "PUBLISHED",
      "contentType": "article",
      "authorId": "uuid",
      "createdAt": "2025-01-17T10:00:00Z",
      "publishedAt": "2025-01-17T12:00:00Z"
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### Get Single Content

```http
GET /api/content/{id}
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "uuid",
  "title": "Content title",
  "slug": "content-title",
  "body": "<h1>Full content...</h1>",
  "contentType": "article",
  "status": "PUBLISHED",
  "authorId": "uuid",
  "author": {
    "id": "uuid",
    "username": "author",
    "email": "author@example.com"
  },
  "metadata": {...},
  "aeoScores": [...],
  "createdAt": "2025-01-17T10:00:00Z",
  "updatedAt": "2025-01-17T10:00:00Z",
  "publishedAt": "2025-01-17T12:00:00Z"
}
```

### Update Content

```http
PUT /api/content/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated Title",
  "body": "<h1>Updated content...</h1>"
}
```

**Response (200):** Returns updated content object

### Publish Content

```http
POST /api/content/{id}/publish
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "uuid",
  "status": "PUBLISHED",
  "publishedAt": "2025-01-17T12:00:00Z"
}
```

### Delete Content

```http
DELETE /api/content/{id}
Authorization: Bearer {token}
```

**Response (204):** No content

---

## AEO Optimization API

### Optimize Content

Analyze and optimize content for a specific AI platform.

```http
POST /api/aeo/optimize
Authorization: Bearer {token}
Content-Type: application/json

{
  "contentId": "uuid",
  "platform": "CHATGPT",
  "aiOptimize": true
}
```

**Platforms:** `CHATGPT`, `CLAUDE`, `PERPLEXITY`, `GEMINI`, `BING`

**Response (200):**
```json
{
  "score": 85.5,
  "optimizedContent": "<h1>Optimized version...</h1>",
  "improvements": [
    {
      "category": "Structure",
      "description": "Add more H2 subheadings",
      "impact": "HIGH"
    }
  ],
  "platformTips": [
    "Use clear step-by-step instructions",
    "Include 3-5 practical examples"
  ],
  "breakdown": {
    "structure": 25,
    "quality": 20,
    "platform": 22,
    "readability": 18.5
  }
}
```

### Direct Content Optimization

Optimize raw content without saving to database.

```http
POST /api/aeo/optimize/direct
Content-Type: application/json

{
  "content": "<h1>Your content here...</h1>",
  "platform": "CHATGPT",
  "aiOptimize": false
}
```

**Response (200):** Same as optimize endpoint

### Get AEO Score

```http
GET /api/aeo/score/{contentId}/{platform}
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "uuid",
  "contentId": "uuid",
  "platform": "CHATGPT",
  "overallScore": 85.5,
  "structureScore": 25,
  "qualityScore": 20,
  "platformScore": 22,
  "readabilityScore": 18.5,
  "improvements": [...],
  "calculatedAt": "2025-01-17T12:00:00Z"
}
```

### Get AEO Performance

```http
GET /api/aeo/performance/{contentId}
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "contentId": "uuid",
  "platforms": [
    {
      "platform": "CHATGPT",
      "citations": 45,
      "avgPosition": 2.3,
      "citationRate": 0.75,
      "trend": [
        {"timestamp": "2025-01-17T00:00:00Z", "value": 40},
        {"timestamp": "2025-01-17T12:00:00Z", "value": 45}
      ]
    }
  ],
  "totalCitations": 150,
  "citationRate": 0.68,
  "visibility": 68.0
}
```

---

## AI Content Generation API

### Generate Content

```http
POST /api/aeo/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "topic": "How to optimize for ChatGPT",
  "contentType": "article",
  "platform": "CHATGPT",
  "tone": "professional",
  "length": "medium",
  "keywords": ["aeo", "chatgpt", "optimization"],
  "targetAudience": "content marketers"
}
```

**Parameters:**
- `topic` (required): Content topic
- `contentType` (default "article"): Type of content
- `platform` (required): Target AI platform
- `tone` (default "professional"): Writing tone
- `length` (default "medium"): "short" (300-500), "medium" (600-1000), "long" (1200-2000)
- `keywords` (optional): Target keywords array
- `targetAudience` (optional): Target audience description

**Response (200):**
```json
{
  "title": "How to Optimize Content for ChatGPT: Complete Guide",
  "body": "<h1>How to Optimize...</h1><p>Full generated content...</p>",
  "outline": [
    "Understanding ChatGPT",
    "Key Optimization Factors",
    "Best Practices"
  ],
  "metadata": {
    "wordCount": 750,
    "estimatedReadTime": "3 min",
    "keywords": ["aeo", "chatgpt", "optimization"]
  }
}
```

### Generate Outline

```http
POST /api/aeo/generate/outline
Authorization: Bearer {token}
Content-Type: application/json

{
  "topic": "AEO Best Practices",
  "platform": "CLAUDE",
  "keywords": ["aeo", "optimization"]
}
```

**Response (200):**
```json
{
  "outline": [
    {
      "heading": "Introduction to AEO",
      "level": 2,
      "points": [
        "What is AEO?",
        "Why it matters in 2025"
      ],
      "subsections": [
        {
          "heading": "The Rise of AI Search",
          "level": 3,
          "points": ["Statistics and trends"]
        }
      ]
    }
  ]
}
```

### Generate Content Ideas

```http
POST /api/aeo/generate/ideas
Authorization: Bearer {token}
Content-Type: application/json

{
  "topic": "AI search optimization",
  "platform": "PERPLEXITY",
  "count": 10
}
```

**Response (200):**
```json
{
  "ideas": [
    {
      "title": "10 Ways Perplexity Ranks Content in 2025",
      "description": "Data-driven analysis of ranking factors",
      "contentType": "article",
      "estimatedLength": "long",
      "targetKeywords": ["perplexity", "ranking", "citations"]
    }
  ]
}
```

---

## Analytics API

### Track Event

```http
POST /api/analytics/track
Authorization: Bearer {token}
Content-Type: application/json

{
  "eventType": "page_view",
  "userId": "uuid",
  "properties": {
    "page": "/content/123",
    "referrer": "google.com"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "eventId": "uuid"
}
```

### Track Citation

```http
POST /api/analytics/citations/track
Authorization: Bearer {token}
Content-Type: application/json

{
  "platform": "CHATGPT",
  "contentId": "uuid",
  "query": "how to optimize for ai",
  "cited": true,
  "citationText": "According to AEOWEB...",
  "position": 2
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "platform": "CHATGPT",
  "contentId": "uuid",
  "query": "how to optimize for ai",
  "cited": true,
  "citationText": "According to AEOWEB...",
  "position": 2,
  "createdAt": "2025-01-17T12:00:00Z"
}
```

### Get Real-Time Metrics

```http
GET /api/analytics/metrics/real-time
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "timestamp": "2025-01-17T12:00:00Z",
  "activeUsers": 127,
  "requestsPerMinute": 450,
  "avgResponseTime": 45,
  "errorRate": 0.02,
  "topPages": [
    {
      "path": "/dashboard",
      "views": 89
    }
  ]
}
```

---

## GraphQL API

### GraphQL Endpoint

```http
POST /graphql
Authorization: Bearer {token}
Content-Type: application/json

{
  "query": "query GetContent($id: ID!) { content(id: $id) { id title body status aeoScores { platform overallScore } } }",
  "variables": {
    "id": "uuid"
  }
}
```

### GraphQL Subscriptions

WebSocket connection: `ws://localhost:4001/graphql`

```graphql
subscription MetricsUpdate {
  metricsUpdate(interval: 5000) {
    timestamp
    cpu
    memory
    requests
    errors
    responseTime
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {...}
}
```

**Common Status Codes:**
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## Rate Limiting

- **General**: 100 requests per minute
- **Auth endpoints**: 10 requests per minute
- **AI generation**: 20 requests per hour

Rate limit headers:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705493400
```

---

## Webhook Events

Subscribe to webhook events for real-time updates.

### Configure Webhook

```http
POST /api/webhooks
Authorization: Bearer {token}
Content-Type: application/json

{
  "url": "https://your-domain.com/webhook",
  "events": ["content.published", "aeo.optimized"],
  "secret": "your-webhook-secret"
}
```

### Webhook Payload

```json
{
  "event": "content.published",
  "timestamp": "2025-01-17T12:00:00Z",
  "data": {
    "contentId": "uuid",
    "title": "Content title",
    "slug": "content-title"
  }
}
```

**Events:**
- `content.created`
- `content.updated`
- `content.published`
- `content.deleted`
- `aeo.optimized`
- `citation.tracked`

---

## SDKs and Client Libraries

### JavaScript/TypeScript

```bash
npm install @aeoweb/sdk
```

```typescript
import { AEOWebClient } from '@aeoweb/sdk';

const client = new AEOWebClient({
  apiKey: 'your-api-key',
  baseURL: 'https://api.aeoweb.com',
});

// Optimize content
const result = await client.aeo.optimize({
  contentId: 'uuid',
  platform: 'CHATGPT',
});
```

### Python

```bash
pip install aeoweb
```

```python
from aeoweb import Client

client = Client(api_key='your-api-key')

# Generate content
content = client.aeo.generate(
    topic='AEO Best Practices',
    platform='CLAUDE',
    length='medium'
)
```

---

For more examples and advanced usage, visit: https://docs.aeoweb.com
