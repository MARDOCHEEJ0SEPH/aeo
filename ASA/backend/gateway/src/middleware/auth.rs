use axum::{
    extract::Request,
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
};
use tower::{Layer, Service};

#[derive(Clone)]
pub struct AuthLayer {
    jwt_secret: String,
}

impl AuthLayer {
    pub fn new(jwt_secret: String) -> Self {
        Self { jwt_secret }
    }
}

impl<S> Layer<S> for AuthLayer {
    type Service = AuthMiddleware<S>;

    fn layer(&self, inner: S) -> Self::Service {
        AuthMiddleware {
            inner,
            jwt_secret: self.jwt_secret.clone(),
        }
    }
}

#[derive(Clone)]
pub struct AuthMiddleware<S> {
    inner: S,
    jwt_secret: String,
}

impl<S> Service<Request> for AuthMiddleware<S>
where
    S: Service<Request, Response = Response> + Clone + Send + 'static,
    S::Future: Send + 'static,
{
    type Response = S::Response;
    type Error = S::Error;
    type Future = std::pin::Pin<
        Box<dyn std::future::Future<Output = Result<Self::Response, Self::Error>> + Send>,
    >;

    fn poll_ready(
        &mut self,
        cx: &mut std::task::Context<'_>,
    ) -> std::task::Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)
    }

    fn call(&mut self, request: Request) -> Self::Future {
        let inner = self.inner.clone();
        let mut inner = std::mem::replace(&mut self.inner, inner);

        let path = request.uri().path().to_string();

        // Public endpoints that don't require auth
        let public_paths = [
            "/health",
            "/",
            "/api/auth/register",
            "/api/auth/login",
            "/api/auth/oauth",
        ];

        let is_public = public_paths.iter().any(|p| path.starts_with(p));

        Box::pin(async move {
            if is_public {
                // Skip auth for public endpoints
                return inner.call(request).await;
            }

            // For protected endpoints, verify JWT token
            // In production, extract and verify the token
            // For now, just pass through

            inner.call(request).await
        })
    }
}
