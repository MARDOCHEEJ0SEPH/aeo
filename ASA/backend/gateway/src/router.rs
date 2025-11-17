use axum::{
    routing::{get, post},
    Router,
};
use tower::ServiceBuilder;
use tower_http::{
    compression::CompressionLayer,
    cors::CorsLayer,
    trace::TraceLayer,
};

use crate::{handlers, middleware, AppState};

pub fn build_router(state: AppState) -> Router {
    Router::new()
        // Health check endpoint
        .route("/health", get(handlers::health::health_check))
        .route("/", get(handlers::root::root))

        // API routes
        .nest("/api/v1", api_routes())

        // Apply middleware
        .layer(
            ServiceBuilder::new()
                .layer(TraceLayer::new_for_http())
                .layer(CompressionLayer::new())
                .layer(CorsLayer::permissive()),
        )
        .with_state(state)
}

fn api_routes() -> Router<AppState> {
    Router::new()
        // Content routes
        .route("/content", get(handlers::content::list_content))
        .route("/content", post(handlers::content::create_content))

        // AEO routes
        .route("/aeo/optimize", post(handlers::aeo::optimize_content))
        .route("/aeo/citations", get(handlers::aeo::get_citations))
        .route("/aeo/score", get(handlers::aeo::calculate_score))

        // Analytics routes
        .route("/analytics/metrics", get(handlers::analytics::get_metrics))
        .route("/analytics/events", post(handlers::analytics::track_event))
}
