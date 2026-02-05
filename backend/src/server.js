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
  console.log(`🧠 API endpoints:`);
  console.log(`   GET  /health`);
  console.log(`   GET  /api/insights`);
  console.log(`   GET  /api/insights/:id`);
  console.log(`   GET  /api/insights/category/:category`);
  console.log(`   GET  /api/insights/segment/:segment`);
  console.log(`   POST /api/insights`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  console.log('\n✅ Database connection closed');
  process.exit(0);
});
