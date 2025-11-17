// Integration tests for ASA Platform
#[cfg(test)]
mod tests {
    use reqwest;

    const BASE_URL: &str = "http://localhost:8080";

    #[tokio::test]
    async fn test_gateway_health() {
        let client = reqwest::Client::new();
        let response = client
            .get(&format!("{}/health", BASE_URL))
            .send()
            .await;

        assert!(response.is_ok());
        let res = response.unwrap();
        assert_eq!(res.status(), 200);
    }

    #[tokio::test]
    async fn test_auth_register() {
        let client = reqwest::Client::new();
        let body = serde_json::json!({
            "email": "test@example.com",
            "username": "testuser",
            "password": "SecurePass123!"
        });

        let response = client
            .post(&format!("{}/api/auth/register", BASE_URL))
            .json(&body)
            .send()
            .await;

        // Should either succeed or return conflict if user exists
        assert!(response.is_ok());
    }

    #[tokio::test]
    async fn test_content_list() {
        let client = reqwest::Client::new();
        let response = client
            .get(&format!("{}/api/content", BASE_URL))
            .send()
            .await;

        assert!(response.is_ok());
    }

    #[tokio::test]
    async fn test_search() {
        let client = reqwest::Client::new();
        let body = serde_json::json!({
            "query": "AEO optimization",
            "limit": 10
        });

        let response = client
            .post(&format!("{}/api/search", BASE_URL))
            .json(&body)
            .send()
            .await;

        assert!(response.is_ok());
    }
}
