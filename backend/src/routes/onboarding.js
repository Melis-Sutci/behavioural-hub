/**
 * Onboarding Builder API Routes
 * Manages onboarding flows, screens, variants, and AI-powered suggestions
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const aiSuggestions = require('../services/onboarding/aiSuggestions');

function createOnboardingRoutes(db) {
  const router = express.Router();

  // ============================================
  // ONBOARDING FLOWS
  // ============================================

  /**
   * GET /api/onboarding/flows
   * Get all onboarding flows
   */
  router.get('/flows', [
    query('country_code').optional().isString(),
    query('status').optional().isIn(['draft', 'active', 'archived'])
  ], (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { country_code, status } = req.query;

      let query = 'SELECT * FROM onboarding_flows WHERE 1=1';
      const params = [];

      if (country_code) {
        query += ' AND country_code = ?';
        params.push(country_code);
      }

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      query += ' ORDER BY created_at DESC';

      const flows = db.prepare(query).all(...params);

      res.json({
        success: true,
        data: flows,
        count: flows.length
      });
    } catch (error) {
      console.error('Error fetching onboarding flows:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/onboarding/flows/:id
   * Get single onboarding flow with screens
   */
  router.get('/flows/:id', [
    param('id').isInt()
  ], (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;

      const flow = db.prepare('SELECT * FROM onboarding_flows WHERE id = ?').get(id);

      if (!flow) {
        return res.status(404).json({
          success: false,
          error: 'Onboarding flow not found'
        });
      }

      // Get screens
      const screens = db.prepare(`
        SELECT * FROM onboarding_screens
        WHERE flow_id = ?
        ORDER BY order_index ASC
      `).all(id);

      // Get suggestions
      const suggestions = db.prepare(`
        SELECT * FROM onboarding_suggestions
        WHERE flow_id = ?
        ORDER BY priority DESC, confidence_score DESC
      `).all(id);

      // Parse JSON fields in suggestions
      suggestions.forEach(s => {
        try {
          s.industry_examples = s.industry_examples ? JSON.parse(s.industry_examples) : [];
        } catch (e) {
          s.industry_examples = [];
        }
      });

      res.json({
        success: true,
        data: {
          ...flow,
          screens,
          suggestions
        }
      });
    } catch (error) {
      console.error('Error fetching onboarding flow:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/onboarding/flows
   * Create new onboarding flow
   */
  router.post('/flows', [
    body('name').notEmpty().trim(),
    body('country_code').notEmpty().isLength({ min: 2, max: 2 }),
    body('app_version').optional().isString(),
    body('platform').optional().isIn(['ios', 'android', 'both']),
    body('description').optional().isString()
  ], (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const {
        name,
        description,
        country_code,
        app_version,
        platform
      } = req.body;

      const stmt = db.prepare(`
        INSERT INTO onboarding_flows (
          name, description, country_code, app_version, platform, created_by
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        name,
        description || '',
        country_code,
        app_version || '1.0.0',
        platform || 'both',
        req.user?.email || 'user'
      );

      res.status(201).json({
        success: true,
        data: {
          id: result.lastInsertRowid,
          message: 'Onboarding flow created successfully'
        }
      });
    } catch (error) {
      console.error('Error creating onboarding flow:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * PATCH /api/onboarding/flows/:id
   * Update onboarding flow
   */
  router.patch('/flows/:id', [
    param('id').isInt(),
    body('status').optional().isIn(['draft', 'active', 'archived'])
  ], (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;
      const updates = req.body;

      const allowedFields = [
        'name', 'description', 'status', 'platform',
        'avg_completion_rate', 'avg_time_to_complete', 'conversion_rate'
      ];

      const updateFields = [];
      const values = [];

      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          updateFields.push(`${key} = ?`);
          values.push(updates[key]);
        }
      });

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid fields to update'
        });
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const query = `UPDATE onboarding_flows SET ${updateFields.join(', ')} WHERE id = ?`;
      db.prepare(query).run(...values);

      res.json({
        success: true,
        message: 'Onboarding flow updated successfully'
      });
    } catch (error) {
      console.error('Error updating onboarding flow:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * DELETE /api/onboarding/flows/:id
   * Delete onboarding flow
   */
  router.delete('/flows/:id', [
    param('id').isInt()
  ], (req, res) => {
    try {
      const { id } = req.params;

      const result = db.prepare('DELETE FROM onboarding_flows WHERE id = ?').run(id);

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          error: 'Onboarding flow not found'
        });
      }

      res.json({
        success: true,
        message: 'Onboarding flow deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting onboarding flow:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ============================================
  // ONBOARDING SCREENS
  // ============================================

  /**
   * POST /api/onboarding/screens
   * Create new screen in a flow
   */
  router.post('/screens', [
    body('flow_id').isInt(),
    body('screen_type').notEmpty().isString(),
    body('order_index').isInt({ min: 1 }),
    body('title').optional().isString(),
    body('cta_text').optional().isString()
  ], (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const {
        flow_id, order_index, screen_type, title, subtitle, description,
        background_type, background_value, cta_text, cta_style,
        skip_enabled, animation_type, analytics_label
      } = req.body;

      const stmt = db.prepare(`
        INSERT INTO onboarding_screens (
          flow_id, order_index, screen_type, title, subtitle, description,
          background_type, background_value, cta_text, cta_style,
          skip_enabled, animation_type, analytics_label
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        flow_id, order_index, screen_type, title || '', subtitle || '',
        description || '', background_type || 'color', background_value || '#ffffff',
        cta_text || 'Continue', cta_style || 'primary',
        skip_enabled ? 1 : 0, animation_type || 'fade', analytics_label || ''
      );

      // Update flow's total_screens count
      db.prepare(`
        UPDATE onboarding_flows
        SET total_screens = (SELECT COUNT(*) FROM onboarding_screens WHERE flow_id = ?),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(flow_id, flow_id);

      res.status(201).json({
        success: true,
        data: {
          id: result.lastInsertRowid,
          message: 'Screen created successfully'
        }
      });
    } catch (error) {
      console.error('Error creating screen:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * PATCH /api/onboarding/screens/:id
   * Update screen
   */
  router.patch('/screens/:id', [
    param('id').isInt()
  ], (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const allowedFields = [
        'order_index', 'screen_type', 'title', 'subtitle', 'description',
        'background_type', 'background_value', 'cta_text', 'cta_style',
        'skip_enabled', 'animation_type', 'analytics_label'
      ];

      const updateFields = [];
      const values = [];

      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          updateFields.push(`${key} = ?`);
          values.push(updates[key]);
        }
      });

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid fields to update'
        });
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const query = `UPDATE onboarding_screens SET ${updateFields.join(', ')} WHERE id = ?`;
      db.prepare(query).run(...values);

      res.json({
        success: true,
        message: 'Screen updated successfully'
      });
    } catch (error) {
      console.error('Error updating screen:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * DELETE /api/onboarding/screens/:id
   * Delete screen
   */
  router.delete('/screens/:id', [
    param('id').isInt()
  ], (req, res) => {
    try {
      const { id } = req.params;

      // Get flow_id before deleting
      const screen = db.prepare('SELECT flow_id FROM onboarding_screens WHERE id = ?').get(id);

      if (!screen) {
        return res.status(404).json({
          success: false,
          error: 'Screen not found'
        });
      }

      db.prepare('DELETE FROM onboarding_screens WHERE id = ?').run(id);

      // Update flow's total_screens count
      db.prepare(`
        UPDATE onboarding_flows
        SET total_screens = (SELECT COUNT(*) FROM onboarding_screens WHERE flow_id = ?),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(screen.flow_id, screen.flow_id);

      res.json({
        success: true,
        message: 'Screen deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting screen:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ============================================
  // AI SUGGESTIONS
  // ============================================

  /**
   * POST /api/onboarding/suggestions/generate
   * Generate AI-powered suggestions for a flow
   */
  router.post('/suggestions/generate', [
    body('flow_id').isInt(),
    body('country_code').optional().isString(),
    body('target_segment').optional().isString()
  ], async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { flow_id, country_code, target_segment, app_category, current_metrics } = req.body;

      // Get flow
      const flow = db.prepare('SELECT * FROM onboarding_flows WHERE id = ?').get(flow_id);

      if (!flow) {
        return res.status(404).json({
          success: false,
          error: 'Onboarding flow not found'
        });
      }

      // Get screens
      const screens = db.prepare(`
        SELECT * FROM onboarding_screens
        WHERE flow_id = ?
        ORDER BY order_index ASC
      `).all(flow_id);

      // Generate suggestions
      const suggestions = await aiSuggestions.generateSuggestions(flow, screens, {
        country_code: country_code || flow.country_code,
        target_segment: target_segment || 'all',
        app_category: app_category || 'utility',
        current_metrics: current_metrics || {
          completion_rate: flow.avg_completion_rate * 100,
          conversion_rate: flow.conversion_rate * 100
        }
      });

      // Save suggestions to database
      const insertStmt = db.prepare(`
        INSERT INTO onboarding_suggestions (
          flow_id, suggestion_type, category, title, description, rationale,
          expected_impact, confidence_score, priority, industry_examples, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertSuggestions = db.transaction((suggestions) => {
        for (const sugg of suggestions) {
          insertStmt.run(
            flow_id,
            sugg.type,
            sugg.category,
            sugg.title,
            sugg.description,
            sugg.rationale || '',
            sugg.expected_impact || '',
            sugg.confidence_score || 0.7,
            sugg.priority || 'medium',
            JSON.stringify(sugg.industry_examples || []),
            'suggested'
          );
        }
      });

      insertSuggestions(suggestions);

      res.json({
        success: true,
        data: suggestions,
        count: suggestions.length,
        message: `Generated ${suggestions.length} suggestions`
      });
    } catch (error) {
      console.error('Error generating suggestions:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/onboarding/suggestions
   * Get suggestions for a flow
   */
  router.get('/suggestions', [
    query('flow_id').optional().isInt(),
    query('status').optional().isIn(['suggested', 'planned', 'tested', 'rejected'])
  ], (req, res) => {
    try {
      const { flow_id, status } = req.query;

      let query = 'SELECT * FROM onboarding_suggestions WHERE 1=1';
      const params = [];

      if (flow_id) {
        query += ' AND flow_id = ?';
        params.push(flow_id);
      }

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      query += ' ORDER BY priority DESC, confidence_score DESC, created_at DESC';

      const suggestions = db.prepare(query).all(...params);

      // Parse JSON fields
      suggestions.forEach(s => {
        try {
          s.industry_examples = s.industry_examples ? JSON.parse(s.industry_examples) : [];
        } catch (e) {
          s.industry_examples = [];
        }
      });

      res.json({
        success: true,
        data: suggestions,
        count: suggestions.length
      });
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * PATCH /api/onboarding/suggestions/:id
   * Update suggestion status (suggested -> planned -> tested)
   */
  router.patch('/suggestions/:id', [
    param('id').isInt(),
    body('status').isIn(['suggested', 'planned', 'tested', 'rejected'])
  ], (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;
      const { status, planned_date, tested_date, test_results, implementation_notes } = req.body;

      let query = 'UPDATE onboarding_suggestions SET status = ?, updated_at = CURRENT_TIMESTAMP';
      const params = [status];

      if (planned_date) {
        query += ', planned_date = ?';
        params.push(planned_date);
      }

      if (tested_date) {
        query += ', tested_date = ?';
        params.push(tested_date);
      }

      if (test_results) {
        query += ', test_results = ?';
        params.push(test_results);
      }

      if (implementation_notes) {
        query += ', implementation_notes = ?';
        params.push(implementation_notes);
      }

      query += ' WHERE id = ?';
      params.push(id);

      db.prepare(query).run(...params);

      res.json({
        success: true,
        message: 'Suggestion updated successfully'
      });
    } catch (error) {
      console.error('Error updating suggestion:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/onboarding/best-practices
   * Get industry best practices database
   */
  router.get('/best-practices', (req, res) => {
    try {
      const { category } = req.query;

      if (category) {
        const practices = aiSuggestions.getBestPractices(category);
        if (!practices) {
          return res.status(404).json({
            success: false,
            error: 'Category not found'
          });
        }
        res.json({ success: true, data: practices });
      } else {
        const categories = aiSuggestions.getAllCategories();
        const allPractices = {};
        categories.forEach(cat => {
          allPractices[cat] = aiSuggestions.getBestPractices(cat);
        });
        res.json({ success: true, data: allPractices });
      }
    } catch (error) {
      console.error('Error fetching best practices:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ============================================
  // ANALYTICS
  // ============================================

  /**
   * GET /api/onboarding/analytics
   * Get analytics for flows and screens
   */
  router.get('/analytics', [
    query('flow_id').optional().isInt(),
    query('date_from').optional().isISO8601(),
    query('date_to').optional().isISO8601()
  ], (req, res) => {
    try {
      const { flow_id, date_from, date_to } = req.query;

      let query = `
        SELECT
          f.id as flow_id,
          f.name as flow_name,
          f.country_code,
          SUM(a.views) as total_views,
          SUM(a.completions) as total_completions,
          SUM(a.skip_count) as total_skips,
          SUM(a.drop_off_count) as total_dropoffs,
          ROUND(CAST(SUM(a.completions) AS FLOAT) / NULLIF(SUM(a.views), 0) * 100, 2) as completion_rate,
          AVG(a.avg_time_spent) as avg_time_spent,
          SUM(a.conversion_count) as total_conversions,
          SUM(a.revenue) as total_revenue
        FROM onboarding_analytics a
        JOIN onboarding_flows f ON a.flow_id = f.id
        WHERE 1=1
      `;

      const params = [];

      if (flow_id) {
        query += ' AND a.flow_id = ?';
        params.push(flow_id);
      }

      if (date_from) {
        query += ' AND a.date >= ?';
        params.push(date_from);
      }

      if (date_to) {
        query += ' AND a.date <= ?';
        params.push(date_to);
      }

      query += ' GROUP BY f.id ORDER BY total_views DESC';

      const analytics = db.prepare(query).all(...params);

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
}

module.exports = createOnboardingRoutes;
