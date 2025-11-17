use axum::{
    routing::{get, post},
    Router,
};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;

mod config;
mod handlers;
mod jwt;
mod models;
mod oauth;
mod repository;
mod webauthn_config;

use config::Config;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    let config = Config::from_env()?;

    // Initialize telemetry
    asa_telemetry::init_tracing("auth-service")?;
    asa_telemetry::init_metrics()?;

    tracing::info!("Starting Auth Service on {}", config.server.address);

    // Database connections
    let db_pool = asa_database::PostgresPool::new(&config.database.url).await?;
    let redis_client = asa_database::RedisClient::new(&config.redis.url).await?;

    // Initialize WebAuthn
    let webauthn = webauthn_config::init_webauthn(&config)?;

    // Create shared state
    let state = handlers::AppState {
        db_pool,
        redis_client,
        webauthn,
        config: config.clone(),
    };

    // Build router
    let app = Router::new()
        .route("/health", get(handlers::health_check))
        .route("/register", post(handlers::register))
        .route("/login", post(handlers::login))
        .route("/refresh", post(handlers::refresh_token))
        .route("/webauthn/register/start", post(handlers::webauthn_register_start))
        .route("/webauthn/register/finish", post(handlers::webauthn_register_finish))
        .route("/webauthn/login/start", post(handlers::webauthn_login_start))
        .route("/webauthn/login/finish", post(handlers::webauthn_login_finish))
        .route("/oauth/:provider/authorize", get(handlers::oauth_authorize))
        .route("/oauth/:provider/callback", get(handlers::oauth_callback))
        .route("/verify", get(handlers::verify_token))
        .route("/logout", post(handlers::logout))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let addr: SocketAddr = config.server.address.parse()?;
    let listener = tokio::net::TcpListener::bind(addr).await?;

    tracing::info!("Auth service listening on {}", addr);

    axum::serve(listener, app).await?;

    Ok(())
}
