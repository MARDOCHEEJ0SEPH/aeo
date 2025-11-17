use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;
use super::platform::AIPlatform;

/// AI Citation tracking (Chapter 9 - Measuring AEO Performance)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Citation {
    pub id: Uuid,
    pub platform: AIPlatform,
    pub content_id: Uuid,
    pub query: String,
    pub position: Option<u32>,  // Position in AI response
    pub cited: bool,
    pub citation_text: Option<String>,  // Actual text cited
    pub context: Option<String>,  // Context around citation
    pub timestamp: DateTime<Utc>,
    pub metadata: CitationMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CitationMetadata {
    pub user_agent: Option<String>,
    pub geo_location: Option<String>,
    pub language: Option<String>,
    pub query_intent: Option<QueryIntent>,
}

/// Query intent classification
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum QueryIntent {
    Informational,
    Navigational,
    Transactional,
    Commercial,
}

/// Citation analytics aggregation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CitationAnalytics {
    pub platform: AIPlatform,
    pub timeframe: Timeframe,
    pub total_citations: u64,
    pub unique_queries: u64,
    pub citation_rate: f64,  // Percentage
    pub average_position: f64,
    pub visibility_score: f64,  // 0-100
    pub trend: Trend,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Timeframe {
    pub start: DateTime<Utc>,
    pub end: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Trend {
    Increasing,
    Stable,
    Decreasing,
}

/// Citation comparison across platforms
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlatformComparison {
    pub platforms: Vec<AIPlatform>,
    pub metrics: Vec<CitationAnalytics>,
    pub best_performing: AIPlatform,
    pub recommendations: Vec<String>,
}
