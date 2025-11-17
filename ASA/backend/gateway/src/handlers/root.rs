use axum::response::Json;
use serde::Serialize;

#[derive(Serialize)]
pub struct RootResponse {
    name: String,
    version: String,
    description: String,
    endpoints: Vec<String>,
}

pub async fn root() -> Json<RootResponse> {
    Json(RootResponse {
        name: "ASA - Autonomous Search Architecture".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        description: "Full-Stack Rust with AEO/LLMO Optimization".to_string(),
        endpoints: vec![
            "/health".to_string(),
            "/api/v1/content".to_string(),
            "/api/v1/aeo/optimize".to_string(),
            "/api/v1/analytics/metrics".to_string(),
        ],
    })
}
