# Supabase Quick Reference - AEOLOVABLE

## 🚀 Essential Commands & Snippets

One-page reference for common Supabase operations.

---

## 📋 Project Credentials

```bash
# Save these securely!
SUPABASE_URL=https://[your-project-ref].supabase.co
SUPABASE_ANON_KEY=eyJhbG...  # Safe for client-side
SUPABASE_SERVICE_KEY=eyJhbG...  # Server-side only!
DB_PASSWORD=[your-database-password]
```

---

## 🔌 Connection Strings

```bash
# REST API
https://[your-project-ref].supabase.co/rest/v1/

# PostgreSQL
postgresql://postgres:[password]@db.[your-project-ref].supabase.co:5432/postgres

# Edge Functions
https://[your-project-ref].supabase.co/functions/v1/[function-name]

# Realtime
wss://[your-project-ref].supabase.co/realtime/v1/websocket
```

---

## 🛠️ Supabase CLI

### Installation & Setup
```bash
# Install
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref [your-project-ref]

# Initialize local project
supabase init
```

### Database Operations
```bash
# Start local Supabase
supabase start

# Stop local Supabase
supabase stop

# Push migrations
supabase db push

# Pull schema from remote
supabase db pull

# Reset local database
supabase db reset

# Check differences
supabase db diff

# Create new migration
supabase migration new [migration-name]
```

### Edge Functions
```bash
# Create new function
supabase functions new [function-name]

# Deploy function
supabase functions deploy [function-name]

# Delete function
supabase functions delete [function-name]

# View logs
supabase functions logs [function-name]

# View logs (follow mode)
supabase functions logs [function-name] --follow

# Set secrets
supabase secrets set KEY=value

# List secrets
supabase secrets list
```

### TypeScript Types
```bash
# Generate types from remote
supabase gen types typescript --project-id [ref] > types/database.types.ts

# Generate from local
supabase gen types typescript --local > types/database.types.ts
```

---

## 📊 SQL Queries

### Quick Queries
```sql
-- List all tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Count rows in table
SELECT COUNT(*) FROM instagram_leads;

-- View recent leads
SELECT * FROM instagram_leads ORDER BY created_at DESC LIMIT 10;

-- Check RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Check triggers
SELECT * FROM pg_trigger WHERE tgname NOT LIKE 'pg_%';

-- Check indexes
SELECT * FROM pg_indexes WHERE schemaname = 'public';
```

### Common Operations
```sql
-- Insert lead
INSERT INTO instagram_leads (
  instagram_username,
  follower_count,
  engagement_rate,
  has_website
) VALUES (
  'test_user',
  25000,
  5.5,
  false
) RETURNING *;

-- Update lead status
UPDATE instagram_leads
SET status = 'contacted'
WHERE instagram_username = 'test_user';

-- Get leads by status
SELECT * FROM instagram_leads
WHERE status = 'discovered'
  AND lead_score >= 7
ORDER BY lead_score DESC
LIMIT 20;

-- Campaign performance
SELECT
  name,
  total_sent,
  total_responses,
  ROUND((total_responses::DECIMAL / NULLIF(total_sent, 0) * 100), 2) as response_rate
FROM outreach_campaigns;
```

---

## 🔐 Authentication

### Client-Side (Browser)
```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabase = createClientComponentClient()

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
})

// Sign out
await supabase.auth.signOut()

// Get session
const { data: { session } } = await supabase.auth.getSession()

// Get user
const { data: { user } } = await supabase.auth.getUser()
```

### Server-Side (API Routes)
```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const supabase = createServerComponentClient({ cookies })

const { data: { session } } = await supabase.auth.getSession()
```

---

## 📂 Database Operations

### Insert
```typescript
const { data, error } = await supabase
  .from('instagram_leads')
  .insert({
    instagram_username: 'user123',
    follower_count: 25000,
  })
  .select()
```

### Select
```typescript
// Get all
const { data, error } = await supabase
  .from('instagram_leads')
  .select('*')

// With filters
const { data, error } = await supabase
  .from('instagram_leads')
  .select('*')
  .eq('status', 'discovered')
  .gte('follower_count', 10000)
  .order('lead_score', { ascending: false })
  .limit(20)

// With joins
const { data, error } = await supabase
  .from('projects')
  .select(`
    *,
    client:clients(*)
  `)
```

### Update
```typescript
const { data, error } = await supabase
  .from('instagram_leads')
  .update({ status: 'contacted' })
  .eq('id', leadId)
  .select()
```

### Delete
```typescript
const { data, error } = await supabase
  .from('instagram_leads')
  .delete()
  .eq('id', leadId)
```

### Upsert
```typescript
const { data, error } = await supabase
  .from('instagram_leads')
  .upsert({
    instagram_username: 'user123',
    follower_count: 26000,
  })
  .select()
```

---

## 📡 Realtime Subscriptions

```typescript
// Subscribe to changes
const channel = supabase
  .channel('leads-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'instagram_leads',
    },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()

// Unsubscribe
channel.unsubscribe()

// Subscribe to specific events
supabase
  .channel('new-leads')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'instagram_leads',
      filter: 'status=eq.discovered',
    },
    (payload) => {
      console.log('New lead discovered!', payload.new)
    }
  )
  .subscribe()
```

---

## 💾 Storage

### Upload File
```typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.png`, file, {
    cacheControl: '3600',
    upsert: true,
  })
```

### Download File
```typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .download(`${userId}/avatar.png`)
```

### Get Public URL
```typescript
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${userId}/avatar.png`)

console.log(data.publicUrl)
```

### Delete File
```typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .remove([`${userId}/avatar.png`])
```

### List Files
```typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .list(userId, {
    limit: 100,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' },
  })
```

---

## 🔧 Edge Functions

### Call Edge Function
```typescript
const { data, error } = await supabase.functions.invoke('analyze-lead', {
  body: {
    username: 'test_user',
    profile_data: {
      follower_count: 25000,
      engagement_rate: 5.5,
    },
  },
})
```

### With Headers
```typescript
const { data, error } = await supabase.functions.invoke('analyze-lead', {
  headers: {
    'Content-Type': 'application/json',
  },
  body: { /* ... */ },
})
```

---

## 🔍 Filters & Operators

```typescript
// Equals
.eq('status', 'discovered')

// Not equals
.neq('status', 'rejected')

// Greater than
.gt('follower_count', 10000)

// Greater than or equal
.gte('follower_count', 10000)

// Less than
.lt('follower_count', 100000)

// Less than or equal
.lte('follower_count', 100000)

// LIKE pattern matching
.like('instagram_username', '%test%')

// ILIKE (case insensitive)
.ilike('niche', '%fitness%')

// IN array
.in('status', ['discovered', 'contacted'])

// IS NULL
.is('deleted_at', null)

// NOT NULL
.not('deleted_at', 'is', null)

// Text search
.textSearch('bio', 'fitness & entrepreneur')

// Range
.gte('follower_count', 10000)
.lte('follower_count', 50000)

// Multiple filters (AND)
.eq('status', 'discovered')
.gte('lead_score', 7)

// OR filters
.or('status.eq.discovered,status.eq.contacted')
```

---

## 🎯 Common Patterns

### Pagination
```typescript
const pageSize = 20
const page = 1
const from = (page - 1) * pageSize
const to = from + pageSize - 1

const { data, error, count } = await supabase
  .from('instagram_leads')
  .select('*', { count: 'exact' })
  .range(from, to)
```

### Search
```typescript
const { data, error } = await supabase
  .from('instagram_leads')
  .select('*')
  .or(
    `instagram_username.ilike.%${searchTerm}%,` +
    `full_name.ilike.%${searchTerm}%,` +
    `bio.ilike.%${searchTerm}%`
  )
```

### Count
```typescript
const { count, error } = await supabase
  .from('instagram_leads')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'discovered')
```

### Batch Insert
```typescript
const { data, error } = await supabase
  .from('instagram_leads')
  .insert([
    { instagram_username: 'user1', follower_count: 10000 },
    { instagram_username: 'user2', follower_count: 20000 },
    { instagram_username: 'user3', follower_count: 30000 },
  ])
```

---

## 🐛 Debugging

### Enable Verbose Logging
```typescript
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      debug: true,
    },
  }
)
```

### Check Query Builder
```typescript
const query = supabase
  .from('instagram_leads')
  .select('*')
  .eq('status', 'discovered')

console.log('Query:', query)
```

### Error Handling
```typescript
const { data, error } = await supabase
  .from('instagram_leads')
  .select('*')

if (error) {
  console.error('Error:', error.message)
  console.error('Details:', error.details)
  console.error('Hint:', error.hint)
  console.error('Code:', error.code)
}
```

---

## 📊 Performance Tips

1. **Use Indexes** - Always query on indexed columns
2. **Limit Results** - Use `.limit()` to prevent large datasets
3. **Select Specific Columns** - Don't use `*` unless needed
4. **Use Count with Head** - For counts only: `{ count: 'exact', head: true }`
5. **Enable RLS** - But use service_role key for admin operations
6. **Cache Results** - Use React Query or SWR for client-side caching
7. **Batch Operations** - Use bulk insert/update when possible

---

## 🔗 Useful Links

- [Supabase Dashboard](https://app.supabase.com)
- [Supabase Docs](https://supabase.com/docs)
- [JavaScript Client Docs](https://supabase.com/docs/reference/javascript)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Discord Community](https://discord.supabase.com)

---

**Quick Reference v1.0** | Last Updated: 2025-11-21
