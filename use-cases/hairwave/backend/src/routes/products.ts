import express from 'express';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let productCatalog: any = null;

async function loadCatalog() {
  if (!productCatalog) {
    const catalogPath = path.join(__dirname, '../../../products/hairwave-catalog.json');
    const data = await readFile(catalogPath, 'utf-8');
    productCatalog = JSON.parse(data);
  }
  return productCatalog;
}

router.get('/', async (req, res) => {
  try {
    const catalog = await loadCatalog();
    const { category, hairType, concern } = req.query;

    let products = catalog.products;

    if (category && category !== 'all') {
      products = products.filter((p: any) => p.category === category);
    }

    if (hairType) {
      products = products.filter((p: any) => p.hairTypes?.includes(hairType));
    }

    if (concern) {
      products = products.filter((p: any) => p.concerns?.includes(concern));
    }

    res.json(products);
  } catch (error) {
    console.error('Error loading products:', error);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const catalog = await loadCatalog();
    const product = catalog.products.find((p: any) => p.id === req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error loading product:', error);
    res.status(500).json({ error: 'Failed to load product' });
  }
});

export default router;
