# n8n Automation Workflows - AEO Agency Platform

## Overview

This document provides detailed n8n workflow configurations for automating Instagram lead generation and outreach for the AEO Agency Platform.

---

## Table of Contents

1. [Setup & Configuration](#setup--configuration)
2. [Workflow 1: Lead Discovery](#workflow-1-lead-discovery)
3. [Workflow 2: Automated Outreach](#workflow-2-automated-outreach)
4. [Workflow 3: Response Monitoring](#workflow-3-response-monitoring)
5. [Workflow 4: Follow-up Automation](#workflow-4-follow-up-automation)
6. [Workflow 5: Data Enrichment](#workflow-5-data-enrichment)
7. [Workflow 6: Performance Analytics](#workflow-6-performance-analytics)
8. [Error Handling & Recovery](#error-handling--recovery)
9. [Rate Limiting & Best Practices](#rate-limiting--best-practices)

---

## Setup & Configuration

### Environment Variables

Configure these in n8n settings:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Instagram
INSTAGRAM_ACCESS_TOKEN=your-instagram-access-token
INSTAGRAM_BUSINESS_ACCOUNT_ID=your-business-account-id

# Third-party Services (Optional)
APIFY_API_TOKEN=your-apify-token
BRIGHT_DATA_API_KEY=your-bright-data-key

# Notifications
RESEND_API_KEY=your-resend-api-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token

# AI Services (for message personalization)
OPENAI_API_KEY=your-openai-key
```

### Required n8n Nodes

Install these community nodes:
- `n8n-nodes-instagram` (if available)
- `n8n-nodes-supabase`
- `n8n-nodes-openai`

---

## Workflow 1: Lead Discovery

**Purpose:** Automatically discover Instagram accounts with 10k+ followers based on hashtags and locations.

**Schedule:** Daily at 2:00 AM
**Estimated Runtime:** 30-60 minutes
**Output:** New leads added to `instagram_leads` table

### Flow Diagram

```
Schedule Trigger (Daily 2 AM)
    ↓
Define Search Parameters
    ↓
Loop Through Hashtags
    ↓
Instagram Hashtag Search
    ↓
Filter: 10k+ Followers
    ↓
Check: Not Already in Database
    ↓
Extract Profile Data
    ↓
Call: Analyze Lead Function
    ↓
Calculate Lead Score
    ↓
Insert to Supabase
    ↓
Log Analytics Event
```

### Node Configuration

#### 1. Schedule Trigger

```json
{
  "node": "Schedule Trigger",
  "type": "n8n-nodes-base.scheduleTrigger",
  "parameters": {
    "rule": {
      "interval": [
        {
          "field": "cronExpression",
          "expression": "0 2 * * *"
        }
      ]
    }
  }
}
```

#### 2. Define Search Parameters

```json
{
  "node": "Define Search Parameters",
  "type": "n8n-nodes-base.code",
  "parameters": {
    "language": "javaScript",
    "jsCode": "// Define hashtags and locations to search\nconst searchConfig = {\n  hashtags: [\n    'entrepreneur',\n    'businessowner',\n    'smallbusiness',\n    'startuplife',\n    'digitalmarketing',\n    'contentcreator',\n    'influencermarketing',\n    'personalbrand',\n    'socialmediamarketing',\n    'brandbuilding'\n  ],\n  locations: [\n    'New York, NY',\n    'Los Angeles, CA',\n    'Chicago, IL',\n    'Miami, FL',\n    'Austin, TX',\n    'San Francisco, CA'\n  ],\n  followerMin: 10000,\n  followerMax: 100000,\n  resultsPerHashtag: 50\n};\n\n// Return array of search tasks\nconst tasks = [];\n\nsearchConfig.hashtags.forEach(hashtag => {\n  tasks.push({\n    type: 'hashtag',\n    query: hashtag,\n    limit: searchConfig.resultsPerHashtag\n  });\n});\n\nsearchConfig.locations.forEach(location => {\n  tasks.push({\n    type: 'location',\n    query: location,\n    limit: searchConfig.resultsPerHashtag\n  });\n});\n\nreturn tasks.map(task => ({ json: task }));"
  }
}
```

#### 3. Instagram Search (Using Apify)

Since official Instagram API has limitations, use Apify's Instagram scrapers:

```json
{
  "node": "Instagram Search via Apify",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
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
        }
      ]
    },
    "sendBody": true,
    "contentType": "json",
    "body": "={\n  \"hashtags\": [\"{{$json.query}}\"],\n  \"resultsLimit\": {{$json.limit}}\n}",
    "options": {}
  }
}
```

#### 4. Wait for Apify Results

```json
{
  "node": "Wait for Results",
  "type": "n8n-nodes-base.wait",
  "parameters": {
    "time": 30,
    "unit": "seconds"
  }
}
```

#### 5. Fetch Apify Dataset

```json
{
  "node": "Fetch Results",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "GET",
    "url": "=https://api.apify.com/v2/acts/{{$json.defaultDatasetId}}/items",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth"
  }
}
```

#### 6. Filter Followers

```json
{
  "node": "Filter 10k+ Followers",
  "type": "n8n-nodes-base.filter",
  "parameters": {
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
}
```

#### 7. Check if Lead Exists

```json
{
  "node": "Check Database",
  "type": "n8n-nodes-base.supabase",
  "parameters": {
    "operation": "get",
    "tableId": "instagram_leads",
    "filterType": "manual",
    "matchType": "allFilters",
    "filters": {
      "conditions": [
        {
          "keyName": "instagram_username",
          "operator": "eq",
          "value": "={{$json.username}}"
        }
      ]
    }
  }
}
```

#### 8. Skip if Exists

```json
{
  "node": "Lead Exists?",
  "type": "n8n-nodes-base.if",
  "parameters": {
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
}
```

#### 9. Extract Profile Data

```json
{
  "node": "Extract Profile Data",
  "type": "n8n-nodes-base.code",
  "parameters": {
    "jsCode": "const profile = $input.item.json;\n\n// Extract location from bio or profile\nconst locationRegex = /📍\\s*([^\\n|]+)|Location:\\s*([^\\n]+)/i;\nconst locationMatch = profile.biography?.match(locationRegex);\nconst location = locationMatch ? (locationMatch[1] || locationMatch[2]).trim() : null;\n\n// Detect if they have a website\nconst hasWebsite = !!profile.externalUrl;\n\n// Calculate basic engagement (more accurate in next step)\nconst avgLikes = profile.postsCount > 0 ? \n  (profile.latestPosts?.reduce((sum, post) => sum + post.likesCount, 0) / profile.latestPosts?.length || 0) : 0;\n\nconst avgComments = profile.postsCount > 0 ? \n  (profile.latestPosts?.reduce((sum, post) => sum + post.commentsCount, 0) / profile.latestPosts?.length || 0) : 0;\n\nconst engagementRate = profile.followersCount > 0 ?\n  ((avgLikes + avgComments) / profile.followersCount) * 100 : 0;\n\nreturn {\n  json: {\n    instagram_username: profile.username,\n    instagram_user_id: profile.id,\n    full_name: profile.fullName,\n    bio: profile.biography,\n    profile_picture_url: profile.profilePicUrl,\n    follower_count: profile.followersCount,\n    following_count: profile.followsCount,\n    post_count: profile.postsCount,\n    engagement_rate: parseFloat(engagementRate.toFixed(2)),\n    location: location,\n    has_website: hasWebsite,\n    existing_website_url: profile.externalUrl || null,\n    status: 'discovered'\n  }\n};"
  }
}
```

#### 10. Detect Niche

```json
{
  "node": "Detect Niche",
  "type": "n8n-nodes-base.code",
  "parameters": {
    "jsCode": "const bio = ($json.bio || '').toLowerCase();\nconst username = ($json.instagram_username || '').toLowerCase();\nconst combined = bio + ' ' + username;\n\nconst niches = {\n  'fitness': ['fitness', 'gym', 'workout', 'health', 'trainer', 'coach', 'bodybuilding', 'athlete'],\n  'fashion': ['fashion', 'style', 'model', 'beauty', 'makeup', 'boutique', 'designer'],\n  'food': ['food', 'chef', 'restaurant', 'recipe', 'cooking', 'baker', 'culinary'],\n  'business': ['entrepreneur', 'business', 'ceo', 'founder', 'startup', 'coach', 'consultant'],\n  'travel': ['travel', 'adventure', 'explore', 'wanderlust', 'tourism', 'blogger'],\n  'lifestyle': ['lifestyle', 'life', 'blogger', 'vlogger', 'creator', 'influencer'],\n  'realestate': ['realtor', 'realestate', 'property', 'broker', 'homes'],\n  'photography': ['photographer', 'photography', 'photo', 'portraits', 'wedding'],\n  'art': ['artist', 'art', 'design', 'creative', 'illustration', 'painter'],\n  'music': ['musician', 'music', 'singer', 'producer', 'dj', 'artist']\n};\n\nlet detectedNiche = 'general';\nlet maxMatches = 0;\n\nfor (const [niche, keywords] of Object.entries(niches)) {\n  const matches = keywords.filter(keyword => combined.includes(keyword)).length;\n  if (matches > maxMatches) {\n    maxMatches = matches;\n    detectedNiche = niche;\n  }\n}\n\nreturn {\n  json: {\n    ...$json,\n    niche: detectedNiche\n  }\n};"
  }
}
```

#### 11. Calculate Lead Score

```json
{
  "node": "Calculate Lead Score",
  "type": "n8n-nodes-base.code",
  "parameters": {
    "jsCode": "let score = 0;\nconst followers = $json.follower_count;\nconst engagement = $json.engagement_rate;\nconst hasWebsite = $json.has_website;\n\n// Follower count scoring (max 4 points)\nif (followers >= 10000 && followers <= 50000) {\n  score += 4; // Sweet spot\n} else if (followers <= 100000) {\n  score += 3;\n} else {\n  score += 2;\n}\n\n// Engagement rate scoring (max 3 points)\nif (engagement >= 5) {\n  score += 3;\n} else if (engagement >= 3) {\n  score += 2;\n} else if (engagement >= 1) {\n  score += 1;\n}\n\n// Website status (max 3 points)\nif (!hasWebsite) {\n  score += 3; // No website = highest priority\n} else {\n  score += 1; // Has website but might want upgrade\n}\n\nreturn {\n  json: {\n    ...$json,\n    lead_score: score\n  }\n};"
  }
}
```

#### 12. Insert to Supabase

```json
{
  "node": "Insert Lead",
  "type": "n8n-nodes-base.supabase",
  "parameters": {
    "operation": "insert",
    "tableId": "instagram_leads",
    "fieldsUi": {
      "fieldValues": [
        {"fieldName": "instagram_username", "fieldValue": "={{$json.instagram_username}}"},
        {"fieldName": "instagram_user_id", "fieldValue": "={{$json.instagram_user_id}}"},
        {"fieldName": "full_name", "fieldValue": "={{$json.full_name}}"},
        {"fieldName": "bio", "fieldValue": "={{$json.bio}}"},
        {"fieldName": "profile_picture_url", "fieldValue": "={{$json.profile_picture_url}}"},
        {"fieldName": "follower_count", "fieldValue": "={{$json.follower_count}}"},
        {"fieldName": "following_count", "fieldValue": "={{$json.following_count}}"},
        {"fieldName": "post_count", "fieldValue": "={{$json.post_count}}"},
        {"fieldName": "engagement_rate", "fieldValue": "={{$json.engagement_rate}}"},
        {"fieldName": "location", "fieldValue": "={{$json.location}}"},
        {"fieldName": "niche", "fieldValue": "={{$json.niche}}"},
        {"fieldName": "has_website", "fieldValue": "={{$json.has_website}}"},
        {"fieldName": "existing_website_url", "fieldValue": "={{$json.existing_website_url}}"},
        {"fieldName": "lead_score", "fieldValue": "={{$json.lead_score}}"},
        {"fieldName": "status", "fieldValue": "discovered"}
      ]
    }
  }
}
```

#### 13. Log Analytics Event

```json
{
  "node": "Log Discovery Event",
  "type": "n8n-nodes-base.supabase",
  "parameters": {
    "operation": "insert",
    "tableId": "analytics_events",
    "fieldsUi": {
      "fieldValues": [
        {"fieldName": "event_type", "fieldValue": "lead_discovered"},
        {"fieldName": "event_data", "fieldValue": "={{JSON.stringify($json)}}"},
        {"fieldName": "lead_id", "fieldValue": "={{$json.id}}"}
      ]
    }
  }
}
```

---

## Workflow 2: Automated Outreach

**Purpose:** Send personalized Instagram DMs to qualified leads.

**Schedule:** Multiple times daily (9 AM, 2 PM, 6 PM)
**Batch Size:** 20 leads per run (to avoid rate limits)
**Output:** Messages sent, database updated

### Flow Diagram

```
Schedule Trigger (3x daily)
    ↓
Fetch Qualified Leads (status = discovered, score >= 7)
    ↓
Limit to 20 Leads
    ↓
Loop Through Each Lead
    ↓
Generate Personalized Message (OpenAI)
    ↓
Add Humanizing Delays (Random 30-90s)
    ↓
Send Instagram DM
    ↓
Log Message in Database
    ↓
Update Lead Status to 'contacted'
    ↓
Log Analytics Event
```

### Node Configuration

#### 1. Schedule Trigger (Multiple Times)

```json
{
  "node": "Schedule Trigger",
  "type": "n8n-nodes-base.scheduleTrigger",
  "parameters": {
    "rule": {
      "interval": [
        {"field": "cronExpression", "expression": "0 9,14,18 * * *"}
      ]
    }
  }
}
```

#### 2. Fetch Qualified Leads

```json
{
  "node": "Fetch Qualified Leads",
  "type": "n8n-nodes-base.supabase",
  "parameters": {
    "operation": "get",
    "tableId": "instagram_leads",
    "filterType": "manual",
    "matchType": "allFilters",
    "filters": {
      "conditions": [
        {"keyName": "status", "operator": "eq", "value": "discovered"},
        {"keyName": "lead_score", "operator": "gte", "value": 7}
      ]
    },
    "sort": {
      "fields": [
        {"fieldName": "lead_score", "order": "DESC"}
      ]
    },
    "returnAll": false,
    "limit": 20
  }
}
```

#### 3. Generate Personalized Message

```json
{
  "node": "Generate Message with AI",
  "type": "n8n-nodes-base.openAi",
  "parameters": {
    "resource": "text",
    "operation": "complete",
    "model": "gpt-4",
    "prompt": "=You are a professional outreach specialist for an AEO agency that creates websites for Instagram influencers.\n\nGenerate a personalized, friendly Instagram DM for the following profile:\n\n- Username: @{{$json.instagram_username}}\n- Name: {{$json.full_name}}\n- Followers: {{$json.follower_count}}\n- Niche: {{$json.niche}}\n- Location: {{$json.location || 'Unknown'}}\n- Has Website: {{$json.has_website ? 'Yes' : 'No'}}\n- Bio: {{$json.bio}}\n\nRequirements:\n1. Keep it under 150 words\n2. Be friendly and authentic, not salesy\n3. Reference their specific niche and follower milestone\n4. Mention their location if available\n5. Focus on the value of having a professional website\n6. Include a soft call-to-action\n7. Use 1-2 relevant emojis max\n8. Don't be pushy\n\nMessage:",
    "options": {
      "maxTokens": 200,
      "temperature": 0.8
    }
  }
}
```

#### 4. Add Random Delay

```json
{
  "node": "Humanize with Delay",
  "type": "n8n-nodes-base.wait",
  "parameters": {
    "time": "={{Math.floor(Math.random() * 60) + 30}}",
    "unit": "seconds"
  }
}
```

#### 5. Send Instagram DM

```json
{
  "node": "Send Instagram DM",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://graph.facebook.com/v18.0/{{$env.INSTAGRAM_BUSINESS_ACCOUNT_ID}}/messages",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpQueryAuth",
    "sendQuery": true,
    "queryParameters": {
      "parameters": [
        {"name": "access_token", "value": "={{$env.INSTAGRAM_ACCESS_TOKEN}}"}
      ]
    },
    "sendBody": true,
    "contentType": "json",
    "body": "={\n  \"recipient\": {\"username\": \"{{$json.instagram_username}}\"},\n  \"message\": {\"text\": \"{{$node['Generate Message with AI'].json.choices[0].text}}\"}\n}"
  }
}
```

#### 6. Log Message

```json
{
  "node": "Log Outreach Message",
  "type": "n8n-nodes-base.supabase",
  "parameters": {
    "operation": "insert",
    "tableId": "outreach_messages",
    "fieldsUi": {
      "fieldValues": [
        {"fieldName": "lead_id", "fieldValue": "={{$json.id}}"},
        {"fieldName": "message_text", "fieldValue": "={{$node['Generate Message with AI'].json.choices[0].text}}"},
        {"fieldName": "message_type", "fieldValue": "initial"},
        {"fieldName": "sent_at", "fieldValue": "={{new Date().toISOString()}}"},
        {"fieldName": "delivered", "fieldValue": true}
      ]
    }
  }
}
```

#### 7. Update Lead Status

```json
{
  "node": "Update Lead Status",
  "type": "n8n-nodes-base.supabase",
  "parameters": {
    "operation": "update",
    "tableId": "instagram_leads",
    "filterType": "manual",
    "matchType": "allFilters",
    "filters": {
      "conditions": [
        {"keyName": "id", "operator": "eq", "value": "={{$json.id}}"}
      ]
    },
    "fieldsUi": {
      "fieldValues": [
        {"fieldName": "status", "fieldValue": "contacted"},
        {"fieldName": "first_contacted_at", "fieldValue": "={{new Date().toISOString()}}"},
        {"fieldName": "last_contacted_at", "fieldValue": "={{new Date().toISOString()}}"},
        {"fieldName": "contact_attempts", "fieldValue": "={{$json.contact_attempts + 1}}"}
      ]
    }
  }
}
```

---

## Workflow 3: Response Monitoring

**Purpose:** Monitor Instagram DMs for responses and categorize them.

**Schedule:** Every 30 minutes
**Output:** Response data logged, lead status updated

### Flow Diagram

```
Schedule Trigger (Every 30 min)
    ↓
Fetch Recent Messages from Instagram
    ↓
Filter: Only Replies (not sent by us)
    ↓
Match to Leads in Database
    ↓
Analyze Sentiment (OpenAI)
    ↓
Categorize Response (Positive/Negative/Neutral)
    ↓
Update Lead Status
    ↓
Send Admin Notification (if positive)
    ↓
Log Analytics Event
```

### Key Nodes

#### Fetch Instagram Messages

```json
{
  "node": "Fetch Instagram Messages",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "GET",
    "url": "https://graph.facebook.com/v18.0/{{$env.INSTAGRAM_BUSINESS_ACCOUNT_ID}}/conversations",
    "authentication": "genericCredentialType",
    "sendQuery": true,
    "queryParameters": {
      "parameters": [
        {"name": "access_token", "value": "={{$env.INSTAGRAM_ACCESS_TOKEN}}"},
        {"name": "fields", "value": "id,messages{from,message,created_time}"}
      ]
    }
  }
}
```

#### Analyze Sentiment

```json
{
  "node": "Analyze Sentiment",
  "type": "n8n-nodes-base.openAi",
  "parameters": {
    "resource": "text",
    "operation": "complete",
    "model": "gpt-4",
    "prompt": "=Analyze the sentiment of this message and categorize it as POSITIVE, NEGATIVE, or NEUTRAL.\n\nMessage: \"{{$json.message}}\"\n\nA POSITIVE response shows interest (e.g., 'yes', 'tell me more', 'interested', 'sounds good').\nA NEGATIVE response shows disinterest (e.g., 'no thanks', 'not interested', 'stop').\nA NEUTRAL response is unclear or asks questions.\n\nRespond with ONLY one word: POSITIVE, NEGATIVE, or NEUTRAL"
  }
}
```

---

## Workflow 4: Follow-up Automation

**Purpose:** Send follow-up messages to non-responders after 3 days.

**Schedule:** Daily at 10 AM
**Criteria:** Contacted 3 days ago, no response, max 2 follow-ups
**Batch Size:** 15 leads per run

---

## Workflow 5: Data Enrichment

**Purpose:** Update lead metrics weekly (follower counts, engagement rates).

**Schedule:** Weekly (Sunday at 3 AM)
**Benefit:** Keep lead data fresh, identify accounts that are growing fast

---

## Workflow 6: Performance Analytics

**Purpose:** Generate daily/weekly reports on lead generation and outreach performance.

**Schedule:** Daily at 11 PM
**Output:** Analytics dashboard data, email reports to admin

---

## Error Handling & Recovery

### Global Error Workflow

```json
{
  "node": "Error Trigger",
  "type": "n8n-nodes-base.errorTrigger",
  "parameters": {}
}
```

Connected to:
- Log error to Supabase
- Send admin notification
- Retry logic (for temporary failures)

### Retry Strategy

```javascript
// In HTTP Request nodes, use this in settings
{
  "retry": {
    "enabled": true,
    "maxRetries": 3,
    "waitBetweenRetries": 1000
  }
}
```

---

## Rate Limiting & Best Practices

### Instagram API Limits

- **Messages per day:** 200-500 (varies by account age/activity)
- **Recommended:** 20-50 messages per day to be safe
- **Delay between messages:** 30-90 seconds (randomized)

### Best Practices

1. **Start Slow:** Begin with 10 messages/day, gradually increase
2. **Warm Up Accounts:** Use accounts for normal activities before automation
3. **Rotate Accounts:** Use multiple Instagram accounts for scaling
4. **Monitor Blocks:** Track failed messages, adjust if blocked
5. **Human-like Behavior:** Randomize timing, message length, content
6. **Quality over Quantity:** Target high-quality leads, not spam everyone

### Rate Limiter Node

```json
{
  "node": "Rate Limiter",
  "type": "n8n-nodes-base.rateLimiter",
  "parameters": {
    "maxRequests": 1,
    "interval": 60000,
    "intervalUnit": "milliseconds"
  }
}
```

---

## Testing & Validation

### Test Mode Workflow

Create a duplicate workflow with:
- Limited to 1-2 test accounts
- Send messages to your own Instagram account
- Validate message quality and personalization
- Check database updates

### Monitoring Checklist

- [ ] Messages sending successfully
- [ ] Database updates working
- [ ] No Instagram blocks/restrictions
- [ ] Response monitoring capturing replies
- [ ] Lead scoring accurate
- [ ] Analytics tracking correctly

---

## Appendix: Complete Workflow JSON

See separate files:
- `workflow-1-lead-discovery.json`
- `workflow-2-automated-outreach.json`
- `workflow-3-response-monitoring.json`
- `workflow-4-follow-up-automation.json`
- `workflow-5-data-enrichment.json`
- `workflow-6-performance-analytics.json`

---

**Document Version:** 1.0
**Last Updated:** 2025-11-21
**Maintainer:** Automation Team
