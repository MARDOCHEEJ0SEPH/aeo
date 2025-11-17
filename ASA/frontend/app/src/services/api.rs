use gloo_net::http::Request;
use serde::{Deserialize, Serialize};

const API_BASE: &str = "http://localhost:3000/api/v1";

pub async fn optimize_content(content: &str, platforms: Vec<String>) -> Result<OptimizeResponse, String> {
    let request_body = OptimizeRequest {
        content: content.to_string(),
        platforms,
    };

    let response = Request::post(&format!("{}/aeo/optimize", API_BASE))
        .json(&request_body)
        .map_err(|e| e.to_string())?
        .send()
        .await
        .map_err(|e| e.to_string())?;

    response
        .json::<OptimizeResponse>()
        .await
        .map_err(|e| e.to_string())
}

#[derive(Serialize)]
struct OptimizeRequest {
    content: String,
    platforms: Vec<String>,
}

#[derive(Deserialize)]
pub struct OptimizeResponse {
    pub score: f64,
    pub improvements: Vec<String>,
}
