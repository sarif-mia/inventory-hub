import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { databaseService } from './services/database.js';

// Import routes
import dashboardRoutes from './routes/dashboard.js';
import productsRoutes from './routes/products.js';
import authRoutes from './routes/auth.js';

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

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
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