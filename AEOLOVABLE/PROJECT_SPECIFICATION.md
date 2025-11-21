# AEO Agency Website - Project Specification

## Project Overview

**Project Name:** AEO Agency Platform
**Code Name:** AEOLOVABLE
**Platform:** Lovable (v0/lovable.dev)
**Database:** Supabase
**Automation:** n8n
**Target Market:** Instagram influencers and businesses with 10k+ followers

## Executive Summary

This project involves building an automated AEO (Answer Engine Optimization) agency website that identifies, analyzes, and reaches out to potential clients on Instagram. The platform will automatically discover Instagram accounts with 10k+ followers, analyze their profiles and locations, and send personalized outreach messages proposing website creation services.

---

## 1. Technical Stack

### Frontend (Lovable)
- **Framework:** React/Next.js (via Lovable)
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **State Management:** React Context/Zustand
- **Form Handling:** React Hook Form + Zod validation

### Backend (Supabase)
- **Database:** PostgreSQL (Supabase)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage (for assets, screenshots)
- **Real-time:** Supabase Realtime subscriptions
- **Edge Functions:** Supabase Edge Functions (for API endpoints)

### Automation (n8n)
- **Workflow Engine:** n8n (self-hosted or cloud)
- **Instagram Integration:** Instagram Graph API / Unofficial APIs
- **Scheduling:** Cron-based triggers
- **Data Processing:** Built-in n8n nodes + custom JavaScript

---

## 2. Core Features

### 2.1 Public Website (Marketing Site)

#### Homepage
- Hero section showcasing AEO services
- Value proposition: "Transform Your Instagram Presence into a Professional Website"
- Social proof: Testimonials, case studies
- Trust indicators: Number of websites created, client success stories
- Clear CTA: "Get Your Custom Website" / "See Examples"

#### Services Page
- **AEO Website Creation**
  - Custom design based on Instagram aesthetic
  - Mobile-first responsive design
  - SEO/AEO optimized structure
  - Answer Engine ready content

- **Instagram Integration**
  - Automatic content sync from Instagram
  - Social proof widgets
  - Gallery displays

- **Additional Services**
  - E-commerce integration
  - Booking systems
  - Lead generation tools
  - Analytics dashboard

#### Portfolio/Case Studies
- Showcase of created websites
- Before/After comparisons
- Client testimonials
- Performance metrics (traffic, conversions)

#### Pricing Page
- Tiered pricing structure:
  - **Starter:** $997 - Basic website (5 pages)
  - **Professional:** $2,497 - Advanced features + SEO
  - **Enterprise:** $4,997+ - Full AEO optimization + automation
- Clear feature comparison table
- ROI calculator

#### About Page
- Agency story and mission
- Team members (if applicable)
- AEO expertise and certifications
- Why choose us section

#### Contact Page
- Contact form
- Live chat (optional)
- Social media links
- Office location/timezone information

### 2.2 Client Dashboard (Protected Area)

#### Authentication
- Email/password registration
- Social login (Google, Instagram)
- Magic link authentication
- Role-based access control (Admin, Client)

#### Client Portal
- **Project Overview**
  - Current project status
  - Timeline and milestones
  - Deliverables checklist

- **Website Preview**
  - Live preview of website in development
  - Feedback/comment system
  - Revision requests

- **Content Management**
  - Upload images, logos, brand assets
  - Provide business information
  - Approve content drafts

- **Communication**
  - Message thread with agency
  - Notification system
  - File sharing

- **Analytics** (Post-launch)
  - Website traffic
  - Conversion metrics
  - Answer Engine visibility
  - Lead generation stats

### 2.3 Admin Dashboard

#### Lead Management
- **Prospecting Dashboard**
  - List of discovered Instagram accounts (10k+ followers)
  - Profile analysis results
  - Location data
  - Engagement metrics
  - Lead score/priority

- **Outreach Status**
  - Pending outreach
  - Messages sent
  - Responses received
  - Conversations in progress
  - Converted leads

- **Lead Details View**
  - Full Instagram profile analysis
  - Follower count and growth trend
  - Location and demographics
  - Content themes/niche
  - Engagement rate
  - Existing website (if any)
  - Competitor analysis

#### Campaign Management
- Create outreach campaigns
- Message templates with personalization tokens
- A/B testing capabilities
- Schedule management
- Performance metrics

#### Client Project Management
- Client list and status
- Project timelines
- Task assignment
- File management
- Invoice/payment tracking

#### Analytics & Reporting
- Lead generation metrics
- Conversion funnel
- Response rates
- Revenue tracking
- ROI per campaign

---

## 3. Instagram Automation Workflow (n8n)

### 3.1 Lead Discovery Workflow

**Trigger:** Scheduled (Daily at 2:00 AM)

**Steps:**
1. **Instagram Hashtag/Location Search**
   - Search relevant hashtags (#entrepreneur, #business, #brand, etc.)
   - Search location-based (configurable cities/regions)
   - Discover new accounts

2. **Filter Accounts**
   - Check follower count (≥10k)
   - Exclude already contacted accounts (check Supabase)
   - Exclude competitors
   - Validate account is active (recent posts)

3. **Profile Analysis**
   - Extract profile data:
     - Username, bio, follower count, following count
     - Profile picture URL
     - Website link (if exists)
     - Location/city
     - Post count

   - Calculate engagement metrics:
     - Average likes per post
     - Average comments per post
     - Engagement rate: (likes + comments) / followers × 100

   - Content analysis:
     - Identify niche/industry
     - Detect brand keywords
     - Analyze visual aesthetic
     - Check if they have a website already

4. **Lead Scoring**
   - High priority: 10k-50k followers, high engagement, no website
   - Medium priority: 50k-100k followers, medium engagement
   - Low priority: 100k+ (likely already has professional presence)

5. **Store in Supabase**
   - Insert into `instagram_leads` table
   - Store profile data, metrics, and score
   - Set status: `discovered`

### 3.2 Outreach Workflow

**Trigger:** Scheduled (Multiple times daily, 9 AM, 2 PM, 6 PM)

**Steps:**
1. **Fetch Qualified Leads**
   - Query Supabase for leads with status `discovered`
   - Apply lead score filter (high priority first)
   - Limit: 20 leads per run (avoid rate limiting)

2. **Personalization Engine**
   - Generate personalized message using lead data:
     - Extract name from bio/username
     - Reference their location
     - Mention their follower count milestone
     - Reference their niche/content theme

   - Message template example:
     ```
     Hey [Name]! 👋

     I came across your amazing [niche] content and noticed you've built an incredible community of [follower_count] followers in [location]!

     I specialize in helping influencers like you turn their Instagram presence into a professional website that attracts more clients and opportunities.

     Would you be interested in seeing how a custom website could help you [specific benefit based on niche]?

     I'd love to show you some examples of websites I've created for creators in the [niche] space. No pressure - just thought this might be valuable for you!

     Best,
     [Your Agency Name]
     ```

3. **Send Instagram DM**
   - Use Instagram API/automation tool
   - Send personalized message
   - Handle rate limits and delays (randomize timing)
   - Log message sent timestamp

4. **Update Lead Status**
   - Update status to `contacted`
   - Record outreach date
   - Increment contact attempt counter

5. **Error Handling**
   - If send fails: Log error, retry later
   - If account restricted: Mark as `blocked`
   - If account not found: Mark as `invalid`

### 3.3 Follow-up Workflow

**Trigger:** Scheduled (Daily at 10:00 AM)

**Steps:**
1. **Identify Follow-up Candidates**
   - Leads contacted 3 days ago with no response
   - Maximum 2 follow-ups per lead

2. **Send Follow-up Message**
   - Different template for follow-up:
     ```
     Hey [Name], following up on my previous message!

     I know you're probably busy, but I wanted to share a quick example of a website I created for [@similar_influencer] - it helped them [result].

     If you're interested, I'd be happy to create a free mockup of what your website could look like. No commitment required!

     Let me know! 😊
     ```

3. **Update Status**
   - Increment follow-up count
   - Update last contact date

### 3.4 Response Monitoring Workflow

**Trigger:** Scheduled (Every 30 minutes)

**Steps:**
1. **Check for New Messages**
   - Query Instagram API for new DM responses
   - Match responses to leads in database

2. **Categorize Response**
   - **Positive:** Keywords like "yes", "interested", "tell me more"
   - **Negative:** "no", "not interested", "stop"
   - **Neutral:** Questions or unclear responses

3. **Update Lead Status**
   - Positive → `interested` (notify admin)
   - Negative → `rejected`
   - Neutral → `engaged` (requires manual response)

4. **Notify Admin**
   - Send notification to admin dashboard
   - Email/SMS alert for positive responses
   - Create task in CRM

### 3.5 Data Enrichment Workflow

**Trigger:** Scheduled (Weekly)

**Steps:**
1. **Update Lead Metrics**
   - Re-fetch follower counts
   - Update engagement rates
   - Check if they've added a website

2. **Clean Database**
   - Mark inactive accounts
   - Remove duplicates
   - Archive old rejected leads

---

## 4. Database Schema (Supabase)

### 4.1 Tables

#### `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'client', -- 'admin', 'client'
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `instagram_leads`
```sql
CREATE TABLE instagram_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instagram_username TEXT UNIQUE NOT NULL,
  instagram_user_id TEXT,
  full_name TEXT,
  bio TEXT,
  profile_picture_url TEXT,
  follower_count INTEGER,
  following_count INTEGER,
  post_count INTEGER,
  engagement_rate DECIMAL(5,2),
  location TEXT,
  city TEXT,
  country TEXT,
  niche TEXT,
  has_website BOOLEAN DEFAULT false,
  existing_website_url TEXT,
  lead_score INTEGER, -- 1-10
  status TEXT DEFAULT 'discovered', -- 'discovered', 'contacted', 'engaged', 'interested', 'rejected', 'converted', 'blocked', 'invalid'
  first_contacted_at TIMESTAMP WITH TIME ZONE,
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  contact_attempts INTEGER DEFAULT 0,
  follow_up_count INTEGER DEFAULT 0,
  converted_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `outreach_campaigns`
```sql
CREATE TABLE outreach_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  message_template TEXT NOT NULL,
  target_follower_min INTEGER DEFAULT 10000,
  target_follower_max INTEGER,
  target_locations TEXT[], -- Array of locations
  target_niches TEXT[], -- Array of niches
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `outreach_messages`
```sql
CREATE TABLE outreach_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES instagram_leads(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES outreach_campaigns(id),
  message_text TEXT NOT NULL,
  message_type TEXT, -- 'initial', 'follow_up'
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  response_received BOOLEAN DEFAULT false,
  response_text TEXT,
  response_sentiment TEXT, -- 'positive', 'negative', 'neutral'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `clients`
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES instagram_leads(id), -- Link to original lead if applicable
  company_name TEXT,
  instagram_handle TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  status TEXT DEFAULT 'onboarding', -- 'onboarding', 'in_progress', 'review', 'completed', 'churned'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `projects`
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  package_tier TEXT, -- 'starter', 'professional', 'enterprise'
  project_value DECIMAL(10,2),
  status TEXT DEFAULT 'planning', -- 'planning', 'design', 'development', 'review', 'completed', 'cancelled'
  lovable_project_url TEXT,
  production_url TEXT,
  start_date DATE,
  expected_completion_date DATE,
  actual_completion_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `project_tasks`
```sql
CREATE TABLE project_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo', -- 'todo', 'in_progress', 'review', 'completed'
  priority TEXT, -- 'low', 'medium', 'high'
  assigned_to UUID REFERENCES users(id),
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `analytics_events`
```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL, -- 'page_view', 'lead_discovered', 'message_sent', 'response_received', 'conversion'
  event_data JSONB,
  user_id UUID REFERENCES users(id),
  lead_id UUID REFERENCES instagram_leads(id),
  project_id UUID REFERENCES projects(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4.2 Row Level Security (RLS)

Enable RLS on all tables and create policies:

```sql
-- Example for instagram_leads table
ALTER TABLE instagram_leads ENABLE ROW LEVEL SECURITY;

-- Admins can see all leads
CREATE POLICY "Admins can view all leads" ON instagram_leads
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- Clients can't see leads (only admins)
CREATE POLICY "Clients cannot view leads" ON instagram_leads
  FOR SELECT
  USING (false);
```

### 4.3 Functions & Triggers

```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_instagram_leads_updated_at BEFORE UPDATE ON instagram_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add similar triggers for other tables
```

---

## 5. User Journeys

### 5.1 Potential Client Journey (Instagram User)

1. **Discovery:** Receives personalized Instagram DM
2. **Interest:** Responds positively to message
3. **Engagement:** Admin follows up with examples/mockups
4. **Conversion:** Agrees to website creation
5. **Onboarding:** Receives account creation email
6. **Access:** Logs into client portal
7. **Collaboration:** Provides content, reviews designs
8. **Launch:** Website goes live
9. **Success:** Tracks results via analytics dashboard

### 5.2 Agency Admin Journey

1. **Setup:** Configure n8n workflows and campaigns
2. **Monitoring:** Check daily lead discovery dashboard
3. **Review:** Assess new qualified leads
4. **Engagement:** Respond to interested prospects
5. **Sales:** Convert leads to clients
6. **Project Management:** Oversee website creation
7. **Delivery:** Launch client websites
8. **Optimization:** Analyze campaign performance, iterate

---

## 6. Answer Engine Optimization (AEO) Strategy

### 6.1 Website AEO Features

- **Structured Data:** Schema.org markup for all pages
- **FAQ Sections:** Answer common questions clearly
- **Natural Language Content:** Conversational tone for AI readability
- **Entity Optimization:** Clear business entities and relationships
- **Featured Snippets:** Content formatted for answer boxes
- **Semantic HTML:** Proper heading hierarchy and semantic tags

### 6.2 Marketing Site AEO

**Target Queries:**
- "How to get a website for my Instagram business"
- "Best website builder for influencers"
- "Should I create a website for my Instagram"
- "Website creation for Instagram creators"
- "How much does a website cost for influencers"

**Content Strategy:**
- Blog articles answering common questions
- Case studies with specific results
- Comparison guides
- Video content explaining the process

### 6.3 Client Website AEO

Each client website will be optimized for:
- Local search (if applicable)
- Industry-specific queries
- Brand name searches
- Service-based queries
- FAQ optimization

---

## 7. Compliance & Legal

### 7.1 Instagram Automation Compliance

**Important Considerations:**
- Instagram Terms of Service compliance
- Avoid aggressive automation (rate limiting)
- Respectful outreach messaging
- Easy opt-out mechanism
- No spam or unsolicited commercial messages

**Best Practices:**
- Daily message limits (max 20-50/day)
- Randomized timing to appear human
- Personalized messages (no bulk generic spam)
- Monitor for blocks/restrictions
- Manual review of responses

### 7.2 Data Privacy

- **GDPR Compliance:** If targeting EU users
  - Clear privacy policy
  - Data collection consent
  - Right to deletion
  - Data portability

- **CCPA Compliance:** If targeting California users
  - Privacy notice
  - Opt-out options

- **Data Storage:**
  - Secure database (Supabase encryption)
  - No sensitive data without consent
  - Regular data audits

### 7.3 Email Marketing

- CAN-SPAM compliance
- Clear unsubscribe options
- Accurate sender information

---

## 8. Development Phases

### Phase 1: Foundation (Week 1-2)
- Set up Lovable project
- Configure Supabase database
- Implement authentication
- Create basic homepage and service pages

### Phase 2: Admin Dashboard (Week 3-4)
- Lead management interface
- Campaign management
- Basic analytics dashboard
- User management

### Phase 3: n8n Automation (Week 5-6)
- Set up n8n instance
- Build lead discovery workflow
- Implement outreach workflow
- Create response monitoring system
- Test Instagram integration

### Phase 4: Client Portal (Week 7-8)
- Client dashboard
- Project tracking
- File upload functionality
- Communication system

### Phase 5: Integration & Testing (Week 9-10)
- Full system integration
- End-to-end testing
- Security audit
- Performance optimization
- Instagram automation testing (small scale)

### Phase 6: Launch & Optimization (Week 11-12)
- Soft launch with limited automation
- Monitor results and metrics
- Gather feedback
- Optimize conversion funnel
- Scale automation gradually

---

## 9. Success Metrics

### Lead Generation
- Leads discovered per day: Target 50+
- Qualified leads (10k+ followers): Target 20+/day
- Response rate: Target 5-10%
- Conversion rate (lead to client): Target 2-5%

### Business
- New clients per month: Target 4-8
- Average project value: Target $2,000+
- Monthly recurring revenue (if applicable)
- Client satisfaction score: Target 4.5+/5

### Technical
- Website uptime: Target 99.9%
- Page load speed: Target <2 seconds
- Instagram automation success rate: Target 95%+
- Database query performance: Target <100ms

---

## 10. Risk Mitigation

### Instagram Account Restrictions
- **Risk:** Main account gets blocked/banned
- **Mitigation:**
  - Use multiple accounts for outreach
  - Implement strict rate limiting
  - Manual review before messages sent
  - Warm up new accounts gradually

### Low Response Rates
- **Risk:** Outreach doesn't generate enough leads
- **Mitigation:**
  - A/B test message templates
  - Refine targeting criteria
  - Improve lead scoring algorithm
  - Diversify outreach channels (email, LinkedIn)

### Scaling Challenges
- **Risk:** Can't handle high volume of clients
- **Mitigation:**
  - Template-based website creation
  - Automation for repetitive tasks
  - Clear project management workflows
  - Hire additional team members

### Technical Failures
- **Risk:** Supabase/n8n/Lovable downtime
- **Mitigation:**
  - Monitoring and alerts
  - Backup systems
  - Data backups
  - Incident response plan

---

## 11. Future Enhancements

### V2 Features
- AI-powered website design generator
- Automatic content creation from Instagram posts
- Multi-language support
- White-label solution for agencies
- Affiliate/referral program

### Additional Platforms
- TikTok automation
- LinkedIn outreach
- YouTube creator targeting
- Twitter/X integration

### Advanced Analytics
- Predictive lead scoring
- Conversion forecasting
- Competitor analysis tools
- ROI calculator for clients

---

## 12. Budget Estimation

### Tools & Services (Monthly)
- Lovable: $0-20 (depends on plan)
- Supabase: $25 (Pro plan)
- n8n: $20-50 (Cloud) or $0 (self-hosted)
- Domain & Email: $15/month
- Instagram automation tools: $50-100/month
- **Total:** ~$110-200/month

### Development (One-time)
- If outsourced: $5,000-15,000
- If in-house: Time investment (12 weeks)

### Operational
- Customer support: Variable
- Marketing: Variable
- Legal/compliance: $500-1,000 (initial)

---

## 13. Next Steps

1. **Validate Concept:**
   - Manual outreach to 20 Instagram users
   - Test message templates and response rates
   - Validate pricing with target market

2. **Set Up Infrastructure:**
   - Create Supabase project
   - Set up Lovable workspace
   - Install n8n (cloud or self-hosted)

3. **Build MVP:**
   - Simple landing page
   - Basic lead database
   - Manual outreach process
   - Collect first 1-2 clients

4. **Automate Gradually:**
   - Start with lead discovery automation
   - Add outreach automation (limited scale)
   - Scale based on results

5. **Iterate & Optimize:**
   - Analyze what works
   - Improve targeting and messaging
   - Build full platform based on learnings

---

## Appendix A: Message Templates

### Template 1: Initial Outreach (General)
```
Hey [Name]! 👋

I came across your Instagram profile and I'm impressed by the [follower_count] followers you've built around [niche] in [location]!

I help creators like you turn their Instagram presence into a professional website that opens new opportunities - whether that's attracting clients, partnerships, or just having a central hub for your brand.

Would you be interested in seeing what a custom website could do for your brand? I'd love to share some examples!

No pressure at all - just thought this might be valuable for you.

Best,
[Agency Name]
```

### Template 2: Niche-Specific (Fitness Influencer)
```
Hey [Name]!

Your fitness content is 🔥! I noticed you've built an amazing community of [follower_count] followers.

I specialize in creating websites for fitness influencers that help them:
✅ Sell online coaching programs
✅ Showcase transformation stories
✅ Book consultation calls
✅ Build email lists for future promotions

Want to see what a professional website could do for your coaching business?

Let me know! 💪
```

### Template 3: Follow-up
```
Hey [Name], just following up!

I know you're probably busy, but I wanted to share a quick example - I recently built a website for [@example_creator] (they're also in [niche]) and it helped them 3x their client bookings in the first month.

If you're interested, I could create a free mockup of what YOUR website could look like. No strings attached!

Let me know if you'd like to see it! 😊
```

---

## Appendix B: Supabase Edge Functions

### Function: analyze-instagram-profile
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { username } = await req.json()

  // Fetch Instagram profile data (use Instagram API or scraping service)
  // Calculate engagement rate
  // Determine niche
  // Return analysis

  return new Response(
    JSON.stringify({ score: 8, niche: 'fitness', engagement_rate: 4.5 }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
```

---

## Appendix C: n8n Workflow Examples

### Lead Discovery Workflow JSON
```json
{
  "name": "Instagram Lead Discovery",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [{"field": "cronExpression", "expression": "0 2 * * *"}]
        }
      },
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger"
    },
    {
      "parameters": {
        "hashtag": "entrepreneur",
        "limit": 50
      },
      "name": "Search Instagram Hashtag",
      "type": "n8n-nodes-base.instagram"
    }
  ]
}
```

---

**Document Version:** 1.0
**Last Updated:** 2025-11-21
**Status:** Draft - Ready for Implementation
