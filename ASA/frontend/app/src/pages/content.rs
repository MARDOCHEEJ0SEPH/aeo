use leptos::*;

#[component]
pub fn ContentList() -> impl IntoView {
    let (content_items, set_content_items) = create_signal(vec![
        ("Getting Started with AEO", "Learn the basics of Answer Engine Optimization", "92.5"),
        ("Rust for Web Development", "Building high-performance web apps with Rust", "88.3"),
        ("Schema.org Deep Dive", "Complete guide to structured data", "95.1"),
    ]);

    view! {
        <div class="content-list">
            <div class="content-header">
                <h1>"📝 Content Library"</h1>
                <button class="btn btn-primary">"+ New Content"</button>
            </div>

            <div class="content-grid">
                {move || content_items.get().iter().map(|(title, desc, score)| {
                    view! {
                        <div class="content-card">
                            <h3>{*title}</h3>
                            <p>{*desc}</p>
                            <div class="content-meta">
                                <span class="aeo-score">
                                    "AEO Score: "
                                    <strong>{*score}"%"</strong>
                                </span>
                                <div class="content-actions">
                                    <button class="btn-small">"Edit"</button>
                                    <button class="btn-small">"Optimize"</button>
                                </div>
                            </div>
                        </div>
                    }
                }).collect::<Vec<_>>()}
            </div>
        </div>
    }
}
