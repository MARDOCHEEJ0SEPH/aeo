-- Analytics tables

-- Events table (using partitioning for scalability)
CREATE TABLE analytics_events (
    id UUID DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(100),
    content_id UUID REFERENCES content(id) ON DELETE SET NULL,
    properties JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create partitions for current and next month
CREATE TABLE analytics_events_2025_01 PARTITION OF analytics_events
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE analytics_events_2025_02 PARTITION OF analytics_events
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Metrics aggregations (hourly rollups)
CREATE TABLE metrics_hourly (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_type VARCHAR(100) NOT NULL,
    metric_value DECIMAL(12,2) NOT NULL,
    dimensions JSONB,
    hour_timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(metric_type, hour_timestamp, dimensions)
);

-- Daily aggregations
CREATE TABLE metrics_daily (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    page_views BIGINT DEFAULT 0,
    unique_visitors BIGINT DEFAULT 0,
    total_sessions BIGINT DEFAULT 0,
    average_session_duration DECIMAL(10,2),
    bounce_rate DECIMAL(5,2),
    conversion_rate DECIMAL(5,2),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(date)
);

-- Platform performance tracking
CREATE TABLE platform_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    total_citations BIGINT DEFAULT 0,
    unique_queries BIGINT DEFAULT 0,
    citation_rate DECIMAL(5,2),
    average_position DECIMAL(5,2),
    visibility_score DECIMAL(5,2),
    trend VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(platform, date)
);

-- User activity tracking
CREATE TABLE user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE analytics_events IS 'Raw analytics events (partitioned by month)';
COMMENT ON TABLE metrics_hourly IS 'Hourly metrics rollups';
COMMENT ON TABLE metrics_daily IS 'Daily aggregated metrics';
COMMENT ON TABLE platform_metrics IS 'Per-platform performance metrics';
COMMENT ON TABLE user_activity IS 'User activity audit log';
