use axum::{
    routing::{get, post},
    Router,
};
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::CorsLayer;

mod aggregator;
mod config;
mod handlers;
mod models;
mod repository;
mod scylla_client;

use config::Config;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    let config = Config::from_env()?;

    // Initialize telemetry
    asa_telemetry::init_tracing("analytics-service")?;
    asa_telemetry::init_metrics()?;

    tracing::info!("Starting Analytics Service on {}", config.server.address);

    // Database connections
    let db_pool = asa_database::PostgresPool::new(&config.database.url).await?;
    let redis_client = asa_database::RedisClient::new(&config.redis.url).await?;

    // Initialize ScyllaDB for time-series data
    let scylla_client = scylla_client::ScyllaClient::new(&config.scylla.nodes).await?;

    // Create real-time aggregator
    let aggregator = Arc::new(aggregator::EventAggregator::new());

    // Spawn background aggregation task
    let agg_clone = aggregator.clone();
    tokio::spawn(async move {
        agg_clone.run_aggregation_loop().await;
    });

    // Create shared state
    let state = handlers::AppState {
        db_pool,
        redis_client,
        scylla_client,
        aggregator,
        config: config.clone(),
    };

    // Build router
    let app = Router::new()
        .route("/health", get(handlers::health_check))
        // Event tracking
        .route("/track", post(handlers::track_event))
        .route("/track/batch", post(handlers::track_batch_events))
        // AEO-specific tracking
        .route("/citations/track", post(handlers::track_citation))
        .route("/citations/:content_id", get(handlers::get_citations))
        .route("/aeo/performance/:content_id", get(handlers::get_aeo_performance))
        // Analytics queries
        .route("/events", get(handlers::query_events))
        .route("/metrics/real-time", get(handlers::get_real_time_metrics))
        .route("/metrics/:metric_name", get(handlers::get_metric_data))
        // Dashboards
        .route("/dashboard/overview", get(handlers::get_dashboard_overview))
        .route("/dashboard/aeo", get(handlers::get_aeo_dashboard))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let addr: SocketAddr = config.server.address.parse()?;
    let listener = tokio::net::TcpListener::bind(addr).await?;

    tracing::info!("Analytics service listening on {}", addr);

    axum::serve(listener, app).await?;

    Ok(())
}
