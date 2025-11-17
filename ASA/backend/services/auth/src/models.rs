use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RefreshTokenRequest {
    pub refresh_token: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub user: UserInfo,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserInfo {
    pub id: Uuid,
    pub email: String,
    pub username: String,
    pub role: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VerifyTokenResponse {
    pub valid: bool,
    pub user: Option<UserInfo>,
}

// WebAuthn models
#[derive(Debug, Serialize, Deserialize)]
pub struct WebAuthnRegisterStartRequest {
    pub user_id: Uuid,
    pub username: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WebAuthnRegisterFinishRequest {
    pub user_id: Uuid,
    pub credential: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WebAuthnLoginStartRequest {
    pub username: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WebAuthnLoginFinishRequest {
    pub username: String,
    pub credential: serde_json::Value,
}

// OAuth models
#[derive(Debug, Serialize, Deserialize)]
pub struct OAuthCallbackQuery {
    pub code: String,
    pub state: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GoogleUserInfo {
    pub id: String,
    pub email: String,
    pub name: String,
    pub picture: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GithubUserInfo {
    pub id: i64,
    pub login: String,
    pub email: Option<String>,
    pub name: Option<String>,
    pub avatar_url: Option<String>,
}
