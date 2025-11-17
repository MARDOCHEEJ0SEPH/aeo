use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub environment: String,
    pub host: String,
    pub port: u16,
    pub jwt_secret: String,
    pub database_url: String,
    pub redis_url: String,
    pub auth_service_url: String,
    pub content_service_url: String,
    pub analytics_service_url: String,
    pub search_service_url: String,
}

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        Ok(Self {
            environment: env::var("ENVIRONMENT").unwrap_or_else(|_| "development".to_string()),
            host: env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
            port: env::var("PORT")
                .unwrap_or_else(|_| "3000".to_string())
                .parse()?,
            jwt_secret: env::var("JWT_SECRET")
                .expect("JWT_SECRET must be set"),
            database_url: env::var("DATABASE_URL")
                .expect("DATABASE_URL must be set"),
            redis_url: env::var("REDIS_URL")
                .unwrap_or_else(|_| "redis://localhost:6379".to_string()),
            auth_service_url: env::var("AUTH_SERVICE_URL")
                .unwrap_or_else(|_| "http://localhost:3001".to_string()),
            content_service_url: env::var("CONTENT_SERVICE_URL")
                .unwrap_or_else(|_| "http://localhost:3002".to_string()),
            analytics_service_url: env::var("ANALYTICS_SERVICE_URL")
                .unwrap_or_else(|_| "http://localhost:3003".to_string()),
            search_service_url: env::var("SEARCH_SERVICE_URL")
                .unwrap_or_else(|_| "http://localhost:3004".to_string()),
        })
    }
}
