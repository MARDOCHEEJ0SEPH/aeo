use axum::{
    routing::{get, post, put},
    Router,
};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;

mod config;
mod handlers;
mod indexer;
mod models;

use config::Config;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    let config = Config::from_env()?;

    // Initialize telemetry
    asa_telemetry::init_tracing("search-service")?;
    asa_telemetry::init_metrics()?;

    tracing::info!("Starting Search Service on {}", config.server.address);

    // Database connections
    let db_pool = asa_database::PostgresPool::new(&config.database.url).await?;
    let redis_client = asa_database::RedisClient::new(&config.redis.url).await?;

    // Initialize MeiliSearch
    let indexer = indexer::SearchIndexer::new(&config.meilisearch.url, &config.meilisearch.api_key).await?;

    // Create shared state
    let state = handlers::AppState {
        db_pool,
        redis_client,
        indexer,
        config: config.clone(),
    };

    // Build router
    let app = Router::new()
        .route("/health", get(handlers::health_check))
        // Search operations
        .route("/search", post(handlers::search))
        .route("/search/aeo", post(handlers::aeo_search))
        .route("/suggest", post(handlers::suggest))
        // Index management
        .route("/index/:id", post(handlers::index_content))
        .route("/index/:id", put(handlers::update_index))
        .route("/index/batch", post(handlers::index_batch))
        .route("/reindex", post(handlers::reindex_all))
        // Analytics
        .route("/analytics/top-queries", get(handlers::get_top_queries))
        .route("/analytics/zero-results", get(handlers::get_zero_result_queries))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let addr: SocketAddr = config.server.address.parse()?;
    let listener = tokio::net::TcpListener::bind(addr).await?;

    tracing::info!("Search service listening on {}", addr);

    axum::serve(listener, app).await?;

    Ok(())
}
