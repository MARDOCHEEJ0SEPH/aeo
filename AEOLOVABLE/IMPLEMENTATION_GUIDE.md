# AEOLOVABLE - Complete Implementation Guide

## 📘 Master Implementation Module

**Version:** 1.0
**Last Updated:** 2025-11-21
**Estimated Time:** 12 weeks
**Difficulty:** Intermediate to Advanced

---

## 📖 Table of Contents

### Part 1: Foundation & Setup
1. [Introduction](#1-introduction)
2. [Prerequisites & Requirements](#2-prerequisites--requirements)
3. [Development Environment Setup](#3-development-environment-setup)
4. [Project Architecture Overview](#4-project-architecture-overview)

### Part 2: Backend Setup (Supabase)
5. [Supabase Project Initialization](#5-supabase-project-initialization)
6. [Database Schema Implementation](#6-database-schema-implementation)
7. [Row Level Security Configuration](#7-row-level-security-configuration)
8. [Edge Functions Development](#8-edge-functions-development)

### Part 3: Frontend Development (Lovable)
9. [Lovable Project Setup](#9-lovable-project-setup)
10. [Authentication System](#10-authentication-system)
11. [Component Library Development](#11-component-library-development)
12. [Marketing Website Pages](#12-marketing-website-pages)
13. [Admin Dashboard](#13-admin-dashboard)
14. [Client Portal](#14-client-portal)

### Part 4: Automation (n8n)
15. [n8n Installation & Configuration](#15-n8n-installation--configuration)
16. [Instagram API Integration](#16-instagram-api-integration)
17. [Workflow Implementation](#17-workflow-implementation)

### Part 5: Integration & Testing
18. [End-to-End Integration](#18-end-to-end-integration)
19. [Testing Strategy](#19-testing-strategy)
20. [Deployment & Launch](#20-deployment--launch)

---

## 1. Introduction

### 1.1 What You'll Build

By the end of this guide, you will have built a complete AEO agency automation platform that:

- **Automatically discovers** Instagram accounts with 10k+ followers
- **Analyzes profiles** using AI and scores them as potential leads
- **Sends personalized DMs** to qualified leads
- **Monitors responses** and categorizes them by sentiment
- **Manages the entire client lifecycle** from lead to project completion
- **Tracks projects** with a full project management system

### 1.2 Target Audience

This guide is designed for:
- Full-stack developers with React/Next.js experience
- Developers familiar with SQL and relational databases
- Teams building automation platforms
- Agencies wanting to automate lead generation

### 1.3 Learning Outcomes

After completing this guide, you will be able to:
- Build complex React applications with Lovable
- Design and implement PostgreSQL databases with Supabase
- Create automation workflows with n8n
- Integrate Instagram Graph API
- Implement AI-powered features with OpenAI
- Deploy production-ready SaaS applications

### 1.4 Module Structure

This implementation guide is divided into **5 major parts**:

| Part | Focus | Duration | Difficulty |
|------|-------|----------|------------|
| 1 | Foundation & Setup | 3 days | Easy |
| 2 | Backend (Supabase) | 2 weeks | Intermediate |
| 3 | Frontend (Lovable) | 4 weeks | Intermediate |
| 4 | Automation (n8n) | 2 weeks | Advanced |
| 5 | Integration & Testing | 3 weeks | Advanced |

### 1.5 Development Approach

We follow an **iterative development approach**:

1. **Build the foundation** - Set up all tools and infrastructure
2. **Develop vertically** - Complete one feature end-to-end before moving to the next
3. **Test continuously** - Write tests as you build
4. **Deploy incrementally** - Deploy features as they're completed
5. **Iterate based on feedback** - Gather feedback and improve

---

## 2. Prerequisites & Requirements

### 2.1 Technical Skills Required

**Essential:**
- JavaScript/TypeScript (ES6+)
- React fundamentals (hooks, state, props)
- HTML5 & CSS3
- SQL basics
- Git version control
- Command line proficiency

**Recommended:**
- Next.js experience
- PostgreSQL knowledge
- API integration experience
- Authentication systems understanding
- Workflow automation concepts

### 2.2 Software Requirements

**Required Tools:**

| Tool | Version | Purpose | Cost |
|------|---------|---------|------|
| Node.js | 18+ | JavaScript runtime | Free |
| npm/yarn | Latest | Package manager | Free |
| Git | 2.x+ | Version control | Free |
| VS Code | Latest | Code editor | Free |
| Supabase CLI | Latest | Database management | Free |
| Docker | Latest | Container runtime (for n8n) | Free |

**Required Services:**

| Service | Plan | Cost | Purpose |
|---------|------|------|---------|
| Supabase | Pro | $25/mo | Database & Auth |
| Lovable | Starter | $20/mo | Frontend hosting |
| n8n | Cloud | $20/mo | Automation |
| OpenAI | Pay-as-you-go | ~$10-50/mo | AI features |
| Apify | Free tier | $0-49/mo | Instagram scraping |

**Total Monthly Cost:** ~$75-165/month

### 2.3 Account Setup Checklist

Before starting, create accounts on:

- [ ] GitHub (for version control)
- [ ] Supabase (database hosting)
- [ ] Lovable (frontend deployment)
- [ ] n8n Cloud or Docker setup
- [ ] Facebook Developers (for Instagram API)
- [ ] OpenAI (for AI features)
- [ ] Apify (for Instagram scraping)
- [ ] Resend or SendGrid (for emails)

### 2.4 API Access Requirements

**Instagram Graph API:**
- Facebook Developer Account
- Instagram Business or Creator Account
- App created with Instagram permissions
- Access token (generated through Facebook App)

**Required Permissions:**
- `instagram_basic`
- `instagram_manage_messages`
- `pages_read_engagement`
- `pages_manage_metadata`

### 2.5 Domain & DNS

**Optional but Recommended:**
- Custom domain name ($10-15/year)
- DNS management access
- SSL certificate (provided by hosting)

---

## 3. Development Environment Setup

### 3.1 Install Node.js and npm

**macOS/Linux:**

```bash
# Install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal, then install Node.js 18
nvm install 18
nvm use 18
nvm alias default 18

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

**Windows:**

1. Download Node.js 18 LTS from [nodejs.org](https://nodejs.org)
2. Run the installer
3. Verify in Command Prompt:
```cmd
node --version
npm --version
```

### 3.2 Install Git

**macOS:**
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Git
brew install git
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install git
```

**Windows:**
Download and install from [git-scm.com](https://git-scm.com)

**Configure Git:**
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 3.3 Install Supabase CLI

```bash
# macOS/Linux
npm install -g supabase

# Verify installation
supabase --version
```

### 3.4 Install Docker (for n8n)

**macOS:**
- Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop)
- Install and start Docker Desktop

**Linux:**
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER
```

**Windows:**
- Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop)
- Install and enable WSL2 if prompted

### 3.5 Install VS Code Extensions

Essential extensions for this project:

```bash
# Install VS Code extensions via command line
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
code --install-extension Prisma.prisma
code --install-extension ms-azuretools.vscode-docker
code --install-extension mtxr.sqltools
code --install-extension mtxr.sqltools-driver-pg
```

**Recommended Extensions:**
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Prisma (for database schema)
- Docker
- SQLTools
- SQLTools PostgreSQL Driver
- GitLens
- Error Lens

### 3.6 Create Project Directory Structure

```bash
# Create main project directory
mkdir ~/aeolovable-project
cd ~/aeolovable-project

# Create subdirectories
mkdir -p frontend
mkdir -p backend
mkdir -p automation
mkdir -p docs
mkdir -p scripts

# Initialize Git repository
git init
git branch -M main

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Next.js
.next/
out/
build/

# Supabase
.supabase/

# n8n
n8n_data/

# IDE
.vscode/
.idea/
*.swp
*.swo

# Logs
logs/
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# Misc
.env.backup
*.bak
EOF
```

### 3.7 Set Up Environment Variables Template

Create a template for environment variables:

```bash
cat > .env.example << 'EOF'
# ====================
# Supabase Configuration
# ====================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_DB_PASSWORD=your-database-password

# ====================
# Instagram API
# ====================
INSTAGRAM_ACCESS_TOKEN=your-instagram-access-token
INSTAGRAM_BUSINESS_ACCOUNT_ID=your-business-account-id
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# ====================
# n8n Configuration
# ====================
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=your-secure-password
N8N_HOST=n8n.yourdomain.com
N8N_WEBHOOK_URL=https://n8n.yourdomain.com

# ====================
# OpenAI (AI Features)
# ====================
OPENAI_API_KEY=sk-your-openai-api-key

# ====================
# Apify (Instagram Scraping)
# ====================
APIFY_API_TOKEN=your-apify-api-token

# ====================
# Email Service (Resend)
# ====================
RESEND_API_KEY=re_your-resend-api-key
FROM_EMAIL=notifications@yourdomain.com

# ====================
# SMS Service (Twilio) - Optional
# ====================
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# ====================
# Analytics (Optional)
# ====================
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# ====================
# Application
# ====================
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_APP_NAME="AEO Agency"
NODE_ENV=development
EOF
```

### 3.8 Verify Installation

Run this verification script:

```bash
cat > verify-setup.sh << 'EOF'
#!/bin/bash

echo "==================================="
echo "AEOLOVABLE Setup Verification"
echo "==================================="
echo ""

# Check Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js: $(node --version)"
else
    echo "❌ Node.js: Not installed"
fi

# Check npm
if command -v npm &> /dev/null; then
    echo "✅ npm: $(npm --version)"
else
    echo "❌ npm: Not installed"
fi

# Check Git
if command -v git &> /dev/null; then
    echo "✅ Git: $(git --version)"
else
    echo "❌ Git: Not installed"
fi

# Check Supabase CLI
if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI: $(supabase --version)"
else
    echo "⚠️  Supabase CLI: Not installed (optional)"
fi

# Check Docker
if command -v docker &> /dev/null; then
    echo "✅ Docker: $(docker --version)"
else
    echo "⚠️  Docker: Not installed (needed for n8n)"
fi

echo ""
echo "==================================="
EOF

chmod +x verify-setup.sh
./verify-setup.sh
```

---

## 4. Project Architecture Overview

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT BROWSER                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │ Marketing  │  │   Admin    │  │  Client    │        │
│  │  Website   │  │ Dashboard  │  │  Portal    │        │
│  └────────────┘  └────────────┘  └────────────┘        │
└─────────────────────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────┐
│              LOVABLE (Frontend - Next.js)                │
│  • React Components                                      │
│  • TailwindCSS Styling                                   │
│  • Client-side State (Zustand)                          │
│  • Form Handling (React Hook Form)                      │
└─────────────────────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────┐
│              SUPABASE (Backend)                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ PostgreSQL  │  │    Auth      │  │   Storage    │  │
│  │  Database   │  │   Service    │  │   Service    │  │
│  └─────────────┘  └──────────────┘  └──────────────┘  │
│  ┌─────────────────────────────────────────────────┐   │
│  │         Edge Functions (Deno)                    │   │
│  │  • analyze-lead    • send-notification          │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────┐
│              n8n (Automation Engine)                     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │    Lead     │  │   Outreach   │  │   Response   │  │
│  │  Discovery  │  │  Automation  │  │  Monitoring  │  │
│  └─────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────┐
│              EXTERNAL SERVICES                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │Instagram │  │ OpenAI   │  │  Apify   │  │ Resend  ││
│  │   API    │  │   API    │  │   API    │  │  Email  ││
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘│
└─────────────────────────────────────────────────────────┘
```

### 4.2 Data Flow

**Lead Discovery Flow:**
```
Instagram (Apify Scraper)
    → n8n Workflow
    → Supabase Edge Function (analyze-lead)
    → PostgreSQL (instagram_leads table)
    → Admin Dashboard (real-time update)
```

**Outreach Flow:**
```
Admin Dashboard (trigger campaign)
    → n8n Workflow (fetch qualified leads)
    → OpenAI (generate personalized message)
    → Instagram API (send DM)
    → PostgreSQL (outreach_messages table)
    → Analytics (track performance)
```

**Response Monitoring Flow:**
```
Instagram API (check messages)
    → n8n Workflow (every 30 min)
    → OpenAI (sentiment analysis)
    → PostgreSQL (update lead status)
    → Notification Service (alert admin)
    → Admin Dashboard (show notification)
```

### 4.3 Directory Structure

```
aeolovable-project/
├── frontend/                    # Lovable frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── marketing/      # Public website components
│   │   │   ├── admin/          # Admin dashboard components
│   │   │   ├── client/         # Client portal components
│   │   │   ├── shared/         # Reusable components
│   │   │   └── ui/             # shadcn/ui components
│   │   ├── pages/
│   │   │   ├── index.tsx       # Homepage
│   │   │   ├── admin/
│   │   │   ├── client/
│   │   │   └── api/            # API routes
│   │   ├── lib/
│   │   │   ├── supabase.ts     # Supabase client
│   │   │   ├── utils.ts
│   │   │   └── validations.ts
│   │   ├── hooks/
│   │   ├── contexts/
│   │   ├── types/
│   │   └── styles/
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
├── backend/                     # Supabase backend
│   ├── supabase/
│   │   ├── migrations/
│   │   │   └── 001_initial_schema.sql
│   │   ├── functions/
│   │   │   ├── analyze-lead/
│   │   │   └── send-notification/
│   │   └── config.toml
│   └── .env.local
├── automation/                  # n8n workflows
│   ├── workflows/
│   │   ├── 01-lead-discovery.json
│   │   ├── 02-automated-outreach.json
│   │   ├── 03-response-monitoring.json
│   │   ├── 04-follow-up.json
│   │   ├── 05-data-enrichment.json
│   │   └── 06-analytics.json
│   ├── docker-compose.yml
│   └── .env
├── docs/                        # Documentation
│   ├── IMPLEMENTATION_GUIDE.md
│   ├── API_REFERENCE.md
│   └── DEPLOYMENT_GUIDE.md
├── scripts/                     # Utility scripts
│   ├── setup.sh
│   ├── seed-database.sql
│   └── backup.sh
├── .gitignore
├── .env.example
└── README.md
```

### 4.4 Technology Decisions

**Why Lovable?**
- No-code/low-code frontend builder
- Built on Next.js (production-ready)
- Automatic deployment and hosting
- Fast iteration and prototyping

**Why Supabase?**
- PostgreSQL (robust, scalable)
- Built-in authentication
- Real-time subscriptions
- Edge Functions (serverless)
- Generous free tier

**Why n8n?**
- Visual workflow builder
- 350+ integrations
- Self-hostable (data privacy)
- Active community
- Cost-effective

**Why OpenAI?**
- Industry-leading AI models
- Excellent for text generation
- Reliable API
- Good documentation

### 4.5 Scalability Considerations

**Database:**
- Indexed queries for performance
- Partitioning for large tables (analytics_events)
- Connection pooling
- Read replicas for heavy loads

**Frontend:**
- CDN for static assets
- Image optimization
- Code splitting
- Lazy loading

**Automation:**
- Rate limiting to prevent API blocks
- Queue management for high volume
- Error handling and retries
- Horizontal scaling (multiple n8n instances)

### 4.6 Security Architecture

**Authentication & Authorization:**
- Supabase Auth (JWT tokens)
- Row Level Security (RLS)
- Role-based access control (RBAC)
- API key encryption

**Data Protection:**
- HTTPS/TLS everywhere
- Encrypted environment variables
- Secure password hashing (bcrypt)
- SQL injection prevention (parameterized queries)

**API Security:**
- Rate limiting
- CORS configuration
- Input validation
- API key rotation

---

## 5. Supabase Project Initialization

### 5.1 Create Supabase Project

**Step 1: Sign Up and Create Project**

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub
4. Click "New Project"

**Step 2: Project Configuration**

Fill in the following:
- **Name:** `aeolovable-production`
- **Database Password:** Generate a strong password (save this!)
- **Region:** Choose closest to your users
- **Pricing Plan:** Start with Free, upgrade to Pro later

**Step 3: Wait for Setup**

Project setup takes 2-3 minutes. While waiting, save these credentials:

```bash
# Create credentials file (DO NOT COMMIT)
cat > backend/.env.local << 'EOF'
# Supabase Credentials
SUPABASE_PROJECT_ID=your-project-id
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_PASSWORD=your-database-password

# Database Connection
DATABASE_URL=postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres
EOF
```

### 5.2 Configure Supabase Locally

**Step 1: Initialize Supabase CLI**

```bash
cd backend
supabase init
```

This creates a `supabase/` directory with:
```
supabase/
├── config.toml        # Configuration file
├── migrations/        # Database migrations
├── functions/         # Edge Functions
└── seed.sql          # Seed data
```

**Step 2: Link to Remote Project**

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# YOUR_PROJECT_REF is found in your project URL:
# https://app.supabase.com/project/YOUR_PROJECT_REF
```

**Step 3: Configure Settings**

Edit `supabase/config.toml`:

```toml
# Project settings
project_id = "your-project-id"

[api]
enabled = true
port = 54321
# Maximum number of rows returned (0 = unlimited)
max_rows = 1000

[db]
port = 54322
major_version = 15

[auth]
# Site URL (your frontend URL)
site_url = "http://localhost:3000"
# Additional redirect URLs
additional_redirect_urls = ["https://yourdomain.com"]
# JWT expiry time
jwt_expiry = 3600
# Enable email confirmation
enable_signup = true

[auth.email]
# Enable email signup
enable_signup = true
# Enable email confirmations
enable_confirmations = true
# Double confirmation for email changes
double_confirm_changes = true

[auth.external.google]
enabled = true
client_id = "your-google-client-id"
secret = "your-google-client-secret"
redirect_uri = "https://your-project.supabase.co/auth/v1/callback"
```

### 5.3 Retrieve API Keys

From your Supabase Dashboard:

1. Go to **Settings** → **API**
2. Copy the following keys:

```bash
# Public (safe to expose)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...

# Private (NEVER expose to client)
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

**Anon Key vs Service Role Key:**
- **Anon Key:** Used in frontend, respects RLS policies
- **Service Role Key:** Bypasses RLS, used in backend/n8n only

### 5.4 Test Connection

Create a test script:

```javascript
// backend/test-connection.js
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

async function testConnection() {
  try {
    console.log('Testing Supabase connection...')

    // Test database connection
    const { data, error } = await supabase
      .from('_test')
      .select('*')
      .limit(1)

    if (error && error.code !== '42P01') { // 42P01 = table doesn't exist (expected)
      throw error
    }

    console.log('✅ Supabase connection successful!')
    console.log('📍 Project URL:', process.env.SUPABASE_URL)

    // Test auth
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    console.log('✅ Auth service accessible')

    return true
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
    return false
  }
}

testConnection()
```

Run the test:

```bash
cd backend
npm install @supabase/supabase-js dotenv
node test-connection.js
```

Expected output:
```
Testing Supabase connection...
✅ Supabase connection successful!
📍 Project URL: https://xxxxx.supabase.co
✅ Auth service accessible
```

---

## 6. Database Schema Implementation

### 6.1 Prepare Migration Files

We'll implement the database schema using migrations for version control.

**Step 1: Create Migration File**

```bash
cd backend/supabase
supabase migration new initial_schema
```

This creates: `supabase/migrations/XXXXXXXX_initial_schema.sql`

**Step 2: Copy Schema**

Copy the entire `DATABASE_SCHEMA.sql` content into the migration file, or split into multiple migrations for better organization:

```bash
# Split into logical migrations
supabase migration new 01_core_tables
supabase migration new 02_lead_management
supabase migration new 03_outreach_system
supabase migration new 04_client_projects
supabase migration new 05_analytics
supabase migration new 06_triggers_functions
supabase migration new 07_rls_policies
supabase migration new 08_indexes
```

### 6.2 Migration 01: Core Tables

```sql
-- supabase/migrations/XXXXXXXX_01_core_tables.sql

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'client' CHECK (role IN ('admin', 'client', 'team_member')),
  avatar_url TEXT,
  phone TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_email ON public.users(email);

-- Comments
COMMENT ON TABLE public.users IS 'User accounts and profiles';
COMMENT ON COLUMN public.users.role IS 'User role: admin, client, or team_member';
```

### 6.3 Migration 02: Lead Management

```sql
-- supabase/migrations/XXXXXXXX_02_lead_management.sql

CREATE TABLE public.instagram_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instagram_username TEXT UNIQUE NOT NULL,
  instagram_user_id TEXT UNIQUE,
  full_name TEXT,
  bio TEXT,
  profile_picture_url TEXT,
  follower_count INTEGER NOT NULL,
  following_count INTEGER,
  post_count INTEGER,
  engagement_rate DECIMAL(5,2),
  avg_likes INTEGER,
  avg_comments INTEGER,

  -- Location
  location TEXT,
  city TEXT,
  country TEXT,

  -- Categorization
  niche TEXT,
  industry_tags TEXT[],
  content_themes TEXT[],

  -- Website
  has_website BOOLEAN DEFAULT false,
  existing_website_url TEXT,
  website_quality_score INTEGER CHECK (website_quality_score BETWEEN 1 AND 10),

  -- Scoring
  lead_score INTEGER CHECK (lead_score BETWEEN 1 AND 10),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- Status
  status TEXT DEFAULT 'discovered' CHECK (status IN (
    'discovered', 'qualified', 'contacted', 'engaged', 'interested',
    'negotiating', 'rejected', 'converted', 'blocked', 'invalid', 'do_not_contact'
  )),

  -- Outreach tracking
  first_contacted_at TIMESTAMP WITH TIME ZONE,
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  contact_attempts INTEGER DEFAULT 0,
  follow_up_count INTEGER DEFAULT 0,
  response_received BOOLEAN DEFAULT false,
  response_sentiment TEXT CHECK (response_sentiment IN ('positive', 'negative', 'neutral')),

  -- Conversion
  converted_at TIMESTAMP WITH TIME ZONE,
  conversion_value DECIMAL(10,2),
  client_id UUID,

  -- Assignment
  assigned_to UUID REFERENCES public.users(id),

  -- Metadata
  notes TEXT,
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_leads_username ON public.instagram_leads(instagram_username);
CREATE INDEX idx_leads_status ON public.instagram_leads(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_follower_count ON public.instagram_leads(follower_count) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_lead_score ON public.instagram_leads(lead_score DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_created_at ON public.instagram_leads(created_at DESC);
CREATE INDEX idx_leads_status_score ON public.instagram_leads(status, lead_score DESC) WHERE deleted_at IS NULL;

-- Full-text search
CREATE INDEX idx_leads_fulltext ON public.instagram_leads USING gin(
  to_tsvector('english',
    coalesce(instagram_username, '') || ' ' ||
    coalesce(full_name, '') || ' ' ||
    coalesce(bio, '') || ' ' ||
    coalesce(location, '')
  )
);
```

### 6.4 Apply Migrations

**Local Development:**

```bash
# Start local Supabase (optional, for local dev)
supabase start

# Apply migrations locally
supabase db reset
```

**Production:**

```bash
# Push migrations to production
supabase db push

# Or use the dashboard SQL editor
```

### 6.5 Verify Schema

```bash
# Check migration status
supabase migration list

# Generate TypeScript types
supabase gen types typescript --local > ../frontend/src/types/database.types.ts
```

This generates TypeScript interfaces for all your tables:

```typescript
// frontend/src/types/database.types.ts (generated)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'client' | 'team_member'
          // ... rest of columns
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          // ...
        }
        Update: {
          id?: string
          email?: string
          // ...
        }
      }
      instagram_leads: {
        // ...
      }
    }
  }
}
```

---

*[Continue to next sections...]*

---

## Navigation

- **Next:** [Part 2: Advanced Database Configuration →](./SUPABASE_ADVANCED.md)
- **See Also:**
  - [Frontend Development Guide](./FRONTEND_DEVELOPMENT.md)
  - [n8n Automation Setup](./AUTOMATION_SETUP.md)
  - [API Reference](./API_REFERENCE.md)

---

**Progress Tracker:**

- [x] Introduction & Prerequisites
- [x] Development Environment Setup
- [x] Project Architecture Overview
- [x] Supabase Project Initialization
- [x] Database Schema Implementation (Basics)
- [ ] Row Level Security Configuration
- [ ] Edge Functions Development
- [ ] Frontend Setup
- [ ] Authentication System
- [ ] Component Development
- [ ] n8n Workflows
- [ ] Integration & Testing
- [ ] Deployment

**Estimated Completion:** 6/100 pages

---

**Document Version:** 1.0
**Last Updated:** 2025-11-21
