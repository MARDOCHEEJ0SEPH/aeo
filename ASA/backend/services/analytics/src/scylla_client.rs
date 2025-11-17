use anyhow::Result;
use scylla::{Session, SessionBuilder};
use std::sync::Arc;

pub struct ScyllaClient {
    session: Arc<Session>,
}

impl ScyllaClient {
    pub async fn new(nodes: &[String]) -> Result<Self> {
        let session = SessionBuilder::new()
            .known_nodes(nodes)
            .build()
            .await?;

        let client = Self {
            session: Arc::new(session),
        };

        client.init_schema().await?;

        Ok(client)
    }

    async fn init_schema(&self) -> Result<()> {
        // Create keyspace
        self.session
            .query(
                "CREATE KEYSPACE IF NOT EXISTS asa_analytics
                 WITH REPLICATION = {
                     'class': 'SimpleStrategy',
                     'replication_factor': 1
                 }",
                &[],
            )
            .await?;

        // Use keyspace
        self.session
            .query("USE asa_analytics", &[])
            .await?;

        // Create events table
        self.session
            .query(
                "CREATE TABLE IF NOT EXISTS events (
                    id uuid,
                    event_type text,
                    user_id uuid,
                    session_id text,
                    properties text,
                    created_at timestamp,
                    PRIMARY KEY ((event_type), created_at, id)
                ) WITH CLUSTERING ORDER BY (created_at DESC)",
                &[],
            )
            .await?;

        // Create metrics rollups table
        self.session
            .query(
                "CREATE TABLE IF NOT EXISTS metrics_rollups (
                    metric_name text,
                    time_bucket timestamp,
                    value double,
                    count bigint,
                    PRIMARY KEY ((metric_name), time_bucket)
                ) WITH CLUSTERING ORDER BY (time_bucket DESC)",
                &[],
            )
            .await?;

        tracing::info!("ScyllaDB schema initialized");

        Ok(())
    }

    pub fn session(&self) -> &Session {
        &self.session
    }
}
