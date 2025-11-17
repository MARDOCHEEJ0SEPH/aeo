-- Performance indexes

-- Content indexes
CREATE INDEX idx_content_status ON content(status);
CREATE INDEX idx_content_author ON content(author_id);
CREATE INDEX idx_content_type ON content(content_type);
CREATE INDEX idx_content_created ON content(created_at DESC);
CREATE INDEX idx_content_published ON content(published_at DESC) WHERE published_at IS NOT NULL;
CREATE INDEX idx_content_slug ON content(slug);

-- Full-text search on content
CREATE INDEX idx_content_title_fts ON content USING GIN(to_tsvector('english', title));
CREATE INDEX idx_content_body_fts ON content USING GIN(to_tsvector('english', body));

-- Session indexes
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- AEO indexes
CREATE INDEX idx_optimizations_content ON content_optimizations(content_id);
CREATE INDEX idx_optimizations_platform ON content_optimizations(platform);
CREATE INDEX idx_citations_platform ON citations(platform);
CREATE INDEX idx_citations_content ON citations(content_id);
CREATE INDEX idx_citations_created ON citations(created_at DESC);
CREATE INDEX idx_citations_cited ON citations(cited);
CREATE INDEX idx_aeo_scores_content ON aeo_scores(content_id);
CREATE INDEX idx_aeo_scores_overall ON aeo_scores(overall_score DESC);

-- Knowledge graph indexes
CREATE INDEX idx_kg_entities_type ON kg_entities(entity_type);
CREATE INDEX idx_kg_entities_name ON kg_entities(name);
CREATE INDEX idx_kg_relationships_from ON kg_relationships(from_entity_id);
CREATE INDEX idx_kg_relationships_to ON kg_relationships(to_entity_id);
CREATE INDEX idx_kg_relationships_type ON kg_relationships(relationship_type);

-- Analytics indexes
CREATE INDEX idx_events_type ON analytics_events(event_type);
CREATE INDEX idx_events_user ON analytics_events(user_id);
CREATE INDEX idx_events_session ON analytics_events(session_id);
CREATE INDEX idx_events_created ON analytics_events(created_at DESC);
CREATE INDEX idx_metrics_hourly_type ON metrics_hourly(metric_type, hour_timestamp DESC);
CREATE INDEX idx_metrics_daily_date ON metrics_daily(date DESC);
CREATE INDEX idx_platform_metrics_platform ON platform_metrics(platform, date DESC);
CREATE INDEX idx_user_activity_user ON user_activity(user_id, created_at DESC);

-- JSONB indexes for fast lookups
CREATE INDEX idx_content_metadata ON content USING GIN(metadata);
CREATE INDEX idx_optimizations_rules ON content_optimizations USING GIN(applied_rules);
CREATE INDEX idx_citations_metadata ON citations USING GIN(metadata);
CREATE INDEX idx_events_properties ON analytics_events USING GIN(properties);

-- Materialized view for dashboard metrics
CREATE MATERIALIZED VIEW dashboard_metrics AS
SELECT
    COUNT(DISTINCT c.id) as total_content,
    COUNT(DISTINCT CASE WHEN c.status = 'published' THEN c.id END) as published_content,
    AVG(s.overall_score) as average_aeo_score,
    COUNT(DISTINCT ct.id) as total_citations,
    COUNT(DISTINCT u.id) as total_users,
    MAX(c.created_at) as last_content_created
FROM content c
LEFT JOIN aeo_scores s ON s.content_id = c.id
LEFT JOIN citations ct ON ct.content_id = c.id
LEFT JOIN users u ON u.id = c.author_id;

CREATE UNIQUE INDEX idx_dashboard_metrics ON dashboard_metrics((1));

-- Function to refresh dashboard
CREATE OR REPLACE FUNCTION refresh_dashboard_metrics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_metrics;
END;
$$ LANGUAGE plpgsql;

COMMENT ON MATERIALIZED VIEW dashboard_metrics IS 'Cached dashboard statistics';
