const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validate, authSchemas } = require('../middleware/validation');
const { authenticate, logAudit } = require('../middleware/auth');

const createAuthRoutes = (db) => {
  const router = express.Router();

  /**
   * POST /api/auth/register
   * Register a new user
   */
  router.post('/register', validate(authSchemas.register), async (req, res) => {
    try {
      const { email, password, full_name } = req.body;

      // Check if user already exists
      const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'User with this email already exists'
        });
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || 10));

      // Create user (default role: user)
      const result = db.prepare(`
        INSERT INTO users (email, password_hash, full_name, role)
        VALUES (?, ?, ?, 'user')
      `).run(email, password_hash, full_name);

      // Generate JWT token
      const token = jwt.sign(
        { userId: result.lastInsertRowid },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      // Generate refresh token
      const refreshToken = crypto.randomBytes(32).toString('hex');
      const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const refreshExpiresAt = new Date();
      refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7); // 7 days

      db.prepare(`
        INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
        VALUES (?, ?, ?)
      `).run(result.lastInsertRowid, refreshTokenHash, refreshExpiresAt.toISOString());

      // Log audit
      logAudit(db, result.lastInsertRowid, 'register', 'user', result.lastInsertRowid, 'success', null, req);

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: result.lastInsertRowid,
            email,
            full_name,
            role: 'user'
          },
          token,
          refresh_token: refreshToken
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Registration failed'
      });
    }
  });

  /**
   * POST /api/auth/login
   * Login with email and password
   */
  router.post('/login', validate(authSchemas.login), async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = db.prepare(`
        SELECT id, email, password_hash, full_name, role, is_active
        FROM users
        WHERE email = ?
      `).get(email);

      if (!user) {
        logAudit(db, null, 'login', 'user', null, 'failure', { email, reason: 'user_not_found' }, req);
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }

      if (!user.is_active) {
        logAudit(db, user.id, 'login', 'user', user.id, 'failure', { reason: 'account_deactivated' }, req);
        return res.status(403).json({
          success: false,
          error: 'Account is deactivated'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        logAudit(db, user.id, 'login', 'user', user.id, 'failure', { reason: 'invalid_password' }, req);
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      // Generate refresh token
      const refreshToken = crypto.randomBytes(32).toString('hex');
      const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const refreshExpiresAt = new Date();
      refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7); // 7 days

      db.prepare(`
        INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
        VALUES (?, ?, ?)
      `).run(user.id, refreshTokenHash, refreshExpiresAt.toISOString());

      // Update last login
      db.prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

      // Log successful login
      logAudit(db, user.id, 'login', 'user', user.id, 'success', null, req);

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role
          },
          token,
          refresh_token: refreshToken
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Login failed'
      });
    }
  });

  /**
   * POST /api/auth/refresh
   * Refresh access token using refresh token
   */
  router.post('/refresh', validate(authSchemas.refreshToken), (req, res) => {
    try {
      const { refresh_token } = req.body;

      // Hash the refresh token
      const tokenHash = crypto.createHash('sha256').update(refresh_token).digest('hex');

      // Find refresh token
      const tokenRecord = db.prepare(`
        SELECT rt.user_id, rt.expires_at, rt.is_revoked, u.is_active
        FROM refresh_tokens rt
        JOIN users u ON rt.user_id = u.id
        WHERE rt.token_hash = ?
      `).get(tokenHash);

      if (!tokenRecord) {
        return res.status(401).json({
          success: false,
          error: 'Invalid refresh token'
        });
      }

      if (tokenRecord.is_revoked) {
        return res.status(401).json({
          success: false,
          error: 'Refresh token has been revoked'
        });
      }

      if (!tokenRecord.is_active) {
        return res.status(403).json({
          success: false,
          error: 'User account is deactivated'
        });
      }

      if (new Date(tokenRecord.expires_at) < new Date()) {
        return res.status(401).json({
          success: false,
          error: 'Refresh token expired'
        });
      }

      // Generate new JWT token
      const token = jwt.sign(
        { userId: tokenRecord.user_id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      res.json({
        success: true,
        data: { token }
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        error: 'Token refresh failed'
      });
    }
  });

  /**
   * POST /api/auth/logout
   * Logout and revoke refresh token
   */
  router.post('/logout', authenticate(db), (req, res) => {
    try {
      const { refresh_token } = req.body;

      if (refresh_token) {
        const tokenHash = crypto.createHash('sha256').update(refresh_token).digest('hex');
        db.prepare(`
          UPDATE refresh_tokens
          SET is_revoked = 1
          WHERE token_hash = ? AND user_id = ?
        `).run(tokenHash, req.user.id);
      }

      logAudit(db, req.user.id, 'logout', 'user', req.user.id, 'success', null, req);

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Logout failed'
      });
    }
  });

  /**
   * GET /api/auth/me
   * Get current user profile
   */
  router.get('/me', authenticate(db), (req, res) => {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  });

  /**
   * PUT /api/auth/password
   * Change password
   */
  router.put('/password', authenticate(db), validate(authSchemas.changePassword), async (req, res) => {
    try {
      const { current_password, new_password } = req.body;

      // Get current password hash
      const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);

      // Verify current password
      const isValidPassword = await bcrypt.compare(current_password, user.password_hash);
      if (!isValidPassword) {
        logAudit(db, req.user.id, 'change_password', 'user', req.user.id, 'failure', { reason: 'invalid_current_password' }, req);
        return res.status(401).json({
          success: false,
          error: 'Current password is incorrect'
        });
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(new_password, parseInt(process.env.BCRYPT_ROUNDS || 10));

      // Update password
      db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(newPasswordHash, req.user.id);

      // Revoke all refresh tokens for security
      db.prepare('UPDATE refresh_tokens SET is_revoked = 1 WHERE user_id = ?').run(req.user.id);

      logAudit(db, req.user.id, 'change_password', 'user', req.user.id, 'success', null, req);

      res.json({
        success: true,
        message: 'Password changed successfully. Please login again.'
      });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({
        success: false,
        error: 'Password change failed'
      });
    }
  });

  /**
   * POST /api/auth/api-keys
   * Generate new API key
   */
  router.post('/api-keys', authenticate(db), (req, res) => {
    try {
      const { name, expires_in_days } = req.body;

      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'API key name is required'
        });
      }

      // Generate random API key
      const apiKey = 'bh_' + crypto.randomBytes(32).toString('hex');
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

      // Calculate expiration
      let expiresAt = null;
      if (expires_in_days) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + parseInt(expires_in_days));
      }

      // Store API key
      const result = db.prepare(`
        INSERT INTO api_keys (user_id, key_hash, name, expires_at)
        VALUES (?, ?, ?, ?)
      `).run(req.user.id, keyHash, name.trim(), expiresAt ? expiresAt.toISOString() : null);

      logAudit(db, req.user.id, 'create_api_key', 'api_key', result.lastInsertRowid, 'success', { name }, req);

      res.status(201).json({
        success: true,
        data: {
          id: result.lastInsertRowid,
          api_key: apiKey,
          name: name.trim(),
          expires_at: expiresAt
        },
        message: 'API key created. Save it securely - it will not be shown again.'
      });
    } catch (error) {
      console.error('API key creation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create API key'
      });
    }
  });

  /**
   * GET /api/auth/api-keys
   * List user's API keys
   */
  router.get('/api-keys', authenticate(db), (req, res) => {
    try {
      const keys = db.prepare(`
        SELECT id, name, last_used_at, expires_at, created_at, is_active
        FROM api_keys
        WHERE user_id = ?
        ORDER BY created_at DESC
      `).all(req.user.id);

      res.json({
        success: true,
        data: keys
      });
    } catch (error) {
      console.error('API keys list error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch API keys'
      });
    }
  });

  /**
   * DELETE /api/auth/api-keys/:id
   * Revoke API key
   */
  router.delete('/api-keys/:id', authenticate(db), (req, res) => {
    try {
      const { id } = req.params;

      // Verify ownership
      const key = db.prepare('SELECT user_id FROM api_keys WHERE id = ?').get(id);
      if (!key) {
        return res.status(404).json({
          success: false,
          error: 'API key not found'
        });
      }

      if (key.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to revoke this API key'
        });
      }

      // Deactivate key
      db.prepare('UPDATE api_keys SET is_active = 0 WHERE id = ?').run(id);

      logAudit(db, req.user.id, 'revoke_api_key', 'api_key', id, 'success', null, req);

      res.json({
        success: true,
        message: 'API key revoked successfully'
      });
    } catch (error) {
      console.error('API key revocation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to revoke API key'
      });
    }
  });

  return router;
};

module.exports = createAuthRoutes;
