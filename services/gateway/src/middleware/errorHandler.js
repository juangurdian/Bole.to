/**
 * Global error handler middleware for the Gateway
 * Handles all errors and returns consistent error responses
 */

class GatewayError extends Error {
  constructor(code, message, status = 500, details = null) {
    super(message);
    this.name = 'GatewayError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

// Export GatewayError class for use in other modules
module.exports.GatewayError = GatewayError;

module.exports = (err, req, res, next) => {
  // Ensure we have a request ID
  const requestId = req.requestId || 'unknown';
  
  // Log error details
  console.error(`[${requestId}] Error:`, {
    name: err.name,
    message: err.message,
    code: err.code || 'UNKNOWN_ERROR',
    status: err.status || 500,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Default error response
  let status = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details = null;

  if (err instanceof GatewayError) {
    // Handle our custom Gateway errors
    status = err.status;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err.name === 'ValidationError') {
    // Handle express-validator errors
    status = 400;
    code = 'VALIDATION_ERROR';
    message = 'Invalid input data';
    details = err.errors || err.details;
  } else if (err.name === 'JsonWebTokenError') {
    // Handle JWT errors
    status = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid or malformed token';
  } else if (err.name === 'TokenExpiredError') {
    // Handle JWT expiration
    status = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Token has expired';
  } else if (err.name === 'UnauthorizedError') {
    // Handle authorization errors
    status = 401;
    code = 'UNAUTHORIZED';
    message = 'Authentication required';
  } else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    // Handle connection errors
    status = 502;
    code = 'BACKEND_UNAVAILABLE';
    message = 'Backend service unavailable';
  } else if (err.type === 'entity.too.large') {
    // Handle payload too large errors
    status = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'Request payload too large';
  } else if (err.status && err.status >= 400 && err.status < 600) {
    // Handle HTTP errors
    status = err.status;
    code = err.code || `HTTP_${status}`;
    message = err.message || 'Request failed';
  }

  // Don't expose sensitive information in production
  if (process.env.NODE_ENV === 'production') {
    // Sanitize error messages for production
    if (status === 500 && !err instanceof GatewayError) {
      message = 'Internal server error';
      details = null;
    }
  }

  // Send error response
  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      requestId,
      timestamp: new Date().toISOString(),
      ...(details && { details })
    }
  });
};