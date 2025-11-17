use asa_database::PostgresPool;
use chrono::{DateTime, Utc};
use sqlx::Row;
use uuid::Uuid;

pub struct AnalyticsRepository {
    db: PostgresPool,
}

impl AnalyticsRepository {
    pub fn new(db: PostgresPool) -> Self {
        Self { db }
    }

    // Event tracking
    pub async fn create_event(
        &self,
        event_type: &str,
        user_id: Option<Uuid>,
        properties: serde_json::Value,
    ) -> anyhow::Result<Uuid> {
        let row = sqlx::query(
            r#"
            INSERT INTO analytics_events (event_type, user_id, properties)
            VALUES ($1, $2, $3)
            RETURNING id
            "#,
        )
        .bind(event_type)
        .bind(user_id)
        .bind(properties)
        .fetch_one(self.db.pool())
        .await?;

        Ok(row.get("id"))
    }

    // Citation tracking
    pub async fn track_citation(
        &self,
        platform: &str,
        content_id: Option<Uuid>,
        query: &str,
        cited: bool,
        citation_text: Option<&str>,
        position: Option<i32>,
    ) -> anyhow::Result<Uuid> {
        let row = sqlx::query(
            r#"
            INSERT INTO citations (platform, content_id, query, cited, citation_text, position)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
            "#,
        )
        .bind(platform)
        .bind(content_id)
        .bind(query)
        .bind(cited)
        .bind(citation_text)
        .bind(position)
        .fetch_one(self.db.pool())
        .await?;

        Ok(row.get("id"))
    }

    pub async fn get_citations_for_content(
        &self,
        content_id: Uuid,
    ) -> anyhow::Result<Vec<Citation>> {
        let rows = sqlx::query(
            r#"
            SELECT id, platform, content_id, query, cited, citation_text, position, created_at
            FROM citations
            WHERE content_id = $1
            ORDER BY created_at DESC
            "#,
        )
        .bind(content_id)
        .fetch_all(self.db.pool())
        .await?;

        Ok(rows.into_iter().map(|row| Citation {
            id: row.get("id"),
            platform: row.get("platform"),
            content_id: row.get("content_id"),
            query: row.get("query"),
            cited: row.get("cited"),
            citation_text: row.get("citation_text"),
            position: row.get("position"),
            created_at: row.get("created_at"),
        }).collect())
    }

    pub async fn get_citation_stats(
        &self,
        content_id: Uuid,
    ) -> anyhow::Result<CitationStats> {
        let row = sqlx::query(
            r#"
            SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE cited = true) as cited_count,
                AVG(position) FILTER (WHERE cited = true) as avg_position
            FROM citations
            WHERE content_id = $1
            "#,
        )
        .bind(content_id)
        .fetch_one(self.db.pool())
        .await?;

        let total: i64 = row.get("total");
        let cited_count: i64 = row.get("cited_count");
        let avg_position: Option<f64> = row.try_get("avg_position").ok();

        let citation_rate = if total > 0 {
            (cited_count as f64 / total as f64) * 100.0
        } else {
            0.0
        };

        Ok(CitationStats {
            total_citations: cited_count,
            total_queries: total,
            citation_rate,
            avg_position: avg_position.unwrap_or(0.0),
        })
    }

    pub async fn get_platform_breakdown(
        &self,
        content_id: Uuid,
    ) -> anyhow::Result<Vec<PlatformStats>> {
        let rows = sqlx::query(
            r#"
            SELECT
                platform,
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE cited = true) as cited_count,
                AVG(position) FILTER (WHERE cited = true) as avg_position
            FROM citations
            WHERE content_id = $1
            GROUP BY platform
            "#,
        )
        .bind(content_id)
        .fetch_all(self.db.pool())
        .await?;

        Ok(rows.into_iter().map(|row| {
            let total: i64 = row.get("total");
            let cited_count: i64 = row.get("cited_count");
            let avg_position: Option<f64> = row.try_get("avg_position").ok();

            PlatformStats {
                platform: row.get("platform"),
                citations: cited_count,
                total_queries: total,
                citation_rate: if total > 0 {
                    (cited_count as f64 / total as f64) * 100.0
                } else {
                    0.0
                },
                avg_position: avg_position.unwrap_or(0.0),
            }
        }).collect())
    }

    pub async fn get_top_queries(
        &self,
        content_id: Uuid,
        limit: i32,
    ) -> anyhow::Result<Vec<QueryStats>> {
        let rows = sqlx::query(
            r#"
            SELECT
                query,
                COUNT(*) FILTER (WHERE cited = true) as citation_count,
                AVG(position) FILTER (WHERE cited = true) as avg_position
            FROM citations
            WHERE content_id = $1 AND cited = true
            GROUP BY query
            ORDER BY citation_count DESC
            LIMIT $2
            "#,
        )
        .bind(content_id)
        .bind(limit)
        .fetch_all(self.db.pool())
        .await?;

        Ok(rows.into_iter().map(|row| QueryStats {
            query: row.get("query"),
            citation_count: row.get("citation_count"),
            avg_position: row.try_get("avg_position").ok().unwrap_or(0.0),
        }).collect())
    }
}

// Models
pub struct Citation {
    pub id: Uuid,
    pub platform: String,
    pub content_id: Option<Uuid>,
    pub query: String,
    pub cited: bool,
    pub citation_text: Option<String>,
    pub position: Option<i32>,
    pub created_at: DateTime<Utc>,
}

pub struct CitationStats {
    pub total_citations: i64,
    pub total_queries: i64,
    pub citation_rate: f64,
    pub avg_position: f64,
}

pub struct PlatformStats {
    pub platform: String,
    pub citations: i64,
    pub total_queries: i64,
    pub citation_rate: f64,
    pub avg_position: f64,
}

pub struct QueryStats {
    pub query: String,
    pub citation_count: i64,
    pub avg_position: f64,
}
