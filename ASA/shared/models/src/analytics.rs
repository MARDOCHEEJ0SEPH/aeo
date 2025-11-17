use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;

/// Analytics event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalyticsEvent {
    pub id: Uuid,
    pub event_type: EventType,
    pub user_id: Option<Uuid>,
    pub session_id: String,
    pub content_id: Option<Uuid>,
    pub properties: serde_json::Value,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EventType {
    PageView,
    ContentView,
    Search,
    Click,
    Conversion,
    Engagement,
}

/// Metrics aggregation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Metrics {
    pub page_views: u64,
    pub unique_visitors: u64,
    pub average_session_duration: f64,
    pub bounce_rate: f64,
    pub conversion_rate: f64,
}
