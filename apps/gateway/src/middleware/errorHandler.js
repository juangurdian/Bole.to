/**
 * Enhanced error handling middleware for the gateway
 */

const errorHandler = (error, req, res, next) => {
  // Log the error with request context
  const errorContext = {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('user-agent'),
    ip: req.ip,
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code
    }
  };

  console.error('Gateway Error:', JSON.stringify(errorContext, null, 2));

  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  // Determine status code
  let statusCode = error.status || error.statusCode || 500;
  
  // Handle specific error types
  if (error.code === 'ECONNREFUSED') {
    statusCode = 502;
  } else if (error.code === 'ENOTFOUND') {
    statusCode = 503;
  } else if (error.code === 'ETIMEDOUT') {
    statusCode = 504;
  }

  const response = {
    success: false,
    error: {
      message: getErrorMessage(error, statusCode, isDevelopment),
      code: getErrorCode(error, statusCode),
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
      ...(isDevelopment && { 
        stack: error.stack,
        originalError: error.message
      })
    }
  };

  res.status(statusCode).json(response);
};

function getErrorMessage(error, statusCode, isDevelopment) {
  if (isDevelopment) {
    return error.message;
  }

  // Production-safe error messages
  switch (statusCode) {
    case 400: return 'Bad Request';
    case 401: return 'Unauthorized';
    case 403: return 'Forbidden';
    case 404: return 'Not Found';
    case 429: return 'Too Many Requests';
    case 500: return 'Internal Server Error';
    case 502: return 'Bad Gateway - Backend service unavailable';
    case 503: return 'Service Unavailable';
    case 504: return 'Gateway Timeout';
    default: return 'An error occurred';
  }
}

function getErrorCode(error, statusCode) {
  if (error.code) return error.code;
  
  switch (statusCode) {
    case 400: return 'BAD_REQUEST';
    case 401: return 'UNAUTHORIZED';
    case 403: return 'FORBIDDEN';
    case 404: return 'NOT_FOUND';
    case 429: return 'RATE_LIMITED';
    case 500: return 'INTERNAL_ERROR';
    case 502: return 'BAD_GATEWAY';
    case 503: return 'SERVICE_UNAVAILABLE';
    case 504: return 'GATEWAY_TIMEOUT';
    default: return 'UNKNOWN_ERROR';
  }
}

module.exports = errorHandler;