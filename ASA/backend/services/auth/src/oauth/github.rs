use crate::config::OAuthProvider;
use crate::models::GithubUserInfo;
use anyhow::Result;
use serde::Deserialize;

#[derive(Deserialize)]
struct TokenResponse {
    access_token: String,
}

pub fn get_auth_url(config: &OAuthProvider) -> Result<String> {
    let params = [
        ("client_id", config.client_id.as_str()),
        ("redirect_uri", config.redirect_uri.as_str()),
        ("scope", "user:email"),
    ];

    let query = serde_urlencoded::to_string(&params)?;
    Ok(format!(
        "https://github.com/login/oauth/authorize?{}",
        query
    ))
}

pub async fn exchange_code(config: &OAuthProvider, code: &str) -> Result<GithubUserInfo> {
    let client = reqwest::Client::new();

    // Exchange code for access token
    let token_response = client
        .post("https://github.com/login/oauth/access_token")
        .header("Accept", "application/json")
        .form(&[
            ("client_id", config.client_id.as_str()),
            ("client_secret", config.client_secret.as_str()),
            ("code", code),
            ("redirect_uri", config.redirect_uri.as_str()),
        ])
        .send()
        .await?
        .json::<TokenResponse>()
        .await?;

    // Get user info
    let user_info = client
        .get("https://api.github.com/user")
        .header("User-Agent", "ASA-Platform")
        .bearer_auth(&token_response.access_token)
        .send()
        .await?
        .json::<GithubUserInfo>()
        .await?;

    Ok(user_info)
}
