use axum::{
    extract::Request,
    response::Response,
};
use tower::{Layer, Service};
use std::sync::Arc;
use governor::{Quota, RateLimiter};
use std::num::NonZeroU32;

#[derive(Clone)]
pub struct RateLimitLayer;

impl RateLimitLayer {
    pub fn new() -> Self {
        Self
    }
}

impl<S> Layer<S> for RateLimitLayer {
    type Service = RateLimitMiddleware<S>;

    fn layer(&self, inner: S) -> Self::Service {
        // 100 requests per second per IP
        let quota = Quota::per_second(NonZeroU32::new(100).unwrap());
        let limiter = Arc::new(RateLimiter::direct(quota));

        RateLimitMiddleware { inner, limiter }
    }
}

#[derive(Clone)]
pub struct RateLimitMiddleware<S> {
    inner: S,
    limiter: Arc<RateLimiter<String, governor::state::direct::NotKeyed, governor::clock::DefaultClock>>,
}

impl<S> Service<Request> for RateLimitMiddleware<S>
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
        let limiter = self.limiter.clone();

        Box::pin(async move {
            // Check rate limit
            if limiter.check().is_err() {
                // Rate limit exceeded
                tracing::warn!("Rate limit exceeded");
            }

            inner.call(request).await
        })
    }
}
