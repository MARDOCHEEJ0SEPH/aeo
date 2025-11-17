use sqlx::postgres::PgPoolOptions;
use std::fs;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://asa_user:asa_password@localhost:5432/asa".to_string());

    println!("🔌 Connecting to database...");
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    println!("📋 Running migrations...");

    // Run migrations in order
    let migrations = vec![
        "001_initial.sql",
        "002_aeo_tables.sql",
        "003_analytics.sql",
        "004_indexes.sql",
    ];

    for migration in migrations {
        println!("  ⚙️  Applying {}...", migration);
        let sql = fs::read_to_string(format!("migrations/{}", migration))?;
        sqlx::raw_sql(&sql).execute(&pool).await?;
        println!("  ✅ {} applied", migration);
    }

    println!("✅ All migrations completed successfully!");

    Ok(())
}
