use anyhow::Result;
use serde_json::json;

pub struct AIGenerator {
    openai_api_key: String,
    anthropic_api_key: String,
    client: reqwest::Client,
}

impl AIGenerator {
    pub fn new(openai_api_key: String, anthropic_api_key: String) -> Self {
        Self {
            openai_api_key,
            anthropic_api_key,
            client: reqwest::Client::new(),
        }
    }

    pub async fn generate_content(
        &self,
        topic: &str,
        content_type: &str,
        target_platform: &str,
        tone: Option<&str>,
        length: Option<&str>,
        keywords: Option<&[String]>,
    ) -> Result<(String, String, Vec<String>)> {
        let platform_guidance = self.get_platform_guidance(target_platform);

        let keywords_str = keywords
            .map(|kw| format!("Keywords to include: {}", kw.join(", ")))
            .unwrap_or_default();

        let prompt = format!(
            r#"Generate comprehensive content optimized for {} with the following specifications:

Topic: {}
Content Type: {}
Tone: {}
Length: {}
{}

Platform Optimization Guidelines:
{}

Please provide:
1. An engaging, SEO-optimized title
2. Well-structured content with clear sections
3. Proper headings (H2, H3)
4. Actionable insights and examples
5. Natural keyword integration
6. Clear, concise language

Format the response as JSON with:
- title: The optimized title
- body: The full content in markdown
- outline: Array of main section headings
"#,
            target_platform,
            topic,
            content_type,
            tone.unwrap_or("professional"),
            length.unwrap_or("medium"),
            keywords_str,
            platform_guidance
        );

        // Use OpenAI GPT-4 or Claude depending on target platform
        let result = if target_platform.to_lowercase().contains("claude") {
            self.generate_with_claude(&prompt).await?
        } else {
            self.generate_with_openai(&prompt).await?
        };

        Ok(result)
    }

    pub async fn generate_outline(
        &self,
        topic: &str,
        content_type: &str,
        target_platform: &str,
    ) -> Result<Vec<String>> {
        let platform_guidance = self.get_platform_guidance(target_platform);

        let prompt = format!(
            r#"Create a detailed outline for {} content about "{}".

Platform: {}
Optimization Guidelines:
{}

Provide a structured outline with main sections and subsections.
Format as a JSON array of strings.
"#,
            content_type, topic, target_platform, platform_guidance
        );

        let (_, _, outline) = self.generate_with_openai(&prompt).await?;
        Ok(outline)
    }

    async fn generate_with_openai(&self, prompt: &str) -> Result<(String, String, Vec<String>)> {
        if self.openai_api_key.is_empty() {
            return self.generate_mock_content(prompt);
        }

        let response = self
            .client
            .post("https://api.openai.com/v1/chat/completions")
            .header("Authorization", format!("Bearer {}", self.openai_api_key))
            .json(&json!({
                "model": "gpt-4-turbo-preview",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are an expert content creator specializing in AEO (Answer Engine Optimization). Create content that is optimized for AI platforms while remaining valuable for human readers."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "response_format": { "type": "json_object" },
                "temperature": 0.7
            }))
            .send()
            .await?;

        if !response.status().is_success() {
            return self.generate_mock_content(prompt);
        }

        let data: serde_json::Value = response.json().await?;
        let content_str = data["choices"][0]["message"]["content"]
            .as_str()
            .unwrap_or("{}");

        let content: serde_json::Value = serde_json::from_str(content_str)?;

        Ok((
            content["title"].as_str().unwrap_or("Generated Content").to_string(),
            content["body"].as_str().unwrap_or("").to_string(),
            content["outline"]
                .as_array()
                .map(|arr| {
                    arr.iter()
                        .filter_map(|v| v.as_str().map(String::from))
                        .collect()
                })
                .unwrap_or_default(),
        ))
    }

    async fn generate_with_claude(&self, prompt: &str) -> Result<(String, String, Vec<String>)> {
        if self.anthropic_api_key.is_empty() {
            return self.generate_mock_content(prompt);
        }

        let response = self
            .client
            .post("https://api.anthropic.com/v1/messages")
            .header("x-api-key", &self.anthropic_api_key)
            .header("anthropic-version", "2023-06-01")
            .json(&json!({
                "model": "claude-3-sonnet-20240229",
                "max_tokens": 4096,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            }))
            .send()
            .await?;

        if !response.status().is_success() {
            return self.generate_mock_content(prompt);
        }

        let data: serde_json::Value = response.json().await?;
        let content_str = data["content"][0]["text"]
            .as_str()
            .unwrap_or("{}");

        let content: serde_json::Value = serde_json::from_str(content_str)?;

        Ok((
            content["title"].as_str().unwrap_or("Generated Content").to_string(),
            content["body"].as_str().unwrap_or("").to_string(),
            content["outline"]
                .as_array()
                .map(|arr| {
                    arr.iter()
                        .filter_map(|v| v.as_str().map(String::from))
                        .collect()
                })
                .unwrap_or_default(),
        ))
    }

    fn generate_mock_content(&self, _prompt: &str) -> Result<(String, String, Vec<String>)> {
        // Mock content for testing when API keys are not available
        Ok((
            "AI-Generated Content: Understanding AEO".to_string(),
            r#"# Understanding Answer Engine Optimization (AEO)

## What is AEO?

Answer Engine Optimization (AEO) is the practice of optimizing content to appear in AI-powered answer engines like ChatGPT, Claude, Perplexity, Google Gemini, and Bing Chat.

## Key Principles

### 1. Structured Content
Content should be well-organized with clear headings and subheadings that guide both AI and human readers.

### 2. Direct Answers
Provide concise, direct answers to common questions at the beginning of sections.

### 3. Citations and Sources
Include authoritative sources and citations to build credibility with AI platforms.

## Implementation Strategies

1. **Use Schema.org markup** for structured data
2. **Create FAQ sections** for common queries
3. **Optimize for featured snippets** with concise answers
4. **Build topical authority** through comprehensive coverage

## Platform-Specific Optimization

Different AI platforms have different preferences:
- ChatGPT prefers clear structure and examples
- Claude values depth and nuance
- Perplexity prioritizes citations
- Gemini favors multimedia integration

## Conclusion

AEO is becoming essential for content visibility in the age of AI. By following these principles, you can ensure your content is discovered and cited by AI platforms.
"#.to_string(),
            vec![
                "What is AEO?".to_string(),
                "Key Principles".to_string(),
                "Implementation Strategies".to_string(),
                "Platform-Specific Optimization".to_string(),
                "Conclusion".to_string(),
            ],
        ))
    }

    fn get_platform_guidance(&self, platform: &str) -> &str {
        match platform.to_lowercase().as_str() {
            "chatgpt" => {
                "ChatGPT Optimization:
- Use clear structure with numbered lists and bullet points
- Include concrete examples and code snippets
- Provide step-by-step instructions
- Use descriptive headings
- Include practical use cases"
            }
            "claude" => {
                "Claude Optimization:
- Provide comprehensive, nuanced content
- Include context and background information
- Use well-structured arguments
- Incorporate multiple perspectives
- Focus on depth over brevity"
            }
            "perplexity" => {
                "Perplexity Optimization:
- Include authoritative citations and sources
- Use data and statistics
- Reference recent research
- Provide verifiable facts
- Link to credible external sources"
            }
            "gemini" => {
                "Google Gemini Optimization:
- Integrate multimedia elements
- Include local and geographic relevance
- Use conversational language
- Provide visual descriptions
- Incorporate multimodal content"
            }
            "bing" => {
                "Bing Chat Optimization:
- Use clear, concise language
- Include recent, fresh content
- Provide authoritative information
- Use proper schema markup
- Optimize for featured snippets"
            }
            _ => "General AEO best practices",
        }
    }
}
