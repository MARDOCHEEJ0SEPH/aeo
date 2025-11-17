/**
 * Elasticsearch Manager
 * Manages Elasticsearch connections for knowledge graph and search
 */

import { Client } from '@elastic/elasticsearch';
import { logger } from '../utils/logger.js';

class ElasticsearchManagerClass {
  constructor() {
    this.client = null;
    this.connected = false;
  }

  /**
   * Connect to Elasticsearch
   */
  async connect() {
    try {
      const elasticsearchUrl = process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200';

      this.client = new Client({
        node: elasticsearchUrl,
        maxRetries: 5,
        requestTimeout: 60000,
        sniffOnStart: false
      });

      // Test connection
      const health = await this.client.cluster.health({});
      logger.info(`Elasticsearch cluster status: ${health.status}`);

      this.connected = true;
      logger.info('✅ Elasticsearch connected successfully');

      // Initialize indices
      await this.initializeIndices();

      return true;
    } catch (error) {
      logger.error('❌ Failed to connect to Elasticsearch:', error);
      throw error;
    }
  }

  /**
   * Initialize Elasticsearch indices
   */
  async initializeIndices() {
    try {
      const indices = [
        {
          name: 'content',
          mappings: {
            properties: {
              title: { type: 'text' },
              content: { type: 'text' },
              keywords: { type: 'keyword' },
              created_at: { type: 'date' },
              deployed_at: { type: 'date' },
              metadata: { type: 'object' }
            }
          }
        },
        {
          name: 'entities',
          mappings: {
            properties: {
              name: { type: 'text' },
              type: { type: 'keyword' },
              properties: { type: 'object' },
              created_at: { type: 'date' }
            }
          }
        },
        {
          name: 'relationships',
          mappings: {
            properties: {
              from_entity: { type: 'keyword' },
              to_entity: { type: 'keyword' },
              relationship_type: { type: 'keyword' },
              weight: { type: 'float' },
              created_at: { type: 'date' }
            }
          }
        },
        {
          name: 'knowledge_graph',
          mappings: {
            properties: {
              concept: { type: 'text' },
              category: { type: 'keyword' },
              related_concepts: { type: 'keyword' },
              metadata: { type: 'object' },
              created_at: { type: 'date' }
            }
          }
        }
      ];

      for (const index of indices) {
        const exists = await this.client.indices.exists({ index: index.name });

        if (!exists) {
          await this.client.indices.create({
            index: index.name,
            body: {
              mappings: index.mappings
            }
          });
          logger.info(`Created Elasticsearch index: ${index.name}`);
        }
      }

      logger.info('✅ Elasticsearch indices initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize Elasticsearch indices:', error);
      throw error;
    }
  }

  /**
   * Index a document
   */
  async index(indexName, document, id = null) {
    try {
      if (!this.connected) {
        throw new Error('Elasticsearch not connected');
      }

      const params = {
        index: indexName,
        body: {
          ...document,
          indexed_at: new Date()
        }
      };

      if (id) {
        params.id = id;
      }

      const result = await this.client.index(params);

      logger.info(`Document indexed in ${indexName}: ${result._id}`);
      return result;
    } catch (error) {
      logger.error(`Failed to index document in ${indexName}:`, error);
      throw error;
    }
  }

  /**
   * Search for documents
   */
  async search(indexName, query) {
    try {
      if (!this.connected) {
        throw new Error('Elasticsearch not connected');
      }

      const result = await this.client.search({
        index: indexName,
        body: query
      });

      return result;
    } catch (error) {
      logger.error(`Failed to search in ${indexName}:`, error);
      return { hits: { hits: [] } };
    }
  }

  /**
   * Get document by ID
   */
  async get(indexName, id) {
    try {
      if (!this.connected) {
        throw new Error('Elasticsearch not connected');
      }

      const result = await this.client.get({
        index: indexName,
        id
      });

      return result._source;
    } catch (error) {
      logger.error(`Failed to get document ${id} from ${indexName}:`, error);
      return null;
    }
  }

  /**
   * Update a document
   */
  async update(indexName, id, doc) {
    try {
      if (!this.connected) {
        throw new Error('Elasticsearch not connected');
      }

      const result = await this.client.update({
        index: indexName,
        id,
        body: {
          doc: {
            ...doc,
            updated_at: new Date()
          }
        }
      });

      logger.info(`Document updated in ${indexName}: ${id}`);
      return result;
    } catch (error) {
      logger.error(`Failed to update document ${id} in ${indexName}:`, error);
      throw error;
    }
  }

  /**
   * Delete a document
   */
  async delete(indexName, id) {
    try {
      if (!this.connected) {
        throw new Error('Elasticsearch not connected');
      }

      const result = await this.client.delete({
        index: indexName,
        id
      });

      logger.info(`Document deleted from ${indexName}: ${id}`);
      return result;
    } catch (error) {
      logger.error(`Failed to delete document ${id} from ${indexName}:`, error);
      throw error;
    }
  }

  /**
   * Bulk index documents
   */
  async bulk(operations) {
    try {
      if (!this.connected) {
        throw new Error('Elasticsearch not connected');
      }

      const result = await this.client.bulk({
        body: operations
      });

      if (result.errors) {
        logger.error('Bulk indexing had errors');
      } else {
        logger.info(`Bulk indexed ${result.items.length} documents`);
      }

      return result;
    } catch (error) {
      logger.error('Failed to bulk index:', error);
      throw error;
    }
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Disconnect from Elasticsearch
   */
  async disconnect() {
    try {
      if (this.client) {
        await this.client.close();
        this.connected = false;
        logger.info('Elasticsearch disconnected');
      }
    } catch (error) {
      logger.error('Error disconnecting from Elasticsearch:', error);
    }
  }
}

// Export singleton instance
export const ElasticsearchManager = new ElasticsearchManagerClass();
export default ElasticsearchManager;
