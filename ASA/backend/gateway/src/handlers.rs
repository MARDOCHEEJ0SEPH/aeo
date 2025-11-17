use axum::{
    extract::{Path, State, WebSocketUpgrade},
    http::{StatusCode, HeaderMap},
    response::{IntoResponse, Json, Response},
};
use axum::extract::ws::{WebSocket, Message};

use crate::config::Config;
use asa_database::{PostgresPool, RedisClient};

#[derive(Clone)]
pub struct AppState {
    pub db_pool: PostgresPool,
    pub redis_client: RedisClient,
    pub http_client: reqwest::Client,
    pub config: Config,
}

// Health check
pub async fn health_check() -> impl IntoResponse {
    Json(serde_json::json!({
        "status": "healthy",
        "service": "gateway",
        "version": "1.0.0"
    }))
}

// Root endpoint
pub async fn root() -> impl IntoResponse {
    Json(serde_json::json!({
        "name": "ASA API Gateway",
        "version": "1.0.0",
        "endpoints": {
            "auth": "/api/auth/*",
            "content": "/api/content/*",
            "analytics": "/api/analytics/*",
            "search": "/api/search/*",
            "websocket": "/ws"
        }
    }))
}

// Proxy to Auth Service
pub async fn proxy_to_auth(
    State(state): State<AppState>,
    headers: HeaderMap,
    axum::extract::Request(req): axum::extract::Request,
) -> Result<Response, AppError> {
    let path = req.uri().path().strip_prefix("/api/auth").unwrap_or("");
    let url = format!("{}{}", state.config.services.auth_url, path);

    proxy_request(state.http_client, url, req, headers).await
}

// Proxy to Content Service
pub async fn proxy_to_content(
    State(state): State<AppState>,
    headers: HeaderMap,
    axum::extract::Request(req): axum::extract::Request,
) -> Result<Response, AppError> {
    let path = req.uri().path().strip_prefix("/api").unwrap_or("");
    let url = format!("{}{}", state.config.services.content_url, path);

    proxy_request(state.http_client, url, req, headers).await
}

// Proxy to Analytics Service
pub async fn proxy_to_analytics(
    State(state): State<AppState>,
    headers: HeaderMap,
    axum::extract::Request(req): axum::extract::Request,
) -> Result<Response, AppError> {
    let path = req.uri().path().strip_prefix("/api/analytics").unwrap_or("");
    let url = format!("{}{}", state.config.services.analytics_url, path);

    proxy_request(state.http_client, url, req, headers).await
}

// Proxy to Search Service
pub async fn proxy_to_search(
    State(state): State<AppState>,
    headers: HeaderMap,
    axum::extract::Request(req): axum::extract::Request,
) -> Result<Response, AppError> {
    let path = req.uri().path().strip_prefix("/api").unwrap_or("");
    let url = format!("{}{}", state.config.services.search_url, path);

    proxy_request(state.http_client, url, req, headers).await
}

// WebSocket handler for real-time updates
pub async fn websocket_handler(
    ws: WebSocketUpgrade,
) -> impl IntoResponse {
    ws.on_upgrade(handle_socket)
}

async fn handle_socket(mut socket: WebSocket) {
    tracing::info!("WebSocket connection established");

    // Send welcome message
    if socket
        .send(Message::Text(
            serde_json::json!({
                "type": "connected",
                "message": "Welcome to ASA real-time updates"
            })
            .to_string(),
        ))
        .await
        .is_err()
    {
        return;
    }

    // Handle incoming messages
    while let Some(msg) = socket.recv().await {
        match msg {
            Ok(Message::Text(text)) => {
                tracing::debug!("Received WebSocket message: {}", text);

                // Echo back for now (in production, handle specific message types)
                if socket
                    .send(Message::Text(format!("Echo: {}", text)))
                    .await
                    .is_err()
                {
                    break;
                }
            }
            Ok(Message::Close(_)) => {
                tracing::info!("WebSocket connection closed");
                break;
            }
            _ => {}
        }
    }
}

// Helper function to proxy requests
async fn proxy_request(
    client: reqwest::Client,
    url: String,
    req: axum::http::Request<axum::body::Body>,
    headers: HeaderMap,
) -> Result<Response, AppError> {
    let method = req.method().clone();
    let body = axum::body::to_bytes(req.into_body(), usize::MAX).await?;

    let mut request = client.request(method, &url);

    // Forward relevant headers
    for (key, value) in headers.iter() {
        if key != "host" {
            request = request.header(key, value);
        }
    }

    let response = request.body(body).send().await?;

    let status = response.status();
    let body_bytes = response.bytes().await?;

    Ok((status, body_bytes).into_response())
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

impl From<reqwest::Error> for AppError {
    fn from(err: reqwest::Error) -> Self {
        AppError::Internal(err.into())
    }
}

impl From<axum::Error> for AppError {
    fn from(err: axum::Error) -> Self {
        AppError::Internal(err.into())
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
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
