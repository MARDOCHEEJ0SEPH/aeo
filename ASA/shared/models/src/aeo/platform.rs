use serde::{Deserialize, Serialize};
use std::fmt;

/// AI Platforms for AEO optimization (from book chapters 1-3)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AIPlatform {
    /// ChatGPT (OpenAI) - Requires clear structure, code examples
    ChatGPT,
    /// Claude (Anthropic) - Values depth, context, nuance
    Claude,
    /// Perplexity - Needs citations, data, authoritative sources
    Perplexity,
    /// Google Gemini - Multimedia, local relevance, reviews
    Gemini,
    /// Bing AI - Clarity, authority, freshness
    Bing,
}

impl AIPlatform {
    /// Get all supported platforms
    pub fn all() -> Vec<Self> {
        vec![
            Self::ChatGPT,
            Self::Claude,
            Self::Perplexity,
            Self::Gemini,
            Self::Bing,
        ]
    }

    /// Get optimization requirements for this platform (Chapter 5)
    pub fn optimization_requirements(&self) -> PlatformRequirements {
        match self {
            Self::ChatGPT => PlatformRequirements {
                structure: "Clear headers and subheaders",
                format: "Numbered lists and bullet points",
                examples: "Concrete implementations and code snippets",
                special: "Include step-by-step instructions",
            },
            Self::Claude => PlatformRequirements {
                structure: "Comprehensive explanations with context",
                format: "Well-structured paragraphs with depth",
                examples: "Address edge cases and nuances",
                special: "Highlight safety and ethical considerations",
            },
            Self::Perplexity => PlatformRequirements {
                structure: "Citations and authoritative sources",
                format: "Statistics and hard data",
                examples: "Latest industry updates and research",
                special: "Multiple perspectives and comparisons",
            },
            Self::Gemini => PlatformRequirements {
                structure: "Image descriptions and multimedia",
                format: "Google-friendly formatting",
                examples: "Local relevance and geographic context",
                special: "User testimonials and reviews",
            },
            Self::Bing => PlatformRequirements {
                structure: "Direct, clear answers",
                format: "Show expert credentials",
                examples: "Recent updates and freshness signals",
                special: "Interactive elements and engagement",
            },
        }
    }

    /// Get ideal content length for platform
    pub fn ideal_content_length(&self) -> ContentLength {
        match self {
            Self::ChatGPT => ContentLength {
                min_words: 500,
                max_words: 2000,
                ideal_words: 1000,
            },
            Self::Claude => ContentLength {
                min_words: 800,
                max_words: 3000,
                ideal_words: 1500,
            },
            Self::Perplexity => ContentLength {
                min_words: 600,
                max_words: 2500,
                ideal_words: 1200,
            },
            Self::Gemini => ContentLength {
                min_words: 400,
                max_words: 1800,
                ideal_words: 900,
            },
            Self::Bing => ContentLength {
                min_words: 500,
                max_words: 2000,
                ideal_words: 1000,
            },
        }
    }
}

impl fmt::Display for AIPlatform {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::ChatGPT => write!(f, "ChatGPT"),
            Self::Claude => write!(f, "Claude"),
            Self::Perplexity => write!(f, "Perplexity"),
            Self::Gemini => write!(f, "Gemini"),
            Self::Bing => write!(f, "Bing AI"),
        }
    }
}

/// Platform-specific optimization requirements
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlatformRequirements {
    pub structure: &'static str,
    pub format: &'static str,
    pub examples: &'static str,
    pub special: &'static str,
}

/// Content length recommendations
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct ContentLength {
    pub min_words: usize,
    pub max_words: usize,
    pub ideal_words: usize,
}

/// Optimization strategy per platform (Chapter 4-5)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlatformStrategy {
    pub platform: AIPlatform,
    pub priority: u8,  // 1-10
    pub active: bool,
    pub custom_rules: Vec<OptimizationRule>,
}

/// Custom optimization rule
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OptimizationRule {
    pub name: String,
    pub description: String,
    pub pattern: String,
    pub replacement: String,
    pub enabled: bool,
}

/// Platform performance metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlatformMetrics {
    pub platform: AIPlatform,
    pub citation_count: u64,
    pub citation_rate: f64,  // Percentage
    pub visibility_score: f64,  // 0-100
    pub average_position: f64,
    pub last_updated: chrono::DateTime<chrono::Utc>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_platform_requirements() {
        let chatgpt = AIPlatform::ChatGPT;
        let reqs = chatgpt.optimization_requirements();

        assert_eq!(reqs.structure, "Clear headers and subheaders");
    }

    #[test]
    fn test_content_length() {
        let claude = AIPlatform::Claude;
        let length = claude.ideal_content_length();

        assert_eq!(length.ideal_words, 1500);
        assert!(length.min_words < length.ideal_words);
        assert!(length.ideal_words < length.max_words);
    }

    #[test]
    fn test_all_platforms() {
        let platforms = AIPlatform::all();
        assert_eq!(platforms.len(), 5);
    }
}
