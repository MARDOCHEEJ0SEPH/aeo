-- ============================================================================
-- AEO Agency Platform - Supabase Database Schema
-- ============================================================================
-- Version: 1.0
-- Last Updated: 2025-11-21
-- Description: Complete database schema for AEO agency automation platform
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- USERS & AUTHENTICATION
-- ============================================================================

-- Users table (extends Supabase auth.users)
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

-- Index for role-based queries
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_email ON public.users(email);

-- ============================================================================
-- INSTAGRAM LEADS
-- ============================================================================

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
  engagement_rate DECIMAL(5,2), -- Percentage (e.g., 4.25 = 4.25%)
  avg_likes INTEGER,
  avg_comments INTEGER,

  -- Location data
  location TEXT,
  city TEXT,
  country TEXT,
  coordinates POINT, -- PostGIS point for geographic queries

  -- Categorization
  niche TEXT,
  industry_tags TEXT[], -- Array of industry tags
  content_themes TEXT[], -- e.g., ['fitness', 'motivation', 'wellness']

  -- Website status
  has_website BOOLEAN DEFAULT false,
  existing_website_url TEXT,
  website_quality_score INTEGER CHECK (website_quality_score BETWEEN 1 AND 10),

  -- Lead scoring
  lead_score INTEGER CHECK (lead_score BETWEEN 1 AND 10),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- Lead status
  status TEXT DEFAULT 'discovered' CHECK (status IN (
    'discovered',
    'qualified',
    'contacted',
    'engaged',
    'interested',
    'negotiating',
    'rejected',
    'converted',
    'blocked',
    'invalid',
    'do_not_contact'
  )),

  -- Outreach tracking
  first_contacted_at TIMESTAMP WITH TIME ZONE,
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  contact_attempts INTEGER DEFAULT 0,
  follow_up_count INTEGER DEFAULT 0,
  response_received BOOLEAN DEFAULT false,
  response_sentiment TEXT CHECK (response_sentiment IN ('positive', 'negative', 'neutral')),

  -- Conversion tracking
  converted_at TIMESTAMP WITH TIME ZONE,
  conversion_value DECIMAL(10,2),
  client_id UUID, -- Foreign key added later to avoid circular dependency

  -- Assignment
  assigned_to UUID REFERENCES public.users(id),

  -- Additional metadata
  notes TEXT,
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Soft delete
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_leads_username ON public.instagram_leads(instagram_username);
CREATE INDEX idx_leads_status ON public.instagram_leads(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_follower_count ON public.instagram_leads(follower_count) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_lead_score ON public.instagram_leads(lead_score DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_created_at ON public.instagram_leads(created_at DESC);
CREATE INDEX idx_leads_status_score ON public.instagram_leads(status, lead_score DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_niche ON public.instagram_leads(niche) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_assigned_to ON public.instagram_leads(assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_location ON public.instagram_leads USING gin(to_tsvector('english', coalesce(location, '')));

-- Full-text search index
CREATE INDEX idx_leads_fulltext ON public.instagram_leads USING gin(
  to_tsvector('english', coalesce(instagram_username, '') || ' ' ||
                        coalesce(full_name, '') || ' ' ||
                        coalesce(bio, '') || ' ' ||
                        coalesce(location, ''))
);

-- ============================================================================
-- OUTREACH CAMPAIGNS
-- ============================================================================

CREATE TABLE public.outreach_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,

  -- Campaign configuration
  message_template TEXT NOT NULL,
  follow_up_template TEXT,

  -- Targeting criteria
  target_follower_min INTEGER DEFAULT 10000,
  target_follower_max INTEGER,
  target_engagement_min DECIMAL(5,2),
  target_locations TEXT[],
  target_niches TEXT[],
  target_has_website BOOLEAN,

  -- Campaign limits
  daily_message_limit INTEGER DEFAULT 20,
  total_message_limit INTEGER,
  messages_sent INTEGER DEFAULT 0,

  -- Timing
  send_times TIME[], -- Array of times to send messages (e.g., ['09:00', '14:00', '18:00'])
  days_of_week INTEGER[], -- 0-6, Sunday = 0

  -- Status
  is_active BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),

  -- Performance tracking
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_responses INTEGER DEFAULT 0,
  total_positive_responses INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,

  -- Ownership
  created_by UUID REFERENCES public.users(id),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_campaigns_status ON public.outreach_campaigns(status);
CREATE INDEX idx_campaigns_active ON public.outreach_campaigns(is_active);
CREATE INDEX idx_campaigns_created_by ON public.outreach_campaigns(created_by);

-- ============================================================================
-- OUTREACH MESSAGES
-- ============================================================================

CREATE TABLE public.outreach_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relationships
  lead_id UUID REFERENCES public.instagram_leads(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.outreach_campaigns(id) ON DELETE SET NULL,

  -- Message content
  message_text TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('initial', 'follow_up', 'manual')),

  -- Delivery tracking
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered BOOLEAN DEFAULT false,
  delivery_error TEXT,
  read_at TIMESTAMP WITH TIME ZONE,

  -- Response tracking
  response_received BOOLEAN DEFAULT false,
  response_text TEXT,
  response_received_at TIMESTAMP WITH TIME ZONE,
  response_sentiment TEXT CHECK (response_sentiment IN ('positive', 'negative', 'neutral')),

  -- Instagram metadata
  instagram_message_id TEXT,
  conversation_id TEXT,

  -- Performance
  clicked_link BOOLEAN DEFAULT false,
  clicked_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_lead_id ON public.outreach_messages(lead_id);
CREATE INDEX idx_messages_campaign_id ON public.outreach_messages(campaign_id);
CREATE INDEX idx_messages_sent_at ON public.outreach_messages(sent_at DESC);
CREATE INDEX idx_messages_response ON public.outreach_messages(response_received, response_sentiment);

-- ============================================================================
-- CLIENTS
-- ============================================================================

CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User relationship
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,

  -- Lead source
  lead_id UUID, -- Foreign key added later to avoid circular dependency
  source TEXT CHECK (source IN ('instagram', 'referral', 'website', 'cold_call', 'event', 'other')),

  -- Company information
  company_name TEXT,
  instagram_handle TEXT,
  website_url TEXT,

  -- Contact information
  primary_contact_name TEXT,
  email TEXT,
  phone TEXT,
  secondary_phone TEXT,

  -- Address
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'United States',

  -- Business details
  industry TEXT,
  business_type TEXT, -- e.g., 'sole_proprietor', 'llc', 'corporation'
  annual_revenue_range TEXT,
  employee_count_range TEXT,

  -- Status
  status TEXT DEFAULT 'onboarding' CHECK (status IN (
    'lead',
    'onboarding',
    'active',
    'on_hold',
    'completed',
    'churned',
    'archived'
  )),

  -- Value tracking
  lifetime_value DECIMAL(10,2) DEFAULT 0,
  total_projects INTEGER DEFAULT 0,

  -- Relationship management
  assigned_to UUID REFERENCES public.users(id),
  account_manager_id UUID REFERENCES public.users(id),
  satisfaction_score INTEGER CHECK (satisfaction_score BETWEEN 1 AND 5),

  -- Communication preferences
  preferred_contact_method TEXT CHECK (preferred_contact_method IN ('email', 'phone', 'sms', 'instagram')),
  timezone TEXT,

  -- Additional data
  notes TEXT,
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  first_project_date DATE,
  last_project_date DATE,

  -- Soft delete
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_clients_lead_id ON public.clients(lead_id);
CREATE INDEX idx_clients_status ON public.clients(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_clients_assigned_to ON public.clients(assigned_to);
CREATE INDEX idx_clients_instagram ON public.clients(instagram_handle) WHERE deleted_at IS NULL;

-- ============================================================================
-- PROJECTS
-- ============================================================================

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Client relationship
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,

  -- Project details
  project_name TEXT NOT NULL,
  description TEXT,
  project_type TEXT CHECK (project_type IN ('website', 'ecommerce', 'landing_page', 'redesign', 'maintenance', 'other')),

  -- Package/Pricing
  package_tier TEXT CHECK (package_tier IN ('starter', 'professional', 'enterprise', 'custom')),
  project_value DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'deposit_paid', 'paid', 'refunded', 'cancelled')),
  deposit_amount DECIMAL(10,2),
  balance_due DECIMAL(10,2),

  -- Project status
  status TEXT DEFAULT 'planning' CHECK (status IN (
    'planning',
    'design',
    'development',
    'content',
    'review',
    'revisions',
    'testing',
    'launch',
    'completed',
    'on_hold',
    'cancelled'
  )),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),

  -- URLs
  lovable_project_url TEXT,
  staging_url TEXT,
  production_url TEXT,
  figma_url TEXT,

  -- Timeline
  start_date DATE,
  expected_completion_date DATE,
  actual_completion_date DATE,
  estimated_hours INTEGER,
  actual_hours INTEGER,

  -- Team assignment
  project_manager_id UUID REFERENCES public.users(id),
  designer_id UUID REFERENCES public.users(id),
  developer_id UUID REFERENCES public.users(id),

  -- Technical details
  tech_stack JSONB, -- e.g., {"frontend": "React", "backend": "Supabase", "hosting": "Lovable"}
  features JSONB, -- Array of features/requirements
  integrations TEXT[], -- e.g., ['stripe', 'mailchimp', 'instagram']

  -- Quality & Satisfaction
  client_satisfaction_score INTEGER CHECK (client_satisfaction_score BETWEEN 1 AND 5),
  internal_quality_score INTEGER CHECK (internal_quality_score BETWEEN 1 AND 5),

  -- Additional data
  notes TEXT,
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  launched_at TIMESTAMP WITH TIME ZONE,

  -- Soft delete
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_projects_client_id ON public.projects(client_id);
CREATE INDEX idx_projects_status ON public.projects(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_client_status ON public.projects(client_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_completion_date ON public.projects(expected_completion_date);
CREATE INDEX idx_projects_project_manager ON public.projects(project_manager_id);

-- ============================================================================
-- PROJECT TASKS
-- ============================================================================

CREATE TABLE public.project_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Project relationship
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,

  -- Task details
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT, -- e.g., 'design', 'development', 'content', 'review', 'client_feedback'

  -- Status
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'blocked', 'completed', 'cancelled')),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- Assignment
  assigned_to UUID REFERENCES public.users(id),
  created_by UUID REFERENCES public.users(id),

  -- Timeline
  due_date DATE,
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Dependencies
  depends_on UUID[], -- Array of task IDs that must be completed first
  blocks UUID[], -- Array of task IDs that are blocked by this task

  -- Additional data
  attachments JSONB, -- Array of file URLs
  comments_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tasks_project_id ON public.project_tasks(project_id);
CREATE INDEX idx_tasks_status ON public.project_tasks(status);
CREATE INDEX idx_tasks_assigned_to ON public.project_tasks(assigned_to);
CREATE INDEX idx_tasks_due_date ON public.project_tasks(due_date) WHERE status != 'completed';

-- ============================================================================
-- COMMENTS/MESSAGES
-- ============================================================================

CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Polymorphic relationships
  commentable_type TEXT NOT NULL CHECK (commentable_type IN ('project', 'task', 'lead', 'client')),
  commentable_id UUID NOT NULL,

  -- Comment content
  content TEXT NOT NULL,
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

  -- Threading
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  thread_root_id UUID, -- For easy retrieval of entire threads

  -- Visibility
  is_internal BOOLEAN DEFAULT false, -- Internal notes vs client-visible

  -- Reactions/Interactions
  reactions JSONB DEFAULT '{}'::jsonb, -- e.g., {"👍": ["user_id_1", "user_id_2"], "❤️": ["user_id_3"]}

  -- Attachments
  attachments JSONB, -- Array of file URLs

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  edited_at TIMESTAMP WITH TIME ZONE,

  -- Soft delete
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_comments_commentable ON public.comments(commentable_type, commentable_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_author ON public.comments(author_id);
CREATE INDEX idx_comments_thread ON public.comments(thread_root_id) WHERE thread_root_id IS NOT NULL;

-- ============================================================================
-- ANALYTICS EVENTS
-- ============================================================================

CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Event details
  event_type TEXT NOT NULL, -- e.g., 'lead_discovered', 'message_sent', 'response_received', 'conversion'
  event_category TEXT, -- e.g., 'lead_generation', 'outreach', 'project', 'user_action'
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Relationships (optional, depends on event type)
  user_id UUID REFERENCES public.users(id),
  lead_id UUID REFERENCES public.instagram_leads(id),
  project_id UUID REFERENCES public.projects(id),
  campaign_id UUID REFERENCES public.outreach_campaigns(id),

  -- Session tracking
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partitioning by month for performance (optional, for high-volume data)
-- CREATE TABLE analytics_events_y2025m01 PARTITION OF analytics_events
-- FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE INDEX idx_analytics_event_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX idx_analytics_user_id ON public.analytics_events(user_id);
CREATE INDEX idx_analytics_lead_id ON public.analytics_events(lead_id);
CREATE INDEX idx_analytics_event_category ON public.analytics_events(event_category);

-- GIN index for JSONB queries
CREATE INDEX idx_analytics_event_data ON public.analytics_events USING gin(event_data);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Recipient
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,

  -- Notification content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'lead_interested',
    'new_message',
    'project_update',
    'task_assigned',
    'payment_received',
    'deadline_approaching',
    'system_alert'
  )),

  -- Action link
  action_url TEXT,
  action_label TEXT,

  -- Related entities
  related_type TEXT, -- e.g., 'lead', 'project', 'task'
  related_id UUID,

  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,

  -- Delivery channels
  sent_via_email BOOLEAN DEFAULT false,
  sent_via_sms BOOLEAN DEFAULT false,
  sent_via_push BOOLEAN DEFAULT false,

  -- Priority
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON public.notifications(notification_type);

-- ============================================================================
-- FILE UPLOADS / STORAGE
-- ============================================================================

CREATE TABLE public.file_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- File details
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- MIME type
  file_size INTEGER, -- in bytes
  storage_path TEXT NOT NULL, -- Supabase Storage path
  public_url TEXT,

  -- Relationships (polymorphic)
  uploadable_type TEXT, -- e.g., 'project', 'client', 'message'
  uploadable_id UUID,

  -- Categorization
  category TEXT, -- e.g., 'logo', 'brand_assets', 'contract', 'screenshot', 'design'

  -- Ownership
  uploaded_by UUID REFERENCES public.users(id),

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Soft delete
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_files_uploadable ON public.file_uploads(uploadable_type, uploadable_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_uploaded_by ON public.file_uploads(uploaded_by);
CREATE INDEX idx_files_category ON public.file_uploads(category);

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS (added after table creation to resolve circular dependencies)
-- ============================================================================

-- Add foreign key from instagram_leads to clients
ALTER TABLE public.instagram_leads
ADD CONSTRAINT fk_instagram_leads_client
FOREIGN KEY (client_id) REFERENCES public.clients(id);

-- Add foreign key from clients to instagram_leads
ALTER TABLE public.clients
ADD CONSTRAINT fk_clients_lead
FOREIGN KEY (lead_id) REFERENCES public.instagram_leads(id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.instagram_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.outreach_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.outreach_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.project_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Recalculate lead score on relevant field changes
CREATE OR REPLACE FUNCTION recalculate_lead_score()
RETURNS TRIGGER AS $$
BEGIN
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

CREATE TRIGGER calculate_score_on_insert
BEFORE INSERT ON public.instagram_leads
FOR EACH ROW
EXECUTE FUNCTION recalculate_lead_score();

CREATE TRIGGER calculate_score_on_update
BEFORE UPDATE ON public.instagram_leads
FOR EACH ROW
WHEN (
  OLD.follower_count IS DISTINCT FROM NEW.follower_count OR
  OLD.engagement_rate IS DISTINCT FROM NEW.engagement_rate OR
  OLD.has_website IS DISTINCT FROM NEW.has_website
)
EXECUTE FUNCTION recalculate_lead_score();

-- Update campaign stats when message is sent
CREATE OR REPLACE FUNCTION update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.campaign_id IS NOT NULL THEN
    UPDATE public.outreach_campaigns
    SET
      total_sent = total_sent + 1,
      messages_sent = messages_sent + 1,
      updated_at = NOW()
    WHERE id = NEW.campaign_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaign_on_message_sent
AFTER INSERT ON public.outreach_messages
FOR EACH ROW
WHEN (NEW.sent_at IS NOT NULL)
EXECUTE FUNCTION update_campaign_stats();

-- Update campaign response stats
CREATE OR REPLACE FUNCTION update_campaign_response_stats()
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
EXECUTE FUNCTION update_campaign_response_stats();

-- Notify admin when lead becomes interested
CREATE OR REPLACE FUNCTION notify_interested_lead()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'interested' AND OLD.status != 'interested' THEN
    -- Create notification for all admins
    INSERT INTO public.notifications (user_id, title, message, notification_type, related_type, related_id, priority)
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

-- Update client lifetime value when project value changes
CREATE OR REPLACE FUNCTION update_client_ltv()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.clients
    SET
      lifetime_value = lifetime_value + NEW.project_value,
      total_projects = total_projects + 1,
      last_project_date = CURRENT_DATE,
      first_project_date = COALESCE(first_project_date, CURRENT_DATE),
      updated_at = NOW()
    WHERE id = NEW.client_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.clients
    SET
      lifetime_value = lifetime_value - OLD.project_value + NEW.project_value,
      updated_at = NOW()
    WHERE id = NEW.client_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.clients
    SET
      lifetime_value = lifetime_value - OLD.project_value,
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

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

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

-- Users policies
CREATE POLICY "Users can view their own data"
ON public.users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
ON public.users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Instagram leads policies
CREATE POLICY "Admins can view all leads"
ON public.instagram_leads FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'team_member')
  )
);

CREATE POLICY "Admins can insert leads"
ON public.instagram_leads FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'team_member')
  )
);

CREATE POLICY "Admins can update leads"
ON public.instagram_leads FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'team_member')
  )
);

-- Clients policies
CREATE POLICY "Clients can view their own data"
ON public.clients FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all clients"
ON public.clients FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'team_member')
  )
);

CREATE POLICY "Admins can manage clients"
ON public.clients FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'team_member')
  )
);

-- Projects policies
CREATE POLICY "Clients can view their own projects"
ON public.projects FOR SELECT
USING (
  client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all projects"
ON public.projects FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'team_member')
  )
);

CREATE POLICY "Admins can manage projects"
ON public.projects FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'team_member')
  )
);

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (user_id = auth.uid());

-- ============================================================================
-- USEFUL VIEWS
-- ============================================================================

-- View: Lead pipeline summary
CREATE OR REPLACE VIEW lead_pipeline AS
SELECT
  status,
  COUNT(*) as count,
  AVG(follower_count)::INTEGER as avg_followers,
  AVG(engagement_rate)::DECIMAL(5,2) as avg_engagement,
  AVG(lead_score)::DECIMAL(3,1) as avg_score
FROM public.instagram_leads
WHERE deleted_at IS NULL
GROUP BY status;

-- View: Campaign performance
CREATE OR REPLACE VIEW campaign_performance AS
SELECT
  c.id,
  c.name,
  c.total_sent,
  c.total_responses,
  c.total_positive_responses,
  c.total_conversions,
  CASE
    WHEN c.total_sent > 0 THEN (c.total_responses::DECIMAL / c.total_sent * 100)::DECIMAL(5,2)
    ELSE 0
  END as response_rate,
  CASE
    WHEN c.total_sent > 0 THEN (c.total_conversions::DECIMAL / c.total_sent * 100)::DECIMAL(5,2)
    ELSE 0
  END as conversion_rate,
  c.created_at,
  c.status
FROM public.outreach_campaigns c;

-- View: Project dashboard
CREATE OR REPLACE VIEW project_dashboard AS
SELECT
  p.id,
  p.project_name,
  p.status,
  p.progress_percentage,
  c.company_name as client_name,
  c.instagram_handle as client_instagram,
  p.project_value,
  p.expected_completion_date,
  u.full_name as project_manager_name,
  (
    SELECT COUNT(*)
    FROM public.project_tasks
    WHERE project_id = p.id AND status = 'completed'
  ) as completed_tasks,
  (
    SELECT COUNT(*)
    FROM public.project_tasks
    WHERE project_id = p.id
  ) as total_tasks
FROM public.projects p
LEFT JOIN public.clients c ON p.client_id = c.id
LEFT JOIN public.users u ON p.project_manager_id = u.id
WHERE p.deleted_at IS NULL;

-- ============================================================================
-- SAMPLE DATA (for development/testing)
-- ============================================================================

-- Insert admin user (password needs to be set via Supabase Auth)
-- INSERT INTO public.users (id, email, full_name, role) VALUES
-- (uuid_generate_v4(), 'admin@aeoagency.com', 'Admin User', 'admin');

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
