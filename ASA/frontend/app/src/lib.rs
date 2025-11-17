mod app;
mod components;
mod pages;
mod services;
mod state;

pub use app::*;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn hydrate() {
    console_error_panic_hook::set_once();
    console_log::init_with_level(log::Level::Debug).expect("error initializing logger");

    leptos::mount_to_body(|| {
        leptos::view! { <App/> }
    });
}
