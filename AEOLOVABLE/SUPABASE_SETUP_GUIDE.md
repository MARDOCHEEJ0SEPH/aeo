# Supabase Setup Guide - AEOLOVABLE Project

## 🚀 Complete Supabase Setup & Deployment

**Version:** 1.0
**Last Updated:** 2025-11-21
**Estimated Time:** 30 minutes

---

## Table of Contents

1. [Create Supabase Account & Project](#step-1-create-supabase-account--project)
2. [Get Your Credentials](#step-2-get-your-credentials)
3. [Deploy Database Schema](#step-3-deploy-database-schema)
4. [Test the Schema](#step-4-test-the-schema)
5. [Set Up Edge Functions](#step-5-set-up-edge-functions)
6. [Configure Authentication](#step-6-configure-authentication)
7. [Set Up Storage](#step-7-set-up-storage)
8. [Connect to Frontend](#step-8-connect-to-frontend)
9. [Verify Everything Works](#step-9-verify-everything-works)

---

## Step 1: Create Supabase Account & Project

### 1.1 Sign Up for Supabase

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign in with **GitHub** (recommended) or email
4. Complete account verification

### 1.2 Create New Project

1. Click **"New Project"**
2. Fill in project details:

   ```
   Name: aeolovable-production
   Database Password: [Generate strong password - SAVE THIS!]
   Region: [Choose closest to your users]
   Pricing Plan: Free (upgrade to Pro later)
   ```

3. Click **"Create new project"**
4. Wait 2-3 minutes for setup to complete

**✅ Checkpoint:** You should see your project dashboard

---

## Step 2: Get Your Credentials

### 2.1 Find Project Settings

1. Click **Settings** (⚙️ icon in sidebar)
2. Go to **API** section

### 2.2 Copy Important Credentials

You'll need these values - **SAVE THEM SECURELY**:

```bash
# Project URL
https://[your-project-ref].supabase.co

# Project Reference ID
[your-project-ref]

# API Keys
anon key (public): eyJhbG...
service_role key (private): eyJhbG...

# Database Password
[The password you created in Step 1.2]
```

### 2.3 Save to .env File

Create a `.env.local` file in your project:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...your-service-role-key
SUPABASE_DB_PASSWORD=your-database-password

# Database Connection String
DATABASE_URL=postgresql://postgres:[password]@db.[your-project-ref].supabase.co:5432/postgres
```

**⚠️ IMPORTANT:** Never commit `.env.local` to Git!

**✅ Checkpoint:** You have all 4 credentials saved

---

## Step 3: Deploy Database Schema

You have **3 options** to deploy the schema:

### Option A: Supabase Dashboard (Easiest) ⭐

**Best for:** First-time deployment

1. Go to your project dashboard
2. Click **SQL Editor** in the sidebar
3. Click **"New query"**
4. **Copy entire contents** of `AEOLOVABLE/DATABASE_SCHEMA.sql`
5. **Paste** into the editor
6. Click **"Run"** (or press Ctrl/Cmd + Enter)
7. Wait ~30 seconds for completion
8. Check for success message: "Success. No rows returned"

**✅ Expected:** All tables, triggers, and functions created

### Option B: Supabase CLI (Recommended for Development)

**Best for:** Version control and migrations

```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Login to Supabase
supabase login

# 3. Link your project
supabase link --project-ref [your-project-ref]
# Enter database password when prompted

# 4. Create migration from schema
mkdir -p supabase/migrations
cp AEOLOVABLE/DATABASE_SCHEMA.sql supabase/migrations/20250101000000_initial_schema.sql

# 5. Push to Supabase
supabase db push

# 6. Verify
supabase db diff
```

**✅ Expected:** "Database migrations applied successfully"

### Option C: Direct psql Connection

**Best for:** Advanced users

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[password]@db.[your-project-ref].supabase.co:5432/postgres"

# Run schema file
\i AEOLOVABLE/DATABASE_SCHEMA.sql

# Verify tables
\dt

# Expected: 11 tables listed
```

**✅ Expected:** See all 11 tables listed

---

## Step 4: Test the Schema

### 4.1 Run the Test Suite

**Using Supabase Dashboard:**

1. In **SQL Editor**, create a **new query**
2. Copy contents of `AEOLOVABLE/DATABASE_SCHEMA_TEST.sql`
3. Paste and click **"Run"**
4. Review output in **Results** panel

**Expected Output:**
```
✅ All 11 tables exist
✅ Found 25 custom indexes
✅ All trigger functions exist
✅ Lead scoring trigger working correctly
✅ Campaign stats trigger working correctly
✅ All tests passed! ✅
```

**Using psql:**
```bash
psql "postgresql://postgres:[password]@db.[your-project-ref].supabase.co:5432/postgres" \
  -f AEOLOVABLE/DATABASE_SCHEMA_TEST.sql
```

**✅ Checkpoint:** All tests pass with ✅

### 4.2 Verify Tables in Dashboard

1. Go to **Table Editor** in sidebar
2. You should see all tables:
   - users
   - instagram_leads
   - outreach_campaigns
   - outreach_messages
   - clients
   - projects
   - project_tasks
   - comments
   - analytics_events
   - notifications
   - file_uploads

**✅ Checkpoint:** All 11 tables visible

---

## Step 5: Set Up Edge Functions

### 5.1 Create Edge Functions Directory

```bash
mkdir -p supabase/functions
```

### 5.2 Create `analyze-lead` Function

```bash
supabase functions new analyze-lead
```

Copy this code to `supabase/functions/analyze-lead/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { username, profile_data } = await req.json()

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Calculate lead score
    const score = calculateLeadScore(profile_data)

    // Insert to database
    const { data, error } = await supabaseClient
      .from('instagram_leads')
      .insert({
        instagram_username: username,
        follower_count: profile_data.follower_count,
        engagement_rate: profile_data.engagement_rate,
        lead_score: score,
        status: 'discovered',
      })
      .select()
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

function calculateLeadScore(profile: any): number {
  let score = 0

  if (profile.follower_count >= 10000 && profile.follower_count <= 50000) {
    score += 4
  } else if (profile.follower_count <= 100000) {
    score += 3
  } else {
    score += 2
  }

  if (profile.engagement_rate >= 5) {
    score += 3
  } else if (profile.engagement_rate >= 3) {
    score += 2
  } else if (profile.engagement_rate >= 1) {
    score += 1
  }

  if (!profile.has_website) {
    score += 3
  } else {
    score += 1
  }

  return score
}
```

### 5.3 Deploy Edge Functions

```bash
# Set environment secrets
supabase secrets set SUPABASE_URL=https://[your-project-ref].supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Deploy function
supabase functions deploy analyze-lead

# Test function
curl -i --location --request POST \
  'https://[your-project-ref].supabase.co/functions/v1/analyze-lead' \
  --header 'Authorization: Bearer [your-anon-key]' \
  --header 'Content-Type: application/json' \
  --data '{"username":"test_user","profile_data":{"follower_count":25000,"engagement_rate":5.5,"has_website":false}}'
```

**✅ Expected:** `{"success":true,"data":{...}}`

---

## Step 6: Configure Authentication

### 6.1 Enable Email Authentication

1. Go to **Authentication** → **Providers**
2. Find **Email** provider
3. Toggle **Enable Email provider** ON
4. Configure settings:
   - ✅ Enable email confirmations
   - ✅ Enable email change confirmations
   - ✅ Enable secure password change

### 6.2 Customize Email Templates

1. Go to **Authentication** → **Email Templates**
2. Customize templates for:
   - Confirmation email
   - Magic link email
   - Reset password email

### 6.3 Set Site URL

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `https://yourdomain.com`
3. Add **Redirect URLs**:
   - `http://localhost:3000` (development)
   - `https://yourdomain.com` (production)

**✅ Checkpoint:** Auth settings configured

---

## Step 7: Set Up Storage

### 7.1 Create Storage Buckets

1. Go to **Storage** in sidebar
2. Click **"Create a new bucket"**

Create these buckets:

**Bucket 1: avatars**
```
Name: avatars
Public: Yes
File size limit: 5 MB
Allowed MIME types: image/png, image/jpeg, image/webp
```

**Bucket 2: project-files**
```
Name: project-files
Public: No
File size limit: 50 MB
Allowed MIME types: image/*, application/pdf, .doc, .docx
```

### 7.2 Set Storage Policies

```sql
-- Allow public read access to avatars
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload avatars
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

-- Allow users to access their own project files
CREATE POLICY "Users can access own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**✅ Checkpoint:** Storage buckets created and secured

---

## Step 8: Connect to Frontend

### 8.1 Install Supabase Client

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### 8.2 Create Supabase Client

Create `lib/supabase/client.ts`:

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database.types'

export const supabase = createClientComponentClient<Database>()
```

### 8.3 Generate TypeScript Types

```bash
# Using Supabase CLI
supabase gen types typescript --project-id [your-project-ref] > types/database.types.ts

# Or using URL
npx supabase gen types typescript --project-id [your-project-ref] --schema public > types/database.types.ts
```

### 8.4 Test Connection

Create `test-supabase.ts`:

```typescript
import { supabase } from './lib/supabase/client'

async function testConnection() {
  try {
    // Test database connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .single()

    if (error) throw error

    console.log('✅ Supabase connected successfully!')
    console.log('Users count:', data)

    // Test auth
    const { data: { session } } = await supabase.auth.getSession()
    console.log('✅ Auth service working!')

  } catch (error) {
    console.error('❌ Connection failed:', error)
  }
}

testConnection()
```

Run test:
```bash
npx ts-node test-supabase.ts
```

**✅ Expected:** "✅ Supabase connected successfully!"

---

## Step 9: Verify Everything Works

### 9.1 Database Checklist

- [ ] All 11 tables created
- [ ] All indexes exist
- [ ] All triggers working
- [ ] RLS policies enabled
- [ ] Test suite passes

### 9.2 Edge Functions Checklist

- [ ] `analyze-lead` function deployed
- [ ] Function accessible via API
- [ ] Returns correct responses

### 9.3 Authentication Checklist

- [ ] Email provider enabled
- [ ] Email templates configured
- [ ] Site URL set
- [ ] Redirect URLs configured

### 9.4 Storage Checklist

- [ ] Avatars bucket created
- [ ] Project files bucket created
- [ ] Storage policies set

### 9.5 Frontend Connection Checklist

- [ ] Supabase client installed
- [ ] Environment variables set
- [ ] TypeScript types generated
- [ ] Test connection works

---

## 🎉 You're Done!

Your Supabase backend is fully configured and ready for the AEOLOVABLE platform!

### Next Steps:

1. **Start building frontend**
   - Follow `FRONTEND_DEVELOPMENT.md`
   - Use the Supabase client to fetch data

2. **Set up n8n automation**
   - Follow `AUTOMATION_SETUP.md`
   - Connect n8n to Supabase

3. **Deploy to production**
   - Upgrade to Supabase Pro ($25/mo)
   - Set up monitoring
   - Configure backups

---

## Quick Reference

### Connection Strings

**REST API:**
```
https://[your-project-ref].supabase.co/rest/v1/
```

**Database:**
```
postgresql://postgres:[password]@db.[your-project-ref].supabase.co:5432/postgres
```

**Edge Functions:**
```
https://[your-project-ref].supabase.co/functions/v1/
```

### Common Commands

```bash
# Link project
supabase link --project-ref [ref]

# Push schema changes
supabase db push

# Pull schema changes
supabase db pull

# Deploy edge function
supabase functions deploy [function-name]

# View logs
supabase functions logs [function-name]

# Generate types
supabase gen types typescript
```

---

## Troubleshooting

### "Invalid API key"
- Check your `.env.local` file
- Verify you're using the correct key (anon vs service_role)
- Restart your dev server

### "relation does not exist"
- Run `DATABASE_SCHEMA.sql` first
- Check you're connected to the right database

### "RLS policy violation"
- Check RLS policies in Table Editor
- Verify user is authenticated
- Use service_role key for admin operations

### Edge function not working
- Check function logs: `supabase functions logs`
- Verify environment secrets are set
- Test with curl to isolate issues

---

## Support Resources

- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)
- **Discord:** [discord.supabase.com](https://discord.supabase.com)
- **GitHub:** [github.com/supabase/supabase](https://github.com/supabase/supabase)

---

**Setup Complete! 🚀**

Your AEOLOVABLE backend is ready to power your Instagram automation platform!

---

**Last Updated:** 2025-11-21
**Version:** 1.0
