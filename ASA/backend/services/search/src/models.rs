use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchRequest {
    pub query: String,
    pub filters: Option<SearchFilters>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchFilters {
    pub content_type: Option<Vec<String>>,
    pub status: Option<String>,
    pub author_id: Option<Uuid>,
    pub date_range: Option<DateRange>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DateRange {
    pub start: Option<DateTime<Utc>>,
    pub end: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchResponse {
    pub results: Vec<SearchResult>,
    pub total: usize,
    pub query: String,
    pub processing_time_ms: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchResult {
    pub id: Uuid,
    pub title: String,
    pub snippet: String,
    pub score: f64,
    pub content_type: String,
    pub url: String,
    pub published_at: Option<DateTime<Utc>>,
    pub highlights: Vec<Highlight>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Highlight {
    pub field: String,
    pub matched_text: String,
}

// AEO-optimized search
#[derive(Debug, Serialize, Deserialize)]
pub struct AEOSearchRequest {
    pub query: String,
    pub platform: String, // ChatGPT, Claude, Perplexity, etc.
    pub intent: Option<String>, // informational, navigational, transactional
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AEOSearchResponse {
    pub direct_answer: Option<String>,
    pub featured_content: Option<SearchResult>,
    pub related_results: Vec<SearchResult>,
    pub suggested_questions: Vec<String>,
    pub platform_optimization: PlatformOptimization,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PlatformOptimization {
    pub platform: String,
    pub relevance_score: f64,
    pub optimization_tips: Vec<String>,
}

// Suggestions/Autocomplete
#[derive(Debug, Serialize, Deserialize)]
pub struct SuggestRequest {
    pub query: String,
    pub limit: Option<usize>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SuggestResponse {
    pub suggestions: Vec<Suggestion>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Suggestion {
    pub text: String,
    pub score: f64,
    pub result_count: Option<usize>,
}

// Index operations
#[derive(Debug, Serialize, Deserialize)]
pub struct IndexContentRequest {
    pub id: Uuid,
    pub title: String,
    pub body: String,
    pub content_type: String,
    pub status: String,
    pub author_id: Uuid,
    pub metadata: Option<serde_json::Value>,
    pub published_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct IndexBatchRequest {
    pub documents: Vec<IndexContentRequest>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct IndexResponse {
    pub task_id: Option<i64>,
    pub status: String,
}

// Analytics
#[derive(Debug, Serialize, Deserialize)]
pub struct TopQuery {
    pub query: String,
    pub count: i64,
    pub avg_click_position: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ZeroResultQuery {
    pub query: String,
    pub count: i64,
    pub last_searched: DateTime<Utc>,
}

// Internal document model for MeiliSearch
#[derive(Debug, Serialize, Deserialize)]
pub struct SearchDocument {
    pub id: String,
    pub title: String,
    pub body: String,
    pub content_type: String,
    pub status: String,
    pub author_id: String,
    pub url: String,
    pub published_at: Option<i64>,
    pub searchable_text: String, // Combined title + body for full-text search
}

impl SearchDocument {
    pub fn from_request(req: &IndexContentRequest) -> Self {
        let searchable_text = format!("{} {}", req.title, req.body);

        Self {
            id: req.id.to_string(),
            title: req.title.clone(),
            body: req.body.clone(),
            content_type: req.content_type.clone(),
            status: req.status.clone(),
            author_id: req.author_id.to_string(),
            url: format!("/content/{}", req.id),
            published_at: req.published_at.map(|dt| dt.timestamp()),
            searchable_text,
        }
    }
}
