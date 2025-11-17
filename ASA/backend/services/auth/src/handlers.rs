use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Json, Redirect},
};
use std::sync::Arc;
use webauthn_rs::Webauthn;

use crate::{
    config::Config,
    jwt::{hash_password, verify_password, JwtService},
    models::*,
    oauth,
    repository::{User, UserRepository},
};
use asa_database::{PostgresPool, RedisClient};

#[derive(Clone)]
pub struct AppState {
    pub db_pool: PostgresPool,
    pub redis_client: RedisClient,
    pub webauthn: Arc<Webauthn>,
    pub config: Config,
}

// Health check
pub async fn health_check() -> impl IntoResponse {
    Json(serde_json::json!({
        "status": "healthy",
        "service": "auth"
    }))
}

// Register new user
pub async fn register(
    State(state): State<AppState>,
    Json(payload): Json<RegisterRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    let repo = UserRepository::new(state.db_pool.clone());

    // Check if user already exists
    if repo.find_by_email(&payload.email).await?.is_some() {
        return Err(AppError::Conflict("Email already registered".to_string()));
    }

    if repo.find_by_username(&payload.username).await?.is_some() {
        return Err(AppError::Conflict("Username already taken".to_string()));
    }

    // Hash password
    let password_hash = hash_password(&payload.password)?;

    // Create user
    let user = repo
        .create_user(&payload.email, &payload.username, &password_hash)
        .await?;

    // Generate tokens
    let jwt_service = JwtService::new(
        state.config.jwt.secret.clone(),
        state.config.jwt.access_token_expiry,
        state.config.jwt.refresh_token_expiry,
    );

    let access_token = jwt_service.generate_access_token(
        user.id,
        user.email.clone(),
        user.username.clone(),
        user.role.clone(),
    )?;

    let refresh_token = jwt_service.generate_refresh_token(
        user.id,
        user.email.clone(),
        user.username.clone(),
        user.role.clone(),
    )?;

    tracing::info!("User registered: {}", user.email);

    Ok(Json(AuthResponse {
        access_token,
        refresh_token,
        user: UserInfo {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
        },
    }))
}

// Login
pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    let repo = UserRepository::new(state.db_pool.clone());

    // Find user
    let user = repo
        .find_by_email(&payload.email)
        .await?
        .ok_or_else(|| AppError::Unauthorized("Invalid credentials".to_string()))?;

    // Verify password
    let password_hash = user
        .password_hash
        .as_ref()
        .ok_or_else(|| AppError::Unauthorized("OAuth user - use OAuth login".to_string()))?;

    if !verify_password(&payload.password, password_hash)? {
        return Err(AppError::Unauthorized("Invalid credentials".to_string()));
    }

    // Generate tokens
    let jwt_service = JwtService::new(
        state.config.jwt.secret.clone(),
        state.config.jwt.access_token_expiry,
        state.config.jwt.refresh_token_expiry,
    );

    let access_token = jwt_service.generate_access_token(
        user.id,
        user.email.clone(),
        user.username.clone(),
        user.role.clone(),
    )?;

    let refresh_token = jwt_service.generate_refresh_token(
        user.id,
        user.email.clone(),
        user.username.clone(),
        user.role.clone(),
    )?;

    tracing::info!("User logged in: {}", user.email);

    Ok(Json(AuthResponse {
        access_token,
        refresh_token,
        user: UserInfo {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
        },
    }))
}

// Refresh access token
pub async fn refresh_token(
    State(state): State<AppState>,
    Json(payload): Json<RefreshTokenRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    let jwt_service = JwtService::new(
        state.config.jwt.secret.clone(),
        state.config.jwt.access_token_expiry,
        state.config.jwt.refresh_token_expiry,
    );

    // Verify refresh token
    let claims = jwt_service.verify_token(&payload.refresh_token)?;

    if claims.token_type != "refresh" {
        return Err(AppError::Unauthorized("Invalid token type".to_string()));
    }

    let user_id = claims.sub.parse()?;

    // Get user from DB to ensure they still exist
    let repo = UserRepository::new(state.db_pool.clone());
    let user = repo
        .find_by_id(user_id)
        .await?
        .ok_or_else(|| AppError::Unauthorized("User not found".to_string()))?;

    // Generate new tokens
    let access_token = jwt_service.generate_access_token(
        user.id,
        user.email.clone(),
        user.username.clone(),
        user.role.clone(),
    )?;

    let refresh_token = jwt_service.generate_refresh_token(
        user.id,
        user.email.clone(),
        user.username.clone(),
        user.role.clone(),
    )?;

    Ok(Json(AuthResponse {
        access_token,
        refresh_token,
        user: UserInfo {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
        },
    }))
}

// Verify token (for gateway/other services)
pub async fn verify_token(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
) -> Result<Json<VerifyTokenResponse>, AppError> {
    let token = headers
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
        .ok_or_else(|| AppError::Unauthorized("Missing token".to_string()))?;

    let jwt_service = JwtService::new(
        state.config.jwt.secret.clone(),
        state.config.jwt.access_token_expiry,
        state.config.jwt.refresh_token_expiry,
    );

    match jwt_service.verify_token(token) {
        Ok(claims) => {
            let user_id = claims.sub.parse()?;
            Ok(Json(VerifyTokenResponse {
                valid: true,
                user: Some(UserInfo {
                    id: user_id,
                    email: claims.email,
                    username: claims.username,
                    role: claims.role,
                }),
            }))
        }
        Err(_) => Ok(Json(VerifyTokenResponse {
            valid: false,
            user: None,
        })),
    }
}

// Logout (invalidate refresh token in Redis)
pub async fn logout(
    State(_state): State<AppState>,
    Json(_payload): Json<RefreshTokenRequest>,
) -> Result<StatusCode, AppError> {
    // In a production system, you'd store refresh tokens in Redis
    // and remove them here to invalidate them
    tracing::info!("User logged out");
    Ok(StatusCode::NO_CONTENT)
}

// WebAuthn Registration Start
pub async fn webauthn_register_start(
    State(_state): State<AppState>,
    Json(_payload): Json<WebAuthnRegisterStartRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    // WebAuthn registration start logic
    // This would use the webauthn-rs library to generate a challenge
    Ok(Json(serde_json::json!({
        "message": "WebAuthn registration start - implementation pending"
    })))
}

// WebAuthn Registration Finish
pub async fn webauthn_register_finish(
    State(_state): State<AppState>,
    Json(_payload): Json<WebAuthnRegisterFinishRequest>,
) -> Result<StatusCode, AppError> {
    // WebAuthn registration finish logic
    Ok(StatusCode::OK)
}

// WebAuthn Login Start
pub async fn webauthn_login_start(
    State(_state): State<AppState>,
    Json(_payload): Json<WebAuthnLoginStartRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    // WebAuthn login start logic
    Ok(Json(serde_json::json!({
        "message": "WebAuthn login start - implementation pending"
    })))
}

// WebAuthn Login Finish
pub async fn webauthn_login_finish(
    State(_state): State<AppState>,
    Json(_payload): Json<WebAuthnLoginFinishRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    // WebAuthn login finish logic
    Err(AppError::NotImplemented(
        "WebAuthn login not yet implemented".to_string(),
    ))
}

// OAuth Authorization
pub async fn oauth_authorize(
    State(state): State<AppState>,
    Path(provider): Path<String>,
) -> Result<Redirect, AppError> {
    let auth_url = match provider.as_str() {
        "google" => oauth::google::get_auth_url(&state.config.oauth.google)?,
        "github" => oauth::github::get_auth_url(&state.config.oauth.github)?,
        _ => return Err(AppError::BadRequest("Unknown OAuth provider".to_string())),
    };

    Ok(Redirect::temporary(&auth_url))
}

// OAuth Callback
pub async fn oauth_callback(
    State(state): State<AppState>,
    Path(provider): Path<String>,
    Query(query): Query<OAuthCallbackQuery>,
) -> Result<Redirect, AppError> {
    let repo = UserRepository::new(state.db_pool.clone());

    let user = match provider.as_str() {
        "google" => {
            let user_info = oauth::google::exchange_code(
                &state.config.oauth.google,
                &query.code,
            )
            .await?;

            // Find or create user
            match repo.find_oauth_user("google", &user_info.id).await? {
                Some(user) => user,
                None => {
                    repo.create_oauth_user(
                        &user_info.email,
                        &user_info.name,
                        "google",
                        &user_info.id,
                    )
                    .await?
                }
            }
        }
        "github" => {
            let user_info = oauth::github::exchange_code(
                &state.config.oauth.github,
                &query.code,
            )
            .await?;

            let email = user_info
                .email
                .ok_or_else(|| AppError::BadRequest("GitHub email not public".to_string()))?;

            // Find or create user
            match repo
                .find_oauth_user("github", &user_info.id.to_string())
                .await?
            {
                Some(user) => user,
                None => {
                    repo.create_oauth_user(
                        &email,
                        &user_info.login,
                        "github",
                        &user_info.id.to_string(),
                    )
                    .await?
                }
            }
        }
        _ => return Err(AppError::BadRequest("Unknown OAuth provider".to_string())),
    };

    // Generate tokens
    let jwt_service = JwtService::new(
        state.config.jwt.secret.clone(),
        state.config.jwt.access_token_expiry,
        state.config.jwt.refresh_token_expiry,
    );

    let access_token = jwt_service.generate_access_token(
        user.id,
        user.email.clone(),
        user.username.clone(),
        user.role.clone(),
    )?;

    let refresh_token = jwt_service.generate_refresh_token(
        user.id,
        user.email,
        user.username,
        user.role,
    )?;

    // Redirect to frontend with tokens
    let redirect_url = format!(
        "http://localhost:8080/auth/callback?access_token={}&refresh_token={}",
        access_token, refresh_token
    );

    Ok(Redirect::temporary(&redirect_url))
}

// Error handling
#[derive(Debug)]
pub enum AppError {
    BadRequest(String),
    Unauthorized(String),
    Conflict(String),
    NotImplemented(String),
    Internal(anyhow::Error),
}

impl From<anyhow::Error> for AppError {
    fn from(err: anyhow::Error) -> Self {
        AppError::Internal(err)
    }
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        AppError::Internal(err.into())
    }
}

impl From<uuid::Error> for AppError {
    fn from(err: uuid::Error) -> Self {
        AppError::Internal(err.into())
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        let (status, message) = match self {
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg),
            AppError::Unauthorized(msg) => (StatusCode::UNAUTHORIZED, msg),
            AppError::Conflict(msg) => (StatusCode::CONFLICT, msg),
            AppError::NotImplemented(msg) => (StatusCode::NOT_IMPLEMENTED, msg),
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
