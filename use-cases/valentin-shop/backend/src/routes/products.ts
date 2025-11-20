import express from 'express';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendToAEOWEB, getAEOScores, trackAnalytics } from '../utils/aeoweb.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load product catalog
let productCatalog: any = null;

async function loadCatalog() {
  if (!productCatalog) {
    const catalogPath = path.join(__dirname, '../../../products/catalog.json');
    const data = await readFile(catalogPath, 'utf-8');
    productCatalog = JSON.parse(data);
  }
  return productCatalog;
}

// GET /api/products - Get all products
router.get('/', async (req, res) => {
  try {
    const catalog = await loadCatalog();
    const { category, inStock } = req.query;

    let products = catalog.products;

    // Filter by category
    if (category && category !== 'all') {
      products = products.filter((p: any) => p.category === category);
    }

    // Filter by stock
    if (inStock === 'true') {
      products = products.filter((p: any) => p.inStock);
    }

    res.json(products);
  } catch (error) {
    console.error('Error loading products:', error);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req, res) => {
  try {
    const catalog = await loadCatalog();
    const product = catalog.products.find((p: any) => p.id === req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Track product view with analytics service
    await trackAnalytics('product_view', {
      productId: product.id,
      productName: product.name,
      category: product.category,
    });

    res.json(product);
  } catch (error) {
    console.error('Error loading product:', error);
    res.status(500).json({ error: 'Failed to load product' });
  }
});

// POST /api/products/:id/optimize - Optimize product for AEO
router.post('/:id/optimize', async (req, res) => {
  try {
    const catalog = await loadCatalog();
    const product = catalog.products.find((p: any) => p.id === req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Send product content to AEOWEB Content Service
    const contentId = await sendToAEOWEB(product);

    // Get AEO scores from AEO Service
    const aeoScores = await getAEOScores(contentId);

    res.json({
      productId: product.id,
      contentId,
      aeoScores,
    });
  } catch (error) {
    console.error('Error optimizing product:', error);
    res.status(500).json({ error: 'Failed to optimize product' });
  }
});

// GET /api/products/:id/aeo-scores - Get AEO scores for product
router.get('/:id/aeo-scores', async (req, res) => {
  try {
    const catalog = await loadCatalog();
    const product = catalog.products.find((p: any) => p.id === req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product.aeoOptimized);
  } catch (error) {
    console.error('Error loading AEO scores:', error);
    res.status(500).json({ error: 'Failed to load AEO scores' });
  }
});

// POST /api/products/:id/track - Track product event
router.post('/:id/track', async (req, res) => {
  try {
    const { eventType, properties } = req.body;

    await trackAnalytics(eventType, {
      productId: req.params.id,
      ...properties,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking event:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

export default router;
