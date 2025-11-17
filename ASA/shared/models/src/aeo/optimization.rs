use serde::{Deserialize, Serialize};
use uuid::Uuid;
use super::platform::AIPlatform;

/// Content optimization record (Chapters 4-5)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContentOptimization {
    pub id: Uuid,
    pub content_id: Uuid,
    pub platform: AIPlatform,
    pub optimization_level: OptimizationLevel,
    pub applied_rules: Vec<String>,
    pub before_score: f64,
    pub after_score: f64,
    pub improvements: Vec<Improvement>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum OptimizationLevel {
    Basic,
    Intermediate,
    Advanced,
    Expert,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Improvement {
    pub category: ImprovementCategory,
    pub description: String,
    pub impact: Impact,
    pub implemented: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ImprovementCategory {
    Structure,
    Keywords,
    Schema,
    Readability,
    Citations,
    Multimedia,
    Engagement,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum Impact {
    High,
    Medium,
    Low,
}

/// AEO Score calculation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AEOScore {
    pub overall: f64,  // 0-100
    pub components: ScoreComponents,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScoreComponents {
    pub schema_markup: f64,
    pub content_quality: f64,
    pub keyword_optimization: f64,
    pub entity_coverage: f64,
    pub citation_potential: f64,
    pub freshness: f64,
    pub engagement: f64,
}

impl AEOScore {
    pub fn calculate(components: ScoreComponents) -> Self {
        let overall = (components.schema_markup * 0.2)
            + (components.content_quality * 0.25)
            + (components.keyword_optimization * 0.15)
            + (components.entity_coverage * 0.15)
            + (components.citation_potential * 0.15)
            + (components.freshness * 0.05)
            + (components.engagement * 0.05);

        Self {
            overall,
            components,
        }
    }
}
