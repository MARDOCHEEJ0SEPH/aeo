use asa_database::PostgresPool;
use sqlx::Row;
use uuid::Uuid;

pub struct User {
    pub id: Uuid,
    pub email: String,
    pub username: String,
    pub password_hash: Option<String>,
    pub role: String,
}

pub struct UserRepository {
    db: PostgresPool,
}

impl UserRepository {
    pub fn new(db: PostgresPool) -> Self {
        Self { db }
    }

    pub async fn create_user(
        &self,
        email: &str,
        username: &str,
        password_hash: &str,
    ) -> anyhow::Result<User> {
        let row = sqlx::query(
            r#"
            INSERT INTO users (email, username, password_hash, role)
            VALUES ($1, $2, $3, 'user')
            RETURNING id, email, username, password_hash, role
            "#,
        )
        .bind(email)
        .bind(username)
        .bind(password_hash)
        .fetch_one(self.db.pool())
        .await?;

        Ok(User {
            id: row.get("id"),
            email: row.get("email"),
            username: row.get("username"),
            password_hash: row.get("password_hash"),
            role: row.get("role"),
        })
    }

    pub async fn find_by_email(&self, email: &str) -> anyhow::Result<Option<User>> {
        let result = sqlx::query(
            r#"
            SELECT id, email, username, password_hash, role
            FROM users
            WHERE email = $1
            "#,
        )
        .bind(email)
        .fetch_optional(self.db.pool())
        .await?;

        Ok(result.map(|row| User {
            id: row.get("id"),
            email: row.get("email"),
            username: row.get("username"),
            password_hash: row.get("password_hash"),
            role: row.get("role"),
        }))
    }

    pub async fn find_by_username(&self, username: &str) -> anyhow::Result<Option<User>> {
        let result = sqlx::query(
            r#"
            SELECT id, email, username, password_hash, role
            FROM users
            WHERE username = $1
            "#,
        )
        .bind(username)
        .fetch_optional(self.db.pool())
        .await?;

        Ok(result.map(|row| User {
            id: row.get("id"),
            email: row.get("email"),
            username: row.get("username"),
            password_hash: row.get("password_hash"),
            role: row.get("role"),
        }))
    }

    pub async fn find_by_id(&self, id: Uuid) -> anyhow::Result<Option<User>> {
        let result = sqlx::query(
            r#"
            SELECT id, email, username, password_hash, role
            FROM users
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(self.db.pool())
        .await?;

        Ok(result.map(|row| User {
            id: row.get("id"),
            email: row.get("email"),
            username: row.get("username"),
            password_hash: row.get("password_hash"),
            role: row.get("role"),
        }))
    }

    pub async fn create_oauth_user(
        &self,
        email: &str,
        username: &str,
        provider: &str,
        provider_id: &str,
    ) -> anyhow::Result<User> {
        let mut tx = self.db.pool().begin().await?;

        // Create user without password
        let user_row = sqlx::query(
            r#"
            INSERT INTO users (email, username, role)
            VALUES ($1, $2, 'user')
            RETURNING id, email, username, password_hash, role
            "#,
        )
        .bind(email)
        .bind(username)
        .fetch_one(&mut *tx)
        .await?;

        let user_id: Uuid = user_row.get("id");

        // Store OAuth connection
        sqlx::query(
            r#"
            INSERT INTO oauth_connections (user_id, provider, provider_user_id)
            VALUES ($1, $2, $3)
            "#,
        )
        .bind(user_id)
        .bind(provider)
        .bind(provider_id)
        .execute(&mut *tx)
        .await?;

        tx.commit().await?;

        Ok(User {
            id: user_id,
            email: user_row.get("email"),
            username: user_row.get("username"),
            password_hash: None,
            role: user_row.get("role"),
        })
    }

    pub async fn find_oauth_user(
        &self,
        provider: &str,
        provider_id: &str,
    ) -> anyhow::Result<Option<User>> {
        let result = sqlx::query(
            r#"
            SELECT u.id, u.email, u.username, u.password_hash, u.role
            FROM users u
            INNER JOIN oauth_connections oc ON u.id = oc.user_id
            WHERE oc.provider = $1 AND oc.provider_user_id = $2
            "#,
        )
        .bind(provider)
        .bind(provider_id)
        .fetch_optional(self.db.pool())
        .await?;

        Ok(result.map(|row| User {
            id: row.get("id"),
            email: row.get("email"),
            username: row.get("username"),
            password_hash: row.get("password_hash"),
            role: row.get("role"),
        }))
    }
}
