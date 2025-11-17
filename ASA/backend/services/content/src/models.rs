use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateContentRequest {
    pub title: String,
    pub slug: Option<String>,
    pub body: String,
    pub content_type: String,
    pub author_id: Uuid,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateContentRequest {
    pub title: Option<String>,
    pub slug: Option<String>,
    pub body: Option<String>,
    pub content_type: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ContentResponse {
    pub id: Uuid,
    pub title: String,
    pub slug: String,
    pub body: String,
    pub content_type: String,
    pub status: String,
    pub author_id: Uuid,
    pub metadata: Option<serde_json::Value>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    pub published_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ContentListResponse {
    pub items: Vec<ContentResponse>,
    pub total: i64,
    pub page: i64,
    pub page_size: i64,
}

// AI Generation
#[derive(Debug, Serialize, Deserialize)]
pub struct GenerateContentRequest {
    pub topic: String,
    pub content_type: String,
    pub target_platform: String, // ChatGPT, Claude, Perplexity, Gemini, Bing
    pub tone: Option<String>,
    pub length: Option<String>,
    pub keywords: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GenerateOutlineRequest {
    pub topic: String,
    pub content_type: String,
    pub target_platform: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GenerateContentResponse {
    pub title: String,
    pub body: String,
    pub outline: Vec<String>,
    pub metadata: serde_json::Value,
}

// AEO Optimization
#[derive(Debug, Serialize, Deserialize)]
pub struct OptimizeContentRequest {
    pub target_platform: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OptimizationResponse {
    pub score: f64,
    pub improvements: Vec<Improvement>,
    pub optimized_content: String,
    pub platform_specific_tips: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Improvement {
    pub category: String,
    pub description: String,
    pub impact: String, // high, medium, low
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OptimizationScoreResponse {
    pub overall_score: f64,
    pub platform_scores: serde_json::Value,
    pub strengths: Vec<String>,
    pub weaknesses: Vec<String>,
}
