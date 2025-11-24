import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger.js';
import { databaseService } from './services/database.js';

// Import routes
import dashboardRoutes from './routes/dashboard.js';
import productsRoutes from './routes/products.js';
import authRoutes from './routes/auth.js';

// Import services
import { MyntraService } from './services/myntra.js';

// Import channels
import { MyntraChannel } from './channels/myntra.js';
import { ShopifyChannel } from './channels/shopify.js';

// Import middleware
import { authenticateToken } from './middleware/auth.js';

const app = express();
const port = parseInt(process.env.PORT || '3001', 10);

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('combined')); // Logging
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Swagger UI documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Inventory Hub API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
  },
}));

// JSON format for the Swagger JSON endpoint
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

/**
 * @swagger
 * /api/health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     description: Check API and database health status
 *     responses:
 *       200:
 *         description: API is healthy and database is connected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 message:
 *                   type: string
 *                   example: API server is running
 *                 database:
 *                   type: string
 *                   example: connected
 *       503:
 *         description: Service unavailable - Database connection failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ERROR
 *                 message:
 *                   type: string
 *                   example: Database connection failed
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ERROR
 *                 message:
 *                   type: string
 *                   example: Service unavailable
 */
// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbHealthy = await databaseService.healthCheck();
    if (dbHealthy) {
      res.json({ status: 'OK', message: 'API server is running', database: 'connected' });
    } else {
      res.status(503).json({ status: 'ERROR', message: 'Database connection failed' });
    }
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({ status: 'ERROR', message: 'Service unavailable' });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/products', authenticateToken, productsRoutes);

// Implemented routes
app.get('/api/categories', authenticateToken, async (req, res) => {
  try {
    const categories = await databaseService.getCategories();
    res.json(categories);
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const orders = await databaseService.getOrders();
    res.json(orders);
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.get('/api/orders/pending', authenticateToken, async (req, res) => {
  try {
    const orders = await databaseService.getPendingOrders();
    res.json(orders);
  } catch (error) {
    console.error('Pending orders fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch pending orders' });
  }
});

app.get('/api/orders/shipped', authenticateToken, async (req, res) => {
  try {
    const orders = await databaseService.getShippedOrders();
    res.json(orders);
  } catch (error) {
    console.error('Shipped orders fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch shipped orders' });
  }
});

app.get('/api/orders/returns', authenticateToken, async (req, res) => {
  try {
    const orders = await databaseService.getReturns();
    res.json(orders);
  } catch (error) {
    console.error('Returns fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch returns' });
  }
});

app.get('/api/inventory', authenticateToken, async (req, res) => {
  try {
    const inventory = await databaseService.getInventory();
    res.json(inventory);
  } catch (error) {
    console.error('Inventory fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

app.get('/api/marketplaces', authenticateToken, async (req, res) => {
  try {
    const marketplaces = await databaseService.getMarketplaces();
    res.json(marketplaces);
  } catch (error) {
    console.error('Marketplaces fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch marketplaces' });
  }
});

app.post('/api/marketplaces', authenticateToken, async (req, res) => {
  try {
    const marketplaceData = req.body;
    const marketplace = await databaseService.createMarketplace(marketplaceData);
    res.json(marketplace);
  } catch (error) {
    console.error('Marketplace creation error:', error);
    res.status(500).json({ error: 'Failed to create marketplace' });
  }
});

app.delete('/api/marketplaces/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const marketplace = await databaseService.getMarketplace(id);
    
    if (!marketplace) {
      return res.status(404).json({ error: 'Marketplace not found' });
    }

    const deleted = await databaseService.deleteMarketplace(id);
    
    if (deleted) {
      res.json({ success: true, message: 'Marketplace deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete marketplace' });
    }
  } catch (error) {
    console.error('Marketplace deletion error:', error);
    res.status(500).json({ error: 'Failed to delete marketplace' });
  }
});

app.post('/api/sync/:id', authenticateToken, async (req, res) => {
  try {
    const marketplaceId = req.params.id;
    const marketplace = await databaseService.getMarketplace(marketplaceId);

    if (!marketplace) {
      return res.status(404).json({ error: 'Marketplace not found' });
    }

    if (marketplace.type === 'shopify') {
      // Shopify sync
      if (!marketplace.settings) {
        return res.status(400).json({ error: 'Shopify credentials not configured' });
      }

      const settings = typeof marketplace.settings === 'string'
        ? JSON.parse(marketplace.settings)
        : marketplace.settings;

      const shopifyChannel = new ShopifyChannel(marketplaceId, {
        storeUrl: marketplace.store_url || '',
        adminApiToken: settings.adminApiToken
      });
      const result = await shopifyChannel.sync();

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          syncedCount: result.syncedCount,
          errors: result.errors
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.message,
          errors: result.errors
        });
      }
    } else if (marketplace.type === 'myntra') {
      // Myntra sync
      if (!marketplace.settings) {
        return res.status(400).json({ error: 'Myntra credentials not configured' });
      }

      const settings = typeof marketplace.settings === 'string'
        ? JSON.parse(marketplace.settings)
        : marketplace.settings;

      const myntraChannel = new MyntraChannel(marketplaceId, settings);
      const result = await myntraChannel.sync();

      if (result.success) {
        res.json({ message: result.message });
      } else {
        res.status(500).json({ error: result.message });
      }
    } else {
      res.status(400).json({ error: `Sync not supported for marketplace type: ${marketplace.type}` });
    }
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

app.get('/api/suppliers', authenticateToken, async (req, res) => {
  try {
    const suppliers = await databaseService.getSuppliers();
    res.json(suppliers);
  } catch (error) {
    console.error('Suppliers fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const notifications = await databaseService.getNotifications();
    res.json(notifications);
  } catch (error) {
    console.error('Notifications fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Shopify proxy routes (for CORS-free API access)
app.get('/api/shopify/*', async (req, res) => {
  try {
    const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL;
    const SHOPIFY_ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;

    if (!SHOPIFY_STORE_URL || !SHOPIFY_ADMIN_API_TOKEN) {
      return res.status(500).json({ error: 'Shopify credentials not configured' });
    }

    const endpoint = req.path.replace('/api/shopify', '');
    const shopifyUrl = `https://${SHOPIFY_STORE_URL}${endpoint}`;

    console.log('Proxying Shopify request to:', shopifyUrl);

    const response = await fetch(shopifyUrl, {
      method: req.method,
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_TOKEN,
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Shopify proxy error:', error);
    res.status(500).json({ error: 'Failed to proxy Shopify request' });
  }
});

// Myntra-specific routes
app.get('/api/myntra/:marketplaceId/health', authenticateToken, async (req, res) => {
  try {
    const { marketplaceId } = req.params;
    const marketplace = await databaseService.getMarketplace(marketplaceId);

    if (!marketplace || marketplace.type !== 'myntra') {
      return res.status(404).json({ error: 'Myntra marketplace not found' });
    }

    if (!marketplace.settings) {
      return res.status(400).json({ error: 'Myntra credentials not configured' });
    }

    const settings = typeof marketplace.settings === 'string'
      ? JSON.parse(marketplace.settings)
      : marketplace.settings;

    const myntraChannel = new MyntraChannel(marketplaceId, settings);
    const result = await myntraChannel.healthCheck();

    res.json(result);
  } catch (error) {
    console.error('Myntra health check error:', error);
    res.status(500).json({ error: 'Health check failed' });
  }
});

app.post('/api/myntra/:marketplaceId/sync-products', authenticateToken, async (req, res) => {
  try {
    const { marketplaceId } = req.params;
    const marketplace = await databaseService.getMarketplace(marketplaceId);

    if (!marketplace || marketplace.type !== 'myntra') {
      return res.status(404).json({ error: 'Myntra marketplace not found' });
    }

    if (!marketplace.settings) {
      return res.status(400).json({ error: 'Myntra credentials not configured' });
    }

    const settings = typeof marketplace.settings === 'string'
      ? JSON.parse(marketplace.settings)
      : marketplace.settings;

    const myntraChannel = new MyntraChannel(marketplaceId, settings);
    const result = await myntraChannel.syncProducts();

    if (result.success) {
      res.json({
        message: result.message,
        syncedCount: result.syncedCount,
        errors: result.errors
      });
    } else {
      res.status(500).json({
        error: result.message,
        errors: result.errors
      });
    }
  } catch (error) {
    console.error('Myntra products sync error:', error);
    res.status(500).json({ error: 'Products sync failed' });
  }
});

app.post('/api/myntra/:marketplaceId/sync-orders', authenticateToken, async (req, res) => {
  try {
    const { marketplaceId } = req.params;
    const marketplace = await databaseService.getMarketplace(marketplaceId);

    if (!marketplace || marketplace.type !== 'myntra') {
      return res.status(404).json({ error: 'Myntra marketplace not found' });
    }

    if (!marketplace.settings) {
      return res.status(400).json({ error: 'Myntra credentials not configured' });
    }

    const settings = typeof marketplace.settings === 'string'
      ? JSON.parse(marketplace.settings)
      : marketplace.settings;

    const myntraChannel = new MyntraChannel(marketplaceId, settings);
    const result = await myntraChannel.syncOrders();

    if (result.success) {
      res.json({
        message: result.message,
        syncedCount: result.syncedCount,
        errors: result.errors
      });
    } else {
      res.status(500).json({
        error: result.message,
        errors: result.errors
      });
    }
  } catch (error) {
    console.error('Myntra orders sync error:', error);
    res.status(500).json({ error: 'Orders sync failed' });
  }
});

app.post('/api/myntra/:marketplaceId/sync-inventory', authenticateToken, async (req, res) => {
  try {
    const { marketplaceId } = req.params;
    const marketplace = await databaseService.getMarketplace(marketplaceId);

    if (!marketplace || marketplace.type !== 'myntra') {
      return res.status(404).json({ error: 'Myntra marketplace not found' });
    }

    if (!marketplace.settings) {
      return res.status(400).json({ error: 'Myntra credentials not configured' });
    }

    const settings = typeof marketplace.settings === 'string'
      ? JSON.parse(marketplace.settings)
      : marketplace.settings;

    const myntraChannel = new MyntraChannel(marketplaceId, settings);
    const result = await myntraChannel.syncInventory();

    if (result.success) {
      res.json({
        message: result.message,
        syncedCount: result.syncedCount,
        errors: result.errors
      });
    } else {
      res.status(500).json({
        error: result.message,
        errors: result.errors
      });
    }
  } catch (error) {
    console.error('Myntra inventory sync error:', error);
    res.status(500).json({ error: 'Inventory sync failed' });
  }
});

// Test Myntra API connection
app.post('/api/myntra/:marketplaceId/test-connection', authenticateToken, async (req, res) => {
  try {
    const { marketplaceId } = req.params;
    const marketplace = await databaseService.getMarketplace(marketplaceId);

    if (!marketplace || marketplace.type !== 'myntra') {
      return res.status(404).json({ error: 'Myntra marketplace not found' });
    }

    if (!marketplace.settings) {
      return res.status(400).json({ error: 'Myntra credentials not configured' });
    }

    const settings = typeof marketplace.settings === 'string'
      ? JSON.parse(marketplace.settings)
      : marketplace.settings;

    const myntraChannel = new MyntraChannel(marketplaceId, settings);

    // Test health check
    const healthResult = await myntraChannel.healthCheck();

    if (healthResult.success) {
      res.json({
        success: true,
        message: 'Myntra API connection successful',
        latency: healthResult.latency
      });
    } else {
      res.status(500).json({
        success: false,
        message: healthResult.message
      });
    }
  } catch (error) {
    console.error('Myntra connection test error:', error);
    res.status(500).json({
      success: false,
      message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
});

// Analytics routes
app.get('/api/analytics/overview', async (req, res) => {
  try {
    const data = await databaseService.getAnalyticsOverview();
    res.json(data);
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics overview' });
  }
});

app.get('/api/analytics', async (req, res) => {
  try {
    const data = await databaseService.getAnalytics();
    res.json(data);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// API documentation redirect to Swagger UI
app.get('/', (req, res) => {
  res.redirect('/api/docs');
});

// 404 handler for other routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: 'Please check the API documentation at /',
    available: 'GET /'
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await databaseService.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await databaseService.close();
  process.exit(0);
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Inventory Hub API server running on port ${port}`);
  console.log(`📊 Health check available at http://localhost:${port}/api/health`);
});

// Export for testing
export default app;