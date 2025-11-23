# 🎉 Inventory Hub - Professional Multi-Channel Inventory Management System

[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-blue.svg)](https://typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://postgresql.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A comprehensive inventory management system for businesses managing products across Shopify, Amazon, and eBay.

## ✨ Features

- **Multi-Channel Sync**: Integrate with Shopify, Amazon, eBay, and custom platforms
- **Product Management**: Full CRUD operations, bulk uploads, category organization
- **Analytics & Reporting**: Dashboard metrics, sales analytics, low stock alerts
- **Order Processing**: Complete order lifecycle from pending to shipped
- **Real-time Updates**: Live inventory synchronization across channels
- **Responsive UI**: Mobile-first design with professional interface

## 🛠️ Tech Stack

**Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Shadcn/ui, React Query, React Router

**Backend**: Node.js, Express.js, PostgreSQL, pg

**DevOps**: Docker, Docker Compose, ESLint, Nginx, Git

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local dev)
- Git

### Setup
```bash
git clone https://github.com/sarif-mia/inventory-hub.git
cd inventory-hub
cp .env.example .env
# Edit .env with your config
docker-compose up --build
```

**Access**: Frontend at http://localhost:3005, API at http://localhost:3001

## 📁 Project Structure

```
inventory-hub/
├── src/
│   ├── components/     # UI components
│   ├── pages/          # App pages
│   ├── integrations/   # External APIs
│   ├── lib/            # Utilities
│   ├── hooks/          # Custom hooks
│   └── server/         # Backend API
├── init-scripts/       # DB setup
├── public/             # Assets
└── docker-compose.yml  # Orchestration
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SHOPIFY_STORE_URL` | Shopify store URL | `mystorename.myshopify.com` |
| `VITE_SHOPIFY_ADMIN_API_TOKEN` | Shopify API token | `shpat_...` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@localhost:5432/db` |

### Database
Uses PostgreSQL with tables for products, categories, orders, inventory, marketplaces, notifications.

## 🧪 Development

```bash
npm install
npm run dev          # Frontend
npm run server       # Backend
npm run lint         # Lint code
npm run build        # Production build
```

## 📊 API Endpoints

- `GET /api/products` - List products
- `POST /api/products` - Create product
- `GET /api/orders` - List orders
- `PUT /api/orders/:id/status` - Update order status
- `GET /api/inventory` - Get stock levels
- `GET /api/dashboard/stats` - Dashboard stats

## 🚀 Deployment

```bash
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

Set `NODE_ENV=production`, configure SSL, monitoring.

## 🤝 Contributing

1. Fork the repo
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push and open PR

Follow TypeScript best practices, write tests, update docs.

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

Shadcn/ui, Tailwind CSS, React ecosystem, PostgreSQL.

## 📞 Support

Email sarifmia.ofc@gmail.com or open an issue.

---

**Built with ❤️ for modern inventory management**