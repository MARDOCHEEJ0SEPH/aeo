use crate::models::{Improvement, OptimizationResponse};
use asa_models::aeo::platform::AIPlatform;

pub struct AEOOptimizer;

impl AEOOptimizer {
    pub fn new() -> Self {
        Self
    }

    pub fn optimize_content(
        &self,
        content: &str,
        platform: &str,
    ) -> OptimizationResponse {
        let platform_enum = match platform.to_lowercase().as_str() {
            "chatgpt" => AIPlatform::ChatGPT,
            "claude" => AIPlatform::Claude,
            "perplexity" => AIPlatform::Perplexity,
            "gemini" => AIPlatform::Gemini,
            "bing" => AIPlatform::Bing,
            _ => AIPlatform::ChatGPT,
        };

        let score = self.calculate_score(content, &platform_enum);
        let improvements = self.identify_improvements(content, &platform_enum);
        let optimized_content = self.apply_optimizations(content, &platform_enum);
        let tips = self.get_platform_tips(&platform_enum);

        OptimizationResponse {
            score,
            improvements,
            optimized_content,
            platform_specific_tips: tips,
        }
    }

    pub fn calculate_score(&self, content: &str, platform: &AIPlatform) -> f64 {
        let mut score = 0.0;
        let mut max_score = 0.0;

        // Structure score (30 points)
        max_score += 30.0;
        score += self.score_structure(content) * 30.0;

        // Content quality (25 points)
        max_score += 25.0;
        score += self.score_quality(content) * 25.0;

        // Platform-specific optimization (25 points)
        max_score += 25.0;
        score += self.score_platform_optimization(content, platform) * 25.0;

        // Readability (20 points)
        max_score += 20.0;
        score += self.score_readability(content) * 20.0;

        (score / max_score) * 100.0
    }

    fn score_structure(&self, content: &str) -> f64 {
        let mut score = 0.0;

        // Check for headings
        if content.contains("##") || content.contains("<h2") {
            score += 0.3;
        }
        if content.contains("###") || content.contains("<h3") {
            score += 0.2;
        }

        // Check for lists
        if content.contains("- ") || content.contains("* ") || content.contains("<ul") {
            score += 0.2;
        }
        if content.contains("1. ") || content.contains("<ol") {
            score += 0.2;
        }

        // Check for paragraphs (not too long)
        let paragraphs: Vec<&str> = content.split("\n\n").collect();
        if paragraphs.len() > 3 {
            score += 0.1;
        }

        score.min(1.0)
    }

    fn score_quality(&self, content: &str) -> f64 {
        let mut score = 0.0;
        let word_count = content.split_whitespace().count();

        // Length check (500-2000 words is ideal)
        if word_count >= 500 && word_count <= 2000 {
            score += 0.4;
        } else if word_count > 2000 {
            score += 0.3;
        } else if word_count >= 300 {
            score += 0.2;
        }

        // Check for examples/code blocks
        if content.contains("```") || content.contains("example:") {
            score += 0.2;
        }

        // Check for questions (engaging)
        if content.contains('?') {
            score += 0.1;
        }

        // Check for actionable content
        let actionable_words = ["how to", "step", "guide", "tutorial", "learn"];
        if actionable_words.iter().any(|word| content.to_lowercase().contains(word)) {
            score += 0.3;
        }

        score.min(1.0)
    }

    fn score_platform_optimization(&self, content: &str, platform: &AIPlatform) -> f64 {
        match platform {
            AIPlatform::ChatGPT => {
                let mut score = 0.0;
                // Numbered lists
                if content.contains("1. ") {
                    score += 0.3;
                }
                // Code examples
                if content.contains("```") {
                    score += 0.4;
                }
                // Step-by-step
                if content.to_lowercase().contains("step") {
                    score += 0.3;
                }
                score.min(1.0)
            }
            AIPlatform::Claude => {
                let mut score = 0.0;
                let word_count = content.split_whitespace().count();
                // Depth (longer content)
                if word_count > 1000 {
                    score += 0.4;
                }
                // Multiple perspectives
                if content.contains("however") || content.contains("alternatively") {
                    score += 0.3;
                }
                // Context
                if content.contains("background") || content.contains("context") {
                    score += 0.3;
                }
                score.min(1.0)
            }
            AIPlatform::Perplexity => {
                let mut score = 0.0;
                // Citations
                if content.contains("[") && content.contains("]") {
                    score += 0.5;
                }
                // Sources
                if content.to_lowercase().contains("source") || content.to_lowercase().contains("reference") {
                    score += 0.3;
                }
                // Data/statistics
                if content.contains('%') || content.chars().filter(|c| c.is_numeric()).count() > 10 {
                    score += 0.2;
                }
                score.min(1.0)
            }
            AIPlatform::Gemini => {
                let mut score = 0.0;
                // Conversational tone
                if content.contains("you") || content.contains("your") {
                    score += 0.3;
                }
                // Visual descriptions
                if content.to_lowercase().contains("image") || content.to_lowercase().contains("visual") {
                    score += 0.4;
                }
                // Local relevance
                if content.to_lowercase().contains("location") || content.to_lowercase().contains("local") {
                    score += 0.3;
                }
                score.min(1.0)
            }
            AIPlatform::Bing => {
                let mut score = 0.0;
                // Concise
                let word_count = content.split_whitespace().count();
                if word_count >= 300 && word_count <= 1000 {
                    score += 0.4;
                }
                // Clear headings
                if content.contains("##") {
                    score += 0.3;
                }
                // Authoritative
                if content.to_lowercase().contains("research") || content.to_lowercase().contains("study") {
                    score += 0.3;
                }
                score.min(1.0)
            }
        }
    }

    fn score_readability(&self, content: &str) -> f64 {
        let mut score = 0.0;
        let sentences: Vec<&str> = content.split(&['.', '!', '?'][..]).collect();

        if !sentences.is_empty() {
            let words: Vec<&str> = content.split_whitespace().collect();
            let avg_sentence_length = words.len() / sentences.len();

            // Ideal sentence length: 15-20 words
            if avg_sentence_length >= 15 && avg_sentence_length <= 20 {
                score += 0.5;
            } else if avg_sentence_length < 25 {
                score += 0.3;
            }
        }

        // Check for transition words
        let transitions = ["however", "therefore", "additionally", "furthermore", "moreover"];
        if transitions.iter().any(|t| content.to_lowercase().contains(t)) {
            score += 0.3;
        }

        // Check for clear formatting
        if content.contains("\n\n") {
            score += 0.2;
        }

        score.min(1.0)
    }

    fn identify_improvements(&self, content: &str, platform: &AIPlatform) -> Vec<Improvement> {
        let mut improvements = Vec::new();

        // Structure improvements
        if !content.contains("##") && !content.contains("<h2") {
            improvements.push(Improvement {
                category: "Structure".to_string(),
                description: "Add section headings (H2, H3) to improve content structure".to_string(),
                impact: "high".to_string(),
            });
        }

        // Platform-specific improvements
        match platform {
            AIPlatform::ChatGPT => {
                if !content.contains("```") {
                    improvements.push(Improvement {
                        category: "Examples".to_string(),
                        description: "Add code examples or practical demonstrations".to_string(),
                        impact: "high".to_string(),
                    });
                }
                if !content.contains("1. ") {
                    improvements.push(Improvement {
                        category: "Format".to_string(),
                        description: "Use numbered lists for step-by-step instructions".to_string(),
                        impact: "medium".to_string(),
                    });
                }
            }
            AIPlatform::Perplexity => {
                if !content.contains("[") {
                    improvements.push(Improvement {
                        category: "Citations".to_string(),
                        description: "Add citations and references to authoritative sources".to_string(),
                        impact: "high".to_string(),
                    });
                }
            }
            AIPlatform::Claude => {
                if content.split_whitespace().count() < 800 {
                    improvements.push(Improvement {
                        category: "Depth".to_string(),
                        description: "Expand content with more detailed explanations and context".to_string(),
                        impact: "medium".to_string(),
                    });
                }
            }
            _ => {}
        }

        improvements
    }

    fn apply_optimizations(&self, content: &str, _platform: &AIPlatform) -> String {
        // In a real implementation, this would apply AI-powered optimizations
        // For now, return the original content
        content.to_string()
    }

    fn get_platform_tips(&self, platform: &AIPlatform) -> Vec<String> {
        match platform {
            AIPlatform::ChatGPT => vec![
                "Use clear, numbered steps for instructions".to_string(),
                "Include practical code examples".to_string(),
                "Break down complex topics into digestible sections".to_string(),
                "Use descriptive headings that preview content".to_string(),
            ],
            AIPlatform::Claude => vec![
                "Provide comprehensive coverage with depth".to_string(),
                "Include context and background information".to_string(),
                "Present multiple perspectives on the topic".to_string(),
                "Use nuanced language that acknowledges complexity".to_string(),
            ],
            AIPlatform::Perplexity => vec![
                "Cite authoritative sources and research".to_string(),
                "Include recent data and statistics".to_string(),
                "Link to credible external references".to_string(),
                "Use verifiable facts and evidence".to_string(),
            ],
            AIPlatform::Gemini => vec![
                "Incorporate multimedia descriptions".to_string(),
                "Add local and geographic relevance".to_string(),
                "Use conversational, accessible language".to_string(),
                "Include visual elements where appropriate".to_string(),
            ],
            AIPlatform::Bing => vec![
                "Keep content concise and to the point".to_string(),
                "Use authoritative, well-researched information".to_string(),
                "Ensure content freshness and timeliness".to_string(),
                "Optimize for featured snippet format".to_string(),
            ],
        }
    }
}

impl Default for AEOOptimizer {
    fn default() -> Self {
        Self::new()
    }
}
