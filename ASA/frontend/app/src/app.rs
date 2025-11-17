use leptos::*;
use leptos_meta::*;
use leptos_router::*;

use crate::pages::{Home, ContentList, AeoOptimizer, Analytics, NotFound};

#[component]
pub fn App() -> impl IntoView {
    provide_meta_context();

    view! {
        <Stylesheet id="leptos" href="/pkg/asa-frontend.css"/>
        <Title text="ASA - Autonomous Search Architecture"/>
        <Meta name="description" content="Full-Stack Rust with AEO/LLMO Optimization"/>

        <Router>
            <nav class="navbar">
                <div class="container">
                    <a href="/" class="logo">"🦀 ASA"</a>
                    <ul class="nav-links">
                        <li><A href="/">"Home"</A></li>
                        <li><A href="/content">"Content"</A></li>
                        <li><A href="/aeo">"AEO Optimizer"</A></li>
                        <li><A href="/analytics">"Analytics"</A></li>
                    </ul>
                </div>
            </nav>

            <main class="main-content">
                <Routes>
                    <Route path="/" view=Home/>
                    <Route path="/content" view=ContentList/>
                    <Route path="/aeo" view=AeoOptimizer/>
                    <Route path="/analytics" view=Analytics/>
                    <Route path="/*any" view=NotFound/>
                </Routes>
            </main>

            <footer class="footer">
                <div class="container">
                    <p>"Built with 🦀 Rust + Leptos | Optimized for 🤖 AI Search"</p>
                    <p>"© 2025 ASA Platform - Full-Stack AEO"</p>
                </div>
            </footer>
        </Router>
    }
}
