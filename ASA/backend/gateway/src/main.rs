use axum::{
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Json},
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tower::ServiceBuilder;
use tower_http::{
    compression::CompressionLayer,
    cors::CorsLayer,
    trace::TraceLayer,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod config;
mod middleware;
mod handlers;
mod router;

use config::Config;

/// Application state
#[derive(Clone)]
pub struct AppState {
    config: Arc<Config>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "asa_gateway=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load configuration
    dotenvy::dotenv().ok();
    let config = Config::from_env()?;

    tracing::info!("🚀 Starting ASA API Gateway");
    tracing::info!("📍 Environment: {}", config.environment);
    tracing::info!("🌐 Listening on {}:{}", config.host, config.port);

    // Build application state
    let state = AppState {
        config: Arc::new(config.clone()),
    };

    // Build application router
    let app = router::build_router(state.clone());

    // Build server address
    let addr = format!("{}:{}", config.host, config.port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;

    tracing::info!("✅ ASA Gateway ready on {}", addr);
    tracing::info!("📖 API docs: http://{}/docs", addr);
    tracing::info!("❤️  Health check: http://{}/health", addr);

    // Run server
    axum::serve(listener, app).await?;

    Ok(())
}
