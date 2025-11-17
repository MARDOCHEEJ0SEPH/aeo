use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub redis: RedisConfig,
    pub meilisearch: MeiliSearchConfig,
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
pub struct MeiliSearchConfig {
    pub url: String,
    pub api_key: String,
}

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        Ok(Self {
            server: ServerConfig {
                address: std::env::var("SEARCH_ADDRESS")
                    .unwrap_or_else(|_| "0.0.0.0:8084".to_string()),
            },
            database: DatabaseConfig {
                url: std::env::var("DATABASE_URL")
                    .expect("DATABASE_URL must be set"),
            },
            redis: RedisConfig {
                url: std::env::var("REDIS_URL")
                    .unwrap_or_else(|_| "redis://localhost:6379".to_string()),
            },
            meilisearch: MeiliSearchConfig {
                url: std::env::var("MEILISEARCH_URL")
                    .unwrap_or_else(|_| "http://localhost:7700".to_string()),
                api_key: std::env::var("MEILISEARCH_API_KEY")
                    .unwrap_or_else(|_| "masterKey".to_string()),
            },
        })
    }
}
