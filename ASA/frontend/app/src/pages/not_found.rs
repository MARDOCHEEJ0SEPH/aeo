use leptos::*;

#[component]
pub fn NotFound() -> impl IntoView {
    view! {
        <div class="not-found">
            <h1>"404"</h1>
            <p>"Page not found"</p>
            <a href="/" class="btn btn-primary">"Go Home"</a>
        </div>
    }
}
