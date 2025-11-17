use leptos::*;

#[component]
pub fn Analytics() -> impl IntoView {
    view! {
        <div class="analytics-dashboard">
            <h1>"📊 Analytics Dashboard"</h1>

            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-value">"12,543"</div>
                    <div class="metric-label">"Total Citations"</div>
                    <div class="metric-trend trend-up">"↑ 23%"</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">"89.2%"</div>
                    <div class="metric-label">"Citation Rate"</div>
                    <div class="metric-trend trend-up">"↑ 5%"</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">"45,678"</div>
                    <div class="metric-label">"Content Views"</div>
                    <div class="metric-trend trend-up">"↑ 12%"</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">"2.4s"</div>
                    <div class="metric-label">"Avg Response Time"</div>
                    <div class="metric-trend trend-down">"↓ 15%"</div>
                </div>
            </div>

            <div class="charts-section">
                <div class="chart-card">
                    <h2>"Citation Trends"</h2>
                    <div class="chart-placeholder">
                        "[Chart: Citations over time by platform]"
                    </div>
                </div>
                <div class="chart-card">
                    <h2>"Platform Performance"</h2>
                    <div class="chart-placeholder">
                        "[Chart: Visibility scores by platform]"
                    </div>
                </div>
            </div>
        </div>
    }
}
