// Load environment variables FIRST
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

// Import middleware
const {
  configureHelmet,
  configureCors,
  createApiLimiter,
  createAuthLimiter,
  createMutationLimiter,
  sanitizeRequest,
  errorHandler,
  notFoundHandler,
  requestLogger
} = require('./middleware/security');

const { authenticate, authorize, optionalAuth } = require('./middleware/auth');
const createAuthRoutes = require('./routes/auth');
const createAutopilotRoutes = require('./routes/autopilot');
const AutopilotJobs = require('./jobs/autopilotJobs');
const logger = require('./utils/logger');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();
const PORT = process.env.PORT || 4000;

// Database connection
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'behavioural_hub.db');
const db = new Database(dbPath);

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security Middleware
app.use(configureHelmet());
app.use(cors(configureCors()));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeRequest);
app.use(requestLogger(logger));

// Apply general rate limiting to all routes
app.use(createApiLimiter());

// ==================== Public Routes ====================

// API Documentation (Swagger UI)
if (process.env.SWAGGER_ENABLED !== 'false') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Behavioural Hub API Documentation'
  }));

  // Serve OpenAPI spec as JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running!' });
});

app.get('/health/live', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/health/ready', (req, res) => {
  try {
    // Check database connectivity
    const result = db.prepare('SELECT 1 as test').get();

    if (result.test === 1) {
      res.json({
        status: 'ready',
        database: 'connected',
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error('Database check failed');
    }
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Authentication routes (with strict rate limiting)
app.use('/api/auth', createAuthLimiter(), createAuthRoutes(db));

// ==================== Protected Routes ====================
// All routes below require authentication

// Apply authentication to all /api/* routes except /api/auth
app.use('/api', (req, res, next) => {
  // Skip authentication for auth routes
  if (req.path.startsWith('/auth')) {
    return next();
  }
  // Apply authentication middleware
  authenticate(db)(req, res, next);
});

// Growth Autopilot routes
app.use('/api/autopilot', createAutopilotRoutes(db));

// GET all insights
app.get('/api/insights', (req, res) => {
  try {
    const insights = db.prepare('SELECT * FROM insights ORDER BY discovery_date DESC').all();
    res.json({
      success: true,
      data: insights,
      count: insights.length
    });
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET single insight by ID
app.get('/api/insights/:id', (req, res) => {
  try {
    const { id } = req.params;
    const insight = db.prepare('SELECT * FROM insights WHERE id = ?').get(id);

    if (!insight) {
      return res.status(404).json({
        success: false,
        error: 'Insight not found'
      });
    }

    res.json({
      success: true,
      data: insight
    });
  } catch (error) {
    console.error('Error fetching insight:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET insights by category
app.get('/api/insights/category/:category', (req, res) => {
  try {
    const { category } = req.params;
    const insights = db.prepare('SELECT * FROM insights WHERE category = ? ORDER BY discovery_date DESC').all(category);

    res.json({
      success: true,
      data: insights,
      count: insights.length
    });
  } catch (error) {
    console.error('Error fetching insights by category:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET insights by segment
app.get('/api/insights/segment/:segment', (req, res) => {
  try {
    const { segment } = req.params;
    const insights = db.prepare('SELECT * FROM insights WHERE target_segment = ? ORDER BY discovery_date DESC').all(segment);

    res.json({
      success: true,
      data: insights,
      count: insights.length
    });
  } catch (error) {
    console.error('Error fetching insights by segment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// ANALYTICS ENDPOINTS
// ============================================

// GET analytics summary for dashboard
app.get('/api/analytics/summary', (req, res) => {
  try {
    // Total insights count
    const totalInsights = db.prepare('SELECT COUNT(*) as count FROM insights').get();

    // Active vs archived
    const statusBreakdown = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM insights
      GROUP BY status
    `).all();

    // Total impact by type
    const impactByType = db.prepare(`
      SELECT
        impact_type,
        COUNT(*) as count,
        SUM(impact_score) as total_impact,
        AVG(impact_score) as avg_impact
      FROM insights
      WHERE status = 'active'
      GROUP BY impact_type
    `).all();

    // Insights by category
    const categoryBreakdown = db.prepare(`
      SELECT
        category,
        COUNT(*) as count,
        AVG(impact_score) as avg_impact
      FROM insights
      GROUP BY category
    `).all();

    // Segment distribution
    const segmentBreakdown = db.prepare(`
      SELECT
        target_segment,
        COUNT(*) as count,
        AVG(impact_score) as avg_impact
      FROM insights
      WHERE status = 'active'
      GROUP BY target_segment
    `).all();

    // Recent discoveries (last 30 days)
    const recentCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM insights
      WHERE date(discovery_date) >= date('now', '-30 days')
    `).get();

    res.json({
      success: true,
      data: {
        total: totalInsights.count,
        status: statusBreakdown,
        impact_by_type: impactByType,
        by_category: categoryBreakdown,
        by_segment: segmentBreakdown,
        recent_discoveries: recentCount.count
      }
    });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET insights by category with detailed stats
app.get('/api/analytics/by-category', (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT
        category,
        COUNT(*) as total_insights,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_insights,
        AVG(impact_score) as avg_impact,
        SUM(impact_score) as total_impact,
        MAX(impact_score) as max_impact,
        MIN(impact_score) as min_impact
      FROM insights
      GROUP BY category
      ORDER BY total_impact DESC
    `).all();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching category analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET insights by segment with detailed stats
app.get('/api/analytics/by-segment', (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT
        target_segment,
        COUNT(*) as total_insights,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_insights,
        AVG(impact_score) as avg_impact,
        SUM(impact_score) as total_impact,
        GROUP_CONCAT(DISTINCT category) as categories
      FROM insights
      GROUP BY target_segment
      ORDER BY total_impact DESC
    `).all();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching segment analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET impact metrics
app.get('/api/analytics/impact', (req, res) => {
  try {
    const metrics = db.prepare(`
      SELECT
        impact_type,
        COUNT(*) as insight_count,
        SUM(impact_score) as total_impact,
        AVG(impact_score) as avg_impact,
        MAX(impact_score) as max_impact
      FROM insights
      WHERE status = 'active'
      GROUP BY impact_type
      ORDER BY total_impact DESC
    `).all();

    // Overall impact
    const overall = db.prepare(`
      SELECT
        SUM(impact_score) as total_impact,
        AVG(impact_score) as avg_impact,
        COUNT(*) as total_insights
      FROM insights
      WHERE status = 'active'
    `).get();

    res.json({
      success: true,
      data: {
        overall,
        by_type: metrics
      }
    });
  } catch (error) {
    console.error('Error fetching impact metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET trends over time
app.get('/api/analytics/trends', (req, res) => {
  try {
    // Insights by month
    const monthlyTrends = db.prepare(`
      SELECT
        strftime('%Y-%m', discovery_date) as month,
        COUNT(*) as insight_count,
        AVG(impact_score) as avg_impact,
        SUM(impact_score) as total_impact
      FROM insights
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `).all();

    // Insights by week (last 8 weeks)
    const weeklyTrends = db.prepare(`
      SELECT
        strftime('%Y-W%W', discovery_date) as week,
        COUNT(*) as insight_count,
        AVG(impact_score) as avg_impact
      FROM insights
      WHERE date(discovery_date) >= date('now', '-56 days')
      GROUP BY week
      ORDER BY week DESC
    `).all();

    res.json({
      success: true,
      data: {
        monthly: monthlyTrends,
        weekly: weeklyTrends
      }
    });
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET top performing insights
app.get('/api/analytics/top-insights', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const topInsights = db.prepare(`
      SELECT
        id,
        title,
        category,
        target_segment,
        impact_score,
        impact_type,
        discovery_date
      FROM insights
      WHERE status = 'active'
      ORDER BY impact_score DESC
      LIMIT ?
    `).all(limit);

    res.json({
      success: true,
      data: topInsights,
      count: topInsights.length
    });
  } catch (error) {
    console.error('Error fetching top insights:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST new insight
app.post('/api/insights', (req, res) => {
  try {
    const {
      title,
      description,
      category,
      status,
      impact_score,
      impact_type,
      discovery_date,
      target_segment,
      psychological_principle,
      evidence,
      recommendation
    } = req.body;

    const stmt = db.prepare(`
      INSERT INTO insights (
        title, description, category, status, impact_score, impact_type,
        discovery_date, target_segment, psychological_principle, evidence, recommendation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      title,
      description,
      category,
      status || 'active',
      impact_score || 0,
      impact_type || 'unknown',
      discovery_date || new Date().toISOString(),
      target_segment || 'all',
      psychological_principle || '',
      evidence || '',
      recommendation || ''
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        message: 'Insight created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating insight:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// AB TESTING ENDPOINTS
// ============================================

// GET all experiments
app.get('/api/experiments', (req, res) => {
  try {
    const experiments = db.prepare(`
      SELECT
        e.*,
        COUNT(DISTINCT v.id) as variant_count,
        COUNT(DISTINCT ua.user_id) as user_count,
        COUNT(DISTINCT ev.id) as event_count
      FROM experiments e
      LEFT JOIN variants v ON e.id = v.experiment_id
      LEFT JOIN user_assignments ua ON e.id = ua.experiment_id
      LEFT JOIN events ev ON e.id = ev.experiment_id
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `).all();

    res.json({
      success: true,
      data: experiments,
      count: experiments.length
    });
  } catch (error) {
    console.error('Error fetching experiments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET single experiment with variants
app.get('/api/experiments/:id', (req, res) => {
  try {
    const { id } = req.params;

    const experiment = db.prepare('SELECT * FROM experiments WHERE id = ?').get(id);

    if (!experiment) {
      return res.status(404).json({
        success: false,
        error: 'Experiment not found'
      });
    }

    const variants = db.prepare(`
      SELECT
        v.*,
        COUNT(DISTINCT ua.user_id) as user_count,
        COUNT(DISTINCT ev.id) as event_count
      FROM variants v
      LEFT JOIN user_assignments ua ON v.id = ua.variant_id
      LEFT JOIN events ev ON v.id = ev.variant_id
      WHERE v.experiment_id = ?
      GROUP BY v.id
      ORDER BY v.is_control DESC, v.id ASC
    `).all(id);

    res.json({
      success: true,
      data: {
        ...experiment,
        variants
      }
    });
  } catch (error) {
    console.error('Error fetching experiment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST new experiment
app.post('/api/experiments', (req, res) => {
  try {
    const {
      name,
      description,
      hypothesis,
      target_segment,
      traffic_allocation,
      variants
    } = req.body;

    // Validation
    if (!name || !variants || variants.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Name and at least 2 variants are required'
      });
    }

    // Create experiment
    const expStmt = db.prepare(`
      INSERT INTO experiments (name, description, hypothesis, target_segment, traffic_allocation, status)
      VALUES (?, ?, ?, ?, ?, 'draft')
    `);

    const expResult = expStmt.run(
      name,
      description || '',
      hypothesis || '',
      target_segment || 'all',
      traffic_allocation || 1.0
    );

    const experimentId = expResult.lastInsertRowid;

    // Create variants
    const varStmt = db.prepare(`
      INSERT INTO variants (experiment_id, name, description, is_control, traffic_weight, config)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertVariants = db.transaction((variants) => {
      for (const variant of variants) {
        varStmt.run(
          experimentId,
          variant.name,
          variant.description || '',
          variant.is_control ? 1 : 0,
          variant.traffic_weight || 1.0,
          JSON.stringify(variant.config || {})
        );
      }
    });

    insertVariants(variants);

    res.status(201).json({
      success: true,
      data: {
        id: experimentId,
        message: 'Experiment created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating experiment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PATCH update experiment (start, stop, etc.)
app.patch('/api/experiments/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status, ended_at } = req.body;

    const experiment = db.prepare('SELECT * FROM experiments WHERE id = ?').get(id);

    if (!experiment) {
      return res.status(404).json({
        success: false,
        error: 'Experiment not found'
      });
    }

    let updateStmt;
    let updateData;

    if (status === 'running' && experiment.status === 'draft') {
      // Start experiment
      updateStmt = db.prepare(`
        UPDATE experiments
        SET status = 'running', started_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      updateData = [id];
    } else if (status === 'completed') {
      // Complete experiment
      updateStmt = db.prepare(`
        UPDATE experiments
        SET status = 'completed', ended_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      updateData = [ended_at || new Date().toISOString(), id];
    } else {
      // Generic update
      updateStmt = db.prepare(`
        UPDATE experiments
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      updateData = [status, id];
    }

    updateStmt.run(...updateData);

    res.json({
      success: true,
      message: 'Experiment updated successfully'
    });
  } catch (error) {
    console.error('Error updating experiment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET assign variant to user
app.get('/api/experiments/:id/assign', (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id is required'
      });
    }

    const experiment = db.prepare('SELECT * FROM experiments WHERE id = ?').get(id);

    if (!experiment) {
      return res.status(404).json({
        success: false,
        error: 'Experiment not found'
      });
    }

    if (experiment.status !== 'running') {
      return res.status(400).json({
        success: false,
        error: 'Experiment is not running'
      });
    }

    // Check if user already assigned
    const existing = db.prepare(`
      SELECT v.* FROM user_assignments ua
      JOIN variants v ON ua.variant_id = v.id
      WHERE ua.experiment_id = ? AND ua.user_id = ?
    `).get(id, user_id);

    if (existing) {
      return res.json({
        success: true,
        data: existing,
        message: 'User already assigned'
      });
    }

    // Get all variants with weights
    const variants = db.prepare(`
      SELECT * FROM variants WHERE experiment_id = ? ORDER BY id
    `).all(id);

    if (variants.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No variants found for this experiment'
      });
    }

    // Weighted random selection
    const totalWeight = variants.reduce((sum, v) => sum + v.traffic_weight, 0);
    let random = Math.random() * totalWeight;
    let selectedVariant = variants[0];

    for (const variant of variants) {
      random -= variant.traffic_weight;
      if (random <= 0) {
        selectedVariant = variant;
        break;
      }
    }

    // Assign user to variant
    const assignStmt = db.prepare(`
      INSERT INTO user_assignments (experiment_id, variant_id, user_id)
      VALUES (?, ?, ?)
    `);

    assignStmt.run(id, selectedVariant.id, user_id);

    res.json({
      success: true,
      data: selectedVariant,
      message: 'User assigned to variant'
    });
  } catch (error) {
    console.error('Error assigning variant:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST track event
app.post('/api/events/track', (req, res) => {
  try {
    const {
      experiment_id,
      variant_id,
      user_id,
      event_type,
      event_data
    } = req.body;

    if (!experiment_id || !variant_id || !user_id || !event_type) {
      return res.status(400).json({
        success: false,
        error: 'experiment_id, variant_id, user_id, and event_type are required'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO events (experiment_id, variant_id, user_id, event_type, event_data)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      experiment_id,
      variant_id,
      user_id,
      event_type,
      JSON.stringify(event_data || {})
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        message: 'Event tracked successfully'
      }
    });
  } catch (error) {
    console.error('Error tracking event:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET experiment results
app.get('/api/experiments/:id/results', (req, res) => {
  try {
    const { id } = req.params;

    const experiment = db.prepare('SELECT * FROM experiments WHERE id = ?').get(id);

    if (!experiment) {
      return res.status(404).json({
        success: false,
        error: 'Experiment not found'
      });
    }

    // Get variant stats
    const variantStats = db.prepare(`
      SELECT
        v.id,
        v.name,
        v.is_control,
        COUNT(DISTINCT ua.user_id) as total_users,
        COUNT(DISTINCT CASE WHEN ev.event_type = 'view' THEN ev.user_id END) as views,
        COUNT(DISTINCT CASE WHEN ev.event_type = 'click' THEN ev.user_id END) as clicks,
        COUNT(DISTINCT CASE WHEN ev.event_type = 'conversion' THEN ev.user_id END) as conversions,
        ROUND(
          CAST(COUNT(DISTINCT CASE WHEN ev.event_type = 'conversion' THEN ev.user_id END) AS FLOAT) /
          NULLIF(COUNT(DISTINCT ua.user_id), 0) * 100,
          2
        ) as conversion_rate,
        ROUND(
          CAST(COUNT(DISTINCT CASE WHEN ev.event_type = 'click' THEN ev.user_id END) AS FLOAT) /
          NULLIF(COUNT(DISTINCT CASE WHEN ev.event_type = 'view' THEN ev.user_id END), 0) * 100,
          2
        ) as click_rate
      FROM variants v
      LEFT JOIN user_assignments ua ON v.id = ua.variant_id
      LEFT JOIN events ev ON v.id = ev.variant_id AND ua.user_id = ev.user_id
      WHERE v.experiment_id = ?
      GROUP BY v.id
      ORDER BY v.is_control DESC, v.id ASC
    `).all(id);

    // Get event timeline
    const timeline = db.prepare(`
      SELECT
        DATE(ev.created_at) as date,
        v.name as variant_name,
        ev.event_type,
        COUNT(*) as count
      FROM events ev
      JOIN variants v ON ev.variant_id = v.id
      WHERE ev.experiment_id = ?
      GROUP BY DATE(ev.created_at), v.name, ev.event_type
      ORDER BY date DESC
    `).all(id);

    res.json({
      success: true,
      data: {
        experiment,
        variant_stats: variantStats,
        timeline
      }
    });
  } catch (error) {
    console.error('Error fetching experiment results:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// SEGMENTS ENDPOINTS
// ============================================

// GET all segments
app.get('/api/segments', (req, res) => {
  try {
    const { status } = req.query;

    let query = 'SELECT * FROM segments';
    const params = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY population_percentage DESC';

    const segments = db.prepare(query).all(...params);

    // Parse traits JSON
    segments.forEach(segment => {
      try {
        segment.traits = JSON.parse(segment.traits);
      } catch (e) {
        segment.traits = [];
      }
    });

    res.json({
      success: true,
      data: segments,
      count: segments.length
    });
  } catch (error) {
    console.error('Error fetching segments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET single segment by ID or slug
app.get('/api/segments/:identifier', (req, res) => {
  try {
    const { identifier } = req.params;

    // Try to find by ID first, then by slug
    let segment;
    if (!isNaN(identifier)) {
      segment = db.prepare('SELECT * FROM segments WHERE id = ?').get(identifier);
    }
    if (!segment) {
      segment = db.prepare('SELECT * FROM segments WHERE slug = ?').get(identifier);
    }

    if (!segment) {
      return res.status(404).json({
        success: false,
        error: 'Segment not found'
      });
    }

    // Parse traits
    try {
      segment.traits = JSON.parse(segment.traits);
    } catch (e) {
      segment.traits = [];
    }

    // Get rules
    const rules = db.prepare('SELECT * FROM segment_rules WHERE segment_id = ?').all(segment.id);

    // Get history
    const history = db.prepare(`
      SELECT * FROM segment_history
      WHERE segment_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).all(segment.id);

    res.json({
      success: true,
      data: {
        ...segment,
        rules,
        history
      }
    });
  } catch (error) {
    console.error('Error fetching segment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST create new segment
app.post('/api/segments', (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      emoji,
      color,
      traits,
      discovery_method,
      created_by
    } = req.body;

    if (!name || !slug || !description) {
      return res.status(400).json({
        success: false,
        error: 'name, slug, and description are required'
      });
    }

    // Insert segment
    const stmt = db.prepare(`
      INSERT INTO segments (
        name, slug, description, emoji, color, traits,
        discovery_method, created_by, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft')
    `);

    const result = stmt.run(
      name,
      slug,
      description,
      emoji || '👥',
      color || 'gray',
      JSON.stringify(traits || []),
      discovery_method || 'manual',
      created_by || 'user'
    );

    const segmentId = result.lastInsertRowid;

    // Log creation in history
    db.prepare(`
      INSERT INTO segment_history (segment_id, action, description, performed_by)
      VALUES (?, 'created', ?, ?)
    `).run(segmentId, `Segment "${name}" created`, created_by || 'user');

    res.status(201).json({
      success: true,
      data: {
        id: segmentId,
        message: 'Segment created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating segment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PATCH update segment
app.patch('/api/segments/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const segment = db.prepare('SELECT * FROM segments WHERE id = ?').get(id);
    if (!segment) {
      return res.status(404).json({
        success: false,
        error: 'Segment not found'
      });
    }

    // Build update query dynamically
    const allowedFields = [
      'name', 'description', 'emoji', 'color', 'status',
      'population_count', 'population_percentage', 'insights_tested',
      'success_rate', 'total_revenue_impact', 'avg_impact_score'
    ];

    const updateFields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        if (key === 'traits') {
          values.push(JSON.stringify(updates[key]));
        } else {
          values.push(updates[key]);
        }
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

    const query = `UPDATE segments SET ${updateFields.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...values);

    // Log update in history
    db.prepare(`
      INSERT INTO segment_history (segment_id, action, description, changes, performed_by)
      VALUES (?, 'updated', ?, ?, ?)
    `).run(
      id,
      'Segment updated',
      JSON.stringify(updates),
      updates.updated_by || 'user'
    );

    res.json({
      success: true,
      message: 'Segment updated successfully'
    });
  } catch (error) {
    console.error('Error updating segment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST add trait to segment
app.post('/api/segments/:id/traits', (req, res) => {
  try {
    const { id } = req.params;
    const { trait } = req.body;

    if (!trait) {
      return res.status(400).json({
        success: false,
        error: 'trait is required'
      });
    }

    const segment = db.prepare('SELECT traits FROM segments WHERE id = ?').get(id);
    if (!segment) {
      return res.status(404).json({
        success: false,
        error: 'Segment not found'
      });
    }

    const traits = JSON.parse(segment.traits);
    if (!traits.includes(trait)) {
      traits.push(trait);

      db.prepare('UPDATE segments SET traits = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(JSON.stringify(traits), id);

      // Log in history
      db.prepare(`
        INSERT INTO segment_history (segment_id, action, description, performed_by)
        VALUES (?, 'trait_added', ?, 'user')
      `).run(id, `Added trait: ${trait}`);

      res.json({
        success: true,
        message: 'Trait added successfully',
        data: { traits }
      });
    } else {
      res.json({
        success: true,
        message: 'Trait already exists',
        data: { traits }
      });
    }
  } catch (error) {
    console.error('Error adding trait:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE remove trait from segment
app.delete('/api/segments/:id/traits/:trait', (req, res) => {
  try {
    const { id, trait } = req.params;

    const segment = db.prepare('SELECT traits FROM segments WHERE id = ?').get(id);
    if (!segment) {
      return res.status(404).json({
        success: false,
        error: 'Segment not found'
      });
    }

    const traits = JSON.parse(segment.traits);
    const index = traits.indexOf(trait);

    if (index > -1) {
      traits.splice(index, 1);

      db.prepare('UPDATE segments SET traits = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(JSON.stringify(traits), id);

      // Log in history
      db.prepare(`
        INSERT INTO segment_history (segment_id, action, description, performed_by)
        VALUES (?, 'trait_removed', ?, 'user')
      `).run(id, `Removed trait: ${trait}`);

      res.json({
        success: true,
        message: 'Trait removed successfully',
        data: { traits }
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Trait not found'
      });
    }
  } catch (error) {
    console.error('Error removing trait:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST archive segment
app.post('/api/segments/:id/archive', (req, res) => {
  try {
    const { id } = req.params;

    const segment = db.prepare('SELECT * FROM segments WHERE id = ?').get(id);
    if (!segment) {
      return res.status(404).json({
        success: false,
        error: 'Segment not found'
      });
    }

    db.prepare(`
      UPDATE segments
      SET status = 'archived', archived_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);

    // Log in history
    db.prepare(`
      INSERT INTO segment_history (segment_id, action, description, performed_by)
      VALUES (?, 'archived', 'Segment archived', 'user')
    `).run(id);

    res.json({
      success: true,
      message: 'Segment archived successfully'
    });
  } catch (error) {
    console.error('Error archiving segment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST reactivate segment
app.post('/api/segments/:id/reactivate', (req, res) => {
  try {
    const { id } = req.params;

    const segment = db.prepare('SELECT * FROM segments WHERE id = ?').get(id);
    if (!segment) {
      return res.status(404).json({
        success: false,
        error: 'Segment not found'
      });
    }

    db.prepare(`
      UPDATE segments
      SET status = 'active', archived_at = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);

    // Log in history
    db.prepare(`
      INSERT INTO segment_history (segment_id, action, description, performed_by)
      VALUES (?, 'reactivated', 'Segment reactivated', 'user')
    `).run(id);

    res.json({
      success: true,
      message: 'Segment reactivated successfully'
    });
  } catch (error) {
    console.error('Error reactivating segment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET segment history
app.get('/api/segments/:id/history', (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;

    const history = db.prepare(`
      SELECT * FROM segment_history
      WHERE segment_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(id, parseInt(limit));

    res.json({
      success: true,
      data: history,
      count: history.length
    });
  } catch (error) {
    console.error('Error fetching segment history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// SETTINGS ENDPOINTS
// ============================================

// GET all settings
app.get('/api/settings', (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM settings ORDER BY category, key').all();

    // Group by category
    const grouped = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = {};
      }

      // Parse value based on type
      let parsedValue = setting.value;
      try {
        if (setting.value_type === 'number') {
          parsedValue = parseFloat(setting.value);
        } else if (setting.value_type === 'boolean') {
          parsedValue = setting.value === 'true';
        } else if (setting.value_type === 'json') {
          parsedValue = JSON.parse(setting.value);
        }
      } catch (e) {
        console.error(`Error parsing setting ${setting.category}.${setting.key}:`, e);
      }

      acc[setting.category][setting.key] = {
        value: parsedValue,
        type: setting.value_type,
        description: setting.description,
        updated_at: setting.updated_at
      };

      return acc;
    }, {});

    res.json({
      success: true,
      data: grouped
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET settings by category
app.get('/api/settings/:category', (req, res) => {
  try {
    const { category } = req.params;
    const settings = db.prepare('SELECT * FROM settings WHERE category = ? ORDER BY key').all(category);

    if (settings.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No settings found for category: ${category}`
      });
    }

    // Parse values
    const parsed = settings.reduce((acc, setting) => {
      let parsedValue = setting.value;
      try {
        if (setting.value_type === 'number') {
          parsedValue = parseFloat(setting.value);
        } else if (setting.value_type === 'boolean') {
          parsedValue = setting.value === 'true';
        } else if (setting.value_type === 'json') {
          parsedValue = JSON.parse(setting.value);
        }
      } catch (e) {
        console.error(`Error parsing setting ${setting.key}:`, e);
      }

      acc[setting.key] = {
        value: parsedValue,
        type: setting.value_type,
        description: setting.description,
        updated_at: setting.updated_at
      };

      return acc;
    }, {});

    res.json({
      success: true,
      category,
      data: parsed
    });
  } catch (error) {
    console.error('Error fetching settings by category:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST create or update setting
app.post('/api/settings', (req, res) => {
  try {
    const { category, key, value, value_type, description } = req.body;

    if (!category || !key || value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'category, key, and value are required'
      });
    }

    // Convert value to string for storage
    let stringValue = value;
    if (value_type === 'json' && typeof value === 'object') {
      stringValue = JSON.stringify(value);
    } else if (value_type === 'boolean') {
      stringValue = value ? 'true' : 'false';
    } else {
      stringValue = String(value);
    }

    // Upsert setting
    const stmt = db.prepare(`
      INSERT INTO settings (category, key, value, value_type, description, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(category, key) DO UPDATE SET
        value = excluded.value,
        value_type = excluded.value_type,
        description = excluded.description,
        updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run(
      category,
      key,
      stringValue,
      value_type || 'string',
      description || null
    );

    res.json({
      success: true,
      message: 'Setting saved successfully',
      data: { category, key, value }
    });
  } catch (error) {
    console.error('Error saving setting:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PATCH update setting value
app.patch('/api/settings/:category/:key', (req, res) => {
  try {
    const { category, key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'value is required'
      });
    }

    // Check if setting exists
    const existing = db.prepare('SELECT * FROM settings WHERE category = ? AND key = ?').get(category, key);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: `Setting not found: ${category}.${key}`
      });
    }

    // Convert value to string based on existing type
    let stringValue = value;
    if (existing.value_type === 'json' && typeof value === 'object') {
      stringValue = JSON.stringify(value);
    } else if (existing.value_type === 'boolean') {
      stringValue = value ? 'true' : 'false';
    } else {
      stringValue = String(value);
    }

    // Update setting
    const stmt = db.prepare(`
      UPDATE settings
      SET value = ?, updated_at = CURRENT_TIMESTAMP
      WHERE category = ? AND key = ?
    `);

    stmt.run(stringValue, category, key);

    res.json({
      success: true,
      message: 'Setting updated successfully',
      data: { category, key, value }
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE setting
app.delete('/api/settings/:category/:key', (req, res) => {
  try {
    const { category, key } = req.params;

    const stmt = db.prepare('DELETE FROM settings WHERE category = ? AND key = ?');
    const result = stmt.run(category, key);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: `Setting not found: ${category}.${key}`
      });
    }

    res.json({
      success: true,
      message: 'Setting deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting setting:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// PSYCHOLOGY PRINCIPLES ENDPOINTS
// ============================================

// GET all psychology principles
app.get('/api/principles', (req, res) => {
  try {
    const { category, confidence_min } = req.query;

    let query = 'SELECT * FROM psychology_principles WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (confidence_min) {
      query += ' AND confidence_score >= ?';
      params.push(parseFloat(confidence_min));
    }

    query += ' ORDER BY confidence_score DESC';

    const principles = db.prepare(query).all(...params);

    // Parse JSON fields
    const parsedPrinciples = principles.map(p => ({
      ...p,
      academic_papers: p.academic_papers ? JSON.parse(p.academic_papers) : [],
      use_cases: p.use_cases ? JSON.parse(p.use_cases) : [],
      real_world_examples: p.real_world_examples ? JSON.parse(p.real_world_examples) : [],
      anti_patterns: p.anti_patterns ? JSON.parse(p.anti_patterns) : []
    }));

    res.json({
      success: true,
      data: parsedPrinciples,
      count: parsedPrinciples.length
    });
  } catch (error) {
    console.error('Error fetching principles:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET single psychology principle by ID
app.get('/api/principles/:id', (req, res) => {
  try {
    const { id } = req.params;
    const principle = db.prepare('SELECT * FROM psychology_principles WHERE id = ?').get(id);

    if (!principle) {
      return res.status(404).json({
        success: false,
        error: 'Principle not found'
      });
    }

    // Parse JSON fields
    const parsedPrinciple = {
      ...principle,
      academic_papers: principle.academic_papers ? JSON.parse(principle.academic_papers) : [],
      use_cases: principle.use_cases ? JSON.parse(principle.use_cases) : [],
      real_world_examples: principle.real_world_examples ? JSON.parse(principle.real_world_examples) : [],
      anti_patterns: principle.anti_patterns ? JSON.parse(principle.anti_patterns) : []
    };

    // Get related sources
    const sources = db.prepare(`
      SELECT s.*, ps.relevance_score
      FROM sources s
      JOIN principle_sources ps ON s.id = ps.source_id
      WHERE ps.principle_id = ?
      ORDER BY ps.relevance_score DESC
    `).all(id);

    res.json({
      success: true,
      data: {
        ...parsedPrinciple,
        sources: sources
      }
    });
  } catch (error) {
    console.error('Error fetching principle:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET principles by category
app.get('/api/principles/category/:category', (req, res) => {
  try {
    const { category } = req.params;
    const principles = db.prepare('SELECT * FROM psychology_principles WHERE category = ? ORDER BY confidence_score DESC').all(category);

    const parsedPrinciples = principles.map(p => ({
      ...p,
      academic_papers: p.academic_papers ? JSON.parse(p.academic_papers) : [],
      use_cases: p.use_cases ? JSON.parse(p.use_cases) : [],
      real_world_examples: p.real_world_examples ? JSON.parse(p.real_world_examples) : [],
      anti_patterns: p.anti_patterns ? JSON.parse(p.anti_patterns) : []
    }));

    res.json({
      success: true,
      data: parsedPrinciples,
      count: parsedPrinciples.length
    });
  } catch (error) {
    console.error('Error fetching principles by category:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// SOURCES ENDPOINTS
// ============================================

// GET all sources
app.get('/api/sources', (req, res) => {
  try {
    const { tier, content_type, confidence_min } = req.query;

    let query = 'SELECT * FROM sources WHERE 1=1';
    const params = [];

    if (tier) {
      query += ' AND tier = ?';
      params.push(parseInt(tier));
    }

    if (content_type) {
      query += ' AND content_type = ?';
      params.push(content_type);
    }

    if (confidence_min) {
      query += ' AND confidence_level >= ?';
      params.push(parseFloat(confidence_min));
    }

    query += ' ORDER BY tier ASC, confidence_level DESC';

    const sources = db.prepare(query).all(...params);

    // Parse JSON fields
    const parsedSources = sources.map(s => ({
      ...s,
      key_takeaways: s.key_takeaways ? JSON.parse(s.key_takeaways) : [],
      relevant_principles: s.relevant_principles ? JSON.parse(s.relevant_principles) : []
    }));

    res.json({
      success: true,
      data: parsedSources,
      count: parsedSources.length
    });
  } catch (error) {
    console.error('Error fetching sources:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET single source by ID
app.get('/api/sources/:id', (req, res) => {
  try {
    const { id } = req.params;
    const source = db.prepare('SELECT * FROM sources WHERE id = ?').get(id);

    if (!source) {
      return res.status(404).json({
        success: false,
        error: 'Source not found'
      });
    }

    // Parse JSON fields
    const parsedSource = {
      ...source,
      key_takeaways: source.key_takeaways ? JSON.parse(source.key_takeaways) : [],
      relevant_principles: source.relevant_principles ? JSON.parse(source.relevant_principles) : []
    };

    // Get related principles
    const principles = db.prepare(`
      SELECT p.*, ps.relevance_score
      FROM psychology_principles p
      JOIN principle_sources ps ON p.id = ps.principle_id
      WHERE ps.source_id = ?
      ORDER BY ps.relevance_score DESC
    `).all(id);

    res.json({
      success: true,
      data: {
        ...parsedSource,
        principles: principles
      }
    });
  } catch (error) {
    console.error('Error fetching source:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// CITATIONS ENDPOINTS
// ============================================

// GET citations for an insight
app.get('/api/insights/:id/citations', (req, res) => {
  try {
    const { id } = req.params;

    const citations = db.prepare(`
      SELECT c.*, s.title, s.author, s.url, s.tier, s.content_type
      FROM citations c
      JOIN sources s ON c.source_id = s.id
      WHERE c.insight_id = ?
      ORDER BY c.relevance_score DESC
    `).all(id);

    res.json({
      success: true,
      data: citations,
      count: citations.length
    });
  } catch (error) {
    console.error('Error fetching citations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST create citation
app.post('/api/citations', (req, res) => {
  try {
    const { insight_id, source_id, quote, relevance_score } = req.body;

    if (!insight_id || !source_id) {
      return res.status(400).json({
        success: false,
        error: 'insight_id and source_id are required'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO citations (insight_id, source_id, quote, relevance_score)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      insight_id,
      source_id,
      quote || null,
      relevance_score || 0.8
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        insight_id,
        source_id,
        quote,
        relevance_score: relevance_score || 0.8
      }
    });
  } catch (error) {
    console.error('Error creating citation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// KNOWLEDGE BASE STATS
// ============================================

// GET knowledge base statistics
app.get('/api/knowledge-base/stats', (req, res) => {
  try {
    const stats = {
      principles: db.prepare('SELECT COUNT(*) as count FROM psychology_principles').get(),
      principlesByCategory: db.prepare(`
        SELECT category, COUNT(*) as count
        FROM psychology_principles
        GROUP BY category
        ORDER BY count DESC
      `).all(),
      sources: db.prepare('SELECT COUNT(*) as count FROM sources').get(),
      sourcesByTier: db.prepare(`
        SELECT tier, COUNT(*) as count
        FROM sources
        GROUP BY tier
        ORDER BY tier ASC
      `).all(),
      citations: db.prepare('SELECT COUNT(*) as count FROM citations').get(),
      avgConfidence: {
        principles: db.prepare('SELECT AVG(confidence_score) as avg FROM psychology_principles').get(),
        sources: db.prepare('SELECT AVG(confidence_level) as avg FROM sources').get()
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching knowledge base stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== Error Handling ====================
// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler(logger));

// ==================== Start Server ====================
app.listen(PORT, () => {
  logger.info('Server started successfully', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    database: dbPath
  });

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 BEHAVIOURAL HUB BACKEND - PRODUCTION READY`);
  console.log(`${'='.repeat(60)}`);
  console.log(`\n🌐 Server:        http://localhost:${PORT}`);
  console.log(`📊 Database:      ${dbPath}`);
  console.log(`🔒 Environment:   ${process.env.NODE_ENV || 'development'}`);
  console.log(`🛡️  Security:      ✓ Helmet, Rate Limiting, CORS, JWT Auth`);
  console.log(`📝 Logging:       ✓ Winston (./logs/)`);
  if (process.env.SWAGGER_ENABLED !== 'false') {
    console.log(`📚 API Docs:      http://localhost:${PORT}/api-docs`);
  }
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 API ENDPOINTS`);
  console.log(`${'='.repeat(60)}`);
  console.log(`\n🔐 Authentication (Public):`);
  console.log(`   POST   /api/auth/register         Register new user`);
  console.log(`   POST   /api/auth/login            Login with email/password`);
  console.log(`   POST   /api/auth/refresh          Refresh access token`);
  console.log(`   POST   /api/auth/logout           Logout and revoke token`);
  console.log(`   GET    /api/auth/me               Get current user profile`);
  console.log(`   PUT    /api/auth/password         Change password`);
  console.log(`   POST   /api/auth/api-keys         Generate API key`);
  console.log(`   GET    /api/auth/api-keys         List API keys`);
  console.log(`   DELETE /api/auth/api-keys/:id     Revoke API key`);
  console.log(`\n🧠 Insights (Protected):`);
  console.log(`   GET    /api/insights`);
  console.log(`   GET    /api/insights/:id`);
  console.log(`   GET    /api/insights/category/:category`);
  console.log(`   GET    /api/insights/segment/:segment`);
  console.log(`   POST   /api/insights`);
  console.log(`   PUT    /api/insights/:id`);
  console.log(`   DELETE /api/insights/:id`);
  console.log(`\n📈 Analytics (Protected):`);
  console.log(`   GET    /api/analytics/summary`);
  console.log(`   GET    /api/analytics/by-category`);
  console.log(`   GET    /api/analytics/by-segment`);
  console.log(`   GET    /api/analytics/impact`);
  console.log(`   GET    /api/analytics/trends`);
  console.log(`   GET    /api/analytics/top-insights?limit=10`);
  console.log(`\n🧪 AB Testing (Protected):`);
  console.log(`   GET    /api/experiments`);
  console.log(`   POST   /api/experiments`);
  console.log(`   GET    /api/experiments/:id`);
  console.log(`   PATCH  /api/experiments/:id`);
  console.log(`   GET    /api/experiments/:id/assign?user_id=xxx`);
  console.log(`   GET    /api/experiments/:id/results`);
  console.log(`   POST   /api/events/track`);
  console.log(`\n👥 Segments (Protected):`);
  console.log(`   GET    /api/segments`);
  console.log(`   POST   /api/segments`);
  console.log(`   GET    /api/segments/:id`);
  console.log(`   PATCH  /api/segments/:id`);
  console.log(`   POST   /api/segments/:id/archive`);
  console.log(`   POST   /api/segments/:id/reactivate`);
  console.log(`\n⚙️  Settings (Protected):`);
  console.log(`   GET    /api/settings`);
  console.log(`   GET    /api/settings/:category`);
  console.log(`   POST   /api/settings`);
  console.log(`   PATCH  /api/settings/:category/:key`);
  console.log(`\n🧬 Knowledge Base (Protected):`);
  console.log(`   GET    /api/principles`);
  console.log(`   GET    /api/sources`);
  console.log(`   POST   /api/citations`);
  console.log(`   GET    /api/knowledge-base/stats`);
  console.log(`\n🤖 Growth Autopilot (Protected):`);
  console.log(`   GET    /api/autopilot/competitors`);
  console.log(`   POST   /api/autopilot/competitors`);
  console.log(`   POST   /api/autopilot/audit`);
  console.log(`   POST   /api/autopilot/recommendations`);
  console.log(`   GET    /api/autopilot/recommendations`);
  console.log(`   POST   /api/autopilot/insights/detect`);
  console.log(`   POST   /api/autopilot/segments/cluster`);
  console.log(`   POST   /api/autopilot/segments/rfm`);
  console.log(`   POST   /api/autopilot/churn/predict`);
  console.log(`   POST   /api/autopilot/ltv/predict`);
  console.log(`   POST   /api/autopilot/loops/detect`);
  console.log(`   GET    /api/autopilot/loops`);
  console.log(`\n✅ Health Checks (Public):`);
  console.log(`   GET    /health                    Basic health check`);
  console.log(`   GET    /health/live               Liveness probe`);
  console.log(`   GET    /health/ready              Readiness probe`);
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📖 DEFAULT CREDENTIALS`);
  console.log(`${'='.repeat(60)}`);
  console.log(`   Email:    admin@behavioural-hub.com`);
  console.log(`   Password: Admin123!`);
  console.log(`   ⚠️  CHANGE THESE IN PRODUCTION!`);
  console.log(`${'='.repeat(60)}\n`);

  // Initialize Growth Autopilot scheduled jobs
  if (process.env.ENABLE_AUTOPILOT_JOBS !== 'false') {
    try {
      const autopilotJobs = new AutopilotJobs(db);
      autopilotJobs.startAll();
      console.log('🤖 Growth Autopilot jobs initialized successfully\n');
    } catch (error) {
      logger.error('Failed to initialize Autopilot jobs', { error: error.message });
      console.error('⚠️  Failed to start Growth Autopilot jobs:', error.message);
    }
  } else {
    console.log('ℹ️  Growth Autopilot jobs disabled (set ENABLE_AUTOPILOT_JOBS=true to enable)\n');
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down gracefully...');
  db.close();
  logger.info('Database connection closed');
  console.log('\n✅ Database connection closed');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  db.close();
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason,
    promise
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  // Exit with failure
  process.exit(1);
});
