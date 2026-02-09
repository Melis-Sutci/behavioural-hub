/**
 * Industry Tracking & Competitor Analysis Routes
 * Track industry news, platform updates, and competitor features
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');

const createIndustryTrackingRoutes = (db) => {
  const router = express.Router();

  // All routes are protected
  router.use(authenticate(db));

  // ==========================================
  // INDUSTRY NEWS SOURCES
  // ==========================================

  /**
   * GET /api/industry/news-sources
   * Get all news sources
   */
  router.get('/news-sources', (req, res) => {
    try {
      const { category, app_context, is_active } = req.query;

      let query = 'SELECT * FROM industry_news_sources WHERE 1=1';
      const params = [];

      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }

      if (app_context) {
        query += ' AND app_context = ?';
        params.push(app_context);
      }

      if (is_active !== undefined) {
        query += ' AND is_active = ?';
        params.push(is_active === 'true' ? 1 : 0);
      }

      query += ' ORDER BY name ASC';

      const sources = db.prepare(query).all(...params);

      res.json({
        success: true,
        data: sources
      });
    } catch (error) {
      console.error('Error fetching news sources:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch news sources'
      });
    }
  });

  /**
   * POST /api/industry/news-sources
   * Add a new news source
   */
  router.post('/news-sources', (req, res) => {
    try {
      const { name, url, category, app_context, check_frequency } = req.body;

      if (!name || !url || !category) {
        return res.status(400).json({
          success: false,
          error: 'Name, URL, and category are required'
        });
      }

      const result = db.prepare(`
        INSERT INTO industry_news_sources (name, url, category, app_context, check_frequency)
        VALUES (?, ?, ?, ?, ?)
      `).run(name, url, category, app_context || 'getcontact', check_frequency || 'daily');

      res.status(201).json({
        success: true,
        data: {
          id: result.lastInsertRowid,
          name,
          url,
          category
        }
      });
    } catch (error) {
      console.error('Error creating news source:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create news source'
      });
    }
  });

  // ==========================================
  // INDUSTRY NEWS
  // ==========================================

  /**
   * GET /api/industry/news
   * Get industry news with filters
   */
  router.get('/news', (req, res) => {
    try {
      const { category, platform, status, priority, limit = 50 } = req.query;

      let query = `
        SELECT
          n.*,
          s.name as source_name,
          u.full_name as reviewed_by_name
        FROM industry_news n
        LEFT JOIN industry_news_sources s ON n.source_id = s.id
        LEFT JOIN users u ON n.reviewed_by = u.id
        WHERE 1=1
      `;
      const params = [];

      if (category) {
        query += ' AND n.category = ?';
        params.push(category);
      }

      if (platform) {
        query += ' AND n.platform = ?';
        params.push(platform);
      }

      if (status) {
        query += ' AND n.status = ?';
        params.push(status);
      }

      if (priority) {
        query += ' AND n.priority = ?';
        params.push(priority);
      }

      query += ' ORDER BY n.published_date DESC, n.created_at DESC LIMIT ?';
      params.push(parseInt(limit));

      const news = db.prepare(query).all(...params);

      // Parse JSON fields
      const parsedNews = news.map(item => ({
        ...item,
        key_points: item.key_points ? JSON.parse(item.key_points) : [],
        action_items: item.action_items ? JSON.parse(item.action_items) : []
      }));

      res.json({
        success: true,
        data: parsedNews
      });
    } catch (error) {
      console.error('Error fetching industry news:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch industry news'
      });
    }
  });

  /**
   * POST /api/industry/news
   * Add a new industry news item
   */
  router.post('/news', (req, res) => {
    try {
      const {
        source_id,
        title,
        url,
        summary,
        category,
        platform,
        relevance_score,
        priority,
        key_points,
        impact_analysis,
        action_items,
        published_date
      } = req.body;

      if (!source_id || !title || !category) {
        return res.status(400).json({
          success: false,
          error: 'Source ID, title, and category are required'
        });
      }

      const result = db.prepare(`
        INSERT INTO industry_news (
          source_id, title, url, summary, category, platform,
          relevance_score, priority, key_points, impact_analysis,
          action_items, published_date
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        source_id,
        title,
        url,
        summary,
        category,
        platform,
        relevance_score || 0.5,
        priority || 'medium',
        key_points ? JSON.stringify(key_points) : null,
        impact_analysis,
        action_items ? JSON.stringify(action_items) : null,
        published_date
      );

      res.status(201).json({
        success: true,
        data: {
          id: result.lastInsertRowid,
          title
        }
      });
    } catch (error) {
      console.error('Error creating news item:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create news item'
      });
    }
  });

  /**
   * PATCH /api/industry/news/:id/status
   * Update news item status
   */
  router.patch('/news/:id/status', (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: 'Status is required'
        });
      }

      db.prepare(`
        UPDATE industry_news
        SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(status, req.user.id, id);

      res.json({
        success: true,
        message: 'News status updated'
      });
    } catch (error) {
      console.error('Error updating news status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update news status'
      });
    }
  });

  // ==========================================
  // COMPETITOR APPS
  // ==========================================

  /**
   * GET /api/industry/competitor-apps
   * Get all competitor apps
   */
  router.get('/competitor-apps', (req, res) => {
    try {
      const { tier, category, is_active } = req.query;

      let query = 'SELECT * FROM competitor_apps WHERE 1=1';
      const params = [];

      if (tier) {
        query += ' AND tier = ?';
        params.push(tier);
      }

      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }

      if (is_active !== undefined) {
        query += ' AND is_active = ?';
        params.push(is_active === 'true' ? 1 : 0);
      }

      query += ' ORDER BY tier ASC, name ASC';

      const apps = db.prepare(query).all(...params);

      // Parse JSON fields
      const parsedApps = apps.map(app => ({
        ...app,
        key_strengths: app.key_strengths ? JSON.parse(app.key_strengths) : [],
        key_weaknesses: app.key_weaknesses ? JSON.parse(app.key_weaknesses) : []
      }));

      res.json({
        success: true,
        data: parsedApps
      });
    } catch (error) {
      console.error('Error fetching competitor apps:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch competitor apps'
      });
    }
  });

  /**
   * GET /api/industry/competitor-apps/:id/features
   * Get features for a specific competitor
   */
  router.get('/competitor-apps/:id/features', (req, res) => {
    try {
      const { id } = req.params;

      const features = db.prepare(`
        SELECT * FROM competitor_features
        WHERE competitor_app_id = ?
        ORDER BY implementation_priority DESC, discovered_date DESC
      `).all(id);

      res.json({
        success: true,
        data: features
      });
    } catch (error) {
      console.error('Error fetching competitor features:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch competitor features'
      });
    }
  });

  /**
   * POST /api/industry/competitor-apps/:id/features
   * Add a feature for a competitor
   */
  router.post('/competitor-apps/:id/features', (req, res) => {
    try {
      const { id } = req.params;
      const {
        feature_name,
        description,
        category,
        implementation_quality,
        user_impact,
        uniqueness,
        we_have_it,
        our_version_better,
        should_implement,
        implementation_priority,
        screenshot_url,
        notes
      } = req.body;

      if (!feature_name) {
        return res.status(400).json({
          success: false,
          error: 'Feature name is required'
        });
      }

      const result = db.prepare(`
        INSERT INTO competitor_features (
          competitor_app_id, feature_name, description, category,
          implementation_quality, user_impact, uniqueness,
          we_have_it, our_version_better, should_implement,
          implementation_priority, screenshot_url, notes, reviewed_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        feature_name,
        description,
        category,
        implementation_quality,
        user_impact,
        uniqueness,
        we_have_it ? 1 : 0,
        our_version_better ? 1 : 0,
        should_implement ? 1 : 0,
        implementation_priority || 'low',
        screenshot_url,
        notes,
        req.user.id
      );

      res.status(201).json({
        success: true,
        data: {
          id: result.lastInsertRowid,
          feature_name
        }
      });
    } catch (error) {
      console.error('Error adding competitor feature:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add competitor feature'
      });
    }
  });

  // ==========================================
  // PLATFORM UPDATES
  // ==========================================

  /**
   * GET /api/industry/platform-updates
   * Get platform updates
   */
  router.get('/platform-updates', (req, res) => {
    try {
      const { platform, status, affects_us, limit = 50 } = req.query;

      let query = `
        SELECT
          p.*,
          u.full_name as reviewed_by_name
        FROM platform_updates p
        LEFT JOIN users u ON p.reviewed_by = u.id
        WHERE 1=1
      `;
      const params = [];

      if (platform) {
        query += ' AND p.platform = ?';
        params.push(platform);
      }

      if (status) {
        query += ' AND p.status = ?';
        params.push(status);
      }

      if (affects_us !== undefined) {
        query += ' AND p.affects_us = ?';
        params.push(affects_us === 'true' ? 1 : 0);
      }

      query += ' ORDER BY p.release_date DESC, p.created_at DESC LIMIT ?';
      params.push(parseInt(limit));

      const updates = db.prepare(query).all(...params);

      // Parse JSON fields
      const parsedUpdates = updates.map(update => ({
        ...update,
        features: update.features ? JSON.parse(update.features) : [],
        api_changes: update.api_changes ? JSON.parse(update.api_changes) : [],
        deprecations: update.deprecations ? JSON.parse(update.deprecations) : [],
        opportunities: update.opportunities ? JSON.parse(update.opportunities) : [],
        risks: update.risks ? JSON.parse(update.risks) : []
      }));

      res.json({
        success: true,
        data: parsedUpdates
      });
    } catch (error) {
      console.error('Error fetching platform updates:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch platform updates'
      });
    }
  });

  /**
   * POST /api/industry/platform-updates
   * Add a new platform update
   */
  router.post('/platform-updates', (req, res) => {
    try {
      const {
        platform,
        version,
        title,
        description,
        release_date,
        features,
        api_changes,
        deprecations,
        affects_us,
        impact_level,
        opportunities,
        risks,
        action_required
      } = req.body;

      if (!platform || !version || !title) {
        return res.status(400).json({
          success: false,
          error: 'Platform, version, and title are required'
        });
      }

      const result = db.prepare(`
        INSERT INTO platform_updates (
          platform, version, title, description, release_date,
          features, api_changes, deprecations, affects_us, impact_level,
          opportunities, risks, action_required
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        platform,
        version,
        title,
        description,
        release_date,
        features ? JSON.stringify(features) : null,
        api_changes ? JSON.stringify(api_changes) : null,
        deprecations ? JSON.stringify(deprecations) : null,
        affects_us ? 1 : 0,
        impact_level || 'medium',
        opportunities ? JSON.stringify(opportunities) : null,
        risks ? JSON.stringify(risks) : null,
        action_required
      );

      res.status(201).json({
        success: true,
        data: {
          id: result.lastInsertRowid,
          title
        }
      });
    } catch (error) {
      console.error('Error creating platform update:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create platform update'
      });
    }
  });

  // ==========================================
  // DASHBOARD STATS
  // ==========================================

  /**
   * GET /api/industry/stats
   * Get dashboard statistics
   */
  router.get('/stats', (req, res) => {
    try {
      const stats = {
        news: {
          total: db.prepare('SELECT COUNT(*) as count FROM industry_news').get().count,
          new: db.prepare("SELECT COUNT(*) as count FROM industry_news WHERE status = 'new'").get().count,
          critical: db.prepare("SELECT COUNT(*) as count FROM industry_news WHERE priority = 'critical'").get().count,
          sources: db.prepare('SELECT COUNT(*) as count FROM industry_news_sources WHERE is_active = 1').get().count
        },
        competitors: {
          total: db.prepare('SELECT COUNT(*) as count FROM competitor_apps WHERE is_active = 1').get().count,
          primary: db.prepare("SELECT COUNT(*) as count FROM competitor_apps WHERE tier = 'primary'").get().count,
          features_to_implement: db.prepare('SELECT COUNT(*) as count FROM competitor_features WHERE should_implement = 1 AND we_have_it = 0').get().count
        },
        platforms: {
          total: db.prepare('SELECT COUNT(*) as count FROM platform_updates').get().count,
          affects_us: db.prepare('SELECT COUNT(*) as count FROM platform_updates WHERE affects_us = 1').get().count,
          critical: db.prepare("SELECT COUNT(*) as count FROM platform_updates WHERE impact_level = 'critical'").get().count
        }
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch stats'
      });
    }
  });

  return router;
};

module.exports = createIndustryTrackingRoutes;
