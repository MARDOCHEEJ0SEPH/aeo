use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Json},
};
use serde::Deserialize;
use uuid::Uuid;

use crate::{
    aeo_optimizer::AEOOptimizer,
    ai_generator::AIGenerator,
    config::Config,
    models::*,
    repository::{Content, ContentRepository},
    schema_generator::SchemaGenerator,
};
use asa_database::{PostgresPool, RedisClient};

#[derive(Clone)]
pub struct AppState {
    pub db_pool: PostgresPool,
    pub redis_client: RedisClient,
    pub ai_generator: AIGenerator,
    pub aeo_optimizer: AEOOptimizer,
    pub config: Config,
}

// Health check
pub async fn health_check() -> impl IntoResponse {
    Json(serde_json::json!({
        "status": "healthy",
        "service": "content"
    }))
}

// Create content
pub async fn create_content(
    State(state): State<AppState>,
    Json(payload): Json<CreateContentRequest>,
) -> Result<Json<ContentResponse>, AppError> {
    let repo = ContentRepository::new(state.db_pool.clone());

    // Generate slug if not provided
    let slug = payload
        .slug
        .unwrap_or_else(|| slug::slugify(&payload.title));

    // Check if slug already exists
    if repo.find_by_slug(&slug).await?.is_some() {
        return Err(AppError::Conflict("Slug already exists".to_string()));
    }

    let content = repo
        .create(
            &payload.title,
            &slug,
            &payload.body,
            &payload.content_type,
            payload.author_id,
            payload.metadata,
        )
        .await?;

    tracing::info!("Content created: {} ({})", content.title, content.id);

    Ok(Json(content_to_response(content)))
}

// List content
#[derive(Deserialize)]
pub struct ListQuery {
    page: Option<i64>,
    page_size: Option<i64>,
    status: Option<String>,
}

pub async fn list_content(
    State(state): State<AppState>,
    Query(query): Query<ListQuery>,
) -> Result<Json<ContentListResponse>, AppError> {
    let repo = ContentRepository::new(state.db_pool.clone());

    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(20).min(100);

    let (items, total) = repo
        .list(page, page_size, query.status.as_deref())
        .await?;

    Ok(Json(ContentListResponse {
        items: items.into_iter().map(content_to_response).collect(),
        total,
        page,
        page_size,
    }))
}

// Get content by ID
pub async fn get_content(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ContentResponse>, AppError> {
    let repo = ContentRepository::new(state.db_pool.clone());

    let content = repo
        .find_by_id(id)
        .await?
        .ok_or_else(|| AppError::NotFound("Content not found".to_string()))?;

    Ok(Json(content_to_response(content)))
}

// Update content
pub async fn update_content(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateContentRequest>,
) -> Result<Json<ContentResponse>, AppError> {
    let repo = ContentRepository::new(state.db_pool.clone());

    let content = repo
        .update(
            id,
            payload.title.as_deref(),
            payload.slug.as_deref(),
            payload.body.as_deref(),
            payload.content_type.as_deref(),
            payload.metadata,
        )
        .await?;

    tracing::info!("Content updated: {}", content.id);

    Ok(Json(content_to_response(content)))
}

// Delete content
pub async fn delete_content(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    let repo = ContentRepository::new(state.db_pool.clone());

    repo.delete(id).await?;

    tracing::info!("Content deleted: {}", id);

    Ok(StatusCode::NO_CONTENT)
}

// Generate content with AI
pub async fn generate_content(
    State(state): State<AppState>,
    Json(payload): Json<GenerateContentRequest>,
) -> Result<Json<GenerateContentResponse>, AppError> {
    let (title, body, outline) = state
        .ai_generator
        .generate_content(
            &payload.topic,
            &payload.content_type,
            &payload.target_platform,
            payload.tone.as_deref(),
            payload.length.as_deref(),
            payload.keywords.as_deref(),
        )
        .await?;

    tracing::info!("AI content generated for topic: {}", payload.topic);

    Ok(Json(GenerateContentResponse {
        title,
        body,
        outline,
        metadata: serde_json::json!({
            "topic": payload.topic,
            "platform": payload.target_platform,
            "generated_at": chrono::Utc::now(),
        }),
    }))
}

// Generate outline
pub async fn generate_outline(
    State(state): State<AppState>,
    Json(payload): Json<GenerateOutlineRequest>,
) -> Result<Json<Vec<String>>, AppError> {
    let outline = state
        .ai_generator
        .generate_outline(
            &payload.topic,
            &payload.content_type,
            &payload.target_platform,
        )
        .await?;

    Ok(Json(outline))
}

// Optimize content for AEO
pub async fn optimize_content(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<OptimizeContentRequest>,
) -> Result<Json<OptimizationResponse>, AppError> {
    let repo = ContentRepository::new(state.db_pool.clone());

    let content = repo
        .find_by_id(id)
        .await?
        .ok_or_else(|| AppError::NotFound("Content not found".to_string()))?;

    let optimization = state
        .aeo_optimizer
        .optimize_content(&content.body, &payload.target_platform);

    tracing::info!(
        "Content optimized: {} for platform: {}",
        id,
        payload.target_platform
    );

    Ok(Json(optimization))
}

// Get optimization score
pub async fn get_optimization_score(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<OptimizationScoreResponse>, AppError> {
    let repo = ContentRepository::new(state.db_pool.clone());

    let content = repo
        .find_by_id(id)
        .await?
        .ok_or_else(|| AppError::NotFound("Content not found".to_string()))?;

    // Calculate scores for all platforms
    use asa_models::aeo::platform::AIPlatform;
    let platforms = [
        AIPlatform::ChatGPT,
        AIPlatform::Claude,
        AIPlatform::Perplexity,
        AIPlatform::Gemini,
        AIPlatform::Bing,
    ];

    let mut platform_scores = serde_json::Map::new();
    let mut total_score = 0.0;

    for platform in &platforms {
        let score = state
            .aeo_optimizer
            .calculate_score(&content.body, platform);
        platform_scores.insert(
            format!("{:?}", platform).to_lowercase(),
            serde_json::json!(score),
        );
        total_score += score;
    }

    let overall_score = total_score / platforms.len() as f64;

    Ok(Json(OptimizationScoreResponse {
        overall_score,
        platform_scores: serde_json::Value::Object(platform_scores),
        strengths: vec![
            "Well-structured content".to_string(),
            "Good readability".to_string(),
        ],
        weaknesses: vec![
            "Could use more examples".to_string(),
            "Add more citations".to_string(),
        ],
    }))
}

// Get schema.org markup
pub async fn get_schema_markup(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let repo = ContentRepository::new(state.db_pool.clone());

    let content = repo
        .find_by_id(id)
        .await?
        .ok_or_else(|| AppError::NotFound("Content not found".to_string()))?;

    let schema_gen = SchemaGenerator::new();

    // Generate Article schema
    let schema = schema_gen.generate_article_schema(
        &content.title,
        &content.body,
        "ASA Author", // In production, fetch actual author name
        content.created_at,
        content.updated_at,
    );

    Ok(Json(schema))
}

// Publish content
pub async fn publish_content(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ContentResponse>, AppError> {
    let repo = ContentRepository::new(state.db_pool.clone());

    let content = repo.publish(id).await?;

    tracing::info!("Content published: {}", content.id);

    Ok(Json(content_to_response(content)))
}

// Unpublish content
pub async fn unpublish_content(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ContentResponse>, AppError> {
    let repo = ContentRepository::new(state.db_pool.clone());

    let content = repo.unpublish(id).await?;

    tracing::info!("Content unpublished: {}", content.id);

    Ok(Json(content_to_response(content)))
}

// Helper functions
fn content_to_response(content: Content) -> ContentResponse {
    ContentResponse {
        id: content.id,
        title: content.title,
        slug: content.slug,
        body: content.body,
        content_type: content.content_type,
        status: content.status,
        author_id: content.author_id,
        metadata: content.metadata,
        created_at: content.created_at,
        updated_at: content.updated_at,
        published_at: content.published_at,
    }
}

// Error handling
#[derive(Debug)]
pub enum AppError {
    NotFound(String),
    Conflict(String),
    Internal(anyhow::Error),
}

impl From<anyhow::Error> for AppError {
    fn from(err: anyhow::Error) -> Self {
        AppError::Internal(err)
    }
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        AppError::Internal(err.into())
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        let (status, message) = match self {
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
            AppError::Conflict(msg) => (StatusCode::CONFLICT, msg),
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
