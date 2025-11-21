# 🎉 Inventory Hub - Professional Multi-Channel Inventory Management System

[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-blue.svg)](https://typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://postgresql.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A comprehensive, production-ready inventory management system designed for businesses managing products across multiple marketplace channels like Shopify, Amazon, and eBay.

## ✨ Features

### 🏪 Multi-Channel Management
- **Shopify Integration**: Seamless sync with Shopify stores
- **Amazon Marketplace**: Connect and manage Amazon listings
- **eBay Integration**: Full eBay selling channel support
- **Custom Channels**: Extensible architecture for additional platforms

### 📦 Complete Inventory Management
- **Product CRUD**: Full create, read, update, delete operations
- **Bulk Upload**: CSV import for large product catalogs
- **Category Management**: Hierarchical product categorization
- **Supplier Tracking**: Manage vendor relationships
- **Stock Levels**: Real-time inventory monitoring

### 📊 Advanced Analytics & Reporting
- **Dashboard Overview**: Key metrics and KPIs at a glance
- **Sales Analytics**: Revenue tracking and performance insights
- **Order Analytics**: Order status and fulfillment metrics
- **Low Stock Alerts**: Automated inventory notifications
- **Performance Reports**: Channel-wise performance analysis

### 🚚 Order Management
- **Order Processing**: Complete order lifecycle management
- **Status Tracking**: Pending → Processing → Shipped → Delivered
- **Customer Management**: Customer information and history
- **Order History**: Complete audit trail
- **Returns Processing**: Return and refund management

### 🔧 Technical Features
- **Real-time Updates**: Live inventory synchronization
- **Search & Filtering**: Advanced product and order search
- **Responsive Design**: Mobile-first, professional UI
- **API-First Architecture**: RESTful API design
- **Docker Ready**: Containerized deployment

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Beautiful, accessible UI components
- **React Query** - Powerful data fetching and caching
- **React Router** - Client-side routing

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Fast, unopinionated web framework
- **PostgreSQL** - Advanced open-source relational database
- **pg (node-postgres)** - PostgreSQL client for Node.js

### DevOps & Tools
- **Docker & Docker Compose** - Containerization and orchestration
- **ESLint** - Code linting and formatting
- **Nginx** - Reverse proxy and load balancing
- **Git** - Version control

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/sarif-mia/inventory-hub.git
cd inventory-hub
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 3. Launch with Docker
```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### 4. Access the Application
- **Frontend**: http://localhost:3005
- **Backend API**: http://localhost:3001
- **Database**: localhost:5432 (internal only)

### 5. Database Setup
The database will be automatically initialized with the schema on first run. Check `init-scripts/01-init-schema.sql` for the complete database structure.

## 📁 Project Structure

```
inventory-hub/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Shadcn/ui components
│   │   └── Dashboard/      # Dashboard-specific components
│   ├── pages/              # Page components
│   ├── integrations/       # External service integrations
│   ├── lib/                # Utility functions and configs
│   ├── hooks/              # Custom React hooks
│   └── server/             # Backend API server
├── init-scripts/           # Database initialization
├── public/                 # Static assets
├── docker-compose.yml      # Docker orchestration
├── Dockerfile              # Frontend container
├── Dockerfile.backend      # Backend container
└── nginx.conf             # Reverse proxy config
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SHOPIFY_STORE_URL` | Your Shopify store URL | `mystorename.myshopify.com` |
| `VITE_SHOPIFY_ADMIN_API_TOKEN` | Shopify admin API token | `shpat_...` |
| `VITE_DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `SHOPIFY_STORE_URL` | Server-side Shopify URL | Same as VITE_ |
| `SHOPIFY_ADMIN_API_TOKEN` | Server-side API token | Same as VITE_ |
| `DATABASE_URL` | Server database connection | Same as VITE_ |

### Database Schema

The application uses PostgreSQL with the following main tables:
- `products` - Product catalog
- `categories` - Product categories
- `orders` - Customer orders
- `inventory` - Stock levels per channel
- `marketplaces` - Connected sales channels
- `notifications` - System notifications

## 🧪 Development

### Local Development Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start backend server (separate terminal)
npm run server

# Run linting
npm run lint

# Build for production
npm run build
```

### Docker Development
```bash
# Development with hot reload
docker-compose -f docker-compose.dev.yml up

# Run tests in container
docker-compose exec frontend npm test
```

## 📊 API Documentation

### Core Endpoints

#### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create new product
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

#### Orders
- `GET /api/orders` - List all orders
- `PUT /api/orders/:id/status` - Update order status

#### Inventory
- `GET /api/inventory` - Get inventory levels
- `PUT /api/inventory/:id` - Update stock levels

#### Analytics
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/analytics` - Detailed analytics

## 🚀 Deployment

### Production Deployment
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d

# Scale services as needed
docker-compose up -d --scale backend=3
```

### Environment Considerations
- Set `NODE_ENV=production`
- Configure proper database credentials
- Set up SSL certificates for HTTPS
- Configure reverse proxy (nginx included)
- Set up monitoring and logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Ensure all linting passes
- Test in Docker environment

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Shadcn/ui** for beautiful UI components
- **Tailwind CSS** for utility-first styling
- **React** ecosystem for robust development tools
- **PostgreSQL** for reliable data storage

## 📞 Support

For support, email sarif@example.com or create an issue in the GitHub repository.

---

**Built with ❤️ for modern inventory management**