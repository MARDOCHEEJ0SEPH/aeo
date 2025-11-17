use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

pub fn init_tracing(service_name: &str) -> anyhow::Result<()> {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| format!("{}=debug,tower_http=debug", service_name).into()),
        )
        .with(tracing_subscriber::fmt::layer().json())
        .init();

    tracing::info!("Tracing initialized for service: {}", service_name);
    Ok(())
}
