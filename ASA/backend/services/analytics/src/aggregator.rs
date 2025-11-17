use dashmap::DashMap;
use std::sync::atomic::{AtomicI64, Ordering};
use std::sync::Arc;
use tokio::time::{interval, Duration};

pub struct EventAggregator {
    event_counts: Arc<DashMap<String, AtomicI64>>,
    user_sessions: Arc<DashMap<String, i64>>,
}

impl EventAggregator {
    pub fn new() -> Self {
        Self {
            event_counts: Arc::new(DashMap::new()),
            user_sessions: Arc::new(DashMap::new()),
        }
    }

    pub fn record_event(&self, event_type: &str, session_id: Option<&str>) {
        // Increment event counter
        self.event_counts
            .entry(event_type.to_string())
            .or_insert_with(|| AtomicI64::new(0))
            .fetch_add(1, Ordering::Relaxed);

        // Track session
        if let Some(sid) = session_id {
            let now = chrono::Utc::now().timestamp();
            self.user_sessions.insert(sid.to_string(), now);
        }
    }

    pub fn get_event_counts(&self) -> Vec<(String, i64)> {
        self.event_counts
            .iter()
            .map(|entry| {
                let event_type = entry.key().clone();
                let count = entry.value().load(Ordering::Relaxed);
                (event_type, count)
            })
            .collect()
    }

    pub fn get_active_users(&self) -> i64 {
        let now = chrono::Utc::now().timestamp();
        let five_minutes_ago = now - 300;

        self.user_sessions
            .iter()
            .filter(|entry| *entry.value() > five_minutes_ago)
            .count() as i64
    }

    pub fn reset_counters(&self) {
        for entry in self.event_counts.iter() {
            entry.value().store(0, Ordering::Relaxed);
        }
    }

    pub async fn run_aggregation_loop(&self) {
        let mut ticker = interval(Duration::from_secs(60)); // Aggregate every minute

        loop {
            ticker.tick().await;

            // Get current counts
            let counts = self.get_event_counts();
            let active_users = self.get_active_users();

            // Log metrics
            tracing::info!(
                "Aggregation tick - Active users: {}, Event counts: {:?}",
                active_users,
                counts
            );

            // In production, you would:
            // 1. Store these aggregates in ScyllaDB
            // 2. Update Redis for real-time queries
            // 3. Clean up old session data

            // Clean up old sessions (older than 30 minutes)
            let thirty_minutes_ago = chrono::Utc::now().timestamp() - 1800;
            self.user_sessions.retain(|_, &mut timestamp| timestamp > thirty_minutes_ago);
        }
    }
}
