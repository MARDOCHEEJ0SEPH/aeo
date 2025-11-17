use asa_models::aeo::schema::{
    ArticleSchema, FAQPageSchema, HowToSchema, SchemaType,
};
use chrono::{DateTime, Utc};
use uuid::Uuid;

pub struct SchemaGenerator;

impl SchemaGenerator {
    pub fn new() -> Self {
        Self
    }

    pub fn generate_article_schema(
        &self,
        title: &str,
        body: &str,
        author_name: &str,
        published_at: DateTime<Utc>,
        updated_at: DateTime<Utc>,
    ) -> serde_json::Value {
        let mut schema = ArticleSchema::new(
            title.to_string(),
            self.extract_description(body),
            published_at.to_rfc3339(),
            updated_at.to_rfc3339(),
        );

        schema.set_author(author_name.to_string());
        schema.to_json_ld()
    }

    pub fn generate_faq_schema(&self, questions: Vec<(String, String)>) -> serde_json::Value {
        let mut schema = FAQPageSchema::new();

        for (question, answer) in questions {
            schema.add_question(question, answer);
        }

        schema.to_json_ld()
    }

    pub fn generate_howto_schema(
        &self,
        name: &str,
        description: &str,
        steps: Vec<String>,
    ) -> serde_json::Value {
        let mut schema = HowToSchema::new(name.to_string(), description.to_string());

        for step in steps {
            schema.add_step(step);
        }

        schema.to_json_ld()
    }

    fn extract_description(&self, body: &str) -> String {
        // Extract first 160 characters as description
        let text = body
            .lines()
            .filter(|line| !line.starts_with('#'))
            .collect::<Vec<_>>()
            .join(" ");

        text.chars().take(160).collect::<String>() + "..."
    }

    pub fn extract_faqs_from_content(&self, content: &str) -> Vec<(String, String)> {
        let mut faqs = Vec::new();
        let lines: Vec<&str> = content.lines().collect();

        for i in 0..lines.len() {
            let line = lines[i].trim();

            // Look for question patterns
            if line.ends_with('?') && !line.is_empty() {
                // Get the next few lines as the answer
                let mut answer = String::new();
                for j in (i + 1)..lines.len().min(i + 5) {
                    let ans_line = lines[j].trim();
                    if ans_line.is_empty() || ans_line.ends_with('?') {
                        break;
                    }
                    answer.push_str(ans_line);
                    answer.push(' ');
                }

                if !answer.is_empty() {
                    faqs.push((
                        line.trim_start_matches(&['#', ' ', '*', '-'][..]).to_string(),
                        answer.trim().to_string(),
                    ));
                }
            }
        }

        faqs
    }

    pub fn extract_steps_from_content(&self, content: &str) -> Vec<String> {
        let mut steps = Vec::new();

        for line in content.lines() {
            let trimmed = line.trim();

            // Look for numbered steps
            if trimmed.starts_with(|c: char| c.is_numeric()) {
                if let Some(pos) = trimmed.find('.') {
                    let step = trimmed[pos + 1..].trim();
                    if !step.is_empty() {
                        steps.push(step.to_string());
                    }
                }
            }
        }

        steps
    }
}

impl Default for SchemaGenerator {
    fn default() -> Self {
        Self::new()
    }
}
