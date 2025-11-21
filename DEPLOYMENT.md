# 🚀 Inventory Hub Deployment Guide

This guide covers deployment strategies for the Inventory Hub application in various environments.

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Cloud Deployment](#cloud-deployment)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [SSL Configuration](#ssl-configuration)
- [Monitoring & Logging](#monitoring--logging)
- [Backup & Recovery](#backup--recovery)
- [Scaling](#scaling)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### System Requirements
- **CPU**: 2+ cores recommended
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 20GB available space
- **Network**: Stable internet connection

### Software Requirements
- Docker 20.10+
- Docker Compose 2.0+
- Git
- SSL certificate (for production)

### Domain & DNS
- Registered domain name
- DNS configuration pointing to your server
- SSL certificate from Let's Encrypt or commercial CA

## 🏠 Local Development

### Quick Start with Docker
```bash
# Clone repository
git clone https://github.com/sarif-mia/inventory-hub.git
cd inventory-hub

# Copy environment file
cp .env.example .env

# Start all services
docker-compose up --build

# Access application
# Frontend: http://localhost:3005
# Backend: http://localhost:3001
```

### Development Environment
```bash
# Install dependencies
npm install

# Start frontend development server
npm run dev

# Start backend (separate terminal)
npm run server

# Run database locally
docker-compose up db
```

## 🐳 Docker Deployment

### Production Docker Compose
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@db:5432/inventory_hub
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=inventory_hub
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    restart: unless-stopped

volumes:
  postgres_data:
```

### Build and Deploy
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## ☁️ Cloud Deployment

### AWS Deployment

#### EC2 Instance Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone repository
git clone https://github.com/sarif-mia/inventory-hub.git
cd inventory-hub

# Configure environment
cp .env.example .env
nano .env  # Edit with production values
```

#### Security Groups
Configure AWS security groups to allow:
- **HTTP**: Port 80 from 0.0.0.0/0
- **HTTPS**: Port 443 from 0.0.0.0/0
- **SSH**: Port 22 from your IP only

#### RDS PostgreSQL Setup
```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier inventory-hub-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password your-password \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name your-subnet-group
```

### DigitalOcean Deployment

#### App Platform
1. Connect GitHub repository
2. Configure build settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Set environment variables
4. Configure domain and SSL

#### Droplet Setup
```bash
# Create droplet with Docker pre-installed
# SSH into droplet
ssh root@your-droplet-ip

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Deploy application
git clone https://github.com/sarif-mia/inventory-hub.git
cd inventory-hub
cp .env.example .env
# Edit .env with production values
docker-compose -f docker-compose.prod.yml up -d
```

### Vercel + Railway Deployment

#### Frontend (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
vercel --prod

# Set environment variables in Vercel dashboard
# VITE_API_URL=https://your-backend-url.com/api
```

#### Backend (Railway)
1. Connect GitHub repository to Railway
2. Configure environment variables
3. Set up PostgreSQL database
4. Deploy backend service

## ⚙️ Environment Configuration

### Production Environment Variables
```bash
# Application
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Shopify Integration
SHOPIFY_STORE_URL=yourstore.myshopify.com
SHOPIFY_ADMIN_API_TOKEN=shpat_xxxxxxxxxx
SHOPIFY_STOREFRONT_TOKEN=xxxxxxxxxx
SHOPIFY_API_KEY=xxxxxxxxxx
SHOPIFY_SECRET_KEY=xxxxxxxxxx

# Security
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-session-secret

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

### Environment File Structure
```
/opt/inventory-hub/
├── .env                    # Production environment variables
├── docker-compose.yml      # Production compose file
├── nginx.conf             # Nginx configuration
└── ssl/                   # SSL certificates
    ├── cert.pem
    └── key.pem
```

## 🗄️ Database Setup

### PostgreSQL Configuration
```sql
-- Create database
CREATE DATABASE inventory_hub;

-- Create user
CREATE USER inventory_user WITH PASSWORD 'secure_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE inventory_hub TO inventory_user;

-- Create extensions
\c inventory_hub;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Database Migration
```bash
# Run migrations
docker-compose exec db psql -U postgres -d inventory_hub -f /docker-entrypoint-initdb.d/01-init-schema.sql

# Or manually
psql -h localhost -U inventory_user -d inventory_hub -f init-scripts/01-init-schema.sql
```

### Database Backup
```bash
# Create backup
docker-compose exec db pg_dump -U postgres inventory_hub > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose exec -T db psql -U postgres inventory_hub < backup_file.sql
```

## 🔒 SSL Configuration

### Let's Encrypt (Free SSL)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (runs twice daily)
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Nginx SSL Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    location / {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 Monitoring & Logging

### Application Monitoring
```bash
# Docker logs
docker-compose logs -f

# System monitoring
docker stats

# Health check endpoint
curl https://yourdomain.com/api/health
```

### Log Aggregation
```bash
# View application logs
docker-compose logs backend

# View nginx access logs
docker-compose logs frontend | grep nginx

# Export logs for analysis
docker-compose logs --no-color > app_logs_$(date +%Y%m%d).log
```

### Error Monitoring (Sentry)
```javascript
// In your application
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

## 💾 Backup & Recovery

### Automated Backups
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
docker-compose exec -T db pg_dump -U postgres inventory_hub > $BACKUP_DIR/db_backup_$DATE.sql

# Application data backup
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz /opt/inventory-hub

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

### Disaster Recovery
```bash
# Stop services
docker-compose down

# Restore database
docker-compose exec -T db psql -U postgres inventory_hub < backup_file.sql

# Restore application files
tar -xzf app_backup.tar.gz -C /

# Restart services
docker-compose up -d
```

## 📈 Scaling

### Horizontal Scaling
```yaml
# docker-compose.scale.yml
version: '3.8'

services:
  backend:
    build: .
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    deploy:
      replicas: 1

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - backend
```

### Load Balancing
```nginx
upstream backend {
    server backend1:3001;
    server backend2:3001;
    server backend3:3001;
}

server {
    listen 80;
    server_name yourdomain.com;

    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location / {
        proxy_pass http://frontend:3005;
    }
}
```

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check database status
docker-compose ps db

# Check database logs
docker-compose logs db

# Test connection
docker-compose exec db psql -U postgres -d inventory_hub -c "SELECT 1;"
```

#### Application Won't Start
```bash
# Check application logs
docker-compose logs backend

# Check environment variables
docker-compose exec backend env

# Verify port availability
netstat -tlnp | grep :3001
```

#### High Memory Usage
```bash
# Check container resource usage
docker stats

# Restart services
docker-compose restart

# Add memory limits to docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

#### SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/cert.pem -text -noout

# Renew certificate
sudo certbot renew

# Test SSL configuration
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

### Performance Optimization

#### Database Optimization
```sql
-- Create indexes for better performance
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_inventory_product_marketplace ON inventory(product_id, marketplace_id);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM orders WHERE status = 'pending';
```

#### Application Optimization
```javascript
// Enable gzip compression
const compression = require('compression');
app.use(compression());

// Cache static assets
app.use(express.static('public', { maxAge: '1y' }));

// Database connection pooling
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Log Analysis
```bash
# Search for errors
docker-compose logs | grep ERROR

# Count requests by status code
docker-compose logs frontend | grep '"GET /api/' | awk '{print $9}' | sort | uniq -c

# Monitor response times
docker-compose logs backend | grep "completed in" | tail -20
```

---

## 📞 Support

For deployment issues or questions:
- Check the [GitHub Issues](https://github.com/sarif-mia/inventory-hub/issues)
- Review the [API Documentation](API.md)
- Contact the development team

**Happy deploying! 🚀**