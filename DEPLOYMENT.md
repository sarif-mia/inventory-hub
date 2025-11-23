# 🚀 Inventory Hub Deployment Guide

This guide covers deployment for Inventory Hub.

## 🔧 Prerequisites

- CPU: 2+ cores, RAM: 4GB+, Storage: 20GB
- Docker 20.10+, Docker Compose 2.0+, Git
- Domain, DNS, SSL cert

## 🏠 Local Development

```bash
git clone https://github.com/sarif-mia/inventory-hub.git
cd inventory-hub
cp .env.example .env
docker-compose up --build
```

Access: Frontend http://localhost:3005, Backend http://localhost:3001

## 🐳 Docker Deployment

### Production Compose
```yaml
version: '3.8'
services:
  frontend:
    build: .
    ports: ["80:80"]
    environment: [NODE_ENV=production]
    depends_on: [backend]
  backend:
    build: .
    dockerfile: Dockerfile.backend
    ports: ["3001:3001"]
    environment: [NODE_ENV=production, DATABASE_URL=...]
    depends_on: [db]
  db:
    image: postgres:15
    environment: [POSTGRES_DB=inventory_hub, ...]
    volumes: [postgres_data:/var/lib/postgresql/data, ./init-scripts:/docker-entrypoint-initdb.d]
```

### Deploy
```bash
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml logs -f
```

## ☁️ Cloud Deployment

### AWS EC2
- Launch EC2 with Docker
- Install Docker Compose
- Clone repo, configure .env
- Deploy with docker-compose

Security groups: HTTP/HTTPS open, SSH restricted.

RDS: Create PostgreSQL instance.

### DigitalOcean
- App Platform: Connect repo, set build/output, env vars, domain/SSL
- Droplet: Similar to EC2 setup

### Vercel + Railway
- Frontend: Deploy to Vercel, set VITE_API_URL
- Backend: Railway with GitHub, PostgreSQL

## ⚙️ Environment Configuration

### Key Variables
```bash
NODE_ENV=production
DATABASE_URL=postgresql://...
SHOPIFY_STORE_URL=...
SHOPIFY_ADMIN_API_TOKEN=...
JWT_SECRET=...
```

## 🗄️ Database Setup

### PostgreSQL
```sql
CREATE DATABASE inventory_hub;
CREATE USER inventory_user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE inventory_hub TO inventory_user;
\c inventory_hub;
CREATE EXTENSION "uuid-ossp";
CREATE EXTENSION "pgcrypto";
```

### Migration
```bash
docker-compose exec db psql -U postgres -d inventory_hub -f /docker-entrypoint-initdb.d/01-init-schema.sql
```

### Backup
```bash
docker-compose exec db pg_dump -U postgres inventory_hub > backup.sql
# Restore: docker-compose exec -T db psql -U postgres inventory_hub < backup.sql
```

## 🔒 SSL Configuration

### Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
# Auto-renew: crontab -e, add renewal command
```

### Nginx SSL
Configure server block with SSL certs, security headers, proxy to app.

## 📊 Monitoring & Logging

- Docker logs: `docker-compose logs -f`
- Health check: `curl /api/health`
- Error monitoring: Sentry integration

## 💾 Backup & Recovery

### Automated Backup Script
```bash
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T db pg_dump -U postgres inventory_hub > $BACKUP_DIR/db_$DATE.sql
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /opt/inventory-hub
find $BACKUP_DIR -mtime +7 -delete
```

### Recovery
```bash
docker-compose down
docker-compose exec -T db psql -U postgres inventory_hub < backup.sql
tar -xzf app_backup.tar.gz -C /
docker-compose up -d
```

## 📈 Scaling

### Horizontal Scaling
Use Docker Swarm or Kubernetes for multiple replicas, load balancer.

### Nginx Load Balancing
```nginx
upstream backend {
    server backend1:3001;
    server backend2:3001;
}
server {
    location /api { proxy_pass http://backend; }
    location / { proxy_pass http://frontend; }
}
```

## 🔧 Troubleshooting

### Common Issues
- DB connection: Check `docker-compose logs db`, test connection
- App won't start: Check logs, env vars, ports
- High memory: `docker stats`, add limits
- SSL issues: Check cert validity, renew

### Performance
- DB indexes: `CREATE INDEX idx_orders_status ON orders(status);`
- Compression, caching, connection pooling

---

For issues, check GitHub Issues or contact team.

**Happy deploying! 🚀**