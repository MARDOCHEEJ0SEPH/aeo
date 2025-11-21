# AEOLOVABLE n8n Automation Workflows

Complete n8n workflow automation suite for the AEO Agency Instagram lead generation and outreach platform.

## 📋 Table of Contents

- [Overview](#overview)
- [Workflows](#workflows)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Workflow Details](#workflow-details)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This directory contains 6 complete n8n workflows that automate the entire Instagram lead generation and conversion pipeline:

1. **Lead Discovery** - Automatically find qualified Instagram leads
2. **Lead Analysis & Qualification** - AI-powered lead scoring and qualification
3. **Automated Outreach** - Send personalized DMs to qualified leads
4. **Response Monitoring** - Track and analyze lead responses in real-time
5. **Follow-up Automation** - Automated follow-up messages for non-responders
6. **Lead Conversion Tracking** - Complete conversion pipeline from lead to client

---

## 📦 Workflows

| Workflow | File | Purpose | Schedule |
|----------|------|---------|----------|
| **01 - Instagram Lead Discovery** | `01-instagram-lead-discovery.json` | Find and import Instagram leads with 10k+ followers | Every 6 hours |
| **02 - Lead Analysis & Qualification** | `02-lead-analysis-qualification.json` | Analyze content and qualify leads using AI | Every 2 hours |
| **03 - Automated Outreach** | `03-automated-outreach.json` | Send personalized outreach messages | Every 1 hour |
| **04 - Response Monitoring** | `04-response-monitoring.json` | Monitor DM responses and analyze sentiment | Every 15 minutes |
| **05 - Follow-up Automation** | `05-follow-up-automation.json` | Send follow-up messages to non-responders | Every 4 hours |
| **06 - Lead Conversion Tracking** | `06-lead-conversion-tracking.json` | Track conversions and create client/project records | Webhook trigger |

---

## ✅ Prerequisites

### Required Services

1. **n8n Instance** (v1.0.0+)
   - Self-hosted or n8n Cloud
   - [Installation Guide](https://docs.n8n.io/hosting/)

2. **Supabase Project**
   - Database schema deployed (see `../DATABASE_SCHEMA.sql`)
   - Project URL and API keys

3. **Apify Account**
   - For Instagram scraping
   - API Token
   - [Sign up](https://apify.com/)

4. **OpenAI API Key**
   - GPT-4 access recommended
   - [Get API Key](https://platform.openai.com/api-keys)

5. **Instagram Graph API**
   - Business/Creator account
   - Facebook Developer App
   - Access Token with messaging permissions
   - [Setup Guide](https://developers.facebook.com/docs/instagram-api/)

### Required n8n Nodes

These nodes should be available in your n8n instance:
- Schedule Trigger
- HTTP Request
- Supabase
- Code (Function)
- If
- Wait
- Webhook

---

## 🚀 Installation

### Step 1: Import Workflows

1. Open your n8n instance
2. Click **Workflows** → **Import from File**
3. Import each workflow JSON file in order:
   - `01-instagram-lead-discovery.json`
   - `02-lead-analysis-qualification.json`
   - `03-automated-outreach.json`
   - `04-response-monitoring.json`
   - `05-follow-up-automation.json`
   - `06-lead-conversion-tracking.json`

### Step 2: Configure Credentials

Set up the following credentials in n8n:

#### 1. Apify API Token
- **Type:** HTTP Header Auth
- **Name:** `Apify API Token`
- **Header Name:** `Authorization`
- **Header Value:** `Bearer YOUR_APIFY_TOKEN`

#### 2. Supabase API
- **Type:** Supabase API
- **Name:** `Supabase API`
- **Host:** `https://YOUR_PROJECT_REF.supabase.co`
- **Service Role Key:** `YOUR_SUPABASE_SERVICE_ROLE_KEY`

#### 3. OpenAI API Key
- **Type:** HTTP Header Auth
- **Name:** `OpenAI API Key`
- **Header Name:** `Authorization`
- **Header Value:** `Bearer YOUR_OPENAI_API_KEY`

#### 4. Instagram Graph API
- **Type:** HTTP Header Auth
- **Name:** `Instagram Graph API`
- **Access Token:** `YOUR_INSTAGRAM_ACCESS_TOKEN`

---

## ⚙️ Configuration

### Workflow 01: Lead Discovery

**Configure Search Queries:**
Edit the "Generate Search Queries" node to target your desired niches:

```javascript
const searchQueries = [
  'fitness coach location:"New York"',
  'restaurant owner location:"Los Angeles"',
  // Add your target niches and locations
];
```

### Workflow 02: Lead Analysis

**Adjust Qualification Criteria:**
Edit SQL query in "Get New Leads" node to filter by different criteria:

```sql
WHERE status = 'discovered'
  AND follower_count >= 10000  -- Adjust minimum followers
  AND deleted_at IS NULL
```

### Workflow 03: Automated Outreach

**Set Message Limits:**
Configure daily limits in the active campaign or adjust the query:

```sql
WHERE c.messages_sent < c.daily_message_limit  -- Adjust limit
```

**Message Template:**
Create outreach campaigns in Supabase with your message templates:

```sql
INSERT INTO outreach_campaigns (
  name,
  message_template,
  daily_message_limit,
  target_follower_min
) VALUES (
  'Main Campaign',
  'Hi {{full_name}}! I noticed your amazing content...',
  20,
  10000
);
```

### Workflow 04: Response Monitoring

**Adjust Check Frequency:**
Edit Schedule Trigger to check more/less frequently (default: 15 minutes)

### Workflow 05: Follow-up Automation

**Configure Follow-up Timing:**
Edit the SQL query to adjust follow-up delays:

```sql
WHERE l.last_contacted_at < NOW() - INTERVAL '3 days'  -- Adjust delay
  AND l.follow_up_count < 2  -- Adjust max follow-ups
```

### Workflow 06: Conversion Tracking

**Get Webhook URL:**
1. Open workflow in n8n
2. Click on "Webhook Trigger" node
3. Copy the webhook URL
4. Use this URL in your frontend to trigger conversions

**Webhook Payload Example:**
```json
{
  "lead_id": "uuid-here",
  "project_name": "Fitness Studio Website",
  "project_type": "website",
  "package_tier": "professional",
  "project_value": 5000,
  "deposit_amount": 1500,
  "converted_by": "user-uuid",
  "notes": "Client wants modern design"
}
```

---

## 🎮 Usage

### Starting the Workflows

1. **Test Each Workflow Individually:**
   - Open workflow
   - Click **"Test workflow"** button
   - Check for errors in execution log

2. **Activate Workflows:**
   - Click the **Active/Inactive** toggle for each workflow
   - Recommended activation order:
     1. Lead Discovery (01)
     2. Lead Analysis (02)
     3. Outreach (03)
     4. Response Monitoring (04)
     5. Follow-up (05)
     6. Conversion Tracking (06)

3. **Monitor Execution:**
   - Go to **Executions** tab
   - Filter by workflow
   - Check for errors or warnings

### Best Practices

1. **Start with Test Mode:**
   - Reduce daily limits initially
   - Test with 1-2 leads first
   - Verify database updates

2. **Monitor Performance:**
   - Check execution times
   - Monitor API rate limits
   - Review analytics events

3. **Adjust Schedules:**
   - Reduce frequency if hitting rate limits
   - Increase for faster processing
   - Consider timezone optimization

---

## 📊 Workflow Details

### 01 - Instagram Lead Discovery

**Flow:**
1. Trigger: Every 6 hours
2. Generate search queries for target niches
3. Call Apify Instagram Scraper API
4. Filter profiles with 10k+ followers
5. Calculate lead scores automatically
6. Save to Supabase database
7. Log analytics events
8. Notify admins of high-score leads

**Key Metrics:**
- Leads discovered per run
- Average lead score
- High-priority lead count

### 02 - Lead Analysis & Qualification

**Flow:**
1. Trigger: Every 2 hours
2. Get newly discovered leads
3. Fetch recent posts via Apify
4. Analyze content themes and engagement
5. Use GPT-4 to qualify leads
6. Calculate website need score
7. Update lead status and custom fields
8. Notify team of qualified leads

**Key Metrics:**
- Qualification rate
- Average website need score
- Recommended package distribution

### 03 - Automated Outreach

**Flow:**
1. Trigger: Every 1 hour
2. Get active campaign settings
3. Fetch qualified leads (not yet contacted)
4. Generate personalized messages with GPT-4
5. Send Instagram DMs via Graph API
6. Log messages in database
7. Update lead status to "contacted"
8. Respect daily message limits
9. Wait between messages (rate limiting)

**Key Metrics:**
- Messages sent per day
- Personalization quality
- Daily limit adherence

### 04 - Response Monitoring

**Flow:**
1. Trigger: Every 15 minutes
2. Fetch Instagram conversations
3. Filter new responses from leads
4. Match responses to leads in database
5. Analyze sentiment with GPT-4
6. Determine interest level (1-10)
7. Update lead status (interested/engaged/rejected)
8. Notify team of positive responses
9. Auto-mark rejections as "do not contact"

**Key Metrics:**
- Response rate
- Positive sentiment rate
- Interest level distribution

### 05 - Follow-up Automation

**Flow:**
1. Trigger: Every 4 hours
2. Find leads contacted 3+ days ago with no response
3. Limit to 2 follow-ups maximum
4. Get campaign follow-up template
5. Generate personalized follow-up with GPT-4
6. Send follow-up DM
7. Increment follow-up counter
8. Wait 10 minutes between follow-ups

**Key Metrics:**
- Follow-up response rate
- Conversion after follow-up
- Average follow-ups needed

### 06 - Lead Conversion Tracking

**Flow:**
1. Trigger: Webhook from frontend
2. Parse conversion data
3. Get lead details from database
4. Create or link user account
5. Create client record
6. Create project record
7. Update lead status to "converted"
8. Update campaign conversion stats
9. Log conversion analytics event
10. Notify entire team
11. Generate and send welcome message
12. Return success response

**Key Metrics:**
- Conversion rate
- Average project value
- Time from discovery to conversion

---

## 🔧 Troubleshooting

### Common Issues

#### 1. "Credentials not found" Error
**Solution:**
- Ensure all 4 credentials are created in n8n
- Check credential names match exactly
- Verify API keys are valid

#### 2. Apify Scraper Returns No Results
**Solution:**
- Check search query syntax
- Verify Apify account has credits
- Try simpler search terms
- Check Apify actor status

#### 3. Instagram API "Invalid Access Token"
**Solution:**
- Regenerate Instagram access token
- Ensure token has messaging permissions
- Check token expiration date
- Verify Instagram Business account is active

#### 4. Supabase Connection Failed
**Solution:**
- Verify database schema is deployed
- Check Supabase project URL
- Ensure service role key is used (not anon key)
- Test connection with simple query

#### 5. OpenAI Rate Limit Errors
**Solution:**
- Reduce workflow execution frequency
- Upgrade OpenAI plan
- Add retry logic with delays
- Use GPT-3.5-turbo for non-critical tasks

#### 6. Messages Not Sending
**Solution:**
- Check Instagram messaging permissions
- Verify recipient allows messages from businesses
- Review Instagram API rate limits (200 messages/day default)
- Check for message policy violations

#### 7. Workflows Not Triggering on Schedule
**Solution:**
- Check n8n instance is running
- Verify workflows are activated (toggle is green)
- Check n8n logs for errors
- Restart n8n instance if needed

### Debug Mode

Enable debug mode in n8n:
1. Open workflow
2. Click **Settings** (gear icon)
3. Enable **Save Execution Progress**
4. Run workflow
5. Check detailed execution log

### Testing Individual Nodes

1. Select node to test
2. Click **"Execute Node"**
3. Review input/output data
4. Check for errors in right panel

---

## 📈 Monitoring & Analytics

### Key Metrics to Track

Query these from your Supabase database:

```sql
-- Daily lead discovery
SELECT DATE(created_at) as date, COUNT(*) as leads_discovered
FROM instagram_leads
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Conversion funnel
SELECT
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM instagram_leads
WHERE deleted_at IS NULL
GROUP BY status;

-- Campaign performance
SELECT
  name,
  total_sent,
  total_responses,
  total_conversions,
  ROUND(total_responses::decimal / NULLIF(total_sent, 0) * 100, 2) as response_rate,
  ROUND(total_conversions::decimal / NULLIF(total_sent, 0) * 100, 2) as conversion_rate
FROM outreach_campaigns
ORDER BY total_sent DESC;

-- Revenue tracking
SELECT
  DATE(created_at) as date,
  COUNT(*) as conversions,
  SUM(lifetime_value) as total_revenue
FROM clients
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### n8n Execution Statistics

View in n8n dashboard:
- Total executions per workflow
- Success rate
- Average execution time
- Error frequency

---

## 🔐 Security Best Practices

1. **API Keys:**
   - Never commit API keys to git
   - Use environment variables in production
   - Rotate keys regularly

2. **Webhook Security:**
   - Add authentication to webhook endpoints
   - Validate incoming payloads
   - Use HTTPS only

3. **Rate Limiting:**
   - Respect all API rate limits
   - Implement exponential backoff
   - Monitor usage metrics

4. **Data Privacy:**
   - Follow Instagram's terms of service
   - Implement GDPR compliance
   - Allow users to opt-out
   - Secure personal data

---

## 📚 Additional Resources

- [n8n Documentation](https://docs.n8n.io/)
- [Instagram Graph API Docs](https://developers.facebook.com/docs/instagram-api/)
- [Apify Documentation](https://docs.apify.com/)
- [OpenAI API Reference](https://platform.openai.com/docs/)
- [Supabase Documentation](https://supabase.com/docs)

---

## 🆘 Support

For issues or questions:

1. Check this README first
2. Review n8n execution logs
3. Test individual nodes
4. Check API service status pages
5. Review database logs in Supabase

---

## 📝 License

Part of the AEOLOVABLE project. All rights reserved.

---

**Last Updated:** 2025-11-21
**Version:** 1.0
**Author:** AEO Agency Development Team
