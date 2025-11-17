use anyhow::Result;
use meilisearch_sdk::{Client, Index};
use crate::models::{IndexContentRequest, SearchDocument};

pub struct SearchIndexer {
    client: Client,
    content_index: Index,
}

impl SearchIndexer {
    pub async fn new(url: &str, api_key: &str) -> Result<Self> {
        let client = Client::new(url, Some(api_key));

        // Get or create content index
        let content_index = client.index("content");

        // Configure searchable attributes
        content_index
            .set_searchable_attributes(&["title", "searchable_text", "body"])
            .await?;

        // Configure filterable attributes
        content_index
            .set_filterable_attributes(&["content_type", "status", "author_id", "published_at"])
            .await?;

        // Configure sortable attributes
        content_index
            .set_sortable_attributes(&["published_at"])
            .await?;

        // Configure ranking rules for AEO optimization
        content_index
            .set_ranking_rules(&[
                "words",
                "typo",
                "proximity",
                "attribute",
                "sort",
                "exactness",
            ])
            .await?;

        tracing::info!("MeiliSearch indexer initialized");

        Ok(Self {
            client,
            content_index,
        })
    }

    pub async fn index_document(&self, doc: &IndexContentRequest) -> Result<()> {
        let search_doc = SearchDocument::from_request(doc);

        self.content_index
            .add_documents(&[search_doc], Some("id"))
            .await?;

        tracing::debug!("Document indexed: {}", doc.id);

        Ok(())
    }

    pub async fn index_batch(&self, docs: Vec<IndexContentRequest>) -> Result<()> {
        let search_docs: Vec<SearchDocument> = docs
            .iter()
            .map(SearchDocument::from_request)
            .collect();

        self.content_index
            .add_documents(&search_docs, Some("id"))
            .await?;

        tracing::info!("Batch indexed: {} documents", docs.len());

        Ok(())
    }

    pub async fn update_document(&self, doc: &IndexContentRequest) -> Result<()> {
        let search_doc = SearchDocument::from_request(doc);

        self.content_index
            .add_or_update(&[search_doc], Some("id"))
            .await?;

        tracing::debug!("Document updated: {}", doc.id);

        Ok(())
    }

    pub async fn delete_document(&self, id: &str) -> Result<()> {
        self.content_index
            .delete_document(id)
            .await?;

        tracing::debug!("Document deleted: {}", id);

        Ok(())
    }

    pub async fn search(
        &self,
        query: &str,
        filters: Option<&str>,
        limit: usize,
        offset: usize,
    ) -> Result<meilisearch_sdk::search::SearchResults<SearchDocument>> {
        let mut search_query = meilisearch_sdk::search::SearchQuery::new(&self.content_index);
        search_query.with_query(query);
        search_query.with_limit(limit);
        search_query.with_offset(offset);

        if let Some(filter) = filters {
            search_query.with_filter(filter);
        }

        // Enable highlighting
        search_query.with_attributes_to_highlight(meilisearch_sdk::search::Selectors::All);
        search_query.with_show_matches_position(true);

        let results = search_query.execute::<SearchDocument>().await?;

        Ok(results)
    }

    pub async fn get_stats(&self) -> Result<serde_json::Value> {
        let stats = self.content_index.get_stats().await?;
        Ok(serde_json::to_value(stats)?)
    }

    pub fn index(&self) -> &Index {
        &self.content_index
    }
}
