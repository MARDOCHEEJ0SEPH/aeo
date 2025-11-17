use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub redis: RedisConfig,
    pub scylla: ScyllaConfig,
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
pub struct ScyllaConfig {
    pub nodes: Vec<String>,
    pub keyspace: String,
}

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        Ok(Self {
            server: ServerConfig {
                address: std::env::var("ANALYTICS_ADDRESS")
                    .unwrap_or_else(|_| "0.0.0.0:8083".to_string()),
            },
            database: DatabaseConfig {
                url: std::env::var("DATABASE_URL")
                    .expect("DATABASE_URL must be set"),
            },
            redis: RedisConfig {
                url: std::env::var("REDIS_URL")
                    .unwrap_or_else(|_| "redis://localhost:6379".to_string()),
            },
            scylla: ScyllaConfig {
                nodes: std::env::var("SCYLLA_NODES")
                    .unwrap_or_else(|_| "localhost:9042".to_string())
                    .split(',')
                    .map(|s| s.trim().to_string())
                    .collect(),
                keyspace: std::env::var("SCYLLA_KEYSPACE")
                    .unwrap_or_else(|_| "asa_analytics".to_string()),
            },
        })
    }
}
