# 📡 Inventory Hub API Documentation

This document provides comprehensive API documentation for the Inventory Hub backend services.

## 🔗 Base URL
```
Production: https://your-domain.com/api
Development: http://localhost:3001/api
```

## 🔐 Authentication
Currently, the API does not require authentication. In production deployments, consider implementing:
- JWT token authentication
- API key authentication
- OAuth 2.0 flows

## 📋 Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## 🏪 Products API

### Get All Products
```http
GET /api/products
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Product Name",
    "sku": "PROD-001",
    "description": "Product description",
    "base_price": 29.99,
    "cost_price": 15.00,
    "weight": 1.5,
    "status": "active",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
]
```

### Get Product by ID
```http
GET /api/products/:id
```

**Parameters:**
- `id` (string): Product UUID

### Create Product
```http
POST /api/products
```

**Request Body:**
```json
{
  "name": "New Product",
  "sku": "NEW-001",
  "description": "Product description",
  "base_price": 19.99,
  "cost_price": 10.00,
  "weight": 0.5,
  "status": "active"
}
```

### Update Product
```http
PUT /api/products/:id
```

**Parameters:**
- `id` (string): Product UUID

**Request Body:** (same as create, all fields optional)

### Delete Product
```http
DELETE /api/products/:id
```

**Parameters:**
- `id` (string): Product UUID

### Bulk Upload Products
```http
POST /api/products/bulk-upload
```

**Request Body:**
```json
{
  "products": [
    {
      "name": "Product 1",
      "sku": "SKU-001",
      "base_price": 10.00,
      "description": "Description"
    }
  ]
}
```

**Response:**
```json
{
  "successful": 5,
  "failed": 1,
  "errors": [
    {
      "sku": "INVALID-SKU",
      "error": "Missing required fields"
    }
  ]
}
```

## 📂 Categories API

### Get All Categories
```http
GET /api/categories
```

### Create Category
```http
POST /api/categories
```

**Request Body:**
```json
{
  "name": "Electronics",
  "description": "Electronic devices and accessories"
}
```

### Update Category
```http
PUT /api/categories/:id
```

### Delete Category
```http
DELETE /api/categories/:id
```

## 📦 Inventory API

### Get All Inventory
```http
GET /api/inventory
```

**Response:**
```json
[
  {
    "id": "uuid",
    "product_id": "uuid",
    "marketplace_id": "uuid",
    "quantity": 100,
    "price": 29.99,
    "status": "in_stock",
    "products": {
      "name": "Product Name",
      "sku": "PROD-001"
    },
    "marketplaces": {
      "name": "Shopify Store"
    }
  }
]
```

### Update Inventory
```http
PUT /api/inventory/:id
```

**Request Body:**
```json
{
  "quantity": 150,
  "price": 32.99
}
```

### Stock Adjustment
```http
POST /api/inventory/adjust
```

**Request Body:**
```json
{
  "product_id": "uuid",
  "marketplace_id": "uuid",
  "adjustment_type": "increase",
  "quantity": 50,
  "reason": "Restock from supplier"
}
```

### Get Stock Adjustments
```http
GET /api/stock-adjustments
```

## 🛒 Orders API

### Get All Orders
```http
GET /api/orders
```

**Response:**
```json
[
  {
    "id": "uuid",
    "order_number": "ORD-001",
    "marketplace_id": "uuid",
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "status": "pending",
    "total": 59.98,
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

### Update Order Status
```http
PUT /api/orders/:id/status
```

**Request Body:**
```json
{
  "status": "shipped"
}
```

**Valid Statuses:**
- `pending`
- `processing`
- `shipped`
- `delivered`
- `cancelled`
- `returned`

### Get Orders by Status
```http
GET /api/orders/pending
GET /api/orders/shipped
GET /api/orders/returns
```

## 🏪 Marketplaces API

### Get All Marketplaces
```http
GET /api/marketplaces
```

### Add Marketplace
```http
POST /api/marketplaces
```

**Request Body:**
```json
{
  "name": "My Shopify Store",
  "type": "shopify",
  "store_url": "mystorename.myshopify.com"
}
```

### Sync Marketplace
```http
POST /api/sync/:marketplaceId
```

Triggers synchronization with the specified marketplace.

## 📊 Dashboard & Analytics API

### Dashboard Statistics
```http
GET /api/dashboard/stats
```

**Response:**
```json
{
  "totalProducts": 150,
  "activeOrders": 25,
  "lowStockCount": 8,
  "connectedChannels": 3
}
```

### Recent Orders
```http
GET /api/dashboard/recent-orders
```

### Low Stock Products
```http
GET /api/dashboard/low-stock
```

### Order Status Distribution
```http
GET /api/dashboard/order-status
```

### Channel Performance
```http
GET /api/dashboard/channels
```

### Sales Trend
```http
GET /api/dashboard/sales-trend
```

### Comprehensive Analytics
```http
GET /api/analytics
```

**Response:**
```json
{
  "salesData": [...],
  "topProducts": [...],
  "marketplaceData": [...],
  "orderStatusData": [...],
  "summary": {
    "totalRevenue": 15420.50,
    "totalOrders": 234,
    "topProduct": "Wireless Headphones",
    "topProductSales": 45
  }
}
```

## 🔔 Notifications API

### Get All Notifications
```http
GET /api/notifications
```

### Mark Notification as Read
```http
PUT /api/notifications/:id
```

**Request Body:**
```json
{
  "is_read": true
}
```

### Mark All Notifications as Read
```http
PUT /api/notifications/mark-all-read
```

## 🔧 Suppliers API

### Get All Suppliers
```http
GET /api/suppliers
```

## 📋 Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Invalid request data |
| `NOT_FOUND` | Resource not found |
| `DUPLICATE_ENTRY` | Resource already exists |
| `DATABASE_ERROR` | Database operation failed |
| `EXTERNAL_API_ERROR` | Third-party API error |

## 🚀 Rate Limiting

- **Authenticated requests:** 1000 requests per hour
- **Unauthenticated requests:** 100 requests per hour
- **Bulk operations:** 10 requests per hour

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## 🔒 Security Considerations

### Input Validation
- All inputs are validated using server-side validation
- SQL injection prevention through parameterized queries
- XSS prevention through input sanitization

### CORS Configuration
```javascript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3005'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

### Data Sanitization
- HTML content is sanitized
- File uploads are validated for type and size
- Sensitive data is encrypted in transit and at rest

## 📊 Monitoring & Logging

### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "OK",
  "message": "API server is running",
  "timestamp": "2025-01-01T00:00:00Z",
  "version": "1.0.0"
}
```

### Request Logging
All API requests are logged with:
- Request method and URL
- Response status code
- Response time
- Client IP address
- User agent

## 🔄 Webhooks & Integrations

### Shopify Webhooks
Supported webhook events:
- `orders/create`
- `orders/update`
- `products/create`
- `products/update`
- `inventory_levels/update`

### Webhook Signature Verification
```javascript
const verifyWebhook = (rawBody, signature) => {
  const hmac = crypto.createHmac('sha256', SHOPIFY_SECRET);
  const digest = hmac.update(rawBody).digest('base64');
  return signature === digest;
};
```

## 📈 Performance Optimization

### Database Indexing
- Primary keys on all tables
- Foreign key indexes
- Composite indexes on frequently queried columns
- Partial indexes for status-based queries

### Caching Strategy
- Redis for session storage
- In-memory caching for frequently accessed data
- CDN for static assets

### Query Optimization
- Use of prepared statements
- Connection pooling
- Query result pagination
- Efficient JOIN operations

## 🧪 Testing the API

### Using cURL
```bash
# Get all products
curl -X GET http://localhost:3001/api/products

# Create a product
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Product","sku":"TEST-001","base_price":10.00}'
```

### Using Postman
Import the provided Postman collection: `docs/InventoryHub.postman_collection.json`

### Automated Testing
```bash
# Run API tests
npm run test:api

# Run integration tests
npm run test:integration
```

---

For additional support or questions about the API, please create an issue in the GitHub repository or contact the development team.