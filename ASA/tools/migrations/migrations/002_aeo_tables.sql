-- AEO-specific tables

-- Content optimizations
CREATE TABLE content_optimizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    optimization_level VARCHAR(50) NOT NULL,
    before_score DECIMAL(5,2),
    after_score DECIMAL(5,2),
    applied_rules JSONB,
    improvements JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- AI platform citations
CREATE TABLE citations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform VARCHAR(50) NOT NULL,
    content_id UUID REFERENCES content(id) ON DELETE SET NULL,
    query TEXT NOT NULL,
    position INTEGER,
    cited BOOLEAN NOT NULL DEFAULT FALSE,
    citation_text TEXT,
    context TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- AEO scores
CREATE TABLE aeo_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    overall_score DECIMAL(5,2) NOT NULL,
    schema_markup DECIMAL(5,2) NOT NULL,
    content_quality DECIMAL(5,2) NOT NULL,
    keyword_optimization DECIMAL(5,2) NOT NULL,
    entity_coverage DECIMAL(5,2) NOT NULL,
    citation_potential DECIMAL(5,2) NOT NULL,
    freshness DECIMAL(5,2) NOT NULL,
    engagement DECIMAL(5,2) NOT NULL,
    calculated_at TIMESTAMP DEFAULT NOW()
);

-- Platform strategies
CREATE TABLE platform_strategies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform VARCHAR(50) UNIQUE NOT NULL,
    priority SMALLINT NOT NULL DEFAULT 5,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    custom_rules JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Knowledge graph entities
CREATE TABLE kg_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    properties JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Entity relationships
CREATE TABLE kg_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_entity_id UUID NOT NULL REFERENCES kg_entities(id) ON DELETE CASCADE,
    to_entity_id UUID NOT NULL REFERENCES kg_entities(id) ON DELETE CASCADE,
    relationship_type VARCHAR(100) NOT NULL,
    weight DECIMAL(3,2) DEFAULT 1.0,
    properties JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Schema markup cache
CREATE TABLE schema_markup (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    schema_type VARCHAR(100) NOT NULL,
    json_ld JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE content_optimizations IS 'Content optimization records per platform';
COMMENT ON TABLE citations IS 'AI platform citation tracking';
COMMENT ON TABLE aeo_scores IS 'AEO score breakdowns';
COMMENT ON TABLE platform_strategies IS 'Platform-specific optimization strategies';
COMMENT ON TABLE kg_entities IS 'Knowledge graph entities';
COMMENT ON TABLE kg_relationships IS 'Knowledge graph relationships';
COMMENT ON TABLE schema_markup IS 'Generated schema.org markup cache';
