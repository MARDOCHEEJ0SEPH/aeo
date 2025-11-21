# Technical Architecture - AEO Agency Platform

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Web App    │  │ Admin Panel  │  │Client Portal │      │
│  │  (Lovable)   │  │  (Lovable)   │  │  (Lovable)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     API LAYER                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Supabase Backend                        │   │
│  │  • REST API         • Realtime                       │   │
│  │  • GraphQL          • Edge Functions                 │   │
│  │  • Authentication   • Storage                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         Supabase PostgreSQL Database                 │   │
│  │  • Users & Authentication                            │   │
│  │  • Instagram Leads                                   │   │
│  │  • Projects & Clients                                │   │
│  │  • Analytics & Events                                │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  AUTOMATION LAYER                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   n8n Workflows                       │   │
│  │  • Lead Discovery   • Outreach Automation            │   │
│  │  • Response Monitor • Data Enrichment                │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                EXTERNAL SERVICES                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Instagram │  │ Email    │  │  SMS     │  │Analytics │   │
│  │   API    │  │ Service  │  │ Service  │  │ Service  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Frontend Architecture (Lovable)

### 1.1 Project Structure

```
/aeo-agency-platform/
├── src/
│   ├── components/
│   │   ├── marketing/          # Public website components
│   │   │   ├── Hero.tsx
│   │   │   ├── Services.tsx
│   │   │   ├── Portfolio.tsx
│   │   │   ├── Pricing.tsx
│   │   │   ├── Testimonials.tsx
│   │   │   └── ContactForm.tsx
│   │   ├── admin/              # Admin dashboard components
│   │   │   ├── LeadsList.tsx
│   │   │   ├── LeadDetails.tsx
│   │   │   ├── CampaignManager.tsx
│   │   │   ├── ProjectBoard.tsx
│   │   │   └── Analytics.tsx
│   │   ├── client/             # Client portal components
│   │   │   ├── ProjectOverview.tsx
│   │   │   ├── FileUpload.tsx
│   │   │   ├── Messages.tsx
│   │   │   └── WebsitePreview.tsx
│   │   ├── shared/             # Shared components
│   │   │   ├── Navigation.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Modal.tsx
│   │   └── ui/                 # shadcn/ui components
│   ├── pages/
│   │   ├── index.tsx           # Homepage
│   │   ├── services.tsx
│   │   ├── portfolio.tsx
│   │   ├── pricing.tsx
│   │   ├── contact.tsx
│   │   ├── admin/
│   │   │   ├── dashboard.tsx
│   │   │   ├── leads.tsx
│   │   │   ├── campaigns.tsx
│   │   │   └── projects.tsx
│   │   └── client/
│   │       ├── dashboard.tsx
│   │       └── project/[id].tsx
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client
│   │   ├── utils.ts            # Utility functions
│   │   └── validations.ts      # Zod schemas
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useLeads.ts
│   │   ├── useProjects.ts
│   │   └── useRealtime.ts
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── NotificationContext.tsx
│   ├── types/
│   │   ├── database.types.ts   # Generated from Supabase
│   │   ├── leads.types.ts
│   │   └── projects.types.ts
│   └── styles/
│       └── globals.css
├── public/
├── .env.local
└── package.json
```

### 1.2 Key Technologies

- **React 18+** with TypeScript
- **Next.js 14+** (App Router)
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **React Hook Form** + **Zod** for forms
- **TanStack Query** (React Query) for data fetching
- **Zustand** for global state management

### 1.3 State Management Strategy

```typescript
// useLeadsStore.ts - Zustand store for leads management
import { create } from 'zustand'

interface Lead {
  id: string
  instagram_username: string
  follower_count: number
  status: string
  // ... other fields
}

interface LeadsStore {
  leads: Lead[]
  selectedLead: Lead | null
  filters: {
    status: string[]
    followerMin: number
    followerMax: number
  }
  setLeads: (leads: Lead[]) => void
  selectLead: (lead: Lead) => void
  updateFilters: (filters: Partial<LeadsStore['filters']>) => void
}

export const useLeadsStore = create<LeadsStore>((set) => ({
  leads: [],
  selectedLead: null,
  filters: {
    status: [],
    followerMin: 10000,
    followerMax: 1000000,
  },
  setLeads: (leads) => set({ leads }),
  selectLead: (lead) => set({ selectedLead: lead }),
  updateFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),
}))
```

### 1.4 Authentication Flow

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// hooks/useAuth.ts
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}
```

---

## 2. Backend Architecture (Supabase)

### 2.1 Supabase Configuration

```javascript
// supabase/config.toml
[api]
enabled = true
port = 54321
max_rows = 1000

[db]
port = 54322

[auth]
site_url = "https://yourdomain.com"
additional_redirect_urls = ["http://localhost:3000"]
jwt_expiry = 3600
enable_signup = true

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = true
```

### 2.2 Row Level Security Policies

```sql
-- Enable RLS on all tables
ALTER TABLE instagram_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_messages ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Admins have full access to leads"
ON instagram_leads
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Client policies
CREATE POLICY "Clients can view their own data"
ON clients
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Clients can view their projects"
ON projects
FOR SELECT
USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);

-- Public policies (marketing site)
CREATE POLICY "Anyone can view published portfolio items"
ON portfolio_items
FOR SELECT
USING (published = true);
```

### 2.3 Supabase Edge Functions

#### Function: analyze-lead

```typescript
// supabase/functions/analyze-lead/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface InstagramProfile {
  username: string
  follower_count: number
  following_count: number
  bio: string
  post_count: number
}

serve(async (req) => {
  try {
    const { username } = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Fetch Instagram profile data (use Instagram API or third-party service)
    const profile = await fetchInstagramProfile(username)

    // Calculate engagement rate
    const engagementRate = calculateEngagementRate(profile)

    // Determine niche
    const niche = detectNiche(profile.bio)

    // Calculate lead score
    const leadScore = calculateLeadScore({
      followerCount: profile.follower_count,
      engagementRate,
      hasWebsite: profile.website !== null,
    })

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          engagement_rate: engagementRate,
          niche,
          lead_score: leadScore,
        },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

function calculateEngagementRate(profile: InstagramProfile): number {
  // Simplified calculation - in production, fetch actual post data
  const avgLikes = profile.follower_count * 0.03 // Assume 3% engagement
  const avgComments = avgLikes * 0.05
  return ((avgLikes + avgComments) / profile.follower_count) * 100
}

function detectNiche(bio: string): string {
  const keywords = {
    fitness: ['fitness', 'gym', 'workout', 'health', 'trainer'],
    fashion: ['fashion', 'style', 'beauty', 'model', 'influencer'],
    food: ['food', 'chef', 'recipe', 'cooking', 'restaurant'],
    business: ['entrepreneur', 'business', 'CEO', 'founder', 'startup'],
    travel: ['travel', 'adventure', 'explore', 'wanderlust'],
  }

  const bioLower = bio.toLowerCase()
  for (const [niche, words] of Object.entries(keywords)) {
    if (words.some(word => bioLower.includes(word))) {
      return niche
    }
  }

  return 'general'
}

function calculateLeadScore(data: {
  followerCount: number
  engagementRate: number
  hasWebsite: boolean
}): number {
  let score = 0

  // Follower count scoring (max 4 points)
  if (data.followerCount >= 10000 && data.followerCount <= 50000) {
    score += 4 // Sweet spot
  } else if (data.followerCount <= 100000) {
    score += 3
  } else {
    score += 2
  }

  // Engagement rate scoring (max 3 points)
  if (data.engagementRate >= 5) {
    score += 3
  } else if (data.engagementRate >= 3) {
    score += 2
  } else {
    score += 1
  }

  // Website status (max 3 points)
  if (!data.hasWebsite) {
    score += 3 // No website = higher priority
  } else {
    score += 1 // Has website but might want upgrade
  }

  return score // Score out of 10
}

async function fetchInstagramProfile(username: string): Promise<InstagramProfile> {
  // Implementation depends on Instagram API or third-party service
  // For now, return mock data
  return {
    username,
    follower_count: 25000,
    following_count: 1500,
    bio: 'Fitness enthusiast | Personal Trainer | Helping you get fit',
    post_count: 342,
  }
}
```

#### Function: send-notification

```typescript
// supabase/functions/send-notification/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { type, recipient, data } = await req.json()

  // Send email, SMS, or push notification based on type
  if (type === 'email') {
    await sendEmail(recipient, data)
  } else if (type === 'sms') {
    await sendSMS(recipient, data)
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

async function sendEmail(to: string, data: any) {
  // Use Resend, SendGrid, or similar service
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'notifications@youragency.com',
      to,
      subject: data.subject,
      html: data.html,
    }),
  })

  return response.json()
}

async function sendSMS(to: string, data: any) {
  // Use Twilio or similar service
  // Implementation here
}
```

### 2.4 Database Triggers

```sql
-- Trigger: Notify when lead becomes interested
CREATE OR REPLACE FUNCTION notify_interested_lead()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'interested' AND OLD.status != 'interested' THEN
    -- Call edge function to send notification
    PERFORM
      net.http_post(
        url := current_setting('app.settings.edge_function_url') || '/send-notification',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := json_build_object(
          'type', 'email',
          'recipient', (SELECT email FROM users WHERE role = 'admin' LIMIT 1),
          'data', json_build_object(
            'subject', 'New Interested Lead!',
            'html', '<h1>Lead @' || NEW.instagram_username || ' is interested!</h1>'
          )
        )::jsonb
      );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_lead_status_change
AFTER UPDATE ON instagram_leads
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION notify_interested_lead();

-- Trigger: Update lead score when engagement changes
CREATE OR REPLACE FUNCTION recalculate_lead_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.lead_score := (
    CASE
      WHEN NEW.follower_count BETWEEN 10000 AND 50000 THEN 4
      WHEN NEW.follower_count <= 100000 THEN 3
      ELSE 2
    END +
    CASE
      WHEN NEW.engagement_rate >= 5 THEN 3
      WHEN NEW.engagement_rate >= 3 THEN 2
      ELSE 1
    END +
    CASE
      WHEN NEW.has_website = false THEN 3
      ELSE 1
    END
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_score_on_insert
BEFORE INSERT ON instagram_leads
FOR EACH ROW
EXECUTE FUNCTION recalculate_lead_score();

CREATE TRIGGER calculate_score_on_update
BEFORE UPDATE ON instagram_leads
FOR EACH ROW
WHEN (
  OLD.follower_count IS DISTINCT FROM NEW.follower_count OR
  OLD.engagement_rate IS DISTINCT FROM NEW.engagement_rate OR
  OLD.has_website IS DISTINCT FROM NEW.has_website
)
EXECUTE FUNCTION recalculate_lead_score();
```

---

## 3. Automation Architecture (n8n)

### 3.1 n8n Setup

**Deployment Options:**
1. **n8n Cloud:** Easiest, $20-50/month
2. **Self-hosted (Docker):** More control, free (hosting costs only)
3. **Self-hosted (npm):** Maximum flexibility

**Recommended: Docker Compose**

```yaml
# docker-compose.yml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
      - N8N_HOST=${N8N_HOST}
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - NODE_ENV=production
      - WEBHOOK_URL=https://${N8N_HOST}/
      - GENERIC_TIMEZONE=America/New_York
    volumes:
      - n8n_data:/home/node/.n8n
      - ./n8n/custom-nodes:/home/node/.n8n/custom

volumes:
  n8n_data:
```

### 3.2 Instagram API Integration

**Option 1: Official Instagram Graph API (Recommended)**

Requirements:
- Facebook Developer account
- Instagram Business/Creator account
- App review for permissions

Permissions needed:
- `instagram_basic`
- `instagram_manage_messages`
- `pages_read_engagement`

**Option 2: Third-party Services**

- **Apify:** Instagram scrapers and automation
- **Bright Data:** Web scraping infrastructure
- **Phantombuster:** Instagram automation

### 3.3 Workflow Nodes Configuration

#### Workflow 1: Lead Discovery

```json
{
  "name": "Instagram Lead Discovery",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "cronExpression",
              "expression": "0 2 * * *"
            }
          ]
        }
      },
      "name": "Daily at 2 AM",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "operation": "searchHashtag",
        "hashtag": "={{$json[\"hashtag\"]}}",
        "limit": 50
      },
      "name": "Search Instagram Hashtag",
      "type": "n8n-nodes-base.instagram",
      "typeVersion": 1,
      "position": [450, 300],
      "credentials": {
        "instagramApi": {
          "id": "1",
          "name": "Instagram Account"
        }
      }
    },
    {
      "parameters": {
        "conditions": {
          "number": [
            {
              "value1": "={{$json[\"follower_count\"]}}",
              "operation": "largerEqual",
              "value2": 10000
            }
          ]
        }
      },
      "name": "Filter 10k+ Followers",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [650, 300]
    },
    {
      "parameters": {
        "functionCode": "// Check if lead already exists in database\nconst username = $input.item.json.username;\n\nconst { createClient } = require('@supabase/supabase-js');\nconst supabase = createClient(\n  $env.SUPABASE_URL,\n  $env.SUPABASE_KEY\n);\n\nconst { data, error } = await supabase\n  .from('instagram_leads')\n  .select('id')\n  .eq('instagram_username', username)\n  .single();\n\nif (data) {\n  // Lead exists, skip\n  return [];\n}\n\n// Lead doesn't exist, continue\nreturn [$input.item];"
      },
      "name": "Check if Exists",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [850, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{$env.SUPABASE_URL}}/functions/v1/analyze-lead",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "username",
              "value": "={{$json[\"username\"]}}"
            }
          ]
        }
      },
      "name": "Analyze Lead",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 1,
      "position": [1050, 300]
    },
    {
      "parameters": {
        "operation": "insert",
        "table": "instagram_leads",
        "columns": "instagram_username,follower_count,engagement_rate,niche,lead_score,status",
        "additionalFields": {}
      },
      "name": "Insert to Supabase",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [1250, 300],
      "credentials": {
        "supabaseApi": {
          "id": "2",
          "name": "Supabase"
        }
      }
    }
  ],
  "connections": {
    "Daily at 2 AM": {
      "main": [[{"node": "Search Instagram Hashtag", "type": "main", "index": 0}]]
    },
    "Search Instagram Hashtag": {
      "main": [[{"node": "Filter 10k+ Followers", "type": "main", "index": 0}]]
    },
    "Filter 10k+ Followers": {
      "main": [[{"node": "Check if Exists", "type": "main", "index": 0}]]
    },
    "Check if Exists": {
      "main": [[{"node": "Analyze Lead", "type": "main", "index": 0}]]
    },
    "Analyze Lead": {
      "main": [[{"node": "Insert to Supabase", "type": "main", "index": 0}]]
    }
  }
}
```

---

## 4. Security Considerations

### 4.1 API Key Management

```bash
# .env.local (Never commit!)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

INSTAGRAM_ACCESS_TOKEN=your-instagram-token
N8N_API_KEY=your-n8n-api-key
RESEND_API_KEY=your-resend-key

# Encryption
JWT_SECRET=your-super-secret-key
ENCRYPTION_KEY=your-encryption-key
```

### 4.2 Rate Limiting

```typescript
// middleware.ts - Rate limiting for API routes
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})

export async function middleware(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous'
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return new Response('Too Many Requests', { status: 429 })
  }

  return NextResponse.next()
}
```

### 4.3 Input Validation

```typescript
// lib/validations.ts
import { z } from 'zod'

export const leadSchema = z.object({
  instagram_username: z.string().min(1).max(30).regex(/^[a-zA-Z0-9._]+$/),
  follower_count: z.number().int().min(0),
  location: z.string().optional(),
})

export const campaignSchema = z.object({
  name: z.string().min(3).max(100),
  message_template: z.string().min(10).max(1000),
  target_follower_min: z.number().int().min(0),
  target_locations: z.array(z.string()).optional(),
})
```

---

## 5. Performance Optimization

### 5.1 Database Indexing

```sql
-- Indexes for common queries
CREATE INDEX idx_leads_status ON instagram_leads(status);
CREATE INDEX idx_leads_follower_count ON instagram_leads(follower_count);
CREATE INDEX idx_leads_lead_score ON instagram_leads(lead_score DESC);
CREATE INDEX idx_leads_created_at ON instagram_leads(created_at DESC);
CREATE INDEX idx_messages_lead_id ON outreach_messages(lead_id);
CREATE INDEX idx_projects_client_status ON projects(client_id, status);

-- Composite indexes
CREATE INDEX idx_leads_status_score ON instagram_leads(status, lead_score DESC);
CREATE INDEX idx_leads_discovery ON instagram_leads(status, follower_count, lead_score);
```

### 5.2 Caching Strategy

```typescript
// lib/cache.ts
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export async function getCachedLeads(filters: any) {
  const cacheKey = `leads:${JSON.stringify(filters)}`
  const cached = await redis.get(cacheKey)

  if (cached) {
    return JSON.parse(cached as string)
  }

  // Fetch from database
  const leads = await fetchLeadsFromDB(filters)

  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(leads))

  return leads
}
```

### 5.3 Image Optimization

```typescript
// components/LeadAvatar.tsx
import Image from 'next/image'

export function LeadAvatar({ url, username }: { url: string; username: string }) {
  return (
    <Image
      src={url}
      alt={username}
      width={48}
      height={48}
      className="rounded-full"
      loading="lazy"
      placeholder="blur"
      blurDataURL="data:image/svg+xml;base64,..."
    />
  )
}
```

---

## 6. Monitoring & Logging

### 6.1 Error Tracking

```typescript
// lib/sentry.ts (if using Sentry)
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
})

// Log errors
export function logError(error: Error, context?: any) {
  Sentry.captureException(error, { extra: context })
}
```

### 6.2 Analytics Tracking

```typescript
// lib/analytics.ts
export async function trackEvent(
  eventType: string,
  eventData: any,
  userId?: string
) {
  await supabase.from('analytics_events').insert({
    event_type: eventType,
    event_data: eventData,
    user_id: userId,
  })
}

// Usage
trackEvent('lead_discovered', { username: '@johndoe', followers: 25000 })
trackEvent('message_sent', { lead_id: '123', campaign_id: '456' })
trackEvent('conversion', { lead_id: '123', project_value: 2500 })
```

---

## 7. Deployment

### 7.1 Lovable Deployment

Lovable handles deployment automatically:
1. Push code to Lovable
2. Automatic build & deploy
3. Custom domain configuration

### 7.2 Supabase Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize project
supabase init

# Link to remote project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push

# Deploy edge functions
supabase functions deploy analyze-lead
supabase functions deploy send-notification
```

### 7.3 n8n Deployment (Docker)

```bash
# Create .env file
cat > .env << EOF
N8N_PASSWORD=your-secure-password
N8N_HOST=n8n.yourdomain.com
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-key
INSTAGRAM_ACCESS_TOKEN=your-token
EOF

# Start n8n
docker-compose up -d

# Check logs
docker-compose logs -f n8n
```

---

## 8. Testing Strategy

### 8.1 Unit Tests

```typescript
// __tests__/lib/lead-scoring.test.ts
import { calculateLeadScore } from '@/lib/lead-scoring'

describe('Lead Scoring', () => {
  it('should give high score to ideal leads', () => {
    const score = calculateLeadScore({
      followerCount: 25000,
      engagementRate: 6.5,
      hasWebsite: false,
    })

    expect(score).toBeGreaterThanOrEqual(8)
  })

  it('should give lower score to leads with existing websites', () => {
    const score = calculateLeadScore({
      followerCount: 25000,
      engagementRate: 6.5,
      hasWebsite: true,
    })

    expect(score).toBeLessThan(8)
  })
})
```

### 8.2 Integration Tests

```typescript
// __tests__/api/leads.test.ts
import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/leads'

describe('/api/leads', () => {
  it('should fetch leads with filters', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { status: 'discovered', limit: '10' },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(JSON.parse(res._getData())).toHaveProperty('leads')
  })
})
```

### 8.3 E2E Tests (Playwright)

```typescript
// e2e/admin-dashboard.spec.ts
import { test, expect } from '@playwright/test'

test('admin can view and filter leads', async ({ page }) => {
  await page.goto('/admin/leads')

  // Login
  await page.fill('[name="email"]', 'admin@test.com')
  await page.fill('[name="password"]', 'password')
  await page.click('button[type="submit"]')

  // Wait for leads to load
  await page.waitForSelector('[data-testid="leads-table"]')

  // Apply filter
  await page.selectOption('[name="status"]', 'discovered')

  // Check results
  const leadCount = await page.locator('[data-testid="lead-row"]').count()
  expect(leadCount).toBeGreaterThan(0)
})
```

---

**Document Version:** 1.0
**Last Updated:** 2025-11-21
**Maintainer:** Development Team
