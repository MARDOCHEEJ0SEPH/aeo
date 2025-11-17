use asa_database::PostgresPool;
use chrono::{DateTime, Utc};
use sqlx::Row;
use uuid::Uuid;

pub struct Content {
    pub id: Uuid,
    pub title: String,
    pub slug: String,
    pub body: String,
    pub content_type: String,
    pub status: String,
    pub author_id: Uuid,
    pub metadata: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub published_at: Option<DateTime<Utc>>,
}

pub struct ContentRepository {
    db: PostgresPool,
}

impl ContentRepository {
    pub fn new(db: PostgresPool) -> Self {
        Self { db }
    }

    pub async fn create(
        &self,
        title: &str,
        slug: &str,
        body: &str,
        content_type: &str,
        author_id: Uuid,
        metadata: Option<serde_json::Value>,
    ) -> anyhow::Result<Content> {
        let row = sqlx::query(
            r#"
            INSERT INTO content (title, slug, body, content_type, status, author_id, metadata)
            VALUES ($1, $2, $3, $4, 'draft', $5, $6)
            RETURNING id, title, slug, body, content_type, status, author_id, metadata,
                      created_at, updated_at, published_at
            "#,
        )
        .bind(title)
        .bind(slug)
        .bind(body)
        .bind(content_type)
        .bind(author_id)
        .bind(metadata)
        .fetch_one(self.db.pool())
        .await?;

        Ok(self.row_to_content(row))
    }

    pub async fn find_by_id(&self, id: Uuid) -> anyhow::Result<Option<Content>> {
        let result = sqlx::query(
            r#"
            SELECT id, title, slug, body, content_type, status, author_id, metadata,
                   created_at, updated_at, published_at
            FROM content
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(self.db.pool())
        .await?;

        Ok(result.map(|row| self.row_to_content(row)))
    }

    pub async fn find_by_slug(&self, slug: &str) -> anyhow::Result<Option<Content>> {
        let result = sqlx::query(
            r#"
            SELECT id, title, slug, body, content_type, status, author_id, metadata,
                   created_at, updated_at, published_at
            FROM content
            WHERE slug = $1
            "#,
        )
        .bind(slug)
        .fetch_optional(self.db.pool())
        .await?;

        Ok(result.map(|row| self.row_to_content(row)))
    }

    pub async fn list(
        &self,
        page: i64,
        page_size: i64,
        status_filter: Option<&str>,
    ) -> anyhow::Result<(Vec<Content>, i64)> {
        let offset = (page - 1) * page_size;

        let query = if let Some(status) = status_filter {
            sqlx::query(
                r#"
                SELECT id, title, slug, body, content_type, status, author_id, metadata,
                       created_at, updated_at, published_at
                FROM content
                WHERE status = $1
                ORDER BY created_at DESC
                LIMIT $2 OFFSET $3
                "#,
            )
            .bind(status)
            .bind(page_size)
            .bind(offset)
        } else {
            sqlx::query(
                r#"
                SELECT id, title, slug, body, content_type, status, author_id, metadata,
                       created_at, updated_at, published_at
                FROM content
                ORDER BY created_at DESC
                LIMIT $1 OFFSET $2
                "#,
            )
            .bind(page_size)
            .bind(offset)
        };

        let rows = query.fetch_all(self.db.pool()).await?;
        let items: Vec<Content> = rows.into_iter().map(|row| self.row_to_content(row)).collect();

        // Get total count
        let count_query = if let Some(status) = status_filter {
            sqlx::query_scalar("SELECT COUNT(*) FROM content WHERE status = $1")
                .bind(status)
        } else {
            sqlx::query_scalar("SELECT COUNT(*) FROM content")
        };

        let total: i64 = count_query.fetch_one(self.db.pool()).await?;

        Ok((items, total))
    }

    pub async fn update(
        &self,
        id: Uuid,
        title: Option<&str>,
        slug: Option<&str>,
        body: Option<&str>,
        content_type: Option<&str>,
        metadata: Option<serde_json::Value>,
    ) -> anyhow::Result<Content> {
        // Build dynamic update query
        let mut query = String::from("UPDATE content SET updated_at = NOW()");
        let mut bind_count = 1;

        if title.is_some() {
            query.push_str(&format!(", title = ${}", bind_count));
            bind_count += 1;
        }
        if slug.is_some() {
            query.push_str(&format!(", slug = ${}", bind_count));
            bind_count += 1;
        }
        if body.is_some() {
            query.push_str(&format!(", body = ${}", bind_count));
            bind_count += 1;
        }
        if content_type.is_some() {
            query.push_str(&format!(", content_type = ${}", bind_count));
            bind_count += 1;
        }
        if metadata.is_some() {
            query.push_str(&format!(", metadata = ${}", bind_count));
            bind_count += 1;
        }

        query.push_str(&format!(" WHERE id = ${}", bind_count));
        query.push_str(" RETURNING id, title, slug, body, content_type, status, author_id, metadata, created_at, updated_at, published_at");

        let mut sql_query = sqlx::query(&query);

        if let Some(t) = title {
            sql_query = sql_query.bind(t);
        }
        if let Some(s) = slug {
            sql_query = sql_query.bind(s);
        }
        if let Some(b) = body {
            sql_query = sql_query.bind(b);
        }
        if let Some(ct) = content_type {
            sql_query = sql_query.bind(ct);
        }
        if let Some(m) = metadata {
            sql_query = sql_query.bind(m);
        }

        sql_query = sql_query.bind(id);

        let row = sql_query.fetch_one(self.db.pool()).await?;
        Ok(self.row_to_content(row))
    }

    pub async fn delete(&self, id: Uuid) -> anyhow::Result<()> {
        sqlx::query("DELETE FROM content WHERE id = $1")
            .bind(id)
            .execute(self.db.pool())
            .await?;
        Ok(())
    }

    pub async fn publish(&self, id: Uuid) -> anyhow::Result<Content> {
        let row = sqlx::query(
            r#"
            UPDATE content
            SET status = 'published', published_at = NOW()
            WHERE id = $1
            RETURNING id, title, slug, body, content_type, status, author_id, metadata,
                      created_at, updated_at, published_at
            "#,
        )
        .bind(id)
        .fetch_one(self.db.pool())
        .await?;

        Ok(self.row_to_content(row))
    }

    pub async fn unpublish(&self, id: Uuid) -> anyhow::Result<Content> {
        let row = sqlx::query(
            r#"
            UPDATE content
            SET status = 'draft', published_at = NULL
            WHERE id = $1
            RETURNING id, title, slug, body, content_type, status, author_id, metadata,
                      created_at, updated_at, published_at
            "#,
        )
        .bind(id)
        .fetch_one(self.db.pool())
        .await?;

        Ok(self.row_to_content(row))
    }

    fn row_to_content(&self, row: sqlx::postgres::PgRow) -> Content {
        Content {
            id: row.get("id"),
            title: row.get("title"),
            slug: row.get("slug"),
            body: row.get("body"),
            content_type: row.get("content_type"),
            status: row.get("status"),
            author_id: row.get("author_id"),
            metadata: row.get("metadata"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
            published_at: row.get("published_at"),
        }
    }
}
