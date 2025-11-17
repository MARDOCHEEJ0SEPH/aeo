use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct TrackEventRequest {
    pub event_type: String,
    pub user_id: Option<Uuid>,
    pub session_id: Option<String>,
    pub properties: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TrackBatchEventsRequest {
    pub events: Vec<TrackEventRequest>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EventResponse {
    pub id: Uuid,
    pub event_type: String,
    pub timestamp: DateTime<Utc>,
}

// AEO Citation tracking
#[derive(Debug, Serialize, Deserialize)]
pub struct TrackCitationRequest {
    pub platform: String,          // ChatGPT, Claude, Perplexity, etc.
    pub content_id: Option<Uuid>,
    pub query: String,
    pub cited: bool,
    pub citation_text: Option<String>,
    pub position: Option<i32>,     // Position in results (1st, 2nd, etc.)
    pub context: Option<String>,   // Additional context about the citation
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CitationResponse {
    pub id: Uuid,
    pub platform: String,
    pub content_id: Option<Uuid>,
    pub query: String,
    pub cited: bool,
    pub citation_text: Option<String>,
    pub position: Option<i32>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CitationStatsResponse {
    pub total_citations: i64,
    pub citation_rate: f64,
    pub platform_breakdown: serde_json::Value,
    pub top_queries: Vec<TopQuery>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TopQuery {
    pub query: String,
    pub citation_count: i64,
    pub avg_position: f64,
}

// AEO Performance
#[derive(Debug, Serialize, Deserialize)]
pub struct AEOPerformanceResponse {
    pub content_id: Uuid,
    pub platforms: Vec<PlatformPerformance>,
    pub overall_score: f64,
    pub citation_count: i64,
    pub visibility_trend: Vec<TrendPoint>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PlatformPerformance {
    pub platform: String,
    pub citations: i64,
    pub avg_position: f64,
    pub citation_rate: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TrendPoint {
    pub timestamp: DateTime<Utc>,
    pub value: f64,
}

// Analytics queries
#[derive(Debug, Deserialize)]
pub struct EventQueryParams {
    pub event_type: Option<String>,
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
    pub limit: Option<i32>,
}

#[derive(Debug, Serialize)]
pub struct EventQueryResponse {
    pub events: Vec<EventData>,
    pub total: i64,
}

#[derive(Debug, Serialize)]
pub struct EventData {
    pub id: Uuid,
    pub event_type: String,
    pub user_id: Option<Uuid>,
    pub properties: serde_json::Value,
    pub created_at: DateTime<Utc>,
}

// Real-time metrics
#[derive(Debug, Serialize)]
pub struct RealTimeMetrics {
    pub active_users: i64,
    pub events_per_minute: f64,
    pub top_events: Vec<EventCount>,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct EventCount {
    pub event_type: String,
    pub count: i64,
}

// Dashboards
#[derive(Debug, Serialize)]
pub struct DashboardOverview {
    pub total_events: i64,
    pub unique_users: i64,
    pub avg_session_duration: f64,
    pub top_content: Vec<ContentStats>,
    pub event_timeline: Vec<TimelinePoint>,
}

#[derive(Debug, Serialize)]
pub struct ContentStats {
    pub content_id: Uuid,
    pub title: String,
    pub views: i64,
    pub engagement_rate: f64,
}

#[derive(Debug, Serialize)]
pub struct TimelinePoint {
    pub timestamp: DateTime<Utc>,
    pub event_count: i64,
}

#[derive(Debug, Serialize)]
pub struct AEODashboard {
    pub total_citations: i64,
    pub platform_performance: Vec<PlatformPerformance>,
    pub top_performing_content: Vec<AEOContentPerformance>,
    pub citation_trend: Vec<TrendPoint>,
}

#[derive(Debug, Serialize)]
pub struct AEOContentPerformance {
    pub content_id: Uuid,
    pub title: String,
    pub total_citations: i64,
    pub citation_rate: f64,
    pub platforms: Vec<String>,
}
