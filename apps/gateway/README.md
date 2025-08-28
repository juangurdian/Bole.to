# Bole.to API Gateway

A lightweight reverse proxy service that forwards requests to the Hi.Events backend while providing CORS, logging, and security features for the Bole.to mobile application.

## Features

- **Reverse Proxy**: Path-preserving forwarding to Hi.Events backend
- **CORS**: Configured for Expo development domains and production URLs
- **Security**: Helmet.js security headers with HSTS
- **Logging**: Request logging with unique request IDs
- **Health Checks**: `/healthz` endpoint for service monitoring
- **Error Handling**: Unified error responses with request tracking
- **Graceful Shutdown**: Proper signal handling for container environments

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (production, staging, development) | `development` |
| `PORT` | Server port | `8000` |
| `HOST` | Server host | `0.0.0.0` |
| `HIEVENTS_BACKEND_URL` | Hi.Events backend URL | `http://localhost:8000` |
| `CORS_ORIGINS` | Comma-separated list of allowed origins | See `.env.example` |
| `REQUEST_TIMEOUT` | Request timeout in milliseconds | `30000` |
| `LOG_LEVEL` | Logging level | `info` |

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

### Production

```bash
# Install production dependencies
npm ci --only=production

# Start server
npm start
```

### Docker

```bash
# Build image
docker build -t bole.to/gateway .

# Run container
docker run -d \
  -p 8000:8000 \
  -e HIEVENTS_BACKEND_URL=http://hievents-backend:8000 \
  bole.to/gateway
```

## API Routes

All requests are forwarded to the Hi.Events backend with the following behavior:

- Requests to `/api/*` are forwarded as-is to Hi.Events
- Requests to other paths are forwarded to `/api/*` on Hi.Events
- `/healthz` is handled locally by the gateway

## CORS Configuration

The gateway is configured to allow requests from:
- Expo development environments (`exp://localhost:*`, `exp://192.168.*:*`)
- Local development (`http://localhost:*`)
- Production domains (`https://staging-api.bole.to`, `https://app.bole.to`)

## Health Check

The `/healthz` endpoint returns service status and metadata:

```json
{
  "status": "healthy",
  "timestamp": "2025-01-20T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

## Error Handling

All errors are returned in a consistent format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

## Security Features

- **Helmet.js**: Standard security headers
- **HSTS**: HTTP Strict Transport Security
- **Request ID Tracking**: Every request gets a unique ID
- **IP Forwarding**: Proper client IP forwarding to backend
- **Error Sanitization**: Internal error details hidden in production

## Deployment

This service is designed to be deployed on container platforms like:
- DigitalOcean App Platform
- Heroku
- AWS ECS/Fargate
- Google Cloud Run
- Kubernetes

The Dockerfile follows best practices for container security and performance.