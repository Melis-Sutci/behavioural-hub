const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = (db) => {
  return (req, res, next) => {
    try {
      // Get token from header
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'No token provided. Please login first.'
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if user still exists and is active
      const user = db.prepare(`
        SELECT id, email, full_name, role, is_active
        FROM users
        WHERE id = ?
      `).get(decoded.userId);

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found. Token invalid.'
        });
      }

      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          error: 'User account is deactivated.'
        });
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Invalid token.'
        });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expired. Please login again.'
        });
      }
      console.error('Authentication error:', error);
      return res.status(500).json({
        success: false,
        error: 'Authentication failed.'
      });
    }
  };
};

/**
 * Authorization Middleware
 * Checks if user has required role
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions. This action requires one of the following roles: ' + roles.join(', ')
      });
    }

    next();
  };
};

/**
 * Optional Authentication
 * Attaches user if token is provided, but doesn't require it
 */
const optionalAuth = (db) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(); // No token, continue without user
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = db.prepare(`
        SELECT id, email, full_name, role, is_active
        FROM users
        WHERE id = ? AND is_active = 1
      `).get(decoded.userId);

      if (user) {
        req.user = user;
      }

      next();
    } catch (error) {
      // Token invalid, but optional - just continue without user
      next();
    }
  };
};

/**
 * API Key Authentication Middleware
 * For programmatic access
 */
const authenticateApiKey = (db) => {
  return (req, res, next) => {
    try {
      const apiKey = req.headers['x-api-key'];

      if (!apiKey) {
        return res.status(401).json({
          success: false,
          error: 'API key required.'
        });
      }

      // Hash the API key
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

      // Find API key and user
      const result = db.prepare(`
        SELECT
          ak.id as key_id,
          ak.user_id,
          ak.expires_at,
          u.email,
          u.full_name,
          u.role,
          u.is_active
        FROM api_keys ak
        JOIN users u ON ak.user_id = u.id
        WHERE ak.key_hash = ? AND ak.is_active = 1
      `).get(keyHash);

      if (!result) {
        return res.status(401).json({
          success: false,
          error: 'Invalid API key.'
        });
      }

      if (!result.is_active) {
        return res.status(403).json({
          success: false,
          error: 'User account is deactivated.'
        });
      }

      // Check expiration
      if (result.expires_at && new Date(result.expires_at) < new Date()) {
        return res.status(401).json({
          success: false,
          error: 'API key expired.'
        });
      }

      // Update last used timestamp
      db.prepare(`
        UPDATE api_keys
        SET last_used_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(result.key_id);

      // Attach user to request
      req.user = {
        id: result.user_id,
        email: result.email,
        full_name: result.full_name,
        role: result.role,
        is_active: result.is_active
      };
      req.apiKeyId = result.key_id;

      next();
    } catch (error) {
      console.error('API key authentication error:', error);
      return res.status(500).json({
        success: false,
        error: 'Authentication failed.'
      });
    }
  };
};

/**
 * Audit Log Helper
 * Logs user actions for security tracking
 */
const logAudit = (db, userId, action, resourceType, resourceId, status, details, req) => {
  try {
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, user_agent, status, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      action,
      resourceType,
      resourceId || null,
      req.ip || req.connection.remoteAddress,
      req.headers['user-agent'] || null,
      status,
      details ? JSON.stringify(details) : null
    );
  } catch (error) {
    console.error('Audit log error:', error);
    // Don't throw - audit logging shouldn't break the request
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  authenticateApiKey,
  logAudit
};
