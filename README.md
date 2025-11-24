# Inventory Hub

Multi-channel inventory management system with React + Node.js + PostgreSQL.

## Quick Start

```bash
git clone <repo>
cd inventory-hub
docker-compose up --build
```

**Access**: http://localhost:3005  
**Login**: admin@inventoryhub.com / admin123

## Features

- Products & Inventory Management
- Multi-Channel Sync (Shopify, Amazon, eBay)
- Order Processing & Analytics
- Real-time Dashboard

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express.js, PostgreSQL
- **DevOps**: Docker, Docker Compose

## Setup

1. Docker and Docker Compose required
2. Clone repository
3. Run `docker-compose up --build`
4. Access web interface at http://localhost:3005

## API

- Frontend: http://localhost:3005
- API: http://localhost:3006
- Database: PostgreSQL on port 5432

## Development

```bash
npm install
npm run dev          # Frontend
npm run build:server # Backend
npm run build        # Production
```

## Environment

Copy `.env.example` to `.env` and configure:
- Database URL
- JWT secrets
- Shopify credentials (optional - can be configured via UI)

## License

MIT