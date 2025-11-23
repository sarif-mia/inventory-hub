import { Router } from 'express';
import { databaseService } from '../services/database.js';
import { CreateProductData, UpdateProductData } from '../types/database';

const router = Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await databaseService.getProducts();
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await databaseService.getProduct(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create product
router.post('/', async (req, res) => {
  try {
    const productData: CreateProductData = req.body;
    const product = await databaseService.createProduct(productData);
    res.json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const productData: UpdateProductData = req.body;
    const product = await databaseService.updateProduct(id, productData);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await databaseService.deleteProduct(id);

    if (!success) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Bulk upload products
router.post('/bulk-upload', async (req, res) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Products array is required' });
    }

    const results = await databaseService.bulkUploadProducts(products);
    res.json(results);
  } catch (error) {
    console.error('Error in bulk upload:', error);
    res.status(500).json({ error: 'Bulk upload failed', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get product inventory
router.get('/:id/inventory', async (req, res) => {
  try {
    const { id } = req.params;
    // This would need to be implemented in the database service
    // For now, return empty array
    res.json([]);
  } catch (error) {
    console.error('Error fetching product inventory:', error);
    res.status(500).json({ error: 'Failed to fetch product inventory' });
  }
});

// Get product sales history
router.get('/:id/sales', async (req, res) => {
  try {
    const { id } = req.params;
    // This would need to be implemented in the database service
    // For now, return empty array
    res.json([]);
  } catch (error) {
    console.error('Error fetching product sales:', error);
    res.status(500).json({ error: 'Failed to fetch product sales' });
  }
});

export default router;