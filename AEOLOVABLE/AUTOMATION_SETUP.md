# n8n Automation Setup Guide

## 📘 Complete Automation Implementation

**Version:** 1.0
**Last Updated:** 2025-11-21
**Part:** 4 of Implementation Module

---

## Table of Contents

1. [n8n Installation & Configuration](#1-n8n-installation--configuration)
2. [Instagram API Setup](#2-instagram-api-setup)
3. [Workflow 1: Lead Discovery](#3-workflow-1-lead-discovery)
4. [Workflow 2: Automated Outreach](#4-workflow-2-automated-outreach)
5. [Workflow 3: Response Monitoring](#5-workflow-3-response-monitoring)
6. [Workflow 4: Follow-up Automation](#6-workflow-4-follow-up-automation)
7. [Workflow 5: Data Enrichment](#7-workflow-5-data-enrichment)
8. [Workflow 6: Analytics & Reporting](#8-workflow-6-analytics--reporting)
9. [Testing & Debugging](#9-testing--debugging)
10. [Production Deployment](#10-production-deployment)

---

## 1. n8n Installation & Configuration

### 1.1 Choose Deployment Method

**Option A: n8n Cloud (Recommended for Beginners)**
- Fastest setup
- Managed hosting
- Automatic updates
- $20/month

**Option B: Docker (Recommended for Control)**
- Full control
- Self-hosted
- One-time setup
- $5-10/month (VPS cost)

**Option C: npm (Advanced)**
- Maximum flexibility
- Manual management
- Free (hosting cost only)

### 1.2 Option A: n8n Cloud Setup

**Step 1: Create Account**
```bash
# Visit n8n.cloud
# Sign up with email
# Choose plan: Starter ($20/month)
```

**Step 2: Access Your Instance**
```
URL: https://your-name.app.n8n.cloud
Username: Your email
Password: Set during signup
```

**Step 3: Configure Environment**
1. Go to Settings → Environment Variables
2. Add variables:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
INSTAGRAM_ACCESS_TOKEN=your-token
OPENAI_API_KEY=your-openai-key
APIFY_API_TOKEN=your-apify-token
```

### 1.3 Option B: Docker Setup (Self-Hosted)

**Step 1: Create Project Directory**
```bash
mkdir ~/aeolovable-automation
cd ~/aeolovable-automation
```

**Step 2: Create Docker Compose File**
```yaml
# docker-compose.yml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: aeo-n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      # Basic Auth
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}

      # Host Configuration
      - N8N_HOST=${N8N_HOST}
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://${N8N_HOST}/

      # Timezone
      - GENERIC_TIMEZONE=America/New_York

      # Execution Settings
      - EXECUTIONS_PROCESS=main
      - EXECUTIONS_DATA_SAVE_ON_SUCCESS=all
      - EXECUTIONS_DATA_SAVE_ON_ERROR=all
      - EXECUTIONS_DATA_SAVE_MANUAL_EXECUTIONS=true

      # Database (PostgreSQL recommended for production)
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=${POSTGRES_DB}
      - DB_POSTGRESDB_USER=${POSTGRES_USER}
      - DB_POSTGRESDB_PASSWORD=${POSTGRES_PASSWORD}

      # External Services
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
      - INSTAGRAM_ACCESS_TOKEN=${INSTAGRAM_ACCESS_TOKEN}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - APIFY_API_TOKEN=${APIFY_API_TOKEN}

    volumes:
      - n8n_data:/home/node/.n8n
      - ./workflows:/home/node/.n8n/workflows
      - ./credentials:/home/node/.n8n/credentials
    depends_on:
      - postgres
    networks:
      - n8n-network

  postgres:
    image: postgres:15
    container_name: aeo-postgres
    restart: always
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - n8n-network

volumes:
  n8n_data:
  postgres_data:

networks:
  n8n-network:
    driver: bridge
```

**Step 3: Create Environment File**
```bash
# .env
N8N_PASSWORD=your-secure-password-here
N8N_HOST=n8n.yourdomain.com

# PostgreSQL
POSTGRES_DB=n8n
POSTGRES_USER=n8n
POSTGRES_PASSWORD=another-secure-password

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# Instagram
INSTAGRAM_ACCESS_TOKEN=your-instagram-token
INSTAGRAM_BUSINESS_ACCOUNT_ID=your-account-id

# AI
OPENAI_API_KEY=sk-your-openai-key

# Scraping
APIFY_API_TOKEN=your-apify-token
```

**Step 4: Start n8n**
```bash
# Start containers
docker-compose up -d

# Check logs
docker-compose logs -f n8n

# Access at http://localhost:5678
# Or configure reverse proxy for https://n8n.yourdomain.com
```

**Step 5: Configure Reverse Proxy (Nginx)**
```nginx
# /etc/nginx/sites-available/n8n
server {
    listen 80;
    server_name n8n.yourdomain.com;

    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/n8n /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Install SSL certificate
sudo certbot --nginx -d n8n.yourdomain.com
```

### 1.4 Configure Credentials in n8n

**Step 1: Access n8n**
- Open your n8n instance
- Login with credentials

**Step 2: Add Supabase Credential**
1. Click Settings → Credentials
2. Click "+ New Credential"
3. Search "HTTP Header Auth"
4. Configure:

```
Name: Supabase
Header Name: apikey
Header Value: [your-supabase-service-key]
```

Also add another credential for Authorization:
```
Name: Supabase Auth
Header Name: Authorization
Header Value: Bearer [your-supabase-service-key]
```

**Step 3: Add Instagram Credential**
1. New Credential → "HTTP Query Auth"
2. Configure:

```
Name: Instagram API
Parameter Name: access_token
Parameter Value: [your-instagram-access-token]
```

**Step 4: Add OpenAI Credential**
1. New Credential → "OpenAI"
2. Configure:

```
Name: OpenAI
API Key: [your-openai-api-key]
```

**Step 5: Add Apify Credential**
1. New Credential → "Apify API"
2. Configure:

```
Name: Apify
API Token: [your-apify-api-token]
```

---

## 2. Instagram API Setup

### 2.1 Create Facebook App

**Step 1: Facebook Developers**
1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Click "My Apps" → "Create App"
3. Select "Business" type
4. Fill in details:
   - **App Name:** AEO Agency Automation
   - **Contact Email:** your@email.com
   - **Business Account:** Select or create

**Step 2: Add Instagram Product**
1. From dashboard, click "+ Add Product"
2. Find "Instagram" and click "Set Up"
3. Complete Basic Setup

**Step 3: Configure App**
1. Go to Settings → Basic
2. Add App Domains: `yourdomain.com`
3. Add Privacy Policy URL
4. Add Terms of Service URL
5. Save changes

### 2.2 Get Instagram Business Account ID

**Step 1: Connect Instagram Account**
1. Go to Instagram → Basic Display
2. Click "Create New App"
3. Follow prompts to connect Instagram Business account

**Step 2: Get Account ID**
```bash
# Using Graph API Explorer (developers.facebook.com/tools/explorer)

# 1. Generate Access Token with permissions:
#    - instagram_basic
#    - instagram_manage_messages
#    - pages_read_engagement

# 2. Make request:
GET /me/accounts

# Response will include your page ID

# 3. Get Instagram Business Account ID:
GET /{page-id}?fields=instagram_business_account

# Save the instagram_business_account.id
```

### 2.3 Generate Long-Lived Access Token

**Step 1: Get Short-Lived Token**
- From Graph API Explorer
- Select your app
- Get User Access Token with permissions

**Step 2: Exchange for Long-Lived Token**
```bash
curl -X GET "https://graph.facebook.com/v18.0/oauth/access_token" \
  -d "grant_type=fb_exchange_token" \
  -d "client_id=YOUR_APP_ID" \
  -d "client_secret=YOUR_APP_SECRET" \
  -d "fb_exchange_token=YOUR_SHORT_LIVED_TOKEN"

# Response:
# {
#   "access_token": "long-lived-token-here",
#   "token_type": "bearer",
#   "expires_in": 5184000  // 60 days
# }
```

**Step 3: Save Token**
```bash
# Add to .env
INSTAGRAM_ACCESS_TOKEN=your-long-lived-token

# Set reminder to refresh in 60 days
```

### 2.4 Test Instagram API Access

```bash
# Test 1: Get account info
curl "https://graph.facebook.com/v18.0/INSTAGRAM_BUSINESS_ACCOUNT_ID?fields=id,username,followers_count&access_token=YOUR_ACCESS_TOKEN"

# Test 2: Get recent media
curl "https://graph.facebook.com/v18.0/INSTAGRAM_BUSINESS_ACCOUNT_ID/media?fields=id,caption,media_type,timestamp&access_token=YOUR_ACCESS_TOKEN"

# Test 3: Get conversations (DMs)
curl "https://graph.facebook.com/v18.0/INSTAGRAM_BUSINESS_ACCOUNT_ID/conversations?platform=instagram&access_token=YOUR_ACCESS_TOKEN"
```

### 2.5 Alternative: Apify Instagram Scrapers

If official API is too restrictive, use Apify:

**Step 1: Create Apify Account**
1. Go to [apify.com](https://apify.com)
2. Sign up (Free tier available)
3. Get API token from Settings

**Step 2: Find Instagram Actors**
```
Popular Actors:
- apify/instagram-profile-scraper
- apify/instagram-hashtag-scraper
- apify/instagram-post-scraper
```

**Step 3: Test Actor**
```bash
curl "https://api.apify.com/v2/acts/apify~instagram-profile-scraper/runs" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "usernames": ["test_account"],
    "resultsLimit": 1
  }' \
  -H "Authorization: Bearer YOUR_APIFY_TOKEN"
```

---

## 3. Workflow 1: Lead Discovery

### 3.1 Workflow Overview

**Purpose:** Automatically discover Instagram accounts with 10k+ followers
**Schedule:** Daily at 2:00 AM
**Duration:** ~30-60 minutes
**Output:** New leads in database

### 3.2 Create Workflow in n8n

**Step 1: Create New Workflow**
1. Click "+ New Workflow"
2. Name: "01 - Lead Discovery"
3. Description: "Discover Instagram accounts with 10k+ followers"

**Step 2: Add Schedule Trigger**

Node: **Schedule Trigger**
Configuration:
```json
{
  "rule": {
    "interval": [
      {
        "field": "cronExpression",
        "expression": "0 2 * * *"
      }
    ]
  }
}
```

**Step 3: Define Search Parameters**

Node: **Code** (JavaScript)
Configuration:
```javascript
// Define search configuration
const searchConfig = {
  hashtags: [
    'entrepreneur',
    'businessowner',
    'smallbusiness',
    'startuplife',
    'digitalmarketing',
    'contentcreator',
    'solopreneur',
    'businesscoach',
    'onlinebusiness',
    'sidehustle'
  ],
  locations: [
    'New York, NY',
    'Los Angeles, CA',
    'Miami, FL',
    'Chicago, IL',
    'Austin, TX'
  ],
  resultsPerHashtag: 50,
  followerMin: 10000,
  followerMax: 100000
};

// Create search tasks
const tasks = [];

// Search by hashtags
searchConfig.hashtags.forEach(hashtag => {
  tasks.push({
    type: 'hashtag',
    query: hashtag,
    limit: searchConfig.resultsPerHashtag
  });
});

// Return tasks as separate items
return tasks.map(task => ({ json: task }));
```

**Step 4: Search Instagram via Apify**

Node: **HTTP Request**
Configuration:
```json
{
  "method": "POST",
  "url": "https://api.apify.com/v2/acts/apify~instagram-hashtag-scraper/runs",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "Authorization",
        "value": "=Bearer {{$env.APIFY_API_TOKEN}}"
      },
      {
        "name": "Content-Type",
        "value": "application/json"
      }
    ]
  },
  "sendBody": true,
  "bodyContentType": "json",
  "jsonBody": "={\n  \"hashtags\": [\"{{$json.query}}\"],\n  \"resultsType\": \"posts\",\n  \"resultsLimit\": {{$json.limit}},\n  \"addParentData\": true\n}",
  "options": {
    "timeout": 300000
  }
}
```

**Step 5: Wait for Apify to Complete**

Node: **Wait**
Configuration:
```json
{
  "time": 60,
  "unit": "seconds"
}
```

**Step 6: Fetch Apify Results**

Node: **HTTP Request**
Configuration:
```json
{
  "method": "GET",
  "url": "=https://api.apify.com/v2/actor-runs/{{$json.data.id}}/dataset/items",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "Authorization",
        "value": "=Bearer {{$env.APIFY_API_TOKEN}}"
      }
    ]
  }
}
```

**Step 7: Extract Owner Profiles**

Node: **Code**
Configuration:
```javascript
// Extract unique profile owners from posts
const items = $input.all();
const profiles = new Map();

items.forEach(item => {
  const post = item.json;

  if (post.ownerUsername && post.ownerFullName) {
    if (!profiles.has(post.ownerUsername)) {
      profiles.set(post.ownerUsername, {
        username: post.ownerUsername,
        full_name: post.ownerFullName,
        profile_pic: post.ownerProfilePicUrl,
        // We'll fetch full profile data in next step
      });
    }
  }
});

// Return unique profiles
return Array.from(profiles.values()).map(profile => ({ json: profile }));
```

**Step 8: Fetch Full Profile Data**

Node: **HTTP Request**
Configuration:
```json
{
  "method": "POST",
  "url": "https://api.apify.com/v2/acts/apify~instagram-profile-scraper/runs?waitForFinish=120",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "sendBody": true,
  "bodyContentType": "json",
  "jsonBody": "={\n  \"usernames\": [\"{{$json.username}}\"],\n  \"resultsLimit\": 1\n}"
}
```

**Step 9: Filter by Follower Count**

Node: **Filter**
Configuration:
```json
{
  "conditions": {
    "number": [
      {
        "value1": "={{$json.followersCount}}",
        "operation": "largerEqual",
        "value2": 10000
      },
      {
        "value1": "={{$json.followersCount}}",
        "operation": "smallerEqual",
        "value2": 100000
      }
    ]
  }
}
```

**Step 10: Check if Lead Already Exists**

Node: **HTTP Request** (Supabase)
Configuration:
```json
{
  "method": "GET",
  "url": "={{$env.SUPABASE_URL}}/rest/v1/instagram_leads",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "apikey",
        "value": "={{$env.SUPABASE_SERVICE_KEY}}"
      },
      {
        "name": "Authorization",
        "value": "=Bearer {{$env.SUPABASE_SERVICE_KEY}}"
      }
    ]
  },
  "sendQuery": true,
  "queryParameters": {
    "parameters": [
      {
        "name": "instagram_username",
        "value": "=eq.{{$json.username}}"
      },
      {
        "name": "select",
        "value": "id"
      }
    ]
  }
}
```

**Step 11: Skip if Exists**

Node: **IF**
Configuration:
```json
{
  "conditions": {
    "number": [
      {
        "value1": "={{$json.length}}",
        "operation": "equal",
        "value2": 0
      }
    ]
  }
}
```

**Step 12: Call Analyze Lead Function**

Node: **HTTP Request** (Supabase Edge Function)
Configuration:
```json
{
  "method": "POST",
  "url": "={{$env.SUPABASE_URL}}/functions/v1/analyze-lead",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "Authorization",
        "value": "=Bearer {{$env.SUPABASE_SERVICE_KEY}}"
      },
      {
        "name": "Content-Type",
        "value": "application/json"
      }
    ]
  },
  "sendBody": true,
  "bodyContentType": "json",
  "jsonBody": "={\n  \"username\": \"{{$json.username}}\",\n  \"profile_data\": {{JSON.stringify($json)}}\n}"
}
```

**Step 13: Log Success**

Node: **Code**
Configuration:
```javascript
const result = $input.all();

console.log(`✅ Successfully processed ${result.length} new leads`);

return result.map(item => ({
  json: {
    success: true,
    lead_id: item.json.data.lead_id,
    username: item.json.data.analysis.username
  }
}));
```

### 3.3 Save and Activate Workflow

```bash
# In n8n interface:
1. Click "Save" (top right)
2. Click "Active" toggle to enable
3. Click "Execute Workflow" to test
4. Check execution log for any errors
```

### 3.4 Monitor Workflow Execution

```bash
# Check logs
# Go to Executions tab
# View successful/failed runs
# Debug any issues
```

---

## 4. Workflow 2: Automated Outreach

### 4.1 Workflow Overview

**Purpose:** Send personalized DMs to qualified leads
**Schedule:** 3x daily (9 AM, 2 PM, 6 PM)
**Batch Size:** 20 leads per run
**Output:** Messages sent, database updated

### 4.2 Workflow Nodes

**Node 1: Schedule Trigger**
```json
{
  "rule": {
    "interval": [
      {
        "field": "cronExpression",
        "expression": "0 9,14,18 * * *"
      }
    ]
  }
}
```

**Node 2: Fetch Qualified Leads**

HTTP Request to Supabase:
```json
{
  "method": "GET",
  "url": "={{$env.SUPABASE_URL}}/rest/v1/instagram_leads",
  "sendQuery": true,
  "queryParameters": {
    "parameters": [
      {
        "name": "status",
        "value": "eq.discovered"
      },
      {
        "name": "lead_score",
        "value": "gte.7"
      },
      {
        "name": "order",
        "value": "lead_score.desc"
      },
      {
        "name": "limit",
        "value": "20"
      }
    ]
  }
}
```

**Node 3: Generate Personalized Message with OpenAI**

Node: **OpenAI**
Configuration:
```json
{
  "resource": "text",
  "operation": "message",
  "model": "gpt-4",
  "messages": {
    "values": [
      {
        "role": "system",
        "content": "You are a professional outreach specialist for an AEO agency that creates websites for Instagram influencers. Write personalized, friendly DMs that are authentic and not salesy."
      },
      {
        "role": "user",
        "content": "=Generate a personalized Instagram DM for:\n\nUsername: @{{$json.instagram_username}}\nName: {{$json.full_name}}\nFollowers: {{$json.follower_count}}\nNiche: {{$json.niche}}\nLocation: {{$json.location || 'Unknown'}}\nHas Website: {{$json.has_website ? 'Yes' : 'No'}}\nBio: {{$json.bio}}\n\nRequirements:\n- Keep under 150 words\n- Be friendly, not pushy\n- Reference their niche and follower count\n- Focus on value of professional website\n- Include soft CTA\n- Use 1-2 emojis max"
      }
    ]
  },
  "options": {
    "maxTokens": 200,
    "temperature": 0.8
  }
}
```

**Node 4: Add Random Humanizing Delay**

Node: **Wait**
```json
{
  "time": "={{Math.floor(Math.random() * 60) + 30}}",
  "unit": "seconds"
}
```

**Node 5: Send Instagram DM**

Node: **HTTP Request**
```json
{
  "method": "POST",
  "url": "=https://graph.facebook.com/v18.0/{{$env.INSTAGRAM_BUSINESS_ACCOUNT_ID}}/messages",
  "sendQuery": true,
  "queryParameters": {
    "parameters": [
      {
        "name": "access_token",
        "value": "={{$env.INSTAGRAM_ACCESS_TOKEN}}"
      }
    ]
  },
  "sendBody": true,
  "bodyContentType": "json",
  "jsonBody": "={\n  \"recipient\": {\n    \"username\": \"{{$json.instagram_username}}\"\n  },\n  \"message\": {\n    \"text\": \"{{$node['OpenAI'].json.choices[0].message.content}}\"\n  }\n}"
}
```

**Node 6: Log Message to Database**

Node: **HTTP Request** (Supabase INSERT)
```json
{
  "method": "POST",
  "url": "={{$env.SUPABASE_URL}}/rest/v1/outreach_messages",
  "sendBody": true,
  "bodyContentType": "json",
  "jsonBody": "={\n  \"lead_id\": \"{{$json.id}}\",\n  \"message_text\": \"{{$node['OpenAI'].json.choices[0].message.content}}\",\n  \"message_type\": \"initial\",\n  \"sent_at\": \"{{new Date().toISOString()}}\",\n  \"delivered\": true\n}"
}
```

**Node 7: Update Lead Status**

Node: **HTTP Request** (Supabase UPDATE)
```json
{
  "method": "PATCH",
  "url": "={{$env.SUPABASE_URL}}/rest/v1/instagram_leads",
  "sendQuery": true,
  "queryParameters": {
    "parameters": [
      {
        "name": "id",
        "value": "=eq.{{$json.id}}"
      }
    ]
  },
  "sendBody": true,
  "bodyContentType": "json",
  "jsonBody": "={\n  \"status\": \"contacted\",\n  \"first_contacted_at\": \"{{new Date().toISOString()}}\",\n  \"last_contacted_at\": \"{{new Date().toISOString()}}\",\n  \"contact_attempts\": {{$json.contact_attempts + 1}}\n}"
}
```

---

*[Continue with Workflows 3-6...]*

---

**Progress Tracker:**

- [x] n8n Installation & Configuration
- [x] Instagram API Setup
- [x] Workflow 1: Lead Discovery
- [x] Workflow 2: Automated Outreach
- [ ] Workflow 3: Response Monitoring
- [ ] Workflow 4: Follow-up Automation
- [ ] Workflow 5: Data Enrichment
- [ ] Workflow 6: Analytics & Reporting
- [ ] Testing & Debugging
- [ ] Production Deployment

**Estimated Completion:** 55/100 pages

---

**Navigation:**

- **Previous:** [Part 3: Frontend Development ←](./FRONTEND_DEVELOPMENT.md)
- **Next:** [Part 5: Testing & Deployment →](./TESTING_DEPLOYMENT.md)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-21
