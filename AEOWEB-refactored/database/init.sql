-- AEOWEB Database Schema
-- PostgreSQL 16+

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For index optimization

-- Drop tables if they exist (for development)
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS citations CASCADE;
DROP TABLE IF EXISTS aeo_scores CASCADE;
DROP TABLE IF NOT EXISTS content_versions CASCADE;
DROP TABLE IF EXISTS content CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS oauth_connections CASCADE;
DROP TABLE IF EXISTS webauthn_credentials CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- Nullable for OAuth-only users
    role VARCHAR(20) NOT NULL DEFAULT 'VIEWER' CHECK (role IN ('ADMIN', 'EDITOR', 'VIEWER')),
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_refresh_token ON sessions(refresh_token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- OAuth connections
CREATE TABLE oauth_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('google', 'github', 'microsoft')),
    provider_user_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider, provider_user_id)
);

CREATE INDEX idx_oauth_user_id ON oauth_connections(user_id);

-- WebAuthn credentials
CREATE TABLE webauthn_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credential_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    counter BIGINT DEFAULT 0,
    transports TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_webauthn_user_id ON webauthn_credentials(user_id);

-- Content table
CREATE TABLE content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    body TEXT NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}',
    searchable_text TSVECTOR, -- Full-text search
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- Generate slug from title trigger
CREATE OR REPLACE FUNCTION generate_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := LOWER(REGEXP_REPLACE(NEW.title, '[^a-zA-Z0-9]+', '-', 'g'));
        NEW.slug := TRIM(BOTH '-' FROM NEW.slug);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_generate_slug
BEFORE INSERT OR UPDATE ON content
FOR EACH ROW
EXECUTE FUNCTION generate_slug();

-- Update searchable_text trigger
CREATE OR REPLACE FUNCTION update_searchable_text()
RETURNS TRIGGER AS $$
BEGIN
    NEW.searchable_text := to_tsvector('english',
        COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.body, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_update_searchable_text
BEFORE INSERT OR UPDATE ON content
FOR EACH ROW
EXECUTE FUNCTION update_searchable_text();

CREATE INDEX idx_content_author_id ON content(author_id);
CREATE INDEX idx_content_status ON content(status);
CREATE INDEX idx_content_content_type ON content(content_type);
CREATE INDEX idx_content_slug ON content(slug);
CREATE INDEX idx_content_created_at ON content(created_at DESC);
CREATE INDEX idx_content_published_at ON content(published_at DESC) WHERE published_at IS NOT NULL;
CREATE INDEX idx_content_searchable_text ON content USING GIN(searchable_text);

-- Content versions table
CREATE TABLE content_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    title VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    UNIQUE(content_id, version)
);

CREATE INDEX idx_content_versions_content_id ON content_versions(content_id);

-- AEO Scores table
CREATE TABLE aeo_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('CHATGPT', 'CLAUDE', 'PERPLEXITY', 'GEMINI', 'BING')),
    overall_score DECIMAL(5,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    structure_score DECIMAL(5,2) NOT NULL CHECK (structure_score >= 0 AND structure_score <= 100),
    quality_score DECIMAL(5,2) NOT NULL CHECK (quality_score >= 0 AND quality_score <= 100),
    platform_score DECIMAL(5,2) NOT NULL CHECK (platform_score >= 0 AND platform_score <= 100),
    readability_score DECIMAL(5,2) NOT NULL CHECK (readability_score >= 0 AND readability_score <= 100),
    improvements JSONB DEFAULT '[]',
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_aeo_scores_content_id ON aeo_scores(content_id);
CREATE INDEX idx_aeo_scores_platform ON aeo_scores(platform);
CREATE INDEX idx_aeo_scores_calculated_at ON aeo_scores(calculated_at DESC);

-- Citations table
CREATE TABLE citations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('CHATGPT', 'CLAUDE', 'PERPLEXITY', 'GEMINI', 'BING')),
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    cited BOOLEAN NOT NULL DEFAULT FALSE,
    citation_text TEXT,
    position INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_citations_content_id ON citations(content_id);
CREATE INDEX idx_citations_platform ON citations(platform);
CREATE INDEX idx_citations_cited ON citations(cited);
CREATE INDEX idx_citations_created_at ON citations(created_at DESC);

-- Partitioning for analytics_events (time-series data)
CREATE TABLE analytics_events (
    id UUID DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create partitions for the next 12 months
DO $$
DECLARE
    start_date DATE := DATE_TRUNC('month', CURRENT_DATE);
    end_date DATE;
    partition_name TEXT;
BEGIN
    FOR i IN 0..11 LOOP
        end_date := start_date + INTERVAL '1 month';
        partition_name := 'analytics_events_' || TO_CHAR(start_date, 'YYYY_MM');

        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS %I PARTITION OF analytics_events
             FOR VALUES FROM (%L) TO (%L)',
            partition_name, start_date, end_date
        );

        start_date := end_date;
    END LOOP;
END $$;

CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);

-- Metrics rollups table (pre-aggregated metrics)
CREATE TABLE metrics_rollups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    time_bucket TIMESTAMP WITH TIME ZONE NOT NULL,
    interval VARCHAR(20) NOT NULL CHECK (interval IN ('1min', '5min', '1hour', '1day')),
    value DECIMAL(20,2) NOT NULL,
    count INTEGER NOT NULL DEFAULT 1,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(metric_name, time_bucket, interval)
);

CREATE INDEX idx_metrics_rollups_metric_name ON metrics_rollups(metric_name);
CREATE INDEX idx_metrics_rollups_time_bucket ON metrics_rollups(time_bucket DESC);
CREATE INDEX idx_metrics_rollups_interval ON metrics_rollups(interval);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_updated_at
BEFORE UPDATE ON content
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123 - CHANGE IN PRODUCTION!)
-- Password hash generated with Argon2
INSERT INTO users (email, username, password_hash, role, email_verified)
VALUES (
    'admin@aeoweb.com',
    'admin',
    '$argon2id$v=19$m=19456,t=2,p=1$kzHPm0Y3mTpFhI/nSNPCZw$DGLTJNGw1z8VnV8K/qWPIFZmKh4zYrTqnL3QqxJNrYE',
    'ADMIN',
    TRUE
);

-- Insert sample content
INSERT INTO content (title, body, content_type, status, author_id, published_at)
VALUES (
    'Getting Started with AEO',
    'Answer Engine Optimization (AEO) is the practice of optimizing content to be discovered and cited by AI-powered search engines like ChatGPT, Claude, Perplexity, Google Gemini, and Bing Chat. This guide covers the fundamentals of AEO and how to implement it effectively.',
    'article',
    'PUBLISHED',
    (SELECT id FROM users WHERE username = 'admin'),
    NOW()
);

-- Create views for common queries
CREATE OR REPLACE VIEW content_with_author AS
SELECT
    c.*,
    u.username AS author_username,
    u.email AS author_email
FROM content c
JOIN users u ON c.author_id = u.id;

CREATE OR REPLACE VIEW aeo_performance_summary AS
SELECT
    c.id AS content_id,
    c.title,
    COUNT(DISTINCT cit.id) AS total_citations,
    COUNT(DISTINCT cit.id) FILTER (WHERE cit.cited = TRUE) AS successful_citations,
    AVG(aeo.overall_score) AS avg_aeo_score,
    MAX(aeo.calculated_at) AS last_optimized_at
FROM content c
LEFT JOIN citations cit ON c.id = cit.content_id
LEFT JOIN aeo_scores aeo ON c.id = aeo.content_id
GROUP BY c.id, c.title;

-- Grant permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO aeoweb_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO aeoweb_app;

-- Analyze tables for query optimization
ANALYZE users;
ANALYZE content;
ANALYZE aeo_scores;
ANALYZE citations;
ANALYZE analytics_events;

COMMENT ON TABLE users IS 'User accounts with authentication data';
COMMENT ON TABLE content IS 'Main content storage with AEO optimization';
COMMENT ON TABLE aeo_scores IS 'AEO scores for each platform per content';
COMMENT ON TABLE citations IS 'Citation tracking from AI platforms';
COMMENT ON TABLE analytics_events IS 'Time-series analytics events';
