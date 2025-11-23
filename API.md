# 📡 Inventory Hub API Documentation

This document provides API documentation for the Inventory Hub backend services.

## 🔗 Base URL
```
Production: https://your-domain.com/api
Development: http://localhost:3001/api
```

## 🔐 Authentication
API currently unauthenticated. For production, implement JWT, API keys, or OAuth.

## 📋 Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## 🏪 Products API

- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/bulk-upload` - Bulk upload products

## 📂 Categories API

- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

## 📦 Inventory API

- `GET /api/inventory` - Get all inventory
- `PUT /api/inventory/:id` - Update inventory
- `POST /api/inventory/adjust` - Adjust stock
- `GET /api/stock-adjustments` - Get adjustments

## 🛒 Orders API

- `GET /api/orders` - List orders
- `PUT /api/orders/:id/status` - Update order status
- `GET /api/orders/pending|shipped|returns` - Get orders by status

## 🏪 Marketplaces API

- `GET /api/marketplaces` - List marketplaces
- `POST /api/marketplaces` - Add marketplace
- `POST /api/sync/:marketplaceId` - Sync marketplace

## 📊 Dashboard & Analytics API

- `GET /api/dashboard/stats` - Dashboard stats
- `GET /api/dashboard/recent-orders` - Recent orders
- `GET /api/dashboard/low-stock` - Low stock products
- `GET /api/analytics` - Comprehensive analytics

## 🔔 Notifications API

- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id` - Mark as read
- `PUT /api/notifications/mark-all-read` - Mark all read

## 🔧 Suppliers API

- `GET /api/suppliers` - List suppliers

## 📋 Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Invalid data |
| `NOT_FOUND` | Resource not found |
| `DUPLICATE_ENTRY` | Already exists |
| `DATABASE_ERROR` | DB error |
| `EXTERNAL_API_ERROR` | Third-party API error |

## 🚀 Rate Limiting

- Authenticated: 1000 req/hour
- Unauthenticated: 100 req/hour
- Bulk ops: 10 req/hour

Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## 🔒 Security

- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CORS configured
- Data encrypted

## 📊 Monitoring

- `GET /api/health` - Health check

## 🧪 Testing

```bash
# Get products
curl -X GET http://localhost:3001/api/products

# Create product
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","sku":"TEST-001","base_price":10.00}'
```

---

For support, create an issue or contact the team.