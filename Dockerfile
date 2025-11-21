# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Create necessary directories
RUN mkdir -p /usr/share/nginx/html/data

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create volume for data persistence
VOLUME ["/usr/share/nginx/html/data"]

EXPOSE 80

# Test nginx configuration and start
CMD ["sh", "-c", "nginx -t && nginx -g 'daemon off;'"]