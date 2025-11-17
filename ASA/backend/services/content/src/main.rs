use axum::{
    routing::{delete, get, post, put},
    Router,
};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;

mod aeo_optimizer;
mod ai_generator;
mod config;
mod handlers;
mod models;
mod repository;
mod schema_generator;

use config::Config;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    let config = Config::from_env()?;

    // Initialize telemetry
    asa_telemetry::init_tracing("content-service")?;
    asa_telemetry::init_metrics()?;

    tracing::info!("Starting Content Service on {}", config.server.address);

    // Database connections
    let db_pool = asa_database::PostgresPool::new(&config.database.url).await?;
    let redis_client = asa_database::RedisClient::new(&config.redis.url).await?;

    // Create AI generator
    let ai_generator = ai_generator::AIGenerator::new(
        config.openai_api_key.clone(),
        config.anthropic_api_key.clone(),
    );

    // Create AEO optimizer
    let aeo_optimizer = aeo_optimizer::AEOOptimizer::new();

    // Create shared state
    let state = handlers::AppState {
        db_pool,
        redis_client,
        ai_generator,
        aeo_optimizer,
        config: config.clone(),
    };

    // Build router
    let app = Router::new()
        .route("/health", get(handlers::health_check))
        // Content CRUD
        .route("/content", post(handlers::create_content))
        .route("/content", get(handlers::list_content))
        .route("/content/:id", get(handlers::get_content))
        .route("/content/:id", put(handlers::update_content))
        .route("/content/:id", delete(handlers::delete_content))
        // AI Generation
        .route("/generate", post(handlers::generate_content))
        .route("/generate/outline", post(handlers::generate_outline))
        // AEO Optimization
        .route("/optimize/:id", post(handlers::optimize_content))
        .route("/optimize/score/:id", get(handlers::get_optimization_score))
        // Schema.org
        .route("/schema/:id", get(handlers::get_schema_markup))
        // Publishing
        .route("/publish/:id", post(handlers::publish_content))
        .route("/unpublish/:id", post(handlers::unpublish_content))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let addr: SocketAddr = config.server.address.parse()?;
    let listener = tokio::net::TcpListener::bind(addr).await?;

    tracing::info!("Content service listening on {}", addr);

    axum::serve(listener, app).await?;

    Ok(())
}
