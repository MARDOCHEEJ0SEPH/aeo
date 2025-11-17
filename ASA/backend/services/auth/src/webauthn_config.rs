use std::sync::Arc;
use url::Url;
use webauthn_rs::{Webauthn, WebauthnBuilder};

use crate::config::Config;

pub fn init_webauthn(config: &Config) -> anyhow::Result<Arc<Webauthn>> {
    let rp_origin = Url::parse(&config.webauthn.rp_origin)?;

    let builder = WebauthnBuilder::new(
        &config.webauthn.rp_id,
        &rp_origin,
    )?;

    let webauthn = builder
        .rp_name(&config.webauthn.rp_name)
        .build()?;

    Ok(Arc::new(webauthn))
}
