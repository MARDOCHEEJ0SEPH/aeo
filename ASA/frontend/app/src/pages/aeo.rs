use leptos::*;
use asa_models::aeo::{AIPlatform, AEOScore, ScoreComponents};

#[component]
pub fn AeoOptimizer() -> impl IntoView {
    let (content, set_content) = create_signal(String::new());
    let (selected_platforms, set_selected_platforms) = create_signal(vec![
        AIPlatform::ChatGPT,
        AIPlatform::Claude,
        AIPlatform::Perplexity,
    ]);
    let (optimization_result, set_optimization_result) = create_signal(None::<AEOScore>);
    let (is_optimizing, set_is_optimizing) = create_signal(false);

    let platforms = AIPlatform::all();

    let optimize_content = move |_| {
        set_is_optimizing.set(true);

        // Simulate optimization (in real app, call API)
        set_timeout(
            move || {
                let score = AEOScore {
                    overall: 87.5,
                    components: ScoreComponents {
                        schema_markup: 85.0,
                        content_quality: 90.0,
                        keyword_optimization: 82.0,
                        entity_coverage: 88.0,
                        citation_potential: 91.0,
                        freshness: 95.0,
                        engagement: 80.0,
                    },
                };
                set_optimization_result.set(Some(score));
                set_is_optimizing.set(false);
            },
            std::time::Duration::from_millis(1500),
        );
    };

    view! {
        <div class="aeo-optimizer">
            <h1>"🤖 AEO Content Optimizer"</h1>
            <p class="subtitle">"Optimize your content for all major AI platforms"</p>

            <div class="optimizer-grid">
                <div class="input-section">
                    <h2>"Content Input"</h2>
                    <textarea
                        class="content-input"
                        placeholder="Paste your content here..."
                        prop:value=content
                        on:input=move |ev| {
                            set_content.set(event_target_value(&ev));
                        }
                    />

                    <div class="platform-selector">
                        <h3>"Target Platforms"</h3>
                        <div class="platform-checkboxes">
                            {platforms.iter().map(|platform| {
                                let platform_name = format!("{}", platform);
                                view! {
                                    <label class="platform-checkbox">
                                        <input type="checkbox" checked/>
                                        <span>{platform_name}</span>
                                    </label>
                                }
                            }).collect::<Vec<_>>()}
                        </div>
                    </div>

                    <button
                        class="btn btn-primary"
                        on:click=optimize_content
                        disabled=move || is_optimizing.get()
                    >
                        {move || if is_optimizing.get() {
                            "⚙️ Optimizing..."
                        } else {
                            "🚀 Optimize Content"
                        }}
                    </button>
                </div>

                <div class="results-section">
                    <h2>"Optimization Results"</h2>
                    {move || match optimization_result.get() {
                        Some(score) => view! {
                            <div class="score-display">
                                <div class="overall-score">
                                    <div class="score-value">{format!("{:.1}", score.overall)}</div>
                                    <div class="score-label">"Overall AEO Score"</div>
                                </div>

                                <div class="component-scores">
                                    <h3>"Score Breakdown"</h3>
                                    <div class="score-item">
                                        <span>"Schema Markup"</span>
                                        <div class="score-bar">
                                            <div
                                                class="score-fill"
                                                style:width=format!("{}%", score.components.schema_markup)
                                            />
                                        </div>
                                        <span>{format!("{:.1}%", score.components.schema_markup)}</span>
                                    </div>
                                    <div class="score-item">
                                        <span>"Content Quality"</span>
                                        <div class="score-bar">
                                            <div
                                                class="score-fill"
                                                style:width=format!("{}%", score.components.content_quality)
                                            />
                                        </div>
                                        <span>{format!("{:.1}%", score.components.content_quality)}</span>
                                    </div>
                                    <div class="score-item">
                                        <span>"Keyword Optimization"</span>
                                        <div class="score-bar">
                                            <div
                                                class="score-fill"
                                                style:width=format!("{}%", score.components.keyword_optimization)
                                            />
                                        </div>
                                        <span>{format!("{:.1}%", score.components.keyword_optimization)}</span>
                                    </div>
                                    <div class="score-item">
                                        <span>"Entity Coverage"</span>
                                        <div class="score-bar">
                                            <div
                                                class="score-fill"
                                                style:width=format!("{}%", score.components.entity_coverage)
                                            />
                                        </div>
                                        <span>{format!("{:.1}%", score.components.entity_coverage)}</span>
                                    </div>
                                    <div class="score-item">
                                        <span>"Citation Potential"</span>
                                        <div class="score-bar">
                                            <div
                                                class="score-fill"
                                                style:width=format!("{}%", score.components.citation_potential)
                                            />
                                        </div>
                                        <span>{format!("{:.1}%", score.components.citation_potential)}</span>
                                    </div>
                                </div>

                                <div class="recommendations">
                                    <h3>"💡 Recommendations"</h3>
                                    <ul>
                                        <li>"Add FAQ schema for better AI comprehension"</li>
                                        <li>"Include more authoritative citations"</li>
                                        <li>"Enhance entity markup with relationships"</li>
                                        <li>"Add structured data for all sections"</li>
                                    </ul>
                                </div>
                            </div>
                        }.into_view(),
                        None => view! {
                            <div class="empty-state">
                                <p>"Enter content and click 'Optimize' to see results"</p>
                            </div>
                        }.into_view()
                    }}
                </div>
            </div>
        </div>
    }
}
