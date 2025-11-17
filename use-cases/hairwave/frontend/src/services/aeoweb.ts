import axios from 'axios';

const AEOWEB_BASE_URL = import.meta.env.VITE_AEOWEB_URL || 'http://localhost:4000';
const CONTENT_SERVICE_URL = import.meta.env.VITE_CONTENT_SERVICE_URL || 'http://localhost:8082';
const AEO_SERVICE_URL = import.meta.env.VITE_AEO_SERVICE_URL || 'http://localhost:4002';
const SEARCH_SERVICE_URL = import.meta.env.VITE_SEARCH_SERVICE_URL || 'http://localhost:8084';
const ANALYTICS_SERVICE_URL = import.meta.env.VITE_ANALYTICS_SERVICE_URL || 'http://localhost:8083';

export interface Ingredient {
  name: string;
  concentration: string;
  purpose: string;
  benefits: string[];
}

export interface ClinicalStudy {
  studySize: number;
  duration: string;
  results: Array<{
    metric: string;
    percentage: number;
    description: string;
  }>;
  institution: string;
  year: number;
}

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
  images: string[];
  shortDescription: string;
  baseDescription: string;
  hairTypes: string[];
  concerns: string[];
  ingredients: {
    active: Ingredient[];
    inactive: string[];
  };
  clinicalResults: ClinicalStudy;
  usage: string[];
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

// Content Service
export const contentService = {
  async getAllProducts(): Promise<Product[]> {
    const { data } = await axios.get(`${CONTENT_SERVICE_URL}/content`, {
      params: { contentType: 'product', brand: 'Hairwave' },
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

// Search Service
export const searchService = {
  async search(query: string) {
    const { data } = await axios.get(`${SEARCH_SERVICE_URL}/search`, {
      params: { q: query, index: 'products' },
    });
    return data;
  },

  async filterByHairType(hairType: string) {
    const { data } = await axios.post(`${SEARCH_SERVICE_URL}/filter`, {
      index: 'products',
      filters: { hairTypes: hairType },
    });
    return data;
  },

  async filterByConcern(concern: string) {
    const { data } = await axios.post(`${SEARCH_SERVICE_URL}/filter`, {
      index: 'products',
      filters: { concerns: concern },
    });
    return data;
  },
};

// Analytics Service
export const analyticsService = {
  async trackEvent(eventType: string, properties: Record<string, any>) {
    await axios.post(`${ANALYTICS_SERVICE_URL}/events`, {
      eventType,
      properties: {
        ...properties,
        brand: 'Hairwave',
        timestamp: new Date().toISOString(),
      },
    });
  },

  async trackProductView(productId: string) {
    await this.trackEvent('product_view', { productId });
  },

  async trackSubscription(productId: string, frequency: string) {
    await this.trackEvent('subscription_added', { productId, frequency });
  },

  async getMetrics() {
    const { data } = await axios.get(`${ANALYTICS_SERVICE_URL}/metrics`);
    return data;
  },
};
