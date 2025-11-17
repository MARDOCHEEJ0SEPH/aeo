use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,      // Subject (user ID)
    pub email: String,
    pub username: String,
    pub role: String,
    pub exp: i64,         // Expiration time
    pub iat: i64,         // Issued at
    pub token_type: String, // "access" or "refresh"
}

pub struct JwtService {
    secret: String,
    access_token_expiry: i64,
    refresh_token_expiry: i64,
}

impl JwtService {
    pub fn new(secret: String, access_token_expiry: i64, refresh_token_expiry: i64) -> Self {
        Self {
            secret,
            access_token_expiry,
            refresh_token_expiry,
        }
    }

    pub fn generate_access_token(
        &self,
        user_id: Uuid,
        email: String,
        username: String,
        role: String,
    ) -> anyhow::Result<String> {
        let now = Utc::now();
        let exp = now + Duration::seconds(self.access_token_expiry);

        let claims = Claims {
            sub: user_id.to_string(),
            email,
            username,
            role,
            exp: exp.timestamp(),
            iat: now.timestamp(),
            token_type: "access".to_string(),
        };

        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.secret.as_bytes()),
        )
        .map_err(|e| anyhow::anyhow!("Failed to generate access token: {}", e))
    }

    pub fn generate_refresh_token(
        &self,
        user_id: Uuid,
        email: String,
        username: String,
        role: String,
    ) -> anyhow::Result<String> {
        let now = Utc::now();
        let exp = now + Duration::seconds(self.refresh_token_expiry);

        let claims = Claims {
            sub: user_id.to_string(),
            email,
            username,
            role,
            exp: exp.timestamp(),
            iat: now.timestamp(),
            token_type: "refresh".to_string(),
        };

        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.secret.as_bytes()),
        )
        .map_err(|e| anyhow::anyhow!("Failed to generate refresh token: {}", e))
    }

    pub fn verify_token(&self, token: &str) -> anyhow::Result<Claims> {
        decode::<Claims>(
            token,
            &DecodingKey::from_secret(self.secret.as_bytes()),
            &Validation::default(),
        )
        .map(|data| data.claims)
        .map_err(|e| anyhow::anyhow!("Invalid token: {}", e))
    }
}

pub fn hash_password(password: &str) -> anyhow::Result<String> {
    use argon2::{
        password_hash::{rand_core::OsRng, PasswordHasher, SaltString},
        Argon2,
    };

    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();

    argon2
        .hash_password(password.as_bytes(), &salt)
        .map(|hash| hash.to_string())
        .map_err(|e| anyhow::anyhow!("Failed to hash password: {}", e))
}

pub fn verify_password(password: &str, hash: &str) -> anyhow::Result<bool> {
    use argon2::{
        password_hash::{PasswordHash, PasswordVerifier},
        Argon2,
    };

    let parsed_hash = PasswordHash::new(hash)
        .map_err(|e| anyhow::anyhow!("Invalid password hash: {}", e))?;

    Ok(Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok())
}
