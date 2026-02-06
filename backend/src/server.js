const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const dbPath = path.join(__dirname, '..', 'behavioural_hub.db');
const db = new Database(dbPath);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running!' });
});

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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Behavioural Hub Backend running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${dbPath}`);
  console.log(`\n🧠 Insights Endpoints:`);
  console.log(`   GET  /api/insights`);
  console.log(`   GET  /api/insights/:id`);
  console.log(`   GET  /api/insights/category/:category`);
  console.log(`   GET  /api/insights/segment/:segment`);
  console.log(`   POST /api/insights`);
  console.log(`\n📈 Analytics Endpoints:`);
  console.log(`   GET  /api/analytics/summary`);
  console.log(`   GET  /api/analytics/by-category`);
  console.log(`   GET  /api/analytics/by-segment`);
  console.log(`   GET  /api/analytics/impact`);
  console.log(`   GET  /api/analytics/trends`);
  console.log(`   GET  /api/analytics/top-insights?limit=10`);
  console.log(`\n🧪 AB Testing Endpoints:`);
  console.log(`   GET    /api/experiments`);
  console.log(`   POST   /api/experiments`);
  console.log(`   GET    /api/experiments/:id`);
  console.log(`   PATCH  /api/experiments/:id`);
  console.log(`   GET    /api/experiments/:id/assign?user_id=xxx`);
  console.log(`   GET    /api/experiments/:id/results`);
  console.log(`   POST   /api/events/track`);
  console.log(`\n✅ GET  /health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  console.log('\n✅ Database connection closed');
  process.exit(0);
});
