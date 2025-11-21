# Troubleshooting & Optimization Guide

## 📘 Complete Troubleshooting & Performance Optimization

**Version:** 1.0
**Last Updated:** 2025-11-21
**Part:** 6 of Implementation Module

---

## Table of Contents

1. [Common Issues & Solutions](#1-common-issues--solutions)
2. [Database Troubleshooting](#2-database-troubleshooting)
3. [Authentication Issues](#3-authentication-issues)
4. [n8n Workflow Debugging](#4-n8n-workflow-debugging)
5. [Instagram API Issues](#5-instagram-api-issues)
6. [Performance Optimization](#6-performance-optimization)
7. [Security Hardening](#7-security-hardening)
8. [Monitoring & Alerting](#8-monitoring--alerting)
9. [Scaling Strategies](#9-scaling-strategies)
10. [Best Practices](#10-best-practices)

---

## 1. Common Issues & Solutions

### 1.1 Frontend Build Errors

**Issue:** Build fails with "Module not found"
```
Error: Cannot find module '@/components/ui/button'
```

**Solution:**
```bash
# Check tsconfig.json paths
cat tsconfig.json | grep paths

# Verify file exists
ls src/components/ui/button.tsx

# Clear cache and rebuild
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

**Issue:** Hydration errors in Next.js
```
Error: Hydration failed because the initial UI does not match
```

**Solution:**
```typescript
// Ensure server and client render the same content
// Use suppressHydrationWarning for dynamic content
<div suppressHydrationWarning>
  {typeof window !== 'undefined' && <ClientOnlyComponent />}
</div>

// Or use useEffect for client-only code
useEffect(() => {
  // Client-side only code here
}, [])
```

### 1.2 Supabase Connection Issues

**Issue:** "Failed to fetch" or connection timeouts

**Solution:**
```typescript
// Check environment variables
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('SUPABASE_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

// Test connection
import { createClient } from '@supabase/supabase-js'

const testConnection = async () => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    const { data, error } = await supabase.from('users').select('count')
    console.log('Connection successful:', data)
  } catch (error) {
    console.error('Connection failed:', error)
  }
}

// Check network
// Open browser DevTools → Network tab
// Look for 4xx/5xx errors
// Check CORS headers
```

### 1.3 Environment Variable Issues

**Issue:** Environment variables not loading

**Solution:**
```bash
# 1. Check file name
ls -la | grep .env
# Should be .env.local, not .env.txt or .env.local.txt

# 2. Verify format (no spaces around =)
cat .env.local | head -5
# ✅ NEXT_PUBLIC_SUPABASE_URL=https://...
# ❌ NEXT_PUBLIC_SUPABASE_URL = https://...

# 3. Restart dev server (required after .env changes)
# Kill server (Ctrl+C) and restart
npm run dev

# 4. For production, set in Lovable dashboard
# Settings → Environment Variables → Add Variable
```

### 1.4 TypeScript Errors

**Issue:** Type errors in Supabase queries

**Solution:**
```bash
# Regenerate types from Supabase schema
cd backend
supabase gen types typescript --local > ../frontend/src/types/database.types.ts

# Or from remote
supabase gen types typescript --project-id YOUR_PROJECT_ID > ../frontend/src/types/database.types.ts
```

```typescript
// Use proper typing
import type { Database } from '@/types/database.types'

type Lead = Database['public']['Tables']['instagram_leads']['Row']

const { data } = await supabase
  .from('instagram_leads')
  .select('*')
  .returns<Lead[]>()

// data is now properly typed!
```

---

## 2. Database Troubleshooting

### 2.1 Slow Queries

**Issue:** Queries taking >1 second

**Diagnosis:**
```sql
-- Enable query logging
ALTER DATABASE postgres SET log_statement = 'all';

-- Find slow queries
SELECT
  query,
  mean_exec_time,
  calls,
  total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000  -- >1 second
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Analyze specific query
EXPLAIN ANALYZE
SELECT * FROM instagram_leads
WHERE status = 'discovered'
  AND lead_score >= 7
ORDER BY lead_score DESC;
```

**Solution:**
```sql
-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_leads_status_score
ON instagram_leads(status, lead_score DESC)
WHERE deleted_at IS NULL;

-- Update statistics
ANALYZE instagram_leads;

-- Rewrite query with better performance
-- Instead of:
SELECT * FROM instagram_leads WHERE location LIKE '%New York%';

-- Use:
SELECT * FROM instagram_leads
WHERE to_tsvector('english', location) @@ to_tsquery('english', 'New & York');
```

### 2.2 Connection Pool Exhaustion

**Issue:** "Too many connections" error

**Diagnosis:**
```sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity;

-- See who's connected
SELECT
  pid,
  usename,
  application_name,
  state,
  query_start
FROM pg_stat_activity
WHERE state = 'active';
```

**Solution:**
```typescript
// Use connection pooling in Supabase client
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: {
        'x-client-info': 'aeo-agency-app',
      },
    },
  }
)

// For serverless functions, use single client instance
// Don't create new client on every request
```

### 2.3 RLS Policy Issues

**Issue:** "Row Level Security policy violation"

**Diagnosis:**
```sql
-- Check policies for table
SELECT * FROM pg_policies WHERE tablename = 'instagram_leads';

-- Test policy as specific user
SET ROLE authenticated;
SET request.jwt.claims.sub TO 'user-uuid-here';
SELECT * FROM instagram_leads;
RESET ROLE;
```

**Solution:**
```sql
-- Debug RLS policies
-- Temporarily disable to test
ALTER TABLE instagram_leads DISABLE ROW LEVEL SECURITY;

-- If query works, RLS is the issue
-- Fix policy:
DROP POLICY IF EXISTS "leads_select_admin_team" ON instagram_leads;

CREATE POLICY "leads_select_admin_team"
ON instagram_leads
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'team_member')
  )
);

-- Re-enable RLS
ALTER TABLE instagram_leads ENABLE ROW LEVEL SECURITY;
```

### 2.4 Trigger Not Firing

**Issue:** Triggers not updating data as expected

**Diagnosis:**
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'calculate_score_on_insert';

-- Check trigger function
\df+ recalculate_lead_score

-- Enable logging in trigger
CREATE OR REPLACE FUNCTION recalculate_lead_score()
RETURNS TRIGGER AS $$
BEGIN
  RAISE NOTICE 'Trigger fired for lead: %', NEW.instagram_username;
  -- ... rest of function
END;
$$ LANGUAGE plpgsql;
```

**Solution:**
```sql
-- Drop and recreate trigger
DROP TRIGGER IF EXISTS calculate_score_on_insert ON instagram_leads;

CREATE TRIGGER calculate_score_on_insert
  BEFORE INSERT ON instagram_leads
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_lead_score();

-- Test trigger
INSERT INTO instagram_leads (
  instagram_username,
  follower_count,
  engagement_rate,
  has_website
) VALUES (
  'test_trigger',
  25000,
  5.5,
  false
) RETURNING lead_score, priority;

-- Should auto-calculate score and priority
```

---

## 3. Authentication Issues

### 3.1 Session Not Persisting

**Issue:** User logged out on page refresh

**Solution:**
```typescript
// Check session persistence settings
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,  // ✅ Enable
      storageKey: 'aeo-auth-token',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  }
)

// Verify storage
console.log('Auth token:', localStorage.getItem('aeo-auth-token'))

// Check cookie settings
// supabase/config.toml
[auth]
jwt_expiry = 3600  # 1 hour
refresh_token_rotation_enabled = true
```

### 3.2 Infinite Redirect Loop

**Issue:** Login redirects to login page repeatedly

**Solution:**
```typescript
// middleware.ts - Fix redirect logic
export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // IMPORTANT: Check if already on login page
  const isAuthPage = req.nextUrl.pathname.startsWith('/login') ||
                     req.nextUrl.pathname.startsWith('/signup')

  if (!session && !isAuthPage && req.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Don't redirect if already authenticated
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL('/admin', req.url))
  }

  return res
}
```

### 3.3 Email Confirmation Not Working

**Issue:** Users not receiving confirmation emails

**Diagnosis:**
```bash
# Check Supabase Auth settings
# Dashboard → Authentication → Email Templates

# Check spam folder
# Check email provider logs
```

**Solution:**
```sql
-- Temporarily disable email confirmation (development only)
-- supabase/config.toml
[auth.email]
enable_confirmations = false  # Only for development!

-- Or manually confirm user
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'user@example.com';
```

---

## 4. n8n Workflow Debugging

### 4.1 Workflow Not Executing

**Issue:** Workflow shows as active but not running

**Diagnosis:**
```bash
# Check n8n logs
docker-compose logs -f n8n

# Check workflow status in UI
# Workflows → Click workflow → Check "Active" toggle
# Executions → Look for errors
```

**Solution:**
```javascript
// Add logging nodes
// Node: Code
console.log('Workflow started:', new Date().toISOString());
console.log('Input data:', $input.all());

// Test workflow manually
// Click "Execute Workflow" button
// Check execution output for each node

// Fix cron expression
// Incorrect:
"expression": "0 2 * * *"  // Might not work in some timezones

// Correct:
"expression": "0 2 * * *"
"timezone": "America/New_York"
```

### 4.2 API Rate Limiting

**Issue:** Instagram/Apify API returning 429 errors

**Solution:**
```javascript
// Add rate limiting delay
// Node: Wait
{
  "time": "={{Math.floor(Math.random() * 30) + 30}}",  // 30-60 seconds
  "unit": "seconds"
}

// Reduce batch size
// Instead of 50 results, try 20
const searchConfig = {
  resultsPerHashtag: 20,  // Reduced from 50
  //...
};

// Implement exponential backoff
// Node: Code
let retries = 0;
const maxRetries = 3;

while (retries < maxRetries) {
  try {
    const response = await fetch(url);
    if (response.status === 429) {
      const delay = Math.pow(2, retries) * 1000;  // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay));
      retries++;
      continue;
    }
    return response;
  } catch (error) {
    if (retries === maxRetries - 1) throw error;
    retries++;
  }
}
```

### 4.3 Data Not Saving to Supabase

**Issue:** n8n workflow completes but no data in database

**Diagnosis:**
```javascript
// Add error logging
// Node: Code (after Supabase insert)
if ($input.first().json.error) {
  console.error('Supabase error:', $input.first().json.error);
  throw new Error($input.first().json.error.message);
}

// Check credentials
// n8n → Credentials → Supabase
// Verify apikey and Authorization headers both set

// Test connection
// Node: HTTP Request
{
  "method": "GET",
  "url": "{{$env.SUPABASE_URL}}/rest/v1/users?select=count",
  // Should return {"count": N}
}
```

**Solution:**
```javascript
// Fix data mapping
// Node: Code
const leadData = {
  instagram_username: $json.username,  // Make sure field names match
  instagram_user_id: $json.id,
  follower_count: parseInt($json.followersCount),  // Convert to integer
  engagement_rate: parseFloat($json.engagementRate),  // Convert to float
  // ... other fields
};

return { json: leadData };

// Verify field names match database schema
// Use exact column names from Supabase
```

---

## 5. Instagram API Issues

### 5.1 Access Token Expired

**Issue:** API returns "OAuthException: The access token has expired"

**Solution:**
```bash
# Generate new long-lived token
curl -X GET "https://graph.facebook.com/v18.0/oauth/access_token" \
  -d "grant_type=fb_exchange_token" \
  -d "client_id=YOUR_APP_ID" \
  -d "client_secret=YOUR_APP_SECRET" \
  -d "fb_exchange_token=YOUR_CURRENT_TOKEN"

# Update in .env
INSTAGRAM_ACCESS_TOKEN=new-token-here

# Restart n8n
docker-compose restart n8n

# Set reminder to refresh in 60 days
```

### 5.2 Message Sending Blocked

**Issue:** "This account cannot send messages at this time"

**Diagnosis:**
```bash
# Check account restrictions
curl "https://graph.facebook.com/v18.0/ACCOUNT_ID?fields=is_published,is_blocked&access_token=TOKEN"
```

**Solution:**
```
# Possible causes:
1. Account flagged for spam
   - Solution: Reduce message volume, improve personalization

2. New account (not warmed up)
   - Solution: Start with 5-10 messages/day, gradually increase

3. Too many messages too quickly
   - Solution: Add delays (30-90 seconds between messages)

4. Messages marked as spam by recipients
   - Solution: Improve message quality, target better

5. Business account not properly set up
   - Solution: Complete Facebook Business verification
```

### 5.3 Rate Limits Reached

**Issue:** "Rate limit exceeded"

**Solution:**
```javascript
// Implement intelligent rate limiting

// Track API calls
const rateLimitState = {
  calls: 0,
  resetTime: Date.now() + (60 * 60 * 1000),  // 1 hour
  maxCalls: 200,  // Instagram limit per hour
};

function canMakeCall() {
  if (Date.now() > rateLimitState.resetTime) {
    rateLimitState.calls = 0;
    rateLimitState.resetTime = Date.now() + (60 * 60 * 1000);
  }

  return rateLimitState.calls < rateLimitState.maxCalls;
}

function recordCall() {
  rateLimitState.calls++;
}

// Use in workflow
if (!canMakeCall()) {
  const waitTime = rateLimitState.resetTime - Date.now();
  console.log(`Rate limit reached. Waiting ${waitTime}ms`);
  await new Promise(resolve => setTimeout(resolve, waitTime));
}

recordCall();
// Make API call
```

---

## 6. Performance Optimization

### 6.1 Frontend Optimization

**Image Optimization:**
```typescript
// Use Next.js Image component
import Image from 'next/image'

<Image
  src={lead.profile_picture_url}
  alt={lead.full_name}
  width={48}
  height={48}
  loading="lazy"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>

// Or use Supabase Image Transformation
const optimizedUrl = supabase.storage
  .from('avatars')
  .getPublicUrl(lead.avatar_path, {
    transform: {
      width: 100,
      height: 100,
      quality: 80,
    },
  })
```

**Code Splitting:**
```typescript
// Dynamic imports for large components
import dynamic from 'next/dynamic'

const AdminDashboard = dynamic(() => import('@/components/admin/Dashboard'), {
  loading: () => <LoadingSpinner />,
  ssr: false,  // Disable server-side rendering if not needed
})

// Route-based code splitting (automatic in Next.js App Router)
// Each page in app/ directory is automatically code-split
```

**Caching:**
```typescript
// Cache API responses
import { cache } from 'react'

export const getLeads = cache(async (filters: LeadFilters) => {
  const { data } = await supabase
    .from('instagram_leads')
    .select('*')
    .match(filters)

  return data
})

// Use React Query for client-side caching
import { useQuery } from '@tanstack/react-query'

function useLeads(filters: LeadFilters) {
  return useQuery({
    queryKey: ['leads', filters],
    queryFn: () => fetchLeads(filters),
    staleTime: 5 * 60 * 1000,  // 5 minutes
    cacheTime: 10 * 60 * 1000,  // 10 minutes
  })
}
```

### 6.2 Database Optimization

**Query Optimization:**
```sql
-- Use EXPLAIN ANALYZE to identify bottlenecks
EXPLAIN (ANALYZE, BUFFERS)
SELECT l.*, COUNT(m.id) as message_count
FROM instagram_leads l
LEFT JOIN outreach_messages m ON l.id = m.lead_id
WHERE l.status = 'discovered'
GROUP BY l.id
ORDER BY l.lead_score DESC
LIMIT 20;

-- Add covering index
CREATE INDEX idx_leads_status_score_covering
ON instagram_leads(status, lead_score DESC)
INCLUDE (instagram_username, follower_count, engagement_rate)
WHERE deleted_at IS NULL;

-- Use materialized views for complex aggregations
CREATE MATERIALIZED VIEW lead_stats AS
SELECT
  status,
  COUNT(*) as count,
  AVG(follower_count) as avg_followers,
  AVG(engagement_rate) as avg_engagement
FROM instagram_leads
WHERE deleted_at IS NULL
GROUP BY status;

-- Refresh periodically
REFRESH MATERIALIZED VIEW CONCURRENTLY lead_stats;
```

**Connection Pooling:**
```typescript
// Use PgBouncer for connection pooling
// supabase/config.toml
[db]
pool_size = 15
statement_timeout = 30000  # 30 seconds
```

### 6.3 n8n Optimization

**Batch Processing:**
```javascript
// Process items in batches instead of one-by-one
// Node: Code
const items = $input.all();
const batchSize = 10;
const batches = [];

for (let i = 0; i < items.length; i += batchSize) {
  batches.push(items.slice(i, i + batchSize));
}

return batches.map(batch => ({ json: { items: batch } }));

// Then use HTTP Request node with batch insert
// POST /rest/v1/instagram_leads
// Body: {json.items}
```

**Parallel Execution:**
```javascript
// Use Split In Batches node
// Settings:
{
  "batchSize": 5,
  "options": {
    "reset": false
  }
}

// Then process batches in parallel
```

---

## 7. Security Hardening

### 7.1 API Key Protection

**Issue:** API keys exposed in client code

**Solution:**
```typescript
// ❌ Never do this
const apiKey = 'sk-1234567890abcdef'  // Hardcoded!

// ✅ Use environment variables
const apiKey = process.env.OPENAI_API_KEY

// ✅ Server-side API routes
// app/api/analyze-lead/route.ts
export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY  // Server-side only

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  })

  return Response.json(await response.json())
}

// Client calls your API, not OpenAI directly
fetch('/api/analyze-lead', {
  method: 'POST',
  body: JSON.stringify(data),
})
```

### 7.2 Input Validation

```typescript
// Always validate and sanitize input
import { z } from 'zod'

const leadSchema = z.object({
  instagram_username: z.string()
    .min(1)
    .max(30)
    .regex(/^[a-zA-Z0-9._]+$/),  // Instagram username format
  follower_count: z.number()
    .int()
    .min(0)
    .max(1000000000),
  email: z.string().email().optional(),
})

// Validate before using
try {
  const validatedData = leadSchema.parse(userInput)
  // Use validatedData
} catch (error) {
  // Handle validation error
  return { error: 'Invalid input' }
}
```

### 7.3 Rate Limiting

```typescript
// Implement rate limiting
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
})

export async function middleware(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous'
  const { success, limit, reset, remaining } = await ratelimit.limit(ip)

  if (!success) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
      },
    })
  }

  return NextResponse.next()
}
```

---

## 8. Monitoring & Alerting

### 8.1 Application Monitoring

**Setup Sentry:**
```bash
npm install @sentry/nextjs

# Initialize
npx @sentry/wizard@latest -i nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
})
```

### 8.2 Database Monitoring

```sql
-- Create monitoring views
CREATE VIEW slow_queries AS
SELECT
  query,
  calls,
  mean_exec_time,
  total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- >100ms
ORDER BY mean_exec_time DESC;

-- Set up alerts
CREATE OR REPLACE FUNCTION check_connection_count()
RETURNS void AS $$
DECLARE
  conn_count INT;
BEGIN
  SELECT count(*) INTO conn_count FROM pg_stat_activity;

  IF conn_count > 80 THEN  -- 80% of max connections
    RAISE WARNING 'High connection count: %', conn_count;
    -- Send alert via webhook/edge function
  END IF;
END;
$$ LANGUAGE plpgsql;
```

### 8.3 Uptime Monitoring

```bash
# Use UptimeRobot or similar
# Monitor endpoints:
- https://yourdomain.com (homepage)
- https://yourdomain.com/api/health (health check)
- https://n8n.yourdomain.com (n8n)
- https://your-project.supabase.co (Supabase)

# Create health check endpoint
# app/api/health/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    auth: await checkAuth(),
    storage: await checkStorage(),
  }

  const allHealthy = Object.values(checks).every(check => check === true)

  return Response.json(
    { status: allHealthy ? 'healthy' : 'unhealthy', checks },
    { status: allHealthy ? 200 : 503 }
  )
}
```

---

## 9. Scaling Strategies

### 9.1 Database Scaling

**Vertical Scaling (Supabase):**
```
Free Tier → Pro ($25/mo) → Enterprise (Custom)
- More CPU
- More RAM
- More connections
- Better performance
```

**Horizontal Scaling:**
```sql
-- Implement read replicas
-- Connection string for reads:
DATABASE_READ_URL=postgresql://...

-- Use in application
const readClient = createClient(READ_URL, KEY, { readonly: true })
const writeClient = createClient(WRITE_URL, KEY)

// Queries
const { data } = await readClient.from('leads').select()

// Mutations
await writeClient.from('leads').insert(data)
```

### 9.2 n8n Scaling

**Multiple Instances:**
```yaml
# docker-compose.yml
services:
  n8n-1:
    image: n8nio/n8n
    # ... config

  n8n-2:
    image: n8nio/n8n
    # ... config

  # Load balancer
  nginx:
    image: nginx
    # ... balance between instances
```

### 9.3 CDN & Caching

```typescript
// Use Vercel Edge Network (automatic with Lovable)
// Or configure CloudFlare

// Set cache headers
export async function GET() {
  return new Response(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  })
}
```

---

## 10. Best Practices

### 10.1 Code Quality

```bash
# Use ESLint
npm run lint

# Use Prettier
npm run format

# Type checking
npm run type-check

# Pre-commit hooks (Husky)
npx husky-init
npm install --save-dev lint-staged

# .husky/pre-commit
#!/bin/sh
npx lint-staged
```

### 10.2 Documentation

```markdown
# Maintain docs:
- README.md (overview)
- API_REFERENCE.md (all endpoints)
- DEPLOYMENT.md (deploy instructions)
- CHANGELOG.md (track changes)
- CONTRIBUTING.md (for team)

# Code comments
/**
 * Calculates lead score based on multiple factors
 * @param followerCount - Number of Instagram followers
 * @param engagementRate - Percentage engagement rate
 * @param hasWebsite - Whether lead has existing website
 * @returns Score from 1-10
 */
function calculateLeadScore(
  followerCount: number,
  engagementRate: number,
  hasWebsite: boolean
): number {
  // Implementation
}
```

### 10.3 Version Control

```bash
# Use semantic versioning
git tag -a v1.0.0 -m "Initial release"

# Feature branches
git checkout -b feature/lead-scoring

# Commit messages
git commit -m "feat: add lead scoring algorithm"
git commit -m "fix: resolve authentication bug"
git commit -m "docs: update API documentation"

# Types: feat, fix, docs, style, refactor, test, chore
```

---

**Progress Tracker:**

- [x] Common Issues & Solutions
- [x] Database Troubleshooting
- [x] Authentication Issues
- [x] n8n Workflow Debugging
- [x] Instagram API Issues
- [x] Performance Optimization
- [x] Security Hardening
- [x] Monitoring & Alerting
- [x] Scaling Strategies
- [x] Best Practices

**Estimated Completion:** 100/100 pages ✅

---

**Navigation:**

- **Previous:** [Part 5: Testing & Deployment ←](./TESTING_DEPLOYMENT.md)
- **Back to Start:** [Part 1: Implementation Guide ←](./IMPLEMENTATION_GUIDE.md)

---

## 🎉 Congratulations!

You've completed the entire AEOLOVABLE implementation module!

**What you've learned:**
- Complete project setup and configuration
- Supabase database design and optimization
- Frontend development with Lovable/Next.js
- n8n automation workflows
- Testing strategies
- Deployment procedures
- Troubleshooting and optimization

**Next Steps:**
1. Start implementing Phase 1 (Foundation)
2. Follow the guides step-by-step
3. Test each component thoroughly
4. Deploy to production gradually
5. Monitor and optimize continuously

**Need Help?**
- Review relevant sections of this guide
- Check Supabase/Lovable/n8n documentation
- Search for specific error messages
- Reach out to project team

---

**Document Version:** 1.0
**Last Updated:** 2025-11-21
**Module Complete:** ✅
