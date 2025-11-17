use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;

/// Schema.org types for AEO optimization (Chapter 8)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "@type")]
pub enum SchemaType {
    Article(ArticleSchema),
    FAQPage(FAQPageSchema),
    HowTo(HowToSchema),
    Product(ProductSchema),
    Service(ServiceSchema),
    Organization(OrganizationSchema),
    Person(PersonSchema),
    WebPage(WebPageSchema),
    BreadcrumbList(BreadcrumbListSchema),
}

/// Article schema for blog posts and guides
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArticleSchema {
    #[serde(rename = "@context")]
    pub context: String,
    pub headline: String,
    pub description: String,
    pub author: AuthorSchema,
    #[serde(rename = "datePublished")]
    pub date_published: DateTime<Utc>,
    #[serde(rename = "dateModified", skip_serializing_if = "Option::is_none")]
    pub date_modified: Option<DateTime<Utc>>,
    pub image: Vec<String>,
    pub publisher: PublisherSchema,
    #[serde(rename = "mainEntityOfPage", skip_serializing_if = "Option::is_none")]
    pub main_entity_of_page: Option<String>,
}

impl ArticleSchema {
    pub fn new(headline: String, description: String, author_name: String) -> Self {
        Self {
            context: "https://schema.org".to_string(),
            headline,
            description,
            author: AuthorSchema {
                schema_type: "Person".to_string(),
                name: author_name,
            },
            date_published: Utc::now(),
            date_modified: None,
            image: vec![],
            publisher: PublisherSchema {
                schema_type: "Organization".to_string(),
                name: "ASA Platform".to_string(),
                logo: LogoSchema {
                    schema_type: "ImageObject".to_string(),
                    url: "/logo.png".to_string(),
                },
            },
            main_entity_of_page: None,
        }
    }
}

/// FAQ Page schema for Q&A content (highly valuable for AEO)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FAQPageSchema {
    #[serde(rename = "@context")]
    pub context: String,
    #[serde(rename = "mainEntity")]
    pub main_entity: Vec<FAQItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FAQItem {
    #[serde(rename = "@type")]
    pub schema_type: String,  // "Question"
    pub name: String,  // The question
    #[serde(rename = "acceptedAnswer")]
    pub accepted_answer: FAQAnswer,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FAQAnswer {
    #[serde(rename = "@type")]
    pub schema_type: String,  // "Answer"
    pub text: String,
}

impl FAQPageSchema {
    pub fn new() -> Self {
        Self {
            context: "https://schema.org".to_string(),
            main_entity: vec![],
        }
    }

    pub fn add_question(&mut self, question: String, answer: String) {
        self.main_entity.push(FAQItem {
            schema_type: "Question".to_string(),
            name: question,
            accepted_answer: FAQAnswer {
                schema_type: "Answer".to_string(),
                text: answer,
            },
        });
    }
}

/// HowTo schema for tutorial content
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HowToSchema {
    #[serde(rename = "@context")]
    pub context: String,
    pub name: String,
    pub description: String,
    pub step: Vec<HowToStep>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub supply: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "totalTime")]
    pub total_time: Option<String>,  // ISO 8601 duration
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HowToStep {
    #[serde(rename = "@type")]
    pub schema_type: String,  // "HowToStep"
    pub name: String,
    pub text: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
}

impl HowToSchema {
    pub fn new(name: String, description: String) -> Self {
        Self {
            context: "https://schema.org".to_string(),
            name,
            description,
            step: vec![],
            tool: None,
            supply: None,
            total_time: None,
        }
    }

    pub fn add_step(&mut self, name: String, text: String) {
        self.step.push(HowToStep {
            schema_type: "HowToStep".to_string(),
            name,
            text,
            image: None,
            url: None,
        });
    }
}

/// Product schema for e-commerce
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductSchema {
    #[serde(rename = "@context")]
    pub context: String,
    pub name: String,
    pub description: String,
    pub image: Vec<String>,
    pub offers: OfferSchema,
    #[serde(rename = "aggregateRating", skip_serializing_if = "Option::is_none")]
    pub aggregate_rating: Option<AggregateRatingSchema>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub brand: Option<BrandSchema>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OfferSchema {
    #[serde(rename = "@type")]
    pub schema_type: String,  // "Offer"
    pub price: String,
    #[serde(rename = "priceCurrency")]
    pub price_currency: String,
    pub availability: String,  // "https://schema.org/InStock"
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AggregateRatingSchema {
    #[serde(rename = "@type")]
    pub schema_type: String,  // "AggregateRating"
    #[serde(rename = "ratingValue")]
    pub rating_value: f32,
    #[serde(rename = "reviewCount")]
    pub review_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrandSchema {
    #[serde(rename = "@type")]
    pub schema_type: String,  // "Brand"
    pub name: String,
}

/// Service schema for service-based businesses
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceSchema {
    #[serde(rename = "@context")]
    pub context: String,
    pub name: String,
    pub description: String,
    pub provider: ProviderSchema,
    #[serde(rename = "serviceType")]
    pub service_type: String,
    #[serde(rename = "areaServed", skip_serializing_if = "Option::is_none")]
    pub area_served: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderSchema {
    #[serde(rename = "@type")]
    pub schema_type: String,  // "Organization"
    pub name: String,
}

/// Organization schema
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrganizationSchema {
    #[serde(rename = "@context")]
    pub context: String,
    pub name: String,
    pub url: String,
    pub logo: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "sameAs")]
    pub same_as: Option<Vec<String>>,  // Social media profiles
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "contactPoint")]
    pub contact_point: Option<ContactPointSchema>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContactPointSchema {
    #[serde(rename = "@type")]
    pub schema_type: String,  // "ContactPoint"
    pub telephone: String,
    #[serde(rename = "contactType")]
    pub contact_type: String,
    pub email: Option<String>,
}

/// Person schema for author profiles
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonSchema {
    #[serde(rename = "@context")]
    pub context: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "jobTitle")]
    pub job_title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "sameAs")]
    pub same_as: Option<Vec<String>>,
}

/// WebPage schema
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebPageSchema {
    #[serde(rename = "@context")]
    pub context: String,
    pub name: String,
    pub description: String,
    pub url: String,
    #[serde(rename = "datePublished")]
    pub date_published: DateTime<Utc>,
    #[serde(rename = "dateModified")]
    pub date_modified: DateTime<Utc>,
}

/// Breadcrumb navigation schema
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BreadcrumbListSchema {
    #[serde(rename = "@context")]
    pub context: String,
    #[serde(rename = "itemListElement")]
    pub item_list_element: Vec<BreadcrumbItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BreadcrumbItem {
    #[serde(rename = "@type")]
    pub schema_type: String,  // "ListItem"
    pub position: u32,
    pub name: String,
    pub item: String,  // URL
}

// Helper types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthorSchema {
    #[serde(rename = "@type")]
    pub schema_type: String,  // "Person"
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PublisherSchema {
    #[serde(rename = "@type")]
    pub schema_type: String,  // "Organization"
    pub name: String,
    pub logo: LogoSchema,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogoSchema {
    #[serde(rename = "@type")]
    pub schema_type: String,  // "ImageObject"
    pub url: String,
}

/// Schema generator utility
pub struct SchemaGenerator;

impl SchemaGenerator {
    /// Generate JSON-LD script tag
    pub fn to_json_ld(schema: &SchemaType) -> Result<String, serde_json::Error> {
        let json = serde_json::to_string_pretty(schema)?;
        Ok(format!(
            r#"<script type="application/ld+json">
{}
</script>"#,
            json
        ))
    }

    /// Generate multiple schemas
    pub fn generate_multiple(schemas: Vec<SchemaType>) -> Result<String, serde_json::Error> {
        let mut scripts = Vec::new();
        for schema in schemas {
            scripts.push(Self::to_json_ld(&schema)?);
        }
        Ok(scripts.join("\n"))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_article_schema() {
        let article = ArticleSchema::new(
            "Test Article".to_string(),
            "Description".to_string(),
            "John Doe".to_string(),
        );

        assert_eq!(article.headline, "Test Article");
        assert_eq!(article.author.name, "John Doe");
    }

    #[test]
    fn test_faq_schema() {
        let mut faq = FAQPageSchema::new();
        faq.add_question(
            "What is AEO?".to_string(),
            "Answer Engine Optimization".to_string(),
        );

        assert_eq!(faq.main_entity.len(), 1);
        assert_eq!(faq.main_entity[0].name, "What is AEO?");
    }

    #[test]
    fn test_howto_schema() {
        let mut howto = HowToSchema::new(
            "How to Optimize for AEO".to_string(),
            "Step-by-step guide".to_string(),
        );

        howto.add_step(
            "Step 1".to_string(),
            "Add schema markup".to_string(),
        );

        assert_eq!(howto.step.len(), 1);
    }

    #[test]
    fn test_json_ld_generation() {
        let article = SchemaType::Article(ArticleSchema::new(
            "Test".to_string(),
            "Desc".to_string(),
            "Author".to_string(),
        ));

        let json_ld = SchemaGenerator::to_json_ld(&article).unwrap();
        assert!(json_ld.contains(r#"<script type="application/ld+json">"#));
        assert!(json_ld.contains("Test"));
    }
}
