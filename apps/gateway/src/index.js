const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');
const { checkBackendHealth, getSystemInfo } = require('./utils/health');

const app = express();
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || '0.0.0.0';
const HIEVENTS_BACKEND_URL = process.env.HIEVENTS_BACKEND_URL || 'http://localhost:8000';
const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT) || 30000;

// Trust proxy headers (important for DigitalOcean App Platform)
app.set('trust proxy', true);

// Add request ID middleware
app.use((req, res, next) => {
  req.requestId = req.get('x-request-id') || uuidv4();
  res.set('x-request-id', req.requestId);
  next();
});

// Security headers
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Allow embedding for mobile apps
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:", "wss:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Compression
app.use(compression());

// CORS Configuration
const corsOrigins = process.env.CORS_ORIGINS ? 
  process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()) : 
  ['http://localhost:3000', 'exp://localhost:19000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin matches any of the allowed patterns
    const isAllowed = corsOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        // Handle wildcard patterns
        const regex = new RegExp(allowedOrigin.replace(/\*/g, '.*'));
        return regex.test(origin);
      }
      return allowedOrigin === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'x-api-key']
}));

// Custom morgan format with request ID
morgan.token('requestId', (req) => req.requestId);
morgan.token('realIp', (req) => req.get('x-real-ip') || req.ip);

const logFormat = process.env.NODE_ENV === 'production' 
  ? ':realIp :requestId :method :url :status :res[content-length] - :response-time ms'
  : ':realIp :requestId :method :url :status :res[content-length] - :response-time ms ":user-agent"';

app.use(morgan(logFormat));

// Health check endpoint
app.get('/healthz', async (req, res) => {
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      requestId: req.requestId,
      system: getSystemInfo()
    };
    
    // Check Hi.Events backend health in background (non-blocking)
    if (req.query.deep === 'true') {
      try {
        const backendHealth = await checkBackendHealth(
          HIEVENTS_BACKEND_URL, 
          5000
        );
        healthCheck.backend = backendHealth;
        
        if (!backendHealth.healthy) {
          healthCheck.status = 'degraded';
          res.status(200); // Still return 200 for gateway health
        }
      } catch (backendError) {
        healthCheck.backend = {
          healthy: false,
          error: backendError.message
        };
        healthCheck.status = 'degraded';
      }
    }
    
    res.status(200).json(healthCheck);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      requestId: req.requestId
    });
  }
});

// Legacy error handling - now using separate middleware
// This is kept for backwards compatibility

// Hi.Events reverse proxy configuration
const proxyOptions = {
  target: HIEVENTS_BACKEND_URL,
  changeOrigin: true,
  timeout: REQUEST_TIMEOUT,
  proxyTimeout: REQUEST_TIMEOUT,
  
  // Path rewriting - preserve all paths
  pathRewrite: {
    '^/api': '/api', // Keep /api prefix if present
  },
  
  // Add request ID to backend requests
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.setHeader('x-request-id', req.requestId);
    proxyReq.setHeader('x-forwarded-for', req.ip);
    proxyReq.setHeader('x-gateway-version', process.env.npm_package_version || '1.0.0');
  },
  
  // Handle proxy responses
  onProxyRes: (proxyRes, req, res) => {
    // Add request ID to response headers
    proxyRes.headers['x-request-id'] = req.requestId;
    
    // Log proxy response for debugging in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${req.requestId}] Proxy response: ${proxyRes.statusCode} ${req.method} ${req.url}`);
    }
  },
  
  // Handle proxy errors
  onError: (err, req, res) => {
    console.error(`[${req.requestId}] Proxy error:`, err.message);
    
    if (!res.headersSent) {
      res.status(502).json({
        success: false,
        error: {
          message: 'Bad Gateway - Backend service unavailable',
          code: 'BACKEND_UNAVAILABLE',
          requestId: req.requestId
        }
      });
    }
  }
};

// Apply proxy middleware to all API routes
app.use('/api', createProxyMiddleware(proxyOptions));

// Fallback for requests without /api prefix - forward to Hi.Events
app.use('/', (req, res, next) => {
  // Skip health check and static files
  if (req.path === '/healthz' || req.path.startsWith('/static/')) {
    return next();
  }
  
  // Forward everything else to Hi.Events
  createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      '^/': '/api/', // Add /api prefix for Hi.Events
    }
  })(req, res, next);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Not Found',
      code: 'NOT_FOUND',
      path: req.path,
      requestId: req.requestId
    }
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Bole.to Gateway running on ${HOST}:${PORT}`);
  console.log(`📡 Proxying to Hi.Events backend: ${HIEVENTS_BACKEND_URL}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🏥 Health check: http://${HOST}:${PORT}/healthz`);
});

module.exports = app;