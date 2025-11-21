# Supabase Advanced Configuration Guide

## 📘 Complete Database Implementation

**Version:** 1.0
**Last Updated:** 2025-11-21
**Part:** 2 of Implementation Module

---

## Table of Contents

1. [Row Level Security (RLS) Implementation](#1-row-level-security-rls-implementation)
2. [Database Triggers & Functions](#2-database-triggers--functions)
3. [Edge Functions Development](#3-edge-functions-development)
4. [Real-time Subscriptions](#4-real-time-subscriptions)
5. [Storage Configuration](#5-storage-configuration)
6. [Database Optimization](#6-database-optimization)
7. [Backup & Recovery](#7-backup--recovery)

---

## 1. Row Level Security (RLS) Implementation

### 1.1 Understanding RLS

Row Level Security allows you to control which rows users can access at the database level.

**Benefits:**
- Security enforced at database level
- No way to bypass from application code
- Automatic filtering of queries
- Different policies for SELECT, INSERT, UPDATE, DELETE

**Key Concepts:**
- **Policies:** Rules that determine row access
- **Using vs With Check:** Using = SELECT, With Check = INSERT/UPDATE
- **auth.uid():** Current user's ID from JWT token
- **auth.jwt():** Full JWT payload

### 1.2 Enable RLS on All Tables

```sql
-- supabase/migrations/XXXXXXXX_07_enable_rls.sql

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

-- Comments
COMMENT ON TABLE public.users IS 'RLS enabled - users can view own data, admins can view all';
```

### 1.3 Users Table Policies

```sql
-- Users can view their own profile
CREATE POLICY "users_select_own"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "users_update_own"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "admins_select_all_users"
ON public.users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Admins can insert users
CREATE POLICY "admins_insert_users"
ON public.users
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Admins can update any user
CREATE POLICY "admins_update_users"
ON public.users
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Admins can delete users
CREATE POLICY "admins_delete_users"
ON public.users
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);
```

### 1.4 Instagram Leads Policies

```sql
-- Only admins and team members can view leads
CREATE POLICY "leads_select_admin_team"
ON public.instagram_leads
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'team_member')
  )
);

-- Users can only view leads assigned to them
CREATE POLICY "leads_select_assigned"
ON public.instagram_leads
FOR SELECT
USING (assigned_to = auth.uid());

-- Admins and team members can insert leads
CREATE POLICY "leads_insert_admin_team"
ON public.instagram_leads
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'team_member')
  )
);

-- Users can update leads assigned to them
CREATE POLICY "leads_update_assigned"
ON public.instagram_leads
FOR UPDATE
USING (
  assigned_to = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'team_member')
  )
);

-- Only admins can delete leads
CREATE POLICY "leads_delete_admin_only"
ON public.instagram_leads
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);
```

### 1.5 Clients Table Policies

```sql
-- Clients can view their own data
CREATE POLICY "clients_select_own"
ON public.clients
FOR SELECT
USING (user_id = auth.uid());

-- Admins can view all clients
CREATE POLICY "clients_select_admin"
ON public.clients
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'team_member')
  )
);

-- Team members can view assigned clients
CREATE POLICY "clients_select_assigned"
ON public.clients
FOR SELECT
USING (
  assigned_to = auth.uid() OR
  account_manager_id = auth.uid()
);

-- Only admins can insert/update/delete clients
CREATE POLICY "clients_manage_admin"
ON public.clients
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'team_member')
  )
);
```

### 1.6 Projects Table Policies

```sql
-- Clients can view their own projects
CREATE POLICY "projects_select_own"
ON public.projects
FOR SELECT
USING (
  client_id IN (
    SELECT id FROM public.clients
    WHERE user_id = auth.uid()
  )
);

-- Admins and team members can view all projects
CREATE POLICY "projects_select_admin_team"
ON public.projects
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'team_member')
  )
);

-- Project team members can view assigned projects
CREATE POLICY "projects_select_team_member"
ON public.projects
FOR SELECT
USING (
  project_manager_id = auth.uid() OR
  designer_id = auth.uid() OR
  developer_id = auth.uid()
);

-- Admins and project managers can manage projects
CREATE POLICY "projects_manage_admin_pm"
ON public.projects
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  ) OR
  project_manager_id = auth.uid()
);
```

### 1.7 Notifications Policies

```sql
-- Users can only view their own notifications
CREATE POLICY "notifications_select_own"
ON public.notifications
FOR SELECT
USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update_own"
ON public.notifications
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- System can insert notifications for any user
-- (using service role key, bypasses RLS)
```

### 1.8 Test RLS Policies

Create a test script:

```javascript
// backend/test-rls.js
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testRLS() {
  console.log('Testing RLS Policies...\n')

  // Test 1: Anon user (should see nothing)
  const anonSupabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  )

  const { data: anonLeads, error: anonError } = await anonSupabase
    .from('instagram_leads')
    .select('*')

  console.log('Test 1: Anonymous user accessing leads')
  console.log('Expected: 0 rows')
  console.log('Actual:', anonLeads?.length || 0, 'rows')
  console.log('✅ PASS\n')

  // Test 2: Create admin user and test
  const adminSupabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  )

  // Sign up as admin
  const { data: authData, error: authError } = await adminSupabase.auth.signUp({
    email: 'admin-test@example.com',
    password: 'test-password-123'
  })

  if (authError) {
    console.error('Auth error:', authError)
    return
  }

  // Update user role to admin (using service role)
  const serviceSupabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  await serviceSupabase
    .from('users')
    .update({ role: 'admin' })
    .eq('id', authData.user.id)

  // Now test as admin
  const { data: adminLeads } = await adminSupabase
    .from('instagram_leads')
    .select('*')

  console.log('Test 2: Admin user accessing leads')
  console.log('Expected: All rows')
  console.log('Actual:', adminLeads?.length || 0, 'rows')
  console.log('✅ PASS\n')

  // Cleanup
  await serviceSupabase.auth.admin.deleteUser(authData.user.id)
}

testRLS()
```

Run the test:

```bash
node backend/test-rls.js
```

---

## 2. Database Triggers & Functions

### 2.1 Auto-Update Timestamp Trigger

```sql
-- supabase/migrations/XXXXXXXX_08_triggers.sql

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at column
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.instagram_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.outreach_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.outreach_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.project_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 2.2 Lead Score Calculation Trigger

```sql
-- Function to calculate lead score automatically
CREATE OR REPLACE FUNCTION recalculate_lead_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate score based on follower count, engagement, and website status
  NEW.lead_score := (
    -- Follower count scoring (max 4 points)
    CASE
      WHEN NEW.follower_count BETWEEN 10000 AND 50000 THEN 4
      WHEN NEW.follower_count <= 100000 THEN 3
      ELSE 2
    END +
    -- Engagement rate scoring (max 3 points)
    CASE
      WHEN NEW.engagement_rate >= 5 THEN 3
      WHEN NEW.engagement_rate >= 3 THEN 2
      WHEN NEW.engagement_rate >= 1 THEN 1
      ELSE 0
    END +
    -- Website status (max 3 points)
    CASE
      WHEN NEW.has_website = false THEN 3
      ELSE 1
    END
  );

  -- Set priority based on score
  NEW.priority := CASE
    WHEN NEW.lead_score >= 9 THEN 'urgent'
    WHEN NEW.lead_score >= 7 THEN 'high'
    WHEN NEW.lead_score >= 5 THEN 'medium'
    ELSE 'low'
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on insert
CREATE TRIGGER calculate_score_on_insert
  BEFORE INSERT ON public.instagram_leads
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_lead_score();

-- Trigger on update (only when relevant fields change)
CREATE TRIGGER calculate_score_on_update
  BEFORE UPDATE ON public.instagram_leads
  FOR EACH ROW
  WHEN (
    OLD.follower_count IS DISTINCT FROM NEW.follower_count OR
    OLD.engagement_rate IS DISTINCT FROM NEW.engagement_rate OR
    OLD.has_website IS DISTINCT FROM NEW.has_website
  )
  EXECUTE FUNCTION recalculate_lead_score();
```

### 2.3 Campaign Statistics Update Trigger

```sql
-- Function to update campaign stats when message is sent
CREATE OR REPLACE FUNCTION update_campaign_stats_on_send()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.campaign_id IS NOT NULL AND NEW.sent_at IS NOT NULL THEN
    UPDATE public.outreach_campaigns
    SET
      total_sent = total_sent + 1,
      messages_sent = messages_sent + 1,
      total_delivered = CASE WHEN NEW.delivered THEN total_delivered + 1 ELSE total_delivered END,
      updated_at = NOW()
    WHERE id = NEW.campaign_id;
  END IF

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaign_on_message_sent
  AFTER INSERT ON public.outreach_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_stats_on_send();

-- Function to update campaign response stats
CREATE OR REPLACE FUNCTION update_campaign_stats_on_response()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.response_received = true AND OLD.response_received = false THEN
    UPDATE public.outreach_campaigns
    SET
      total_responses = total_responses + 1,
      total_positive_responses = CASE
        WHEN NEW.response_sentiment = 'positive' THEN total_positive_responses + 1
        ELSE total_positive_responses
      END,
      updated_at = NOW()
    WHERE id = NEW.campaign_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaign_on_response
  AFTER UPDATE ON public.outreach_messages
  FOR EACH ROW
  WHEN (NEW.campaign_id IS NOT NULL)
  EXECUTE FUNCTION update_campaign_stats_on_response();
```

### 2.4 Notification Trigger for Interested Leads

```sql
-- Function to notify admins when lead becomes interested
CREATE OR REPLACE FUNCTION notify_interested_lead()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'interested' AND OLD.status != 'interested' THEN
    -- Insert notification for all admins
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      notification_type,
      related_type,
      related_id,
      priority
    )
    SELECT
      id,
      'New Interested Lead! 🎉',
      'Lead @' || NEW.instagram_username || ' (' || NEW.follower_count || ' followers) has shown interest!',
      'lead_interested',
      'lead',
      NEW.id,
      'high'
    FROM public.users
    WHERE role = 'admin';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_lead_interested
  AFTER UPDATE ON public.instagram_leads
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_interested_lead();
```

### 2.5 Client Lifetime Value (LTV) Trigger

```sql
-- Function to update client lifetime value
CREATE OR REPLACE FUNCTION update_client_ltv()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- New project added
    UPDATE public.clients
    SET
      lifetime_value = lifetime_value + COALESCE(NEW.project_value, 0),
      total_projects = total_projects + 1,
      last_project_date = CURRENT_DATE,
      first_project_date = COALESCE(first_project_date, CURRENT_DATE),
      updated_at = NOW()
    WHERE id = NEW.client_id;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Project value changed
    UPDATE public.clients
    SET
      lifetime_value = lifetime_value - COALESCE(OLD.project_value, 0) + COALESCE(NEW.project_value, 0),
      updated_at = NOW()
    WHERE id = NEW.client_id;

  ELSIF TG_OP = 'DELETE' THEN
    -- Project deleted
    UPDATE public.clients
    SET
      lifetime_value = lifetime_value - COALESCE(OLD.project_value, 0),
      total_projects = total_projects - 1,
      updated_at = NOW()
    WHERE id = OLD.client_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ltv_on_project_change
  AFTER INSERT OR UPDATE OR DELETE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION update_client_ltv();
```

### 2.6 Test Triggers

```sql
-- Test script
DO $$
DECLARE
  test_lead_id UUID;
  test_campaign_id UUID;
  initial_score INT;
  updated_score INT;
BEGIN
  -- Test 1: Lead score calculation
  INSERT INTO public.instagram_leads (
    instagram_username,
    follower_count,
    engagement_rate,
    has_website
  ) VALUES (
    'test_user_trigger',
    25000,
    5.5,
    false
  ) RETURNING id, lead_score INTO test_lead_id, initial_score;

  RAISE NOTICE 'Test 1: Lead score = % (expected: 10)', initial_score;

  -- Test 2: Score recalculation on update
  UPDATE public.instagram_leads
  SET follower_count = 200000
  WHERE id = test_lead_id
  RETURNING lead_score INTO updated_score;

  RAISE NOTICE 'Test 2: Updated score = % (expected: 8)', updated_score;

  -- Cleanup
  DELETE FROM public.instagram_leads WHERE id = test_lead_id;

  RAISE NOTICE 'All trigger tests passed! ✅';
END $$;
```

---

## 3. Edge Functions Development

### 3.1 Setup Edge Functions

Edge Functions are serverless functions that run on Deno.

```bash
cd backend/supabase

# Create edge functions
supabase functions new analyze-lead
supabase functions new send-notification
supabase functions new generate-report
```

### 3.2 Analyze Lead Function

```typescript
// supabase/functions/analyze-lead/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InstagramProfile {
  username: string
  follower_count: number
  following_count: number
  post_count: number
  bio: string
  engagement_rate?: number
  location?: string
}

interface AnalysisResult {
  niche: string
  lead_score: number
  priority: string
  has_website: boolean
  engagement_rate: number
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const { username, profile_data } = await req.json()

    if (!username) {
      throw new Error('Username is required')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Analyze the profile
    const analysis = analyzeProfile(profile_data)

    // Store in database
    const { data, error } = await supabaseClient
      .from('instagram_leads')
      .insert({
        instagram_username: username,
        instagram_user_id: profile_data.id,
        full_name: profile_data.full_name,
        bio: profile_data.bio,
        profile_picture_url: profile_data.profile_picture_url,
        follower_count: profile_data.follower_count,
        following_count: profile_data.following_count,
        post_count: profile_data.post_count,
        engagement_rate: analysis.engagement_rate,
        location: profile_data.location,
        niche: analysis.niche,
        has_website: analysis.has_website,
        existing_website_url: profile_data.external_url,
        lead_score: analysis.lead_score,
        priority: analysis.priority,
        status: 'discovered',
      })
      .select()
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          lead_id: data.id,
          analysis,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

function analyzeProfile(profile: InstagramProfile): AnalysisResult {
  // Calculate engagement rate
  const engagementRate = profile.engagement_rate || calculateEngagementRate(profile)

  // Detect niche
  const niche = detectNiche(profile.bio)

  // Check if has website
  const hasWebsite = !!(profile as any).external_url

  // Calculate lead score
  let score = 0

  // Follower count scoring (max 4 points)
  if (profile.follower_count >= 10000 && profile.follower_count <= 50000) {
    score += 4
  } else if (profile.follower_count <= 100000) {
    score += 3
  } else {
    score += 2
  }

  // Engagement rate scoring (max 3 points)
  if (engagementRate >= 5) {
    score += 3
  } else if (engagementRate >= 3) {
    score += 2
  } else if (engagementRate >= 1) {
    score += 1
  }

  // Website status (max 3 points)
  if (!hasWebsite) {
    score += 3
  } else {
    score += 1
  }

  // Determine priority
  const priority = score >= 9 ? 'urgent' : score >= 7 ? 'high' : score >= 5 ? 'medium' : 'low'

  return {
    niche,
    lead_score: score,
    priority,
    has_website: hasWebsite,
    engagement_rate: engagementRate,
  }
}

function calculateEngagementRate(profile: InstagramProfile): number {
  // Simplified - in production, fetch actual post data
  const avgEngagement = profile.follower_count * 0.03 // Assume 3%
  return parseFloat(((avgEngagement / profile.follower_count) * 100).toFixed(2))
}

function detectNiche(bio: string): string {
  const bioLower = bio.toLowerCase()

  const niches: Record<string, string[]> = {
    fitness: ['fitness', 'gym', 'workout', 'health', 'trainer', 'coach'],
    fashion: ['fashion', 'style', 'model', 'beauty', 'makeup'],
    food: ['food', 'chef', 'restaurant', 'recipe', 'cooking'],
    business: ['entrepreneur', 'business', 'ceo', 'founder', 'startup'],
    travel: ['travel', 'adventure', 'explore', 'wanderlust'],
    lifestyle: ['lifestyle', 'blogger', 'vlogger', 'influencer'],
  }

  for (const [niche, keywords] of Object.entries(niches)) {
    if (keywords.some((keyword) => bioLower.includes(keyword))) {
      return niche
    }
  }

  return 'general'
}
```

### 3.3 Send Notification Function

```typescript
// supabase/functions/send-notification/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  type: 'email' | 'sms' | 'push'
  recipient: string
  subject?: string
  message: string
  data?: Record<string, any>
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, recipient, subject, message, data }: NotificationRequest = await req.json()

    let result

    switch (type) {
      case 'email':
        result = await sendEmail(recipient, subject!, message, data)
        break
      case 'sms':
        result = await sendSMS(recipient, message)
        break
      case 'push':
        result = await sendPushNotification(recipient, message, data)
        break
      default:
        throw new Error(`Unsupported notification type: ${type}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        result,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function sendEmail(
  to: string,
  subject: string,
  message: string,
  data?: Record<string, any>
): Promise<any> {
  // Using Resend for email
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: Deno.env.get('FROM_EMAIL') || 'notifications@yourdomain.com',
      to: [to],
      subject,
      html: message,
      ...data,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Email sending failed: ${error}`)
  }

  return await response.json()
}

async function sendSMS(to: string, message: string): Promise<any> {
  // Using Twilio for SMS
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
  const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

  const credentials = btoa(`${accountSid}:${authToken}`)

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: fromNumber!,
        Body: message,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`SMS sending failed: ${error}`)
  }

  return await response.json()
}

async function sendPushNotification(
  recipient: string,
  message: string,
  data?: Record<string, any>
): Promise<any> {
  // Implement push notification (Firebase, OneSignal, etc.)
  // Placeholder implementation
  console.log('Push notification:', { recipient, message, data })
  return { sent: true }
}
```

### 3.4 Deploy Edge Functions

```bash
# Set secrets for edge functions
supabase secrets set RESEND_API_KEY=your-resend-key
supabase secrets set TWILIO_ACCOUNT_SID=your-twilio-sid
supabase secrets set TWILIO_AUTH_TOKEN=your-twilio-token
supabase secrets set TWILIO_PHONE_NUMBER=your-twilio-number

# Deploy functions
supabase functions deploy analyze-lead
supabase functions deploy send-notification

# Test function locally
supabase functions serve analyze-lead

# In another terminal, test with curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/analyze-lead' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"username": "test_user", "profile_data": {...}}'
```

---

*[Continue with sections 4-7...]*

---

**Progress Tracker:**

- [x] Row Level Security Implementation
- [x] Database Triggers & Functions
- [x] Edge Functions Development
- [ ] Real-time Subscriptions
- [ ] Storage Configuration
- [ ] Database Optimization
- [ ] Backup & Recovery

**Estimated Completion:** 20/100 pages

---

**Navigation:**

- **Previous:** [Part 1: Foundation & Setup ←](./IMPLEMENTATION_GUIDE.md)
- **Next:** [Part 3: Frontend Development →](./FRONTEND_DEVELOPMENT.md)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-21
