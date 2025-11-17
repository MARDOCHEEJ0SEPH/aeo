use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Json},
};
use uuid::Uuid;

use crate::{
    config::Config,
    indexer::SearchIndexer,
    models::*,
};
use asa_database::{PostgresPool, RedisClient};

#[derive(Clone)]
pub struct AppState {
    pub db_pool: PostgresPool,
    pub redis_client: RedisClient,
    pub indexer: SearchIndexer,
    pub config: Config,
}

// Health check
pub async fn health_check() -> impl IntoResponse {
    Json(serde_json::json!({
        "status": "healthy",
        "service": "search"
    }))
}

// Standard search
pub async fn search(
    State(state): State<AppState>,
    Json(payload): Json<SearchRequest>,
) -> Result<Json<SearchResponse>, AppError> {
    let start = std::time::Instant::now();

    // Build filter string
    let filters = payload.filters.as_ref().map(|f| {
        let mut filter_parts = Vec::new();

        if let Some(types) = &f.content_type {
            let type_filter = types
                .iter()
                .map(|t| format!("content_type = '{}'", t))
                .collect::<Vec<_>>()
                .join(" OR ");
            filter_parts.push(format!("({})", type_filter));
        }

        if let Some(status) = &f.status {
            filter_parts.push(format!("status = '{}'", status));
        }

        filter_parts.join(" AND ")
    });

    let limit = payload.limit.unwrap_or(20).min(100);
    let offset = payload.offset.unwrap_or(0);

    let results = state
        .indexer
        .search(&payload.query, filters.as_deref(), limit, offset)
        .await?;

    let search_results: Vec<SearchResult> = results
        .hits
        .into_iter()
        .map(|hit| {
            let doc = hit.result;
            SearchResult {
                id: Uuid::parse_str(&doc.id).unwrap_or_default(),
                title: doc.title,
                snippet: extract_snippet(&doc.body, 200),
                score: hit.ranking_score.unwrap_or(0.0),
                content_type: doc.content_type,
                url: doc.url,
                published_at: doc.published_at.map(|ts| {
                    chrono::DateTime::from_timestamp(ts, 0)
                        .unwrap_or_default()
                }),
                highlights: vec![],
            }
        })
        .collect();

    let processing_time = start.elapsed().as_millis() as u64;

    tracing::info!(
        "Search executed: '{}' - {} results in {}ms",
        payload.query,
        search_results.len(),
        processing_time
    );

    Ok(Json(SearchResponse {
        results: search_results,
        total: results.estimated_total_hits.unwrap_or(0),
        query: payload.query,
        processing_time_ms: processing_time,
    }))
}

// AEO-optimized search
pub async fn aeo_search(
    State(state): State<AppState>,
    Json(payload): Json<AEOSearchRequest>,
) -> Result<Json<AEOSearchResponse>, AppError> {
    // Standard search
    let results = state
        .indexer
        .search(&payload.query, Some("status = 'published'"), 10, 0)
        .await?;

    let mut related_results: Vec<SearchResult> = results
        .hits
        .into_iter()
        .map(|hit| {
            let doc = hit.result;
            SearchResult {
                id: Uuid::parse_str(&doc.id).unwrap_or_default(),
                title: doc.title,
                snippet: extract_snippet(&doc.body, 200),
                score: hit.ranking_score.unwrap_or(0.0),
                content_type: doc.content_type,
                url: doc.url,
                published_at: doc.published_at.map(|ts| {
                    chrono::DateTime::from_timestamp(ts, 0)
                        .unwrap_or_default()
                }),
                highlights: vec![],
            }
        })
        .collect();

    // Featured content (top result)
    let featured_content = related_results.first().cloned();

    // Generate direct answer for AEO
    let direct_answer = if !related_results.is_empty() {
        Some(generate_direct_answer(&payload.query, &related_results[0]))
    } else {
        None
    };

    // Suggested questions
    let suggested_questions = generate_suggested_questions(&payload.query, &payload.platform);

    // Platform optimization
    let platform_optimization = PlatformOptimization {
        platform: payload.platform.clone(),
        relevance_score: calculate_platform_relevance(&payload.platform, featured_content.as_ref()),
        optimization_tips: get_platform_tips(&payload.platform),
    };

    Ok(Json(AEOSearchResponse {
        direct_answer,
        featured_content,
        related_results,
        suggested_questions,
        platform_optimization,
    }))
}

// Autocomplete suggestions
pub async fn suggest(
    State(state): State<AppState>,
    Json(payload): Json<SuggestRequest>,
) -> Result<Json<SuggestResponse>, AppError> {
    let limit = payload.limit.unwrap_or(5);

    // Simple prefix search
    let results = state
        .indexer
        .search(&payload.query, None, limit, 0)
        .await?;

    let suggestions: Vec<Suggestion> = results
        .hits
        .into_iter()
        .take(limit)
        .map(|hit| {
            let doc = hit.result;
            Suggestion {
                text: doc.title,
                score: hit.ranking_score.unwrap_or(0.0),
                result_count: Some(1),
            }
        })
        .collect();

    Ok(Json(SuggestResponse { suggestions }))
}

// Index single document
pub async fn index_content(
    State(state): State<AppState>,
    Json(payload): Json<IndexContentRequest>,
) -> Result<Json<IndexResponse>, AppError> {
    state.indexer.index_document(&payload).await?;

    Ok(Json(IndexResponse {
        task_id: None,
        status: "indexed".to_string(),
    }))
}

// Update indexed document
pub async fn update_index(
    State(state): State<AppState>,
    Path(_id): Path<Uuid>,
    Json(payload): Json<IndexContentRequest>,
) -> Result<Json<IndexResponse>, AppError> {
    state.indexer.update_document(&payload).await?;

    Ok(Json(IndexResponse {
        task_id: None,
        status: "updated".to_string(),
    }))
}

// Index batch of documents
pub async fn index_batch(
    State(state): State<AppState>,
    Json(payload): Json<IndexBatchRequest>,
) -> Result<Json<IndexResponse>, AppError> {
    state.indexer.index_batch(payload.documents).await?;

    Ok(Json(IndexResponse {
        task_id: None,
        status: "batch_indexed".to_string(),
    }))
}

// Reindex all content from database
pub async fn reindex_all(
    State(state): State<AppState>,
) -> Result<Json<IndexResponse>, AppError> {
    // In production, this would fetch all content from the database
    // and reindex it in batches
    tracing::info!("Reindex all triggered");

    Ok(Json(IndexResponse {
        task_id: None,
        status: "reindexing_started".to_string(),
    }))
}

// Get top search queries
pub async fn get_top_queries(
    State(_state): State<AppState>,
) -> Result<Json<Vec<TopQuery>>, AppError> {
    // Mock implementation - in production, track queries in analytics
    Ok(Json(vec![
        TopQuery {
            query: "AEO optimization".to_string(),
            count: 245,
            avg_click_position: 1.2,
        },
        TopQuery {
            query: "Claude AI content".to_string(),
            count: 189,
            avg_click_position: 1.5,
        },
    ]))
}

// Get queries with zero results
pub async fn get_zero_result_queries(
    State(_state): State<AppState>,
) -> Result<Json<Vec<ZeroResultQuery>>, AppError> {
    // Mock implementation
    Ok(Json(vec![]))
}

// Helper functions
fn extract_snippet(text: &str, max_length: usize) -> String {
    let clean_text: String = text
        .lines()
        .filter(|line| !line.starts_with('#'))
        .collect::<Vec<_>>()
        .join(" ");

    if clean_text.len() <= max_length {
        clean_text
    } else {
        format!("{}...", &clean_text[..max_length])
    }
}

fn generate_direct_answer(query: &str, result: &SearchResult) -> String {
    format!(
        "Based on '{}': {}",
        result.title,
        &result.snippet[..result.snippet.len().min(150)]
    )
}

fn generate_suggested_questions(query: &str, _platform: &str) -> Vec<String> {
    vec![
        format!("What is {}?", query),
        format!("How to use {}?", query),
        format!("Best practices for {}", query),
    ]
}

fn calculate_platform_relevance(_platform: &str, _content: Option<&SearchResult>) -> f64 {
    // In production, calculate based on content optimization for platform
    85.0
}

fn get_platform_tips(platform: &str) -> Vec<String> {
    match platform.to_lowercase().as_str() {
        "chatgpt" => vec![
            "Content is well-structured with clear sections".to_string(),
            "Includes practical examples".to_string(),
        ],
        "claude" => vec![
            "Comprehensive coverage with depth".to_string(),
            "Multiple perspectives included".to_string(),
        ],
        "perplexity" => vec![
            "Strong citation foundation".to_string(),
            "Authoritative sources referenced".to_string(),
        ],
        _ => vec!["Content optimized for AI platforms".to_string()],
    }
}

// Error handling
#[derive(Debug)]
pub enum AppError {
    Internal(anyhow::Error),
}

impl From<anyhow::Error> for AppError {
    fn from(err: anyhow::Error) -> Self {
        AppError::Internal(err)
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        let (status, message) = match self {
            AppError::Internal(err) => {
                tracing::error!("Internal error: {:?}", err);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Internal server error".to_string(),
                )
            }
        };

        (status, Json(serde_json::json!({ "error": message }))).into_response()
    }
}
