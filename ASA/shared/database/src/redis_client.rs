use redis::{Client, aio::ConnectionManager};

pub struct RedisClient {
    client: Client,
    connection: ConnectionManager,
}

impl RedisClient {
    pub async fn new(redis_url: &str) -> anyhow::Result<Self> {
        let client = Client::open(redis_url)?;
        let connection = ConnectionManager::new(client.clone()).await?;

        Ok(Self { client, connection })
    }

    pub fn connection(&self) -> &ConnectionManager {
        &self.connection
    }

    pub async fn health_check(&self) -> anyhow::Result<()> {
        redis::cmd("PING")
            .query_async(&mut self.connection.clone())
            .await?;
        Ok(())
    }
}
