import axios from 'axios';

const AEOWEB_BASE_URL = import.meta.env.VITE_AEOWEB_URL || 'http://localhost:4000';
const CONTENT_SERVICE_URL = import.meta.env.VITE_CONTENT_SERVICE_URL || 'http://localhost:8082';
const AEO_SERVICE_URL = import.meta.env.VITE_AEO_SERVICE_URL || 'http://localhost:4002';
const SEARCH_SERVICE_URL = import.meta.env.VITE_SEARCH_SERVICE_URL || 'http://localhost:8084';
const ANALYTICS_SERVICE_URL = import.meta.env.VITE_ANALYTICS_SERVICE_URL || 'http://localhost:8083';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  subcategory: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  inStock: boolean;
  inventory: number;
  colors: string[];
  sizes: string[];
  images: string[];
  shortDescription: string;
  baseDescription: string;
  features: string[];
  specifications: Record<string, string>;
  aeoOptimized: Record<string, AEOOptimization>;
  reviews: ProductReviews;
  tags: string[];
}

export interface AEOOptimization {
  title: string;
  content: string;
  score: number;
  lastOptimized: string;
}

export interface ProductReviews {
  average: number;
  count: number;
  distribution: Record<string, number>;
}

export interface AEOScore {
  overallScore: number;
  structureScore: number;
  qualityScore: number;
  platformScore: number;
  readabilityScore: number;
  improvements: string[];
}

// Content Service - Product Management
export const contentService = {
  async getAllProducts(): Promise<Product[]> {
    const { data } = await axios.get(`${CONTENT_SERVICE_URL}/content`, {
      params: { contentType: 'product', brand: 'Valentin Shop' },
    });
    return data;
  },

  async getProduct(id: string): Promise<Product> {
    const { data } = await axios.get(`${CONTENT_SERVICE_URL}/content/${id}`);
    return data;
  },

  async getProductsByCategory(category: string): Promise<Product[]> {
    const { data } = await axios.get(`${CONTENT_SERVICE_URL}/content`, {
      params: { contentType: 'product', category },
    });
    return data;
  },
};

// AEO Service - Optimization & Scoring
export const aeoService = {
  async getAEOScore(contentId: string, platform: string): Promise<AEOScore> {
    const { data } = await axios.post(`${AEO_SERVICE_URL}/optimize`, {
      contentId,
      platform,
    });
    return data;
  },

  async optimizeAllPlatforms(contentId: string): Promise<Record<string, AEOScore>> {
    const platforms = ['CHATGPT', 'CLAUDE', 'PERPLEXITY', 'GEMINI', 'BING'];
    const results: Record<string, AEOScore> = {};

    await Promise.all(
      platforms.map(async (platform) => {
        const score = await this.getAEOScore(contentId, platform);
        results[platform] = score;
      })
    );

    return results;
  },

  async getCitations(contentId: string) {
    const { data } = await axios.get(`${AEO_SERVICE_URL}/citations/${contentId}`);
    return data;
  },
};

// Search Service - Product Discovery
export const searchService = {
  async search(query: string) {
    const { data } = await axios.get(`${SEARCH_SERVICE_URL}/search`, {
      params: { q: query, index: 'products' },
    });
    return data;
  },

  async autocomplete(query: string) {
    const { data } = await axios.get(`${SEARCH_SERVICE_URL}/autocomplete`, {
      params: { q: query, index: 'products' },
    });
    return data;
  },

  async filter(filters: Record<string, any>) {
    const { data } = await axios.post(`${SEARCH_SERVICE_URL}/filter`, {
      index: 'products',
      filters,
    });
    return data;
  },
};

// Analytics Service - Event Tracking
export const analyticsService = {
  async trackEvent(eventType: string, properties: Record<string, any>) {
    await axios.post(`${ANALYTICS_SERVICE_URL}/events`, {
      eventType,
      properties: {
        ...properties,
        brand: 'Valentin Shop',
        timestamp: new Date().toISOString(),
      },
    });
  },

  async trackProductView(productId: string) {
    await this.trackEvent('product_view', { productId });
  },

  async trackAddToCart(productId: string, quantity: number) {
    await this.trackEvent('add_to_cart', { productId, quantity });
  },

  async trackPurchase(orderId: string, total: number, items: any[]) {
    await this.trackEvent('purchase', { orderId, total, items });
  },

  async getMetrics() {
    const { data } = await axios.get(`${ANALYTICS_SERVICE_URL}/metrics`);
    return data;
  },
};

// GraphQL queries for advanced features
export const graphqlQueries = {
  GET_PRODUCTS: `
    query GetProducts($limit: Int, $offset: Int) {
      content(contentType: PRODUCT, limit: $limit, offset: $offset) {
        id
        title
        body
        metadata
        createdAt
        updatedAt
      }
    }
  `,

  GET_AEO_SCORES: `
    query GetAEOScores($contentId: ID!) {
      aeoScores(contentId: $contentId) {
        id
        platform
        overallScore
        structureScore
        qualityScore
        platformScore
        readabilityScore
        createdAt
      }
    }
  `,
};

export async function queryGraphQL(query: string, variables?: Record<string, any>) {
  const { data } = await axios.post(`${AEOWEB_BASE_URL}/graphql`, {
    query,
    variables,
  });
  return data;
}
