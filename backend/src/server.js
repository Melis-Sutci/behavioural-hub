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
  console.log(`\n✅ GET  /health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  console.log('\n✅ Database connection closed');
  process.exit(0);
});
