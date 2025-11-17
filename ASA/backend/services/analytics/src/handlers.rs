use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Json},
};
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    aggregator::EventAggregator,
    models::*,
    repository::{AnalyticsRepository, Citation, PlatformStats, QueryStats},
    scylla_client::ScyllaClient,
};
use asa_database::{PostgresPool, RedisClient};
use crate::config::Config;

#[derive(Clone)]
pub struct AppState {
    pub db_pool: PostgresPool,
    pub redis_client: RedisClient,
    pub scylla_client: ScyllaClient,
    pub aggregator: Arc<EventAggregator>,
    pub config: Config,
}

// Health check
pub async fn health_check() -> impl IntoResponse {
    Json(serde_json::json!({
        "status": "healthy",
        "service": "analytics"
    }))
}

// Track single event
pub async fn track_event(
    State(state): State<AppState>,
    Json(payload): Json<TrackEventRequest>,
) -> Result<Json<EventResponse>, AppError> {
    let repo = AnalyticsRepository::new(state.db_pool.clone());

    // Store in PostgreSQL
    let event_id = repo
        .create_event(
            &payload.event_type,
            payload.user_id,
            payload.properties,
        )
        .await?;

    // Update real-time aggregator
    state.aggregator.record_event(
        &payload.event_type,
        payload.session_id.as_deref(),
    );

    tracing::debug!("Event tracked: {} ({})", payload.event_type, event_id);

    Ok(Json(EventResponse {
        id: event_id,
        event_type: payload.event_type,
        timestamp: chrono::Utc::now(),
    }))
}

// Track batch events
pub async fn track_batch_events(
    State(state): State<AppState>,
    Json(payload): Json<TrackBatchEventsRequest>,
) -> Result<Json<Vec<EventResponse>>, AppError> {
    let mut responses = Vec::new();

    for event in payload.events {
        let repo = AnalyticsRepository::new(state.db_pool.clone());

        let event_id = repo
            .create_event(&event.event_type, event.user_id, event.properties)
            .await?;

        state.aggregator.record_event(
            &event.event_type,
            event.session_id.as_deref(),
        );

        responses.push(EventResponse {
            id: event_id,
            event_type: event.event_type,
            timestamp: chrono::Utc::now(),
        });
    }

    tracing::info!("Batch tracked: {} events", responses.len());

    Ok(Json(responses))
}

// Track citation
pub async fn track_citation(
    State(state): State<AppState>,
    Json(payload): Json<TrackCitationRequest>,
) -> Result<Json<CitationResponse>, AppError> {
    let repo = AnalyticsRepository::new(state.db_pool.clone());

    let citation_id = repo
        .track_citation(
            &payload.platform,
            payload.content_id,
            &payload.query,
            payload.cited,
            payload.citation_text.as_deref(),
            payload.position,
        )
        .await?;

    tracing::info!(
        "Citation tracked: platform={}, cited={}, content_id={:?}",
        payload.platform,
        payload.cited,
        payload.content_id
    );

    Ok(Json(CitationResponse {
        id: citation_id,
        platform: payload.platform,
        content_id: payload.content_id,
        query: payload.query,
        cited: payload.cited,
        citation_text: payload.citation_text,
        position: payload.position,
        created_at: chrono::Utc::now(),
    }))
}

// Get citations for content
pub async fn get_citations(
    State(state): State<AppState>,
    Path(content_id): Path<Uuid>,
) -> Result<Json<CitationStatsResponse>, AppError> {
    let repo = AnalyticsRepository::new(state.db_pool.clone());

    let stats = repo.get_citation_stats(content_id).await?;
    let platform_breakdown = repo.get_platform_breakdown(content_id).await?;
    let top_queries = repo.get_top_queries(content_id, 10).await?;

    // Convert platform stats to JSON
    let platform_json: Vec<serde_json::Value> = platform_breakdown
        .into_iter()
        .map(|p| {
            serde_json::json!({
                "platform": p.platform,
                "citations": p.citations,
                "citation_rate": p.citation_rate,
                "avg_position": p.avg_position
            })
        })
        .collect();

    Ok(Json(CitationStatsResponse {
        total_citations: stats.total_citations,
        citation_rate: stats.citation_rate,
        platform_breakdown: serde_json::json!(platform_json),
        top_queries: top_queries
            .into_iter()
            .map(|q| TopQuery {
                query: q.query,
                citation_count: q.citation_count,
                avg_position: q.avg_position,
            })
            .collect(),
    }))
}

// Get AEO performance
pub async fn get_aeo_performance(
    State(state): State<AppState>,
    Path(content_id): Path<Uuid>,
) -> Result<Json<AEOPerformanceResponse>, AppError> {
    let repo = AnalyticsRepository::new(state.db_pool.clone());

    let stats = repo.get_citation_stats(content_id).await?;
    let platform_breakdown = repo.get_platform_breakdown(content_id).await?;

    let platforms: Vec<PlatformPerformance> = platform_breakdown
        .into_iter()
        .map(|p| PlatformPerformance {
            platform: p.platform,
            citations: p.citations,
            avg_position: p.avg_position,
            citation_rate: p.citation_rate,
        })
        .collect();

    // Mock visibility trend (in production, query from time-series data)
    let visibility_trend = vec![
        TrendPoint {
            timestamp: chrono::Utc::now() - chrono::Duration::days(7),
            value: 65.0,
        },
        TrendPoint {
            timestamp: chrono::Utc::now() - chrono::Duration::days(3),
            value: 72.0,
        },
        TrendPoint {
            timestamp: chrono::Utc::now(),
            value: stats.citation_rate,
        },
    ];

    Ok(Json(AEOPerformanceResponse {
        content_id,
        platforms,
        overall_score: stats.citation_rate,
        citation_count: stats.total_citations,
        visibility_trend,
    }))
}

// Query events
pub async fn query_events(
    State(_state): State<AppState>,
    Query(_params): Query<EventQueryParams>,
) -> Result<Json<EventQueryResponse>, AppError> {
    // Mock implementation
    Ok(Json(EventQueryResponse {
        events: vec![],
        total: 0,
    }))
}

// Get real-time metrics
pub async fn get_real_time_metrics(
    State(state): State<AppState>,
) -> Result<Json<RealTimeMetrics>, AppError> {
    let event_counts = state.aggregator.get_event_counts();
    let active_users = state.aggregator.get_active_users();

    // Calculate events per minute
    let total_events: i64 = event_counts.iter().map(|(_, count)| count).sum();
    let events_per_minute = total_events as f64 / 60.0;

    let top_events: Vec<EventCount> = event_counts
        .into_iter()
        .map(|(event_type, count)| EventCount { event_type, count })
        .collect();

    Ok(Json(RealTimeMetrics {
        active_users,
        events_per_minute,
        top_events,
        timestamp: chrono::Utc::now(),
    }))
}

// Get metric data
pub async fn get_metric_data(
    State(_state): State<AppState>,
    Path(_metric_name): Path<String>,
) -> Result<Json<Vec<TrendPoint>>, AppError> {
    // Mock implementation
    Ok(Json(vec![]))
}

// Get dashboard overview
pub async fn get_dashboard_overview(
    State(_state): State<AppState>,
) -> Result<Json<DashboardOverview>, AppError> {
    // Mock implementation
    Ok(Json(DashboardOverview {
        total_events: 12500,
        unique_users: 450,
        avg_session_duration: 325.5,
        top_content: vec![],
        event_timeline: vec![],
    }))
}

// Get AEO dashboard
pub async fn get_aeo_dashboard(
    State(_state): State<AppState>,
) -> Result<Json<AEODashboard>, AppError> {
    // Mock implementation
    Ok(Json(AEODashboard {
        total_citations: 856,
        platform_performance: vec![],
        top_performing_content: vec![],
        citation_trend: vec![],
    }))
}

// Error handling
#[derive(Debug)]
pub enum AppError {
    NotFound(String),
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
