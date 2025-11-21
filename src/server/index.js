import express from 'express';
import { Pool } from 'pg';
import path from 'path';

const app = express();
const port = 3001;

// Middleware
app.use(express.json());

// Get database credentials from environment variables
const databaseUrl = process.env.DATABASE_URL || 'postgresql://admin:password123@localhost:5432/market_sync';
const pool = new Pool({
  connectionString: databaseUrl,
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API server is running' });
});

// Dashboard data endpoint
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const client = await pool.connect();

    // Get counts for dashboard
    const productsCount = await client.query('SELECT COUNT(*) as count FROM products');
    const ordersCount = await client.query("SELECT COUNT(*) as count FROM orders WHERE status IN ('pending', 'processing', 'shipped')");
    const lowStockCount = await client.query("SELECT COUNT(*) as count FROM inventory WHERE status = 'low_stock'");
    const channelsCount = await client.query('SELECT COUNT(*) as count FROM marketplaces');

    client.release();

    res.json({
      totalProducts: parseInt(productsCount.rows[0].count),
      activeOrders: parseInt(ordersCount.rows[0].count),
      lowStockCount: parseInt(lowStockCount.rows[0].count),
      connectedChannels: parseInt(channelsCount.rows[0].count),
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Recent orders endpoint
app.get('/api/dashboard/recent-orders', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5');
    client.release();

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    res.status(500).json({ error: 'Failed to fetch recent orders' });
  }
});

// Low stock products endpoint
app.get('/api/dashboard/low-stock', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT * FROM inventory WHERE status = 'low_stock' LIMIT 5");
    client.release();

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    res.status(500).json({ error: 'Failed to fetch low stock products' });
  }
});

// Order status data endpoint
app.get('/api/dashboard/order-status', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT status, COUNT(*) as count 
      FROM orders 
      GROUP BY status
    `);
    client.release();

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching order status data:', error);
    res.status(500).json({ error: 'Failed to fetch order status data' });
  }
});

// Channel data endpoint
app.get('/api/dashboard/channels', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT m.name, COUNT(o.id) as order_count
      FROM marketplaces m
      LEFT JOIN orders o ON m.id = o.marketplace_id
      GROUP BY m.id, m.name
    `);
    client.release();

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching channel data:', error);
    res.status(500).json({ error: 'Failed to fetch channel data' });
  }
});

// Sales trend data endpoint
app.get('/api/dashboard/sales-trend', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT 
        TO_CHAR(created_at, 'Dy') as day,
        SUM(total) as sales
      FROM orders 
      WHERE status = 'delivered'
      AND created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY TO_CHAR(created_at, 'Dy')
      ORDER BY TO_CHAR(created_at, 'Dy')
    `);
    client.release();

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sales trend data:', error);
    res.status(500).json({ error: 'Failed to fetch sales trend data' });
  }
});

// List marketplaces (used by frontend)
app.get('/api/marketplaces', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM marketplaces ORDER BY name');
    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching marketplaces:', error);
    res.status(500).json({ error: 'Failed to fetch marketplaces' });
  }
});

// Sync marketplace endpoint - triggers server-side Shopify sync
app.post('/api/sync/:id', async (req, res) => {
  const marketplaceId = req.params.id;

  try {
    const client = await pool.connect();
    const mpRes = await client.query('SELECT * FROM marketplaces WHERE id = $1', [marketplaceId]);
    if (mpRes.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: 'Marketplace not found' });
    }

    const marketplace = mpRes.rows[0];

    if (marketplace.type !== 'shopify') {
      client.release();
      return res.status(400).json({ error: 'Only Shopify marketplaces supported by this endpoint' });
    }

    // Perform Shopify sync using server-side fetch and DB
    const SHOPIFY_STORE_URL = process.env.VITE_SHOPIFY_STORE_URL || process.env.SHOPIFY_STORE_URL;
    const SHOPIFY_ADMIN_API_TOKEN = process.env.VITE_SHOPIFY_ADMIN_API_TOKEN || process.env.SHOPIFY_ADMIN_API_TOKEN;

    if (!SHOPIFY_STORE_URL || !SHOPIFY_ADMIN_API_TOKEN) {
      client.release();
      return res.status(500).json({ error: 'Shopify credentials not configured on server' });
    }

    // Helper to fetch Shopify Admin endpoints
    const shopifyFetch = async (path, opts = {}) => {
      const url = `https://${SHOPIFY_STORE_URL.replace(/\/$/, '').replace(/^https?:\/\//, '')}/admin/api/2023-10${path}`;
      const headers = {
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_TOKEN,
        'Content-Type': 'application/json',
        ...(opts.headers || {}),
      };
      const response = await fetch(url, { method: opts.method || 'GET', headers, body: opts.body });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Shopify API error ${response.status}: ${text}`);
      }
      return response.json();
    };

    // Sync products (basic implementation)
    let syncedProducts = 0;
    let sinceId;
    let hasMore = true;

    while (hasMore) {
      const query = `?limit=50${sinceId ? `&since_id=${sinceId}` : ''}&fields=id,title,variants,images,body_html,status,created_at,updated_at`;
      const data = await shopifyFetch(`/products.json${query}`);
      const products = data.products || [];
      if (products.length === 0) break;

      for (const product of products) {
        try {
          const sku = (product.variants && product.variants[0] && product.variants[0].sku) || `SHOPIFY-${product.id}`;
          const base_price = parseFloat(product.variants?.[0]?.price || '0');
          // Upsert product
          const existing = await client.query('SELECT id FROM products WHERE sku = $1', [sku]);
          if (existing.rows.length > 0) {
            await client.query('UPDATE products SET name=$1, description=$2, base_price=$3, status=$4, updated_at=NOW() WHERE id=$5', [product.title, product.body_html || '', base_price, product.status === 'active' ? 'active' : 'inactive', existing.rows[0].id]);
          } else {
            await client.query('INSERT INTO products(name, description, sku, base_price, status, created_at, updated_at) VALUES($1,$2,$3,$4,$5,NOW(),NOW())', [product.title, product.body_html || '', sku, base_price, product.status === 'active' ? 'active' : 'inactive']);
          }

          // Sync inventory for variants
          if (product.variants) {
            for (const variant of product.variants) {
              const variantSku = variant.sku || sku;
              const prodRes = await client.query('SELECT id FROM products WHERE sku = $1', [variantSku]);
              if (prodRes.rows.length === 0) continue;
              const productId = prodRes.rows[0].id;
              // Upsert inventory record for this marketplace
              const invRes = await client.query('SELECT id FROM inventory WHERE product_id = $1 AND marketplace_id = $2', [productId, marketplaceId]);
              if (invRes.rows.length > 0) {
                await client.query('UPDATE inventory SET quantity=$1, price=$2, updated_at=NOW() WHERE id=$3', [variant.inventory_quantity || 0, parseFloat(variant.price || '0'), invRes.rows[0].id]);
              } else {
                await client.query('INSERT INTO inventory(product_id, marketplace_id, quantity, price, created_at, updated_at) VALUES($1,$2,$3,$4,NOW(),NOW())', [productId, marketplaceId, variant.inventory_quantity || 0, parseFloat(variant.price || '0')]);
              }
            }
          }

          syncedProducts++;
        } catch (err) {
          console.error('Product sync error:', err);
        }
      }

      hasMore = products.length === 50;
      if (hasMore) {
        sinceId = products[products.length - 1].id;
      }
    }

    // Sync orders (basic implementation)
    let syncedOrders = 0;
    sinceId = undefined;
    hasMore = true;

    while (hasMore) {
      const query = `?limit=50${sinceId ? `&since_id=${sinceId}` : ''}`;
      const data = await shopifyFetch(`/orders.json${query}`);
      const orders = data.orders || [];
      if (orders.length === 0) break;

      for (const order of orders) {
        try {
          const existing = await client.query('SELECT id FROM orders WHERE order_number = $1', [order.name]);
          if (existing.rows.length > 0) continue;

          const status = (order.fulfillment_status === 'fulfilled') ? 'delivered' : (order.fulfillment_status === 'partial') ? 'shipped' : 'pending';
          const customer_name = order.customer ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() : (order.billing_address ? order.billing_address.name : 'Unknown');

          const insertRes = await client.query('INSERT INTO orders(order_number, marketplace_id, total, subtotal, tax, shipping_cost, status, customer_name, customer_email, shipping_address, payment_status, created_at, updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW()) RETURNING id', [order.name, marketplaceId, parseFloat(order.total_price || '0'), parseFloat(order.subtotal_price || '0'), parseFloat(order.total_tax || '0'), parseFloat(order.shipping_lines?.[0]?.price || '0'), status, customer_name, order.email || null, order.shipping_address ? JSON.stringify(order.shipping_address) : null, order.payment_status || 'paid']);
          const newOrderId = insertRes.rows[0].id;

          // Insert order items
          if (order.line_items) {
            for (const item of order.line_items) {
              // Find product by SKU
              const prodRes = await client.query('SELECT id FROM products WHERE sku = $1', [item.sku]);
              if (prodRes.rows.length === 0) continue;
              const productId = prodRes.rows[0].id;
              await client.query('INSERT INTO order_items(order_id, product_id, quantity, unit_price, total_price, created_at, updated_at) VALUES($1,$2,$3,$4,$5,NOW(),NOW())', [newOrderId, productId, item.quantity, parseFloat(item.price || '0'), parseFloat((item.quantity * parseFloat(item.price || '0')) || 0)]);
            }
          }

          syncedOrders++;
        } catch (err) {
          console.error('Order sync error:', err);
        }
      }

      hasMore = orders.length === 50;
      if (hasMore) {
        sinceId = orders[orders.length - 1].id;
      }
    }

    // Update marketplace last_sync
    await client.query('UPDATE marketplaces SET last_sync = NOW() WHERE id = $1', [marketplaceId]);

    client.release();
    res.json({ success: true, message: `Synced ${syncedProducts} products and ${syncedOrders} orders` });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Sync failed', detail: error.message || String(error) });
  }
});

// Get single product endpoint
app.get('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM products WHERE id = $1', [id]);
    client.release();
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Suppliers API endpoints
app.get('/api/suppliers', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM suppliers ORDER BY name');
    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// Get product inventory endpoint
app.get('/api/products/:id/inventory', async (req, res) => {
  const { id } = req.params;
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT i.*, m.name as marketplace_name
      FROM inventory i
      LEFT JOIN marketplaces m ON i.marketplace_id = m.id
      WHERE i.product_id = $1
    `, [id]);
    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching product inventory:', error);
    res.status(500).json({ error: 'Failed to fetch product inventory' });
  }
});

// Get product sales history endpoint
app.get('/api/products/:id/sales', async (req, res) => {
  const { id } = req.params;
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT oi.*, o.order_number, o.created_at, o.status, m.name as marketplace_name
      FROM order_items oi
      LEFT JOIN orders o ON oi.order_id = o.id
      LEFT JOIN marketplaces m ON o.marketplace_id = m.id
      WHERE oi.product_id = $1
      ORDER BY o.created_at DESC
    `, [id]);
    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching product sales:', error);
    res.status(500).json({ error: 'Failed to fetch product sales' });
  }
});
// Products API endpoints
app.get('/api/products', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM products ORDER BY name');
    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/products', async (req, res) => {
  const { name, description, sku, base_price, status } = req.body;
  try {
    const client = await pool.connect();
    const result = await client.query(
      'INSERT INTO products (name, description, sku, base_price, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *',
      [name, description, sku, base_price, status]
    );
    client.release();
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, sku, base_price, status } = req.body;
  try {
    const client = await pool.connect();
    const result = await client.query(
      'UPDATE products SET name = $1, description = $2, sku = $3, base_price = $4, status = $5, updated_at = NOW() WHERE id = $6 RETURNING *',
      [name, description, sku, base_price, status, id]
    );
    client.release();
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const client = await pool.connect();
    await client.query('DELETE FROM products WHERE id = $1', [id]);
    client.release();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Orders API endpoints
app.get('/api/orders', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM orders ORDER BY created_at DESC');
    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const client = await pool.connect();
    const result = await client.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );
    client.release();
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Inventory API endpoints
app.get('/api/inventory', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT i.*, p.name as product_name, p.sku, m.name as marketplace_name
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      JOIN marketplaces m ON i.marketplace_id = m.id
      ORDER BY p.name
    `);
    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

app.post('/api/inventory', async (req, res) => {
  const { product_id, marketplace_id, quantity, price } = req.body;
  try {
    const client = await pool.connect();
    const result = await client.query(
      'INSERT INTO inventory (product_id, marketplace_id, quantity, price, last_updated) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
      [product_id, marketplace_id, quantity, price]
    );
    client.release();
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating inventory:', error);
    res.status(500).json({ error: 'Failed to create inventory record' });
  }
});

app.put('/api/inventory/:id', async (req, res) => {
  const { id } = req.params;
  const { quantity, price } = req.body;
  try {
    const client = await pool.connect();
    const result = await client.query(
      'UPDATE inventory SET quantity = $1, price = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [quantity, price, id]
    );
    client.release();
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory record not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ error: 'Failed to update inventory' });
  }
});

// Categories API endpoints
app.get('/api/categories', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM categories ORDER BY name');
    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.post('/api/categories', async (req, res) => {
  const { name, description } = req.body;
  try {
    const client = await pool.connect();
    const result = await client.query(
      'INSERT INTO categories (name, description, created_at) VALUES ($1, $2, NOW()) RETURNING *',
      [name, description]
    );
    client.release();
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    const client = await pool.connect();
    const result = await client.query(
      'UPDATE categories SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description, id]
    );
    client.release();
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const client = await pool.connect();
    await client.query('DELETE FROM categories WHERE id = $1', [id]);
    client.release();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Analytics data endpoints
app.get('/api/analytics/overview', async (req, res) => {
  try {
    const client = await pool.connect();

    const totalProducts = await client.query('SELECT COUNT(*) as count FROM products');
    const totalOrders = await client.query('SELECT COUNT(*) as count FROM orders');
    const totalRevenue = await client.query('SELECT SUM(total) as revenue FROM orders WHERE status = \'delivered\'');
    const lowStockItems = await client.query('SELECT COUNT(*) as count FROM inventory WHERE quantity <= 10');

    client.release();

    res.json({
      totalProducts: parseInt(totalProducts.rows[0].count),
      totalOrders: parseInt(totalOrders.rows[0].count),
      totalRevenue: parseFloat(totalRevenue.rows[0].revenue || 0),
      lowStockItems: parseInt(lowStockItems.rows[0].count),
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// Stock adjustments endpoint
app.post('/api/inventory/adjust', async (req, res) => {
  const { product_id, marketplace_id, adjustment_type, quantity, reason } = req.body;
  try {
    const client = await pool.connect();

    // Get current inventory
    const currentInv = await client.query(
      'SELECT quantity FROM inventory WHERE product_id = $1 AND marketplace_id = $2',
      [product_id, marketplace_id]
    );

    if (currentInv.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: 'Inventory record not found' });
    }

    const currentQuantity = currentInv.rows[0].quantity;
    const newQuantity = adjustment_type === 'increase' ? currentQuantity + quantity : currentQuantity - quantity;

    // Update inventory
    await client.query(
      'UPDATE inventory SET quantity = $1, updated_at = NOW() WHERE product_id = $2 AND marketplace_id = $3',
      [newQuantity, product_id, marketplace_id]
    );

    // Log adjustment
    await client.query(
      'INSERT INTO stock_adjustments (product_id, marketplace_id, adjustment_type, quantity, reason, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
      [product_id, marketplace_id, adjustment_type, quantity, reason]
    );

    client.release();
    res.json({ success: true, newQuantity });
  } catch (error) {
    console.error('Error adjusting stock:', error);
    res.status(500).json({ error: 'Failed to adjust stock' });
  }
});

// Get stock adjustments endpoint
app.get('/api/stock-adjustments', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT sa.*, p.name as product_name, p.sku, m.name as marketplace_name
      FROM stock_adjustments sa
      LEFT JOIN products p ON sa.product_id = p.id
      LEFT JOIN marketplaces m ON sa.marketplace_id = m.id
      ORDER BY sa.created_at DESC
    `);
    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stock adjustments:', error);
    res.status(500).json({ error: 'Failed to fetch stock adjustments' });
  }
});

// Add marketplace endpoint
app.post('/api/marketplaces', async (req, res) => {
  const { name, type, store_url } = req.body;
  try {
    const client = await pool.connect();
    const result = await client.query(
      'INSERT INTO marketplaces (name, type, store_url, status, connected_at, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW()) RETURNING *',
      [name, type, store_url, 'active']
    );
    client.release();
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating marketplace:', error);
    res.status(500).json({ error: 'Failed to create marketplace' });
  }
});

// Bulk upload products endpoint
app.post('/api/products/bulk-upload', async (req, res) => {
  const { products } = req.body;

  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'Products array is required' });
  }

  try {
    const client = await pool.connect();
    const results = {
      successful: 0,
      failed: 0,
      errors: [],
    };

    for (const product of products) {
      try {
        const { name, sku, description, base_price, cost_price, weight, category_id, supplier_id } = product;

        // Validate required fields
        if (!name || !sku || !base_price) {
          results.failed++;
          results.errors.push(`Product ${JSON.stringify(product)}: Missing required fields (name, sku, base_price)`);
          continue;
        }

        // Check if SKU already exists
        const existing = await client.query('SELECT id FROM products WHERE sku = $1', [sku]);
        if (existing.rows.length > 0) {
          results.failed++;
          results.errors.push(`Product ${sku}: SKU already exists`);
          continue;
        }

        // Insert product
        await client.query(
          'INSERT INTO products (name, sku, description, base_price, cost_price, weight, category_id, supplier_id, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())',
          [name, sku, description || '', parseFloat(base_price), cost_price ? parseFloat(cost_price) : null, weight ? parseFloat(weight) : null, category_id || null, supplier_id || null, 'active']
        );

        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Product ${product.sku || 'unknown'}: ${error.message}`);
      }
    }

    client.release();
    res.json(results);
  } catch (error) {
    console.error('Error in bulk upload:', error);
    res.status(500).json({ error: 'Bulk upload failed', details: error.message });
  }
});
// Returns endpoint
app.get('/api/orders/returns', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT o.*, m.name as marketplace_name
      FROM orders o
      LEFT JOIN marketplaces m ON o.marketplace_id = m.id
      WHERE o.status = 'returned'
      ORDER BY o.created_at DESC
    `);
    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching returns:', error);
    res.status(500).json({ error: 'Failed to fetch returns' });
  }
});
// Shipped orders endpoint
app.get('/api/orders/shipped', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT o.*, m.name as marketplace_name
      FROM orders o
      LEFT JOIN marketplaces m ON o.marketplace_id = m.id
      WHERE o.status = 'shipped'
      ORDER BY o.created_at DESC
    `);
    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching shipped orders:', error);
    res.status(500).json({ error: 'Failed to fetch shipped orders' });
  }
});
// Pending orders endpoint
app.get('/api/orders/pending', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT o.*, m.name as marketplace_name
      FROM orders o
      LEFT JOIN marketplaces m ON o.marketplace_id = m.id
      WHERE o.status = 'pending'
      ORDER BY o.created_at DESC
    `);
    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching pending orders:', error);
    res.status(500).json({ error: 'Failed to fetch pending orders' });
  }
});
// Analytics API endpoint
app.get('/api/analytics', async (req, res) => {
  try {
    const client = await pool.connect();

    // Get sales data for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesQuery = `
      SELECT
        DATE(created_at) as date,
        SUM(total) as sales,
        COUNT(*) as order_count
      FROM orders
      WHERE created_at >= $1 AND status = 'delivered'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at)
    `;
    const salesResult = await client.query(salesQuery, [thirtyDaysAgo.toISOString()]);

    const salesData = salesResult.rows.map(row => ({
      date: new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sales: Math.round(parseFloat(row.sales)),
      orders: parseInt(row.order_count)
    }));

    // Get top products
    const topProductsQuery = `
      SELECT
        p.name,
        SUM(oi.quantity) as quantity,
        SUM(oi.total_price) as revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'delivered'
      GROUP BY p.id, p.name
      ORDER BY quantity DESC
      LIMIT 5
    `;
    const topProductsResult = await client.query(topProductsQuery);
    const topProducts = topProductsResult.rows.map(row => ({
      name: row.name,
      quantity: parseInt(row.quantity),
      revenue: parseFloat(row.revenue)
    }));

    // Get marketplace data
    const marketplaceQuery = `
      SELECT
        m.name,
        COUNT(o.id) as orders,
        COALESCE(SUM(o.total), 0) as revenue
      FROM marketplaces m
      LEFT JOIN orders o ON m.id = o.marketplace_id AND o.status = 'delivered'
      GROUP BY m.id, m.name
    `;
    const marketplaceResult = await client.query(marketplaceQuery);
    const marketplaceData = marketplaceResult.rows.map(row => ({
      name: row.name,
      orders: parseInt(row.orders),
      revenue: parseFloat(row.revenue)
    }));

    // Get order status distribution
    const statusQuery = `
      SELECT status, COUNT(*) as count
      FROM orders
      GROUP BY status
    `;
    const statusResult = await client.query(statusQuery);
    const orderStatusData = statusResult.rows.map(row => ({
      name: row.status.charAt(0).toUpperCase() + row.status.slice(1),
      value: parseInt(row.count)
    }));

    // Get summary stats
    const totalRevenue = salesData.reduce((sum, item) => sum + item.sales, 0);
    const totalOrders = salesData.reduce((sum, item) => sum + item.orders, 0);

    client.release();

    res.json({
      salesData,
      topProducts,
      marketplaceData,
      orderStatusData,
      summary: {
        totalRevenue,
        totalOrders,
        topProduct: topProducts.length > 0 ? topProducts[0].name : 'N/A',
        topProductSales: topProducts.length > 0 ? topProducts[0].quantity : 0
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
  // Get notifications endpoint
  app.get('/api/notifications', async (req, res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM notifications ORDER BY created_at DESC');
      client.release();
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  // Mark notification as read
  app.put('/api/notifications/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const client = await pool.connect();
      const result = await client.query('UPDATE notifications SET is_read = true WHERE id = $1 RETURNING *', [id]);
      client.release();
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating notification:', error);
      res.status(500).json({ error: 'Failed to update notification' });
    }
  });

  // Mark all as read
  app.put('/api/notifications/mark-all-read', async (req, res) => {
    try {
      const client = await pool.connect();
      await client.query('UPDATE notifications SET is_read = true WHERE is_read = false');
      client.release();
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
  });

  // Start server
  app.listen(port, '0.0.0.0', () => {
    console.log(`API server running on port ${port}`);
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`API server running on port ${port}`);
});