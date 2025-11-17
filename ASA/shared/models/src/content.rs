use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;
use crate::aeo::{SchemaType, AEOScore};

/// Content entity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Content {
    pub id: Uuid,
    pub title: String,
    pub slug: String,
    pub body: String,
    pub excerpt: Option<String>,
    pub content_type: ContentType,
    pub status: ContentStatus,
    pub author_id: Uuid,
    pub schema: Vec<SchemaType>,
    pub aeo_score: Option<AEOScore>,
    pub metadata: ContentMetadata,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub published_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ContentType {
    Article,
    Tutorial,
    Guide,
    FAQ,
    Product,
    Service,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ContentStatus {
    Draft,
    Review,
    Published,
    Archived,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContentMetadata {
    pub keywords: Vec<String>,
    pub entities: Vec<String>,
    pub word_count: usize,
    pub reading_time_minutes: u32,
    pub language: String,
    pub tags: Vec<String>,
}

/// Content creation request
#[derive(Debug, Clone, Deserialize)]
pub struct CreateContentRequest {
    pub title: String,
    pub body: String,
    pub content_type: ContentType,
    pub keywords: Vec<String>,
}

/// Content update request
#[derive(Debug, Clone, Deserialize)]
pub struct UpdateContentRequest {
    pub title: Option<String>,
    pub body: Option<String>,
    pub status: Option<ContentStatus>,
    pub keywords: Option<Vec<String>>,
}
