use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub redis: RedisConfig,
    pub jwt: JwtConfig,
    pub webauthn: WebAuthnConfig,
    pub oauth: OAuthConfig,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ServerConfig {
    pub address: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct DatabaseConfig {
    pub url: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct RedisConfig {
    pub url: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct JwtConfig {
    pub secret: String,
    pub access_token_expiry: i64,  // seconds
    pub refresh_token_expiry: i64, // seconds
}

#[derive(Debug, Clone, Deserialize)]
pub struct WebAuthnConfig {
    pub rp_id: String,
    pub rp_name: String,
    pub rp_origin: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct OAuthConfig {
    pub google: OAuthProvider,
    pub github: OAuthProvider,
}

#[derive(Debug, Clone, Deserialize)]
pub struct OAuthProvider {
    pub client_id: String,
    pub client_secret: String,
    pub redirect_uri: String,
}

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        Ok(Self {
            server: ServerConfig {
                address: std::env::var("AUTH_ADDRESS")
                    .unwrap_or_else(|_| "0.0.0.0:8081".to_string()),
            },
            database: DatabaseConfig {
                url: std::env::var("DATABASE_URL")
                    .expect("DATABASE_URL must be set"),
            },
            redis: RedisConfig {
                url: std::env::var("REDIS_URL")
                    .unwrap_or_else(|_| "redis://localhost:6379".to_string()),
            },
            jwt: JwtConfig {
                secret: std::env::var("JWT_SECRET")
                    .expect("JWT_SECRET must be set"),
                access_token_expiry: std::env::var("JWT_ACCESS_EXPIRY")
                    .unwrap_or_else(|_| "900".to_string())
                    .parse()?,
                refresh_token_expiry: std::env::var("JWT_REFRESH_EXPIRY")
                    .unwrap_or_else(|_| "604800".to_string())
                    .parse()?,
            },
            webauthn: WebAuthnConfig {
                rp_id: std::env::var("WEBAUTHN_RP_ID")
                    .unwrap_or_else(|_| "localhost".to_string()),
                rp_name: std::env::var("WEBAUTHN_RP_NAME")
                    .unwrap_or_else(|_| "ASA Platform".to_string()),
                rp_origin: std::env::var("WEBAUTHN_RP_ORIGIN")
                    .unwrap_or_else(|_| "http://localhost:8080".to_string()),
            },
            oauth: OAuthConfig {
                google: OAuthProvider {
                    client_id: std::env::var("GOOGLE_CLIENT_ID")
                        .unwrap_or_default(),
                    client_secret: std::env::var("GOOGLE_CLIENT_SECRET")
                        .unwrap_or_default(),
                    redirect_uri: std::env::var("GOOGLE_REDIRECT_URI")
                        .unwrap_or_else(|_| "http://localhost:8081/oauth/google/callback".to_string()),
                },
                github: OAuthProvider {
                    client_id: std::env::var("GITHUB_CLIENT_ID")
                        .unwrap_or_default(),
                    client_secret: std::env::var("GITHUB_CLIENT_SECRET")
                        .unwrap_or_default(),
                    redirect_uri: std::env::var("GITHUB_REDIRECT_URI")
                        .unwrap_or_else(|_| "http://localhost:8081/oauth/github/callback".to_string()),
                },
            },
        })
    }
}
