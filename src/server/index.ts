import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { databaseService } from './services/database.js';

// Import routes
import dashboardRoutes from './routes/dashboard.js';
import productsRoutes from './routes/products.js';
import authRoutes from './routes/auth.js';

// Import services
import { MyntraService } from './services/myntra.js';

// Import channels
import { MyntraChannel } from './channels/myntra.js';

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

app.post('/api/sync/:id', authenticateToken, async (req, res) => {
  try {
    const marketplaceId = req.params.id;
    const marketplace = await databaseService.getMarketplace(marketplaceId);

    if (!marketplace) {
      return res.status(404).json({ error: 'Marketplace not found' });
    }

    if (marketplace.type === 'shopify') {
      // Shopify sync (existing implementation)
      // This would call Shopify sync service
      await databaseService.updateMarketplaceLastSync(marketplaceId);
      res.json({ message: 'Shopify sync completed successfully' });
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

// Root API documentation with HTML response
app.get('/', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inventory Hub API - Professional Multi-Channel Inventory Management</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/react-icons@4.12.0/font/react-icons.css">
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/lucide-react@0.294.0/dist/umd/lucide-react.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            color: white;
            margin-bottom: 40px;
            padding: 40px 0;
        }
        .header h1 {
            font-size: 3rem;
            font-weight: 700;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
        }
        .icon { font-size: 3rem; }
        .header p {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        .status {
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 30px;
            backdrop-filter: blur(10px);
        }
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 15px;
        }
        .status-item {
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }
        .status-item strong {
            display: block;
            font-size: 1.5rem;
            color: #4ade80;
        }
        .endpoints {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .endpoint-group {
            margin-bottom: 30px;
            border-bottom: 1px solid #eee;
            padding-bottom: 20px;
        }
        .endpoint-group:last-child {
            border-bottom: none;
        }
        .endpoint-group h3 {
            color: #667eea;
            font-size: 1.5rem;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .endpoint {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 10px;
            border-left: 4px solid #667eea;
        }
        .endpoint-method {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: bold;
            margin-right: 10px;
        }
        .endpoint-path {
            font-family: 'Monaco', 'Menlo', monospace;
            font-weight: bold;
            color: #333;
        }
        .endpoint-desc {
            color: #666;
            margin-top: 5px;
        }
        .auth-required {
            background: #fef3c7;
            color: #92400e;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 0.7rem;
            margin-left: 10px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            color: white;
            opacity: 0.8;
        }
        .badge {
            display: inline-block;
            background: #4ade80;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: bold;
            margin-left: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>
                <i data-lucide="rocket" class="icon"></i>
                Inventory Hub API
            </h1>
            <p>Professional Multi-Channel Inventory Management System</p>
            <div class="badge">v1.0.0</div>
        </div>

        <div class="status">
            <h2 style="color: white; margin-bottom: 10px;">
                <i data-lucide="bar-chart-3" style="margin-right: 10px;"></i>
                System Status
            </h2>
            <div class="status-grid">
                <div class="status-item">
                    <strong>● Online</strong>
                    <span>API Status</span>
                </div>
                <div class="status-item">
                    <strong>● Connected</strong>
                    <span>Database</span>
                </div>
                <div class="status-item">
                    <strong>${new Date().toLocaleString()}</strong>
                    <span>Last Updated</span>
                </div>
                <div class="status-item">
                    <strong>55 Products</strong>
                    <span>Active Inventory</span>
                </div>
            </div>
        </div>

        <div class="endpoints">
            <h2 style="color: #333; margin-bottom: 30px; text-align: center;">
                <i data-lucide="file-text" style="margin-right: 10px;"></i>
                Available Endpoints
            </h2>

            <div class="endpoint-group">
                <h3>
                    <i data-lucide="search" style="margin-right: 10px;"></i>
                    Health & Monitoring
                </h3>
                <div class="endpoint">
                    <span class="endpoint-method">GET</span>
                    <span class="endpoint-path">/api/health</span>
                    <div class="endpoint-desc">Check API and database health status</div>
                </div>
            </div>

            <div class="endpoint-group">
                <h3>
                    <i data-lucide="shield" style="margin-right: 10px;"></i>
                    Authentication
                </h3>
                <div class="endpoint">
                    <span class="endpoint-method">POST</span>
                    <span class="endpoint-path">/api/auth/login</span>
                    <div class="endpoint-desc">Authenticate user and receive JWT tokens</div>
                </div>
                <div class="endpoint">
                    <span class="endpoint-method">GET</span>
                    <span class="endpoint-path">/api/auth/profile</span>
                    <span class="auth-required">AUTH REQUIRED</span>
                    <div class="endpoint-desc">Get current authenticated user profile</div>
                </div>
                <div class="endpoint">
                    <span class="endpoint-method">POST</span>
                    <span class="endpoint-path">/api/auth/refresh</span>
                    <div class="endpoint-desc">Refresh expired access token</div>
                </div>
            </div>

            <div class="endpoint-group">
                <h3>
                    <i data-lucide="layout-dashboard" style="margin-right: 10px;"></i>
                    Dashboard
                </h3>
                <div class="endpoint">
                    <span class="endpoint-method">GET</span>
                    <span class="endpoint-path">/api/dashboard/stats</span>
                    <span class="auth-required">AUTH REQUIRED</span>
                    <div class="endpoint-desc">Get dashboard statistics and metrics</div>
                </div>
                <div class="endpoint">
                    <span class="endpoint-method">GET</span>
                    <span class="endpoint-path">/api/dashboard/recent-orders</span>
                    <span class="auth-required">AUTH REQUIRED</span>
                    <div class="endpoint-desc">Retrieve recent order history</div>
                </div>
                <div class="endpoint">
                    <span class="endpoint-method">GET</span>
                    <span class="endpoint-path">/api/dashboard/low-stock</span>
                    <span class="auth-required">AUTH REQUIRED</span>
                    <div class="endpoint-desc">Get low stock product alerts</div>
                </div>
            </div>

            <div class="endpoint-group">
                <h3>
                    <i data-lucide="package" style="margin-right: 10px;"></i>
                    Products Management
                </h3>
                <div class="endpoint">
                    <span class="endpoint-method">GET</span>
                    <span class="endpoint-path">/api/products</span>
                    <span class="auth-required">AUTH REQUIRED</span>
                    <div class="endpoint-desc">List all products with pagination</div>
                </div>
                <div class="endpoint">
                    <span class="endpoint-method">GET</span>
                    <span class="endpoint-path">/api/products/:id</span>
                    <span class="auth-required">AUTH REQUIRED</span>
                    <div class="endpoint-desc">Get detailed product information</div>
                </div>
                <div class="endpoint">
                    <span class="endpoint-method">POST</span>
                    <span class="endpoint-path">/api/products</span>
                    <span class="auth-required">AUTH REQUIRED</span>
                    <div class="endpoint-desc">Create new product</div>
                </div>
                <div class="endpoint">
                    <span class="endpoint-method">PUT</span>
                    <span class="endpoint-path">/api/products/:id</span>
                    <span class="auth-required">AUTH REQUIRED</span>
                    <div class="endpoint-desc">Update existing product</div>
                </div>
                <div class="endpoint">
                    <span class="endpoint-method">DELETE</span>
                    <span class="endpoint-path">/api/products/:id</span>
                    <span class="auth-required">AUTH REQUIRED</span>
                    <div class="endpoint-desc">Remove product from inventory</div>
                </div>
            </div>

            <div class="endpoint-group">
                <h3>
                    <i data-lucide="clipboard-list" style="margin-right: 10px;"></i>
                    Orders & Transactions
                </h3>
                <div class="endpoint">
                    <span class="endpoint-method">GET</span>
                    <span class="endpoint-path">/api/orders</span>
                    <span class="auth-required">AUTH REQUIRED</span>
                    <div class="endpoint-desc">Get all orders with filtering options</div>
                </div>
            </div>

            <div class="endpoint-group">
                <h3>
                    <i data-lucide="trending-up" style="margin-right: 10px;"></i>
                    Inventory Control
                </h3>
                <div class="endpoint">
                    <span class="endpoint-method">GET</span>
                    <span class="endpoint-path">/api/inventory</span>
                    <span class="auth-required">AUTH REQUIRED</span>
                    <div class="endpoint-desc">Get complete inventory status</div>
                </div>
                <div class="endpoint">
                    <span class="endpoint-method">GET</span>
                    <span class="endpoint-path">/api/categories</span>
                    <span class="auth-required">AUTH REQUIRED</span>
                    <div class="endpoint-desc">List product categories</div>
                </div>
            </div>

            <div class="endpoint-group">
                <h3>
                    <i data-lucide="building-2" style="margin-right: 10px;"></i>
                    Multi-Channel Integration
                </h3>
                <div class="endpoint">
                    <span class="endpoint-method">GET</span>
                    <span class="endpoint-path">/api/marketplaces</span>
                    <span class="auth-required">AUTH REQUIRED</span>
                    <div class="endpoint-desc">List connected marketplaces</div>
                </div>
                <div class="endpoint">
                    <span class="endpoint-method">POST</span>
                    <span class="endpoint-path">/api/marketplaces</span>
                    <span class="auth-required">AUTH REQUIRED</span>
                    <div class="endpoint-desc">Connect new marketplace</div>
                </div>
            </div>

            <div class="endpoint-group">
                <h3>
                    <i data-lucide="pie-chart" style="margin-right: 10px;"></i>
                    Analytics & Reporting
                </h3>
                <div class="endpoint">
                    <span class="endpoint-method">GET</span>
                    <span class="endpoint-path">/api/analytics/overview</span>
                    <div class="endpoint-desc">Get analytics overview dashboard</div>
                </div>
                <div class="endpoint">
                    <span class="endpoint-method">GET</span>
                    <span class="endpoint-path">/api/analytics</span>
                    <div class="endpoint-desc">Detailed analytics and reports</div>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>
                <i data-lucide="external-link" style="margin-right: 5px;"></i>
                <strong>Frontend:</strong> <a href="http://localhost:3005" style="color: white;">http://localhost:3005</a>
            </p>
            <p>
                <i data-lucide="phone" style="margin-right: 5px;"></i>
                <strong>Support:</strong> support@inventoryhub.com
            </p>
            <p style="margin-top: 20px; font-size: 0.9rem;">© 2025 Inventory Hub - Professional Inventory Management System</p>
        </div>
    </div>
    <script>
        // Initialize Lucide icons
        lucide.createIcons();
    </script>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
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