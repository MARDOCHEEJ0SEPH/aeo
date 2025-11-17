use axum::{response::Json, http::StatusCode};
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
pub struct ContentListResponse {
    items: Vec<ContentItem>,
    total: usize,
}

#[derive(Serialize)]
pub struct ContentItem {
    id: String,
    title: String,
    excerpt: String,
}

pub async fn list_content() -> Json<ContentListResponse> {
    Json(ContentListResponse {
        items: vec![],
        total: 0,
    })
}

#[derive(Deserialize)]
pub struct CreateContentRequest {
    title: String,
    body: String,
}

pub async fn create_content(Json(payload): Json<CreateContentRequest>) -> StatusCode {
    // TODO: Implement content creation
    StatusCode::CREATED
}
