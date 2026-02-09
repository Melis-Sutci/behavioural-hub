const express = require('express');
const { v4: uuidv4 } = require('uuid');
// Fix: Use default imports instead of destructuring
const AutopilotAIService = require('../services/autopilot/aiService');
const PaywallGenerator = require('../services/autopilot/paywallGenerator');
const PaywallExporter = require('../services/autopilot/paywallExporter');
const PatternDetector = require('../services/autopilot/patternDetector');
const BehavioralClusteringEngine = require('../services/segmentation/clusteringEngine');
const RFMAnalysisEngine = require('../services/segmentation/rfmEngine');
const ChurnPredictor = require('../services/predictive/churnPredictor');
const LTVPredictor = require('../services/predictive/ltvPredictor');
const GrowthLoopDetector = require('../services/growthLoops/loopDetector');
const ViralCoefficientCalculator = require('../services/growthLoops/viralCalculator');

// Import upload middleware
const { uploadMultiple, handleUploadError } = require('../middleware/upload');

// Import validation middleware
const {
  validateAudit,
  validateRecommendations,
  validateCompetitor,
  validateChurnPrediction,
  validateLtvPrediction,
  validateClustering,
  validatePatternDetection
} = require('../middleware/autopilotValidation');

module.exports = (db) => {
  const router = express.Router();

  // Initialize services with db parameter
  const aiService = new AutopilotAIService(db);
  const paywallGenerator = new PaywallGenerator(db);
  const paywallExporter = new PaywallExporter(db);
  const patternDetector = new PatternDetector(db);
  const clusteringEngine = new BehavioralClusteringEngine(db);
  const rfmEngine = new RFMAnalysisEngine(db);
  const churnPredictor = new ChurnPredictor(db);
  const ltvPredictor = new LTVPredictor(db);
  const loopDetector = new GrowthLoopDetector(db);
  const viralCalculator = new ViralCoefficientCalculator(db);

  // ==========================================
  // COMPETITORS API
  // ==========================================

  // GET /api/autopilot/competitors - List all competitors
  router.get('/competitors', (req, res) => {
    try {
      const { category, country } = req.query;

      let query = 'SELECT * FROM paywall_competitors';
      const conditions = [];
      const params = [];

      if (category) {
        conditions.push('category = ?');
        params.push(category);
      }
      if (country) {
        conditions.push('country = ?');
        params.push(country);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY updated_at DESC';

      const competitors = db.prepare(query).all(...params);

      res.json({
        success: true,
        data: competitors,
        total: competitors.length
      });
    } catch (error) {
      console.error('Error fetching competitors:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST /api/autopilot/competitors - Add new competitor
  router.post('/competitors', validateCompetitor, (req, res) => {
    try {
      const competitorId = `comp_${uuidv4()}`;
      const {
        app_name,
        bundle_id,
        category,
        country = 'US',
        pricing_weekly,
        pricing_monthly,
        pricing_yearly,
        pricing_lifetime,
        trial_duration,
        trial_type,
        paywall_screenshot_url,
        paywall_template,
        paywall_elements,
        notes,
        market_position
      } = req.body;

      if (!app_name || !category) {
        return res.status(400).json({
          success: false,
          error: 'app_name and category are required'
        });
      }

      const stmt = db.prepare(`
        INSERT INTO paywall_competitors (
          id, app_name, bundle_id, category, country,
          pricing_weekly, pricing_monthly, pricing_yearly, pricing_lifetime,
          trial_duration, trial_type,
          paywall_screenshot_url, paywall_template, paywall_elements,
          notes, market_position, added_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);

      stmt.run(
        competitorId, app_name, bundle_id, category, country,
        pricing_weekly, pricing_monthly, pricing_yearly, pricing_lifetime,
        trial_duration, trial_type,
        paywall_screenshot_url, paywall_template,
        paywall_elements ? JSON.stringify(paywall_elements) : null,
        notes, market_position
      );

      const competitor = db.prepare('SELECT * FROM paywall_competitors WHERE id = ?').get(competitorId);

      res.status(201).json({
        success: true,
        data: competitor
      });
    } catch (error) {
      console.error('Error adding competitor:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // PUT /api/autopilot/competitors/:id - Update competitor
  router.put('/competitors/:id', (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Check if competitor exists
      const existing = db.prepare('SELECT * FROM paywall_competitors WHERE id = ?').get(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Competitor not found' });
      }

      // Build update query dynamically
      const allowedFields = [
        'app_name', 'bundle_id', 'category', 'country',
        'pricing_weekly', 'pricing_monthly', 'pricing_yearly', 'pricing_lifetime',
        'trial_duration', 'trial_type', 'paywall_screenshot_url',
        'paywall_template', 'paywall_elements', 'notes', 'market_position'
      ];

      const setFields = [];
      const params = [];

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          setFields.push(`${field} = ?`);
          params.push(field === 'paywall_elements' && typeof updates[field] === 'object'
            ? JSON.stringify(updates[field])
            : updates[field]
          );
        }
      }

      if (setFields.length === 0) {
        return res.status(400).json({ success: false, error: 'No valid fields to update' });
      }

      setFields.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      const query = `UPDATE paywall_competitors SET ${setFields.join(', ')} WHERE id = ?`;
      db.prepare(query).run(...params);

      const updated = db.prepare('SELECT * FROM paywall_competitors WHERE id = ?').get(id);

      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      console.error('Error updating competitor:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // DELETE /api/autopilot/competitors/:id - Delete competitor
  router.delete('/competitors/:id', (req, res) => {
    try {
      const { id } = req.params;

      const result = db.prepare('DELETE FROM paywall_competitors WHERE id = ?').run(id);

      if (result.changes === 0) {
        return res.status(404).json({ success: false, error: 'Competitor not found' });
      }

      res.json({
        success: true,
        message: 'Competitor deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting competitor:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ==========================================
  // BENCHMARKS API
  // ==========================================

  // GET /api/autopilot/benchmarks - Get benchmarks
  router.get('/benchmarks', (req, res) => {
    try {
      const { category, country = 'global' } = req.query;

      let query = 'SELECT * FROM benchmarks';
      const params = [];

      if (category) {
        query += ' WHERE category = ? AND country = ?';
        params.push(category, country);
      }

      query += ' ORDER BY category, metric_name';

      const benchmarks = db.prepare(query).all(...params);

      res.json({
        success: true,
        data: benchmarks
      });
    } catch (error) {
      console.error('Error fetching benchmarks:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ==========================================
  // AUDIT API
  // ==========================================

  // POST /api/autopilot/audit - Generate full audit
  router.post('/audit', validateAudit, async (req, res) => {
    try {
      const { category, pricing, trial, metrics } = req.body;

      if (!category || !pricing || !metrics) {
        return res.status(400).json({
          success: false,
          error: 'category, pricing, and metrics are required'
        });
      }

      // Get competitors
      const competitors = db.prepare(
        'SELECT * FROM paywall_competitors WHERE category = ? ORDER BY updated_at DESC LIMIT 10'
      ).all(category);

      // Get benchmarks
      const benchmarks = db.prepare(
        'SELECT * FROM benchmarks WHERE category = ?'
      ).all(category);

      // Generate audit using AI
      const audit = await aiService.generateAudit({
        category,
        pricing,
        trial,
        metrics,
        competitors,
        benchmarks
      });

      // Save audit to database
      const auditId = `audit_${uuidv4()}`;
      db.prepare(`
        INSERT INTO autopilot_audits (
          id, overall_score, strengths, weaknesses, opportunities,
          current_metrics, benchmark_comparison, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        auditId,
        audit.overallScore,
        JSON.stringify(audit.strengths),
        JSON.stringify(audit.weaknesses),
        JSON.stringify(audit.opportunities),
        JSON.stringify(metrics),
        JSON.stringify({ competitors: competitors.length, benchmarks: benchmarks.length })
      );

      res.json({
        success: true,
        data: { id: auditId, ...audit }
      });
    } catch (error) {
      console.error('Error generating audit:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/autopilot/audits - List audits
  router.get('/audits', (req, res) => {
    try {
      const audits = db.prepare(
        'SELECT * FROM autopilot_audits ORDER BY created_at DESC LIMIT 50'
      ).all();

      // Parse JSON fields
      const parsed = audits.map(audit => ({
        ...audit,
        strengths: JSON.parse(audit.strengths || '[]'),
        weaknesses: JSON.parse(audit.weaknesses || '[]'),
        opportunities: JSON.parse(audit.opportunities || '[]'),
        current_metrics: JSON.parse(audit.current_metrics || '{}'),
        benchmark_comparison: JSON.parse(audit.benchmark_comparison || '{}')
      }));

      res.json({
        success: true,
        data: parsed
      });
    } catch (error) {
      console.error('Error fetching audits:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ==========================================
  // RECOMMENDATIONS API
  // ==========================================

  // POST /api/autopilot/recommendations - Generate recommendations
  router.post('/recommendations', validateRecommendations, async (req, res) => {
    try {
      const { category, pricing, trial, metrics, pastTests = [] } = req.body;

      if (!category || !pricing || !metrics) {
        return res.status(400).json({
          success: false,
          error: 'category, pricing, and metrics are required'
        });
      }

      // Get top competitors
      const competitors = db.prepare(
        'SELECT * FROM paywall_competitors WHERE category = ? ORDER BY updated_at DESC LIMIT 5'
      ).all(category);

      // Get benchmarks
      const benchmarks = db.prepare(
        'SELECT * FROM benchmarks WHERE category = ?'
      ).all(category);

      // Generate recommendations using AI
      const recommendations = await aiService.generateRecommendations({
        category,
        pricing,
        trial,
        metrics,
        competitors,
        benchmarks,
        pastTests
      });

      // Save recommendations to database
      const savedRecs = [];
      for (const rec of recommendations) {
        const recId = `rec_${uuidv4()}`;

        db.prepare(`
          INSERT INTO autopilot_recommendations (
            id, test_type, hypothesis, description,
            current_value, suggested_value,
            priority_score, expected_impact, confidence_score,
            sample_size_required, estimated_duration_days,
            rationale, data_sources, competitor_references,
            status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
        `).run(
          recId,
          rec.testType,
          rec.hypothesis,
          rec.description,
          JSON.stringify(rec.currentValue),
          JSON.stringify(rec.suggestedValue),
          rec.priorityScore,
          rec.expectedImpact,
          rec.confidence,
          rec.sampleSize,
          rec.duration,
          rec.rationale,
          JSON.stringify(rec.dataSources || []),
          JSON.stringify(rec.competitorReferences || [])
        );

        savedRecs.push({ id: recId, ...rec });
      }

      res.json({
        success: true,
        data: savedRecs
      });
    } catch (error) {
      console.error('Error generating recommendations:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/autopilot/recommendations - List recommendations
  router.get('/recommendations', (req, res) => {
    try {
      const { status = 'pending' } = req.query;

      const recommendations = db.prepare(
        'SELECT * FROM autopilot_recommendations WHERE status = ? ORDER BY priority_score DESC'
      ).all(status);

      // Parse JSON fields
      const parsed = recommendations.map(rec => ({
        ...rec,
        current_value: JSON.parse(rec.current_value || '{}'),
        suggested_value: JSON.parse(rec.suggested_value || '{}'),
        data_sources: JSON.parse(rec.data_sources || '[]'),
        competitor_references: JSON.parse(rec.competitor_references || '[]')
      }));

      res.json({
        success: true,
        data: parsed
      });
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // PUT /api/autopilot/recommendations/:id/status - Update recommendation status
  router.put('/recommendations/:id/status', (req, res) => {
    try {
      const { id } = req.params;
      const { status, experiment_id } = req.body;

      if (!['pending', 'approved', 'running', 'completed'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid status' });
      }

      const updates = { status };
      if (status === 'running' && experiment_id) {
        updates.experiment_id = experiment_id;
        updates.applied_at = new Date().toISOString();
      }

      const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
      const values = Object.values(updates);
      values.push(id);

      db.prepare(`UPDATE autopilot_recommendations SET ${setClause} WHERE id = ?`).run(...values);

      const updated = db.prepare('SELECT * FROM autopilot_recommendations WHERE id = ?').get(id);

      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      console.error('Error updating recommendation:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ==========================================
  // INSIGHTS API (AUTO-GENERATED)
  // ==========================================

  // POST /api/autopilot/insights/detect - Run pattern detection
  router.post('/insights/detect', validatePatternDetection, async (req, res) => {
    try {
      const { timeWindow = '7d' } = req.body;

      // Run pattern detection
      const patterns = await patternDetector.detectAllPatterns(timeWindow);

      // Save as auto_insights
      const savedInsights = [];
      for (const pattern of patterns) {
        const insightId = db.prepare(`
          INSERT INTO auto_insights (
            source_type, raw_data, confidence_score, pattern_type,
            detected_at, status
          ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 'pending')
        `).run(
          'event_pattern',
          JSON.stringify(pattern),
          pattern.confidence || 0.5,
          pattern.type
        ).lastInsertRowid;

        savedInsights.push({ id: insightId, ...pattern });
      }

      res.json({
        success: true,
        data: savedInsights,
        total: savedInsights.length
      });
    } catch (error) {
      console.error('Error detecting patterns:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/autopilot/insights - List auto-generated insights
  router.get('/insights', (req, res) => {
    try {
      const { status = 'pending' } = req.query;

      const insights = db.prepare(
        'SELECT * FROM auto_insights WHERE status = ? ORDER BY confidence_score DESC, detected_at DESC LIMIT 50'
      ).all(status);

      const parsed = insights.map(insight => ({
        ...insight,
        raw_data: JSON.parse(insight.raw_data || '{}')
      }));

      res.json({
        success: true,
        data: parsed
      });
    } catch (error) {
      console.error('Error fetching auto insights:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ==========================================
  // SEGMENTATION API
  // ==========================================

  // POST /api/autopilot/segments/cluster - Run clustering analysis
  router.post('/segments/cluster', validateClustering, async (req, res) => {
    try {
      const { k = 5, features } = req.body;

      const segments = await clusteringEngine.performClustering(k, features);

      res.json({
        success: true,
        data: segments
      });
    } catch (error) {
      console.error('Error clustering:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST /api/autopilot/segments/rfm - Run RFM analysis
  router.post('/segments/rfm', async (req, res) => {
    try {
      const segments = await rfmEngine.analyzeRFM();

      res.json({
        success: true,
        data: segments
      });
    } catch (error) {
      console.error('Error RFM analysis:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ==========================================
  // CHURN PREDICTION API
  // ==========================================

  // POST /api/autopilot/churn/predict - Predict churn for users
  router.post('/churn/predict', validateChurnPrediction, async (req, res) => {
    try {
      const { userIds } = req.body;

      if (!userIds || !Array.isArray(userIds)) {
        return res.status(400).json({
          success: false,
          error: 'userIds array is required'
        });
      }

      const predictions = await churnPredictor.predictBatch(userIds);

      res.json({
        success: true,
        data: predictions
      });
    } catch (error) {
      console.error('Error predicting churn:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/autopilot/churn/high-risk - Get high-risk users
  router.get('/churn/high-risk', (req, res) => {
    try {
      const highRisk = db.prepare(`
        SELECT * FROM churn_predictions
        WHERE churn_risk_level IN ('critical', 'high')
        ORDER BY churn_probability DESC
        LIMIT 100
      `).all();

      const parsed = highRisk.map(p => ({
        ...p,
        factors: JSON.parse(p.factors || '[]')
      }));

      res.json({
        success: true,
        data: parsed
      });
    } catch (error) {
      console.error('Error fetching high-risk users:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ==========================================
  // LTV PREDICTION API
  // ==========================================

  // POST /api/autopilot/ltv/predict - Predict LTV for users
  router.post('/ltv/predict', validateLtvPrediction, async (req, res) => {
    try {
      const { userIds } = req.body;

      if (!userIds || !Array.isArray(userIds)) {
        return res.status(400).json({
          success: false,
          error: 'userIds array is required'
        });
      }

      const predictions = await ltvPredictor.predictBatch(userIds);

      res.json({
        success: true,
        data: predictions
      });
    } catch (error) {
      console.error('Error predicting LTV:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/autopilot/ltv/high-value - Get high-value users
  router.get('/ltv/high-value', (req, res) => {
    try {
      const highValue = db.prepare(`
        SELECT * FROM ltv_predictions
        WHERE ltv_segment IN ('whale', 'high_value')
        ORDER BY predicted_ltv DESC
        LIMIT 100
      `).all();

      const parsed = highValue.map(p => ({
        ...p,
        factors: JSON.parse(p.factors || '[]')
      }));

      res.json({
        success: true,
        data: parsed
      });
    } catch (error) {
      console.error('Error fetching high-value users:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ==========================================
  // GROWTH LOOPS API
  // ==========================================

  // POST /api/autopilot/loops/detect - Detect growth loops
  router.post('/loops/detect', async (req, res) => {
    try {
      const loops = await loopDetector.detectAllLoops();

      res.json({
        success: true,
        data: loops
      });
    } catch (error) {
      console.error('Error detecting loops:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/autopilot/loops - List growth loops
  router.get('/loops', (req, res) => {
    try {
      const { loop_type, status = 'active' } = req.query;

      let query = 'SELECT * FROM growth_loops WHERE status = ?';
      const params = [status];

      if (loop_type) {
        query += ' AND loop_type = ?';
        params.push(loop_type);
      }

      query += ' ORDER BY loop_strength DESC';

      const loops = db.prepare(query).all(...params);

      const parsed = loops.map(loop => ({
        ...loop,
        trigger_event: JSON.parse(loop.trigger_event || '{}'),
        loop_steps: JSON.parse(loop.loop_steps || '[]')
      }));

      res.json({
        success: true,
        data: parsed
      });
    } catch (error) {
      console.error('Error fetching growth loops:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST /api/autopilot/loops/viral/calculate - Calculate viral coefficient
  router.post('/loops/viral/calculate', async (req, res) => {
    try {
      const { startDate, endDate } = req.body;

      const viralMetrics = await viralCalculator.calculateViralCoefficient(startDate, endDate);

      res.json({
        success: true,
        data: viralMetrics
      });
    } catch (error) {
      console.error('Error calculating viral coefficient:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ==========================================
  // PAYWALL GENERATOR API
  // ==========================================

  // POST /api/autopilot/paywall/generate - Generate paywall designs
  router.post('/paywall/generate', async (req, res) => {
    try {
      const {
        category,
        targetSegment = 'all',
        objective = 'maximize_conversions',
        appContext = {},
        seasonalContext = null
      } = req.body;

      if (!category) {
        return res.status(400).json({
          success: false,
          error: 'category is required'
        });
      }

      const result = await paywallGenerator.generatePaywalls({
        category,
        targetSegment,
        objective,
        appContext,
        seasonalContext
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error generating paywalls:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST /api/autopilot/paywall/refine - Refine existing paywall
  router.post('/paywall/refine', async (req, res) => {
    try {
      const {
        templateId,
        userFeedback,
        targetSegment,
        objective,
        sessionId
      } = req.body;

      if (!templateId || !userFeedback) {
        return res.status(400).json({
          success: false,
          error: 'templateId and userFeedback are required'
        });
      }

      const result = await paywallGenerator.refinePaywall({
        templateId,
        userFeedback,
        targetSegment,
        objective,
        sessionId
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error refining paywall:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST /api/autopilot/paywall/seasonal - Generate seasonal campaign paywall
  router.post('/paywall/seasonal', async (req, res) => {
    try {
      const {
        eventType,
        country,
        startDate,
        endDate,
        discount,
        urgencyLevel = 'medium',
        targetSegment = 'all',
        category
      } = req.body;

      if (!eventType || !country || !startDate || !endDate || !category) {
        return res.status(400).json({
          success: false,
          error: 'eventType, country, startDate, endDate, and category are required'
        });
      }

      const result = await paywallGenerator.generateSeasonalPaywall({
        eventType,
        country,
        startDate,
        endDate,
        discount,
        urgencyLevel,
        targetSegment,
        category
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error generating seasonal paywall:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST /api/autopilot/paywall/optimize-copy - Optimize paywall copy
  router.post('/paywall/optimize-copy', async (req, res) => {
    try {
      const { currentCopy, persona, goal, currentRate, painPoints } = req.body;

      if (!currentCopy || !persona) {
        return res.status(400).json({
          success: false,
          error: 'currentCopy and persona are required'
        });
      }

      const result = await paywallGenerator.optimizeCopy({
        currentCopy,
        persona,
        goal,
        currentRate,
        painPoints
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error optimizing copy:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST /api/autopilot/paywall/optimize-pricing - Optimize pricing strategy
  router.post('/paywall/optimize-pricing', async (req, res) => {
    try {
      const {
        currentPricing,
        competitorPricing,
        benchmarks,
        appMetrics,
        goal = 'maximize_revenue'
      } = req.body;

      if (!currentPricing) {
        return res.status(400).json({
          success: false,
          error: 'currentPricing is required'
        });
      }

      const result = await paywallGenerator.optimizePricing({
        currentPricing,
        competitorPricing,
        benchmarks,
        appMetrics,
        goal
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error optimizing pricing:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST /api/autopilot/paywall/chat/start - Start chat session with optional file uploads
  router.post('/paywall/chat/start', uploadMultiple, handleUploadError, async (req, res) => {
    try {
      const {
        objective,
        targetSegment,
        initialPrompt,
        contextData = '{}'
      } = req.body;

      if (!objective || !initialPrompt) {
        return res.status(400).json({
          success: false,
          error: 'objective and initialPrompt are required'
        });
      }

      // Parse contextData if it's a string
      const parsedContextData = typeof contextData === 'string' ? JSON.parse(contextData) : contextData;

      const result = await paywallGenerator.createChatSession({
        objective,
        targetSegment,
        initialPrompt,
        contextData: parsedContextData,
        uploadedFiles: req.files || []
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error starting chat session:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST /api/autopilot/paywall/chat/continue - Continue chat session with optional file uploads
  router.post('/paywall/chat/continue', uploadMultiple, handleUploadError, async (req, res) => {
    try {
      const { sessionId, userMessage, refinementRequest } = req.body;

      if (!sessionId || !userMessage) {
        return res.status(400).json({
          success: false,
          error: 'sessionId and userMessage are required'
        });
      }

      const result = await paywallGenerator.continueChat(
        sessionId,
        userMessage,
        refinementRequest,
        req.files || []
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error continuing chat:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST /api/autopilot/paywall/chat/complete - Complete chat session
  router.post('/paywall/chat/complete', async (req, res) => {
    try {
      const { sessionId, finalTemplateId } = req.body;

      if (!sessionId || !finalTemplateId) {
        return res.status(400).json({
          success: false,
          error: 'sessionId and finalTemplateId are required'
        });
      }

      await paywallGenerator.completeSession(sessionId, finalTemplateId);

      res.json({
        success: true,
        message: 'Chat session completed'
      });
    } catch (error) {
      console.error('Error completing chat session:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Export endpoints

  // GET /api/autopilot/paywall/export/:templateId/html - Export as standalone HTML
  router.get('/paywall/export/:templateId/html', async (req, res) => {
    try {
      const { templateId } = req.params;

      const result = await paywallExporter.exportAsHTML(templateId);

      // Set headers for HTML download
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="${result.name.replace(/[^a-z0-9]/gi, '-')}.html"`);

      res.send(result.html);
    } catch (error) {
      console.error('Error exporting HTML:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/autopilot/paywall/export/:templateId/json - Export as JSON
  router.get('/paywall/export/:templateId/json', async (req, res) => {
    try {
      const { templateId } = req.params;

      const result = await paywallExporter.exportAsJSON(templateId);

      // Set headers for JSON download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${result.name.replace(/[^a-z0-9]/gi, '-')}.json"`);

      res.json(result);
    } catch (error) {
      console.error('Error exporting JSON:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/autopilot/paywall/export/:templateId/preview - Get HTML preview for screenshot
  router.get('/paywall/export/:templateId/preview', async (req, res) => {
    try {
      const { templateId } = req.params;

      const result = await paywallExporter.exportAsHTML(templateId);

      // Return HTML for in-browser rendering (no download)
      res.setHeader('Content-Type', 'text/html');
      res.send(result.html);
    } catch (error) {
      console.error('Error getting preview:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/autopilot/paywall/templates - List paywall templates
  router.get('/paywall/templates', (req, res) => {
    try {
      const { status, targetSegment, isSeasonal, campaignId } = req.query;

      let query = 'SELECT * FROM paywall_templates';
      const conditions = [];
      const params = [];

      if (status) {
        conditions.push('status = ?');
        params.push(status);
      }
      if (targetSegment) {
        conditions.push('target_segment = ?');
        params.push(targetSegment);
      }
      if (isSeasonal !== undefined) {
        conditions.push('is_seasonal = ?');
        params.push(isSeasonal === 'true' ? 1 : 0);
      }
      if (campaignId) {
        conditions.push('campaign_id = ?');
        params.push(campaignId);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY created_at DESC';

      const templates = db.prepare(query).all(...params);

      const parsed = templates.map(t => ({
        ...t,
        layout_config: JSON.parse(t.layout_config || '{}'),
        copy_config: JSON.parse(t.copy_config || '{}'),
        pricing_display: JSON.parse(t.pricing_display || '{}'),
        visual_config: JSON.parse(t.visual_config || '{}'),
        competitor_references: JSON.parse(t.competitor_references || '[]')
      }));

      res.json({
        success: true,
        data: parsed,
        total: parsed.length
      });
    } catch (error) {
      console.error('Error fetching paywall templates:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/autopilot/paywall/templates/:id - Get single paywall template
  router.get('/paywall/templates/:id', (req, res) => {
    try {
      const { id } = req.params;

      const template = db.prepare('SELECT * FROM paywall_templates WHERE id = ?').get(id);

      if (!template) {
        return res.status(404).json({ success: false, error: 'Template not found' });
      }

      const parsed = {
        ...template,
        layout_config: JSON.parse(template.layout_config || '{}'),
        copy_config: JSON.parse(template.copy_config || '{}'),
        pricing_display: JSON.parse(template.pricing_display || '{}'),
        visual_config: JSON.parse(template.visual_config || '{}'),
        competitor_references: JSON.parse(template.competitor_references || '[]')
      };

      res.json({
        success: true,
        data: parsed
      });
    } catch (error) {
      console.error('Error fetching paywall template:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // PUT /api/autopilot/paywall/templates/:id/status - Update template status
  router.put('/paywall/templates/:id/status', (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['draft', 'active', 'testing', 'archived', 'winner'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status. Must be: draft, active, testing, archived, or winner'
        });
      }

      db.prepare('UPDATE paywall_templates SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(status, id);

      const updated = db.prepare('SELECT * FROM paywall_templates WHERE id = ?').get(id);

      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      console.error('Error updating template status:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/autopilot/paywall/chat/sessions - List chat sessions
  router.get('/paywall/chat/sessions', (req, res) => {
    try {
      const { status, objective } = req.query;

      let query = 'SELECT * FROM paywall_chat_sessions';
      const conditions = [];
      const params = [];

      if (status) {
        conditions.push('status = ?');
        params.push(status);
      }
      if (objective) {
        conditions.push('objective = ?');
        params.push(objective);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY started_at DESC';

      const sessions = db.prepare(query).all(...params);

      const parsed = sessions.map(s => ({
        ...s,
        context_data: JSON.parse(s.context_data || '{}'),
        generated_templates: JSON.parse(s.generated_templates || '[]')
      }));

      res.json({
        success: true,
        data: parsed,
        total: parsed.length
      });
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/autopilot/paywall/chat/sessions/:id/messages - Get chat messages
  router.get('/paywall/chat/sessions/:id/messages', (req, res) => {
    try {
      const { id } = req.params;

      const messages = db.prepare(
        'SELECT * FROM paywall_chat_messages WHERE session_id = ? ORDER BY created_at ASC'
      ).all(id);

      const parsed = messages.map(m => ({
        ...m,
        generated_templates: JSON.parse(m.generated_templates || 'null'),
        refinement_request: JSON.parse(m.refinement_request || 'null')
      }));

      res.json({
        success: true,
        data: parsed
      });
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/autopilot/paywall/campaigns - List seasonal campaigns
  router.get('/paywall/campaigns', (req, res) => {
    try {
      const { status, eventType } = req.query;

      let query = 'SELECT * FROM seasonal_campaigns';
      const conditions = [];
      const params = [];

      if (status) {
        conditions.push('status = ?');
        params.push(status);
      }
      if (eventType) {
        conditions.push('event_type = ?');
        params.push(eventType);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY start_date DESC';

      const campaigns = db.prepare(query).all(...params);

      const parsed = campaigns.map(c => ({
        ...c,
        special_pricing: JSON.parse(c.special_pricing || 'null'),
        campaign_theme: JSON.parse(c.campaign_theme || '{}'),
        target_countries: JSON.parse(c.target_countries || '[]'),
        target_segments: JSON.parse(c.target_segments || '[]'),
        paywall_template_ids: JSON.parse(c.paywall_template_ids || '[]')
      }));

      res.json({
        success: true,
        data: parsed,
        total: parsed.length
      });
    } catch (error) {
      console.error('Error fetching seasonal campaigns:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ==========================================
  // MARKET INTELLIGENCE API
  // ==========================================

  // GET /api/autopilot/market-intelligence - Get market insights
  router.get('/market-intelligence', (req, res) => {
    try {
      const { category, insight_type } = req.query;

      let query = 'SELECT * FROM market_intelligence';
      const conditions = [];
      const params = [];

      if (category) {
        conditions.push('category = ?');
        params.push(category);
      }
      if (insight_type) {
        conditions.push('insight_type = ?');
        params.push(insight_type);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY created_at DESC LIMIT 50';

      const intelligence = db.prepare(query).all(...params);

      const parsed = intelligence.map(intel => ({
        ...intel,
        data: JSON.parse(intel.data || '{}')
      }));

      res.json({
        success: true,
        data: parsed
      });
    } catch (error) {
      console.error('Error fetching market intelligence:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
};
