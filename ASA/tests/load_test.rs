// Load testing script
// Run with: cargo test --test load_test --release -- --nocapture

#[cfg(test)]
mod load_tests {
    use std::sync::Arc;
    use std::time::{Duration, Instant};
    use tokio::task;

    #[tokio::test]
    #[ignore] // Ignore by default, run explicitly
    async fn load_test_concurrent_requests() {
        let client = Arc::new(reqwest::Client::new());
        let num_requests = 1000;
        let concurrency = 50;

        let start = Instant::now();
        let mut tasks = vec![];

        for i in 0..num_requests {
            let client = client.clone();
            let task = task::spawn(async move {
                let response = client
                    .get("http://localhost:8080/health")
                    .send()
                    .await;

                match response {
                    Ok(res) => res.status().is_success(),
                    Err(_) => false,
                }
            });

            tasks.push(task);

            // Control concurrency
            if tasks.len() >= concurrency {
                let results: Vec<_> = futures::future::join_all(tasks.drain(..)).await;
                let successes = results.iter().filter(|r| r.as_ref().unwrap_or(&false)).count();
                println!("Batch completed: {}/{} successful", successes, concurrency);
            }
        }

        // Wait for remaining tasks
        let results: Vec<_> = futures::future::join_all(tasks).await;
        let successes = results.iter().filter(|r| r.as_ref().unwrap_or(&false)).count();

        let duration = start.elapsed();
        let rps = num_requests as f64 / duration.as_secs_f64();

        println!("\n===== Load Test Results =====");
        println!("Total Requests: {}", num_requests);
        println!("Successful: {}", successes);
        println!("Failed: {}", num_requests - successes);
        println!("Duration: {:?}", duration);
        println!("Requests/sec: {:.2}", rps);
        println!("============================\n");

        assert!(successes > num_requests * 95 / 100, "Success rate should be > 95%");
    }
}
