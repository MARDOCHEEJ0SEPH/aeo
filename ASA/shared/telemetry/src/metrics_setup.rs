use metrics_exporter_prometheus::PrometheusBuilder;

pub fn init_metrics() -> anyhow::Result<()> {
    PrometheusBuilder::new()
        .install()
        .map_err(|e| anyhow::anyhow!("Failed to install Prometheus exporter: {}", e))?;

    tracing::info!("Metrics initialized");
    Ok(())
}
