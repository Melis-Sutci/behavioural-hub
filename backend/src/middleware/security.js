const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

/**
 * Configure Helmet for security headers
 */
const configureHelmet = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    }
  });
};

/**
 * General API rate limiter
 */
const createApiLimiter = () => {
  return rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000), // 15 minutes default
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 100), // 100 requests per window
    message: {
      success: false,
      error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/health/live' || req.path === '/health/ready';
    }
  });
};

/**
 * Strict rate limiter for authentication endpoints
 */
const createAuthLimiter = () => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: {
      success: false,
      error: 'Too many authentication attempts, please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true // Don't count successful requests
  });
};

/**
 * Moderate rate limiter for data modification endpoints
 */
const createMutationLimiter = () => {
  return rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute
    message: {
      success: false,
      error: 'Too many requests, please slow down.'
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

/**
 * CORS configuration
 */
const configureCors = () => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'http://localhost:8080'];

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);

      // Allow all origins in development mode
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }

      // In production, check whitelist
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
    maxAge: 86400 // 24 hours
  };
};

/**
 * Request sanitization middleware
 * Prevents common injection attacks
 */
const sanitizeRequest = (req, res, next) => {
  // Remove any null bytes from request
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/\0/g, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      for (let key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);

  next();
};

/**
 * Global error handler middleware
 */
const errorHandler = (logger) => {
  return (err, req, res, next) => {
    // Log error with context
    if (logger && logger.logError) {
      logger.logError(err, {
        method: req.method,
        path: req.path,
        userId: req.user?.id,
        ip: req.ip
      });
    } else {
      console.error('Global error handler:', err);
    }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired'
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.details
    });
  }

  // CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: 'CORS policy violation'
    });
  }

  // Database errors
  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(409).json({
      success: false,
      error: 'Database constraint violation'
    });
  }

    // Default error response
    res.status(err.status || 500).json({
      success: false,
      error: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message
    });
  };
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`
  });
};

/**
 * Request logging middleware
 */
const requestLogger = (logger) => {
  return (req, res, next) => {
    const start = Date.now();

    // Log after response is sent
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (logger && logger.logRequest) {
        logger.logRequest(req, res, duration);
      }
    });

    next();
  };
};

module.exports = {
  configureHelmet,
  configureCors,
  createApiLimiter,
  createAuthLimiter,
  createMutationLimiter,
  sanitizeRequest,
  errorHandler,
  notFoundHandler,
  requestLogger
};
