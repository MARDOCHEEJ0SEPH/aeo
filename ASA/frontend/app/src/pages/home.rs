use leptos::*;
use asa_models::aeo::AIPlatform;

#[component]
pub fn Home() -> impl IntoView {
    let (platform_stats, set_platform_stats) = create_signal(vec![
        ("ChatGPT", 85.5, "⬆"),
        ("Claude", 92.3, "⬆"),
        ("Perplexity", 78.9, "➡"),
        ("Gemini", 81.2, "⬆"),
        ("Bing AI", 73.4, "⬇"),
    ]);

    view! {
        <div class="home-container">
            <section class="hero">
                <h1>"ASA - Autonomous Search Architecture"</h1>
                <p class="subtitle">
                    "Full-Stack Rust Platform with Native AEO/LLMO Optimization"
                </p>
                <div class="hero-buttons">
                    <a href="/aeo" class="btn btn-primary">"Start Optimizing"</a>
                    <a href="/content" class="btn btn-secondary">"View Content"</a>
                </div>
            </section>

            <section class="features">
                <h2>"🚀 Built with Rust for Maximum Performance"</h2>
                <div class="feature-grid">
                    <div class="feature-card">
                        <div class="feature-icon">"⚡"</div>
                        <h3>"Blazing Fast"</h3>
                        <p>"Sub-10ms API latencies | <200KB WASM bundle"</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">"🛡️"</div>
                        <h3>"Memory Safe"</h3>
                        <p>"Zero runtime errors | Compile-time guarantees"</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">"🤖"</div>
                        <h3>"AEO Native"</h3>
                        <p>"Optimized for all 5 major AI platforms"</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">"📊"</div>
                        <h3>"Real-time Analytics"</h3>
                        <p>"Citation tracking | Performance metrics"</p>
                    </div>
                </div>
            </section>

            <section class="platform-stats">
                <h2>"🎯 AI Platform Performance"</h2>
                <div class="stats-grid">
                    {move || platform_stats.get().iter().map(|(name, score, trend)| {
                        view! {
                            <div class="stat-card">
                                <div class="stat-platform">{*name}</div>
                                <div class="stat-score">{format!("{:.1}%", score)}</div>
                                <div class="stat-trend">{*trend}</div>
                            </div>
                        }
                    }).collect::<Vec<_>>()}
                </div>
            </section>

            <section class="schema-showcase">
                <h2>"📋 Schema.org Implementation"</h2>
                <p>"Complete type-safe schema generation for:"</p>
                <div class="schema-list">
                    <span class="schema-badge">"Article"</span>
                    <span class="schema-badge">"FAQ"</span>
                    <span class="schema-badge">"HowTo"</span>
                    <span class="schema-badge">"Product"</span>
                    <span class="schema-badge">"Service"</span>
                    <span class="schema-badge">"Organization"</span>
                    <span class="schema-badge">"Person"</span>
                    <span class="schema-badge">"WebPage"</span>
                    <span class="schema-badge">"Breadcrumb"</span>
                </div>
            </section>

            <section class="tech-stack">
                <h2>"🛠️ Technology Stack"</h2>
                <div class="tech-grid">
                    <div class="tech-item">
                        <strong>"Frontend:"</strong>
                        " Leptos + WebAssembly"
                    </div>
                    <div class="tech-item">
                        <strong>"Backend:"</strong>
                        " Axum + Tokio"
                    </div>
                    <div class="tech-item">
                        <strong>"Database:"</strong>
                        " PostgreSQL + Redis"
                    </div>
                    <div class="tech-item">
                        <strong>"Search:"</strong>
                        " MeiliSearch"
                    </div>
                </div>
            </section>
        </div>
    }
}
