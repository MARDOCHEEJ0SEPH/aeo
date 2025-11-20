import axios from 'axios';

const CONTENT_SERVICE_URL = process.env.CONTENT_SERVICE_URL || 'http://localhost:8082';
const AEO_SERVICE_URL = process.env.AEO_SERVICE_URL || 'http://localhost:4002';
const ANALYTICS_SERVICE_URL = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:8083';

/**
 * Send product content to AEOWEB Content Service
 */
export async function sendToAEOWEB(product: any): Promise<string> {
  try {
    const response = await axios.post(`${CONTENT_SERVICE_URL}/content`, {
      title: product.name,
      body: product.baseDescription,
      contentType: 'product',
      metadata: {
        brand: 'Valentin Shop',
        category: product.category,
        subcategory: product.subcategory,
        price: product.price,
        sku: product.sku,
        images: product.images,
        features: product.features,
        specifications: product.specifications,
      },
    });

    return response.data.id;
  } catch (error) {
    console.error('Error sending to AEOWEB Content Service:', error);
    throw error;
  }
}

/**
 * Get AEO scores from AEO Service for all platforms
 */
export async function getAEOScores(contentId: string): Promise<Record<string, any>> {
  const platforms = ['CHATGPT', 'CLAUDE', 'PERPLEXITY', 'GEMINI', 'BING'];
  const scores: Record<string, any> = {};

  try {
    await Promise.all(
      platforms.map(async (platform) => {
        const response = await axios.post(`${AEO_SERVICE_URL}/optimize`, {
          contentId,
          platform,
        });
        scores[platform] = response.data;
      })
    );

    return scores;
  } catch (error) {
    console.error('Error getting AEO scores:', error);
    throw error;
  }
}

/**
 * Track analytics event
 */
export async function trackAnalytics(eventType: string, properties: Record<string, any>): Promise<void> {
  try {
    await axios.post(`${ANALYTICS_SERVICE_URL}/events`, {
      eventType,
      properties: {
        ...properties,
        brand: 'Valentin Shop',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    // Don't throw on analytics errors, just log them
    console.error('Error tracking analytics:', error);
  }
}

/**
 * Get analytics metrics
 */
export async function getMetrics(): Promise<any> {
  try {
    const response = await axios.get(`${ANALYTICS_SERVICE_URL}/metrics`, {
      params: { brand: 'Valentin Shop' },
    });
    return response.data;
  } catch (error) {
    console.error('Error getting metrics:', error);
    throw error;
  }
}
