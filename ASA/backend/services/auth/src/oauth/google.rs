use crate::config::OAuthProvider;
use crate::models::GoogleUserInfo;
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
        ("response_type", "code"),
        ("scope", "openid email profile"),
        ("access_type", "offline"),
        ("prompt", "consent"),
    ];

    let query = serde_urlencoded::to_string(&params)?;
    Ok(format!(
        "https://accounts.google.com/o/oauth2/v2/auth?{}",
        query
    ))
}

pub async fn exchange_code(config: &OAuthProvider, code: &str) -> Result<GoogleUserInfo> {
    let client = reqwest::Client::new();

    // Exchange code for access token
    let token_response = client
        .post("https://oauth2.googleapis.com/token")
        .form(&[
            ("client_id", config.client_id.as_str()),
            ("client_secret", config.client_secret.as_str()),
            ("code", code),
            ("redirect_uri", config.redirect_uri.as_str()),
            ("grant_type", "authorization_code"),
        ])
        .send()
        .await?
        .json::<TokenResponse>()
        .await?;

    // Get user info
    let user_info = client
        .get("https://www.googleapis.com/oauth2/v2/userinfo")
        .bearer_auth(&token_response.access_token)
        .send()
        .await?
        .json::<GoogleUserInfo>()
        .await?;

    Ok(user_info)
}
