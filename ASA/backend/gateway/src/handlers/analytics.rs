use axum::{response::Json, http::StatusCode};
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
pub struct MetricsResponse {
    page_views: u64,
    unique_visitors: u64,
}

pub async fn get_metrics() -> Json<MetricsResponse> {
    Json(MetricsResponse {
        page_views: 0,
        unique_visitors: 0,
    })
}

#[derive(Deserialize)]
pub struct TrackEventRequest {
    event_type: String,
    properties: serde_json::Value,
}

pub async fn track_event(Json(payload): Json<TrackEventRequest>) -> StatusCode {
    StatusCode::ACCEPTED
}
