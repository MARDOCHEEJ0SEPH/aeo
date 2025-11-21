# AEOLOVABLE - AEO Agency Automation Platform

## 🚀 Project Overview

AEOLOVABLE is an intelligent automation platform for AEO (Answer Engine Optimization) agencies. It automatically discovers, analyzes, and reaches out to Instagram influencers with 10k+ followers to offer professional website creation services.

### Key Features

- ✅ **Automated Lead Discovery**: Finds Instagram accounts with 10k+ followers using hashtags and location search
- ✅ **AI-Powered Analysis**: Analyzes profiles, calculates engagement rates, and scores leads automatically
- ✅ **Intelligent Outreach**: Sends personalized DMs to qualified leads using AI-generated messages
- ✅ **Response Monitoring**: Tracks responses and categorizes them by sentiment
- ✅ **Client Management**: Complete CRM for managing converted leads through project completion
- ✅ **Project Tracking**: Full project management system for website creation workflows
- ✅ **AEO-Optimized**: Built with Answer Engine Optimization best practices

---

## 📋 Table of Contents

1. [Documentation](#documentation)
2. [Technology Stack](#technology-stack)
3. [Quick Start](#quick-start)
4. [Architecture](#architecture)
5. [Security & Compliance](#security--compliance)
6. [Development Roadmap](#development-roadmap)
7. [Contributing](#contributing)

---

## 📚 Documentation

This repository contains comprehensive documentation for the entire platform:

| Document | Description |
|----------|-------------|
| **[PROJECT_SPECIFICATION.md](./PROJECT_SPECIFICATION.md)** | Complete project specification including features, user journeys, success metrics, and risk mitigation |
| **[TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md)** | Detailed technical architecture covering frontend, backend, automation, security, and deployment |
| **[N8N_WORKFLOWS.md](./N8N_WORKFLOWS.md)** | Step-by-step n8n workflow configurations for Instagram automation |
| **[DATABASE_SCHEMA.sql](./DATABASE_SCHEMA.sql)** | Complete Supabase PostgreSQL database schema with tables, indexes, triggers, and RLS policies |

---

## 🛠 Technology Stack

### Frontend
- **Platform**: Lovable (lovable.dev)
- **Framework**: React/Next.js
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Edge Functions**: Supabase Edge Functions (Deno)

### Automation
- **Workflow Engine**: n8n
- **Instagram Integration**: Instagram Graph API / Apify
- **AI**: OpenAI GPT-4 (for message personalization)

### Infrastructure
- **Hosting**: Lovable (automatic deployment)
- **Database Hosting**: Supabase Cloud
- **Automation**: n8n Cloud or self-hosted (Docker)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account ([supabase.com](https://supabase.com))
- Lovable account ([lovable.dev](https://lovable.dev))
- n8n account or Docker for self-hosting
- Instagram Business Account
- Facebook Developer Account (for Instagram API)

### 1. Set Up Supabase

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize project
supabase init

# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations (create database schema)
psql -h db.YOUR_PROJECT_REF.supabase.co -U postgres -d postgres -f DATABASE_SCHEMA.sql

# Or use Supabase dashboard SQL editor to paste DATABASE_SCHEMA.sql
```

### 2. Set Up Environment Variables

Create `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Instagram
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_business_account_id

# n8n
N8N_API_KEY=your_n8n_api_key

# AI (OpenAI)
OPENAI_API_KEY=your_openai_api_key

# Notifications
RESEND_API_KEY=your_resend_api_key
```

### 3. Deploy to Lovable

1. Create a new project on [lovable.dev](https://lovable.dev)
2. Connect your Git repository or use Lovable's interface
3. Follow the frontend structure in `TECHNICAL_ARCHITECTURE.md`
4. Configure environment variables in Lovable settings
5. Deploy!

### 4. Set Up n8n Workflows

**Option A: n8n Cloud**
1. Sign up at [n8n.io](https://n8n.io)
2. Import workflows from `N8N_WORKFLOWS.md`
3. Configure credentials (Supabase, Instagram, OpenAI)
4. Activate workflows

**Option B: Self-Hosted (Docker)**

```bash
# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
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
      - N8N_BASIC_AUTH_PASSWORD=your_secure_password
      - N8N_HOST=n8n.yourdomain.com
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://n8n.yourdomain.com/
    volumes:
      - n8n_data:/home/node/.n8n
volumes:
  n8n_data:
EOF

# Start n8n
docker-compose up -d

# Access at http://localhost:5678
```

### 5. Configure Instagram API

1. Create Facebook App at [developers.facebook.com](https://developers.facebook.com)
2. Add Instagram Graph API product
3. Generate Access Token with permissions:
   - `instagram_basic`
   - `instagram_manage_messages`
   - `pages_read_engagement`
4. Convert short-lived token to long-lived token
5. Add token to environment variables

---

## 🏗 Architecture

### System Flow

```
Instagram Users (10k+ followers)
         ↓
    n8n Discovery Workflow
         ↓
  Lead Analysis & Scoring
         ↓
   Supabase Database
         ↓
  n8n Outreach Workflow
         ↓
 Personalized DM Sent
         ↓
  Response Monitoring
         ↓
   Admin Dashboard
         ↓
 Convert to Client
         ↓
  Project Management
         ↓
Website Creation & Launch
```

### Key Workflows

1. **Lead Discovery** (Daily at 2 AM)
   - Search hashtags and locations
   - Filter 10k+ followers
   - Analyze engagement
   - Score and store leads

2. **Automated Outreach** (3x daily: 9 AM, 2 PM, 6 PM)
   - Fetch qualified leads
   - Generate personalized messages
   - Send DMs with rate limiting
   - Update database

3. **Response Monitoring** (Every 30 minutes)
   - Check for new messages
   - Analyze sentiment
   - Notify admins
   - Update lead status

4. **Follow-up Automation** (Daily at 10 AM)
   - Identify non-responders
   - Send follow-up messages
   - Max 2 follow-ups per lead

---

## 🔒 Security & Compliance

### Data Protection

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Encrypted API keys and credentials
- ✅ GDPR-compliant data handling
- ✅ Secure authentication with Supabase Auth

### Instagram Compliance

- ✅ Rate limiting (20-50 messages/day)
- ✅ Humanized delays (30-90s between messages)
- ✅ Personalized messages (no spam)
- ✅ Respect Instagram Terms of Service

### Best Practices

- Start with low volume (10-20 messages/day)
- Monitor for blocks/restrictions
- Use multiple accounts for scaling
- Always provide opt-out options
- Regular compliance audits

---

## 🗺 Development Roadmap

### Phase 1: Foundation ✅ (Week 1-2)
- [ ] Set up Lovable project
- [ ] Configure Supabase database
- [ ] Implement authentication
- [ ] Create basic homepage and service pages

### Phase 2: Admin Dashboard (Week 3-4)
- [ ] Lead management interface
- [ ] Campaign management
- [ ] Basic analytics dashboard
- [ ] User management

### Phase 3: n8n Automation (Week 5-6)
- [ ] Set up n8n instance
- [ ] Build lead discovery workflow
- [ ] Implement outreach workflow
- [ ] Create response monitoring system
- [ ] Test Instagram integration

### Phase 4: Client Portal (Week 7-8)
- [ ] Client dashboard
- [ ] Project tracking
- [ ] File upload functionality
- [ ] Communication system

### Phase 5: Integration & Testing (Week 9-10)
- [ ] Full system integration
- [ ] End-to-end testing
- [ ] Security audit
- [ ] Performance optimization
- [ ] Instagram automation testing

### Phase 6: Launch & Optimization (Week 11-12)
- [ ] Soft launch with limited automation
- [ ] Monitor results and metrics
- [ ] Gather feedback
- [ ] Optimize conversion funnel
- [ ] Scale automation gradually

---

## 📊 Success Metrics

### Lead Generation
- **Target**: 50+ leads discovered per day
- **Target**: 20+ qualified leads (10k+ followers) per day
- **Target**: 5-10% response rate
- **Target**: 2-5% conversion rate (lead to client)

### Business
- **Target**: 4-8 new clients per month
- **Target**: $2,000+ average project value
- **Target**: 4.5+/5 client satisfaction score

### Technical
- **Target**: 99.9% uptime
- **Target**: <2 second page load speed
- **Target**: 95%+ automation success rate

---

## 🤝 Contributing

This is a proprietary project for AEO agency operations. For internal team members:

1. Follow the development roadmap
2. Create feature branches: `feature/description`
3. Write tests for new features
4. Update documentation as needed
5. Submit pull requests for review

---

## 📞 Support

For questions or issues:
- **Documentation**: Review the docs in this repository
- **Technical Issues**: Contact the development team
- **Business Questions**: Contact project manager

---

## 📄 License

Proprietary - All rights reserved.

---

## 🎯 Quick Links

- [Supabase Dashboard](https://app.supabase.com)
- [Lovable Dashboard](https://lovable.dev)
- [n8n Workflows](https://app.n8n.io)
- [Instagram Graph API Docs](https://developers.facebook.com/docs/instagram-api)
- [OpenAI API Docs](https://platform.openai.com/docs)

---

## 📝 Version History

- **v1.0** (2025-11-21): Initial specification and architecture
  - Complete database schema
  - n8n workflow documentation
  - Technical architecture
  - Project specification

---

**Built with ❤️ for AEO Agencies**
