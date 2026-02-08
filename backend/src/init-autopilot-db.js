const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'behavioural_hub.db');
const db = new Database(dbPath);

console.log(`📂 Using database: ${dbPath}`);
console.log('🚀 Initializing Growth Autopilot tables...');

// ============================================
// 1. COMPETITORS TABLE
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS competitors (
    id TEXT PRIMARY KEY,
    app_name TEXT NOT NULL,
    bundle_id TEXT,
    category TEXT NOT NULL,
    country TEXT DEFAULT 'US',

    -- Pricing
    pricing_weekly REAL,
    pricing_monthly REAL,
    pricing_yearly REAL,
    pricing_lifetime REAL,

    -- Trial
    trial_duration INTEGER,
    trial_type TEXT, -- 'free', 'paid', 'none'

    -- Paywall
    paywall_screenshot_url TEXT,
    paywall_template TEXT, -- 'card_stack', 'hero_image', 'minimal'
    paywall_elements TEXT, -- JSON array

    -- Notes
    notes TEXT,
    market_position TEXT, -- 'premium', 'mid', 'budget'

    added_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);
console.log('✅ Table created: competitors');

// ============================================
// 2. BENCHMARKS TABLE
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS benchmarks (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    country TEXT DEFAULT 'global',

    -- Metrics
    metric_name TEXT NOT NULL,
    p25 REAL,
    p50 REAL,
    p75 REAL,
    p90 REAL,

    -- Metadata
    sample_size INTEGER,
    data_source TEXT, -- 'manual', 'industry_report', 'aggregated'
    confidence TEXT, -- 'low', 'medium', 'high'

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(category, country, metric_name)
  )
`);
console.log('✅ Table created: benchmarks');

// ============================================
// 3. AUTOPILOT RECOMMENDATIONS TABLE
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS autopilot_recommendations (
    id TEXT PRIMARY KEY,
    experiment_id TEXT,

    -- Test details
    test_type TEXT NOT NULL, -- 'pricing', 'trial', 'element', 'positioning'
    hypothesis TEXT NOT NULL,
    description TEXT NOT NULL,

    -- Current vs Suggested
    current_value TEXT, -- JSON
    suggested_value TEXT, -- JSON

    -- Impact
    priority_score INTEGER, -- 0-100
    expected_impact TEXT, -- 'low', 'medium', 'high'
    confidence_score REAL, -- 0-1

    -- Test params
    sample_size_required INTEGER,
    estimated_duration_days INTEGER,

    -- Rationale
    rationale TEXT,
    data_sources TEXT, -- JSON array
    competitor_references TEXT, -- JSON array

    -- Status
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'running', 'completed'

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    applied_at TEXT
  )
`);
console.log('✅ Table created: autopilot_recommendations');

// ============================================
// 4. AUTOPILOT AUDITS TABLE
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS autopilot_audits (
    id TEXT PRIMARY KEY,

    -- Scores
    overall_score INTEGER, -- 0-100

    -- Analysis
    strengths TEXT, -- JSON array
    weaknesses TEXT, -- JSON array
    opportunities TEXT, -- JSON array

    -- Metrics snapshot
    current_metrics TEXT, -- JSON
    benchmark_comparison TEXT, -- JSON

    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);
console.log('✅ Table created: autopilot_audits');

// ============================================
// 5. MARKET INTELLIGENCE TABLE
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS market_intelligence (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,

    insight_type TEXT, -- 'pricing_trend', 'trial_strategy', 'design_pattern'
    title TEXT NOT NULL,
    description TEXT,

    data TEXT, -- JSON
    confidence TEXT,

    source TEXT, -- 'industry_report', 'competitor_analysis', 'user_research'
    source_url TEXT,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);
console.log('✅ Table created: market_intelligence');

// ============================================
// 6. AUTO INSIGHTS TABLE
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS auto_insights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_type TEXT NOT NULL, -- 'event_pattern', 'segment_analysis', 'external'
    raw_data TEXT NOT NULL, -- JSON
    confidence_score REAL NOT NULL,
    pattern_type TEXT, -- 'conversion', 'retention', 'churn', 'engagement'
    detected_at TEXT DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending', -- 'pending', 'validated', 'rejected', 'published'
    validated_by INTEGER,
    published_as INTEGER, -- insight_id when published
    FOREIGN KEY (published_as) REFERENCES insights(id)
  )
`);
console.log('✅ Table created: auto_insights');

// ============================================
// 7. PATTERN DETECTIONS TABLE
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS pattern_detections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    auto_insight_id INTEGER NOT NULL,
    pattern_name TEXT NOT NULL,
    pattern_data TEXT NOT NULL, -- JSON
    statistical_significance REAL,
    sample_size INTEGER,
    detected_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auto_insight_id) REFERENCES auto_insights(id)
  )
`);
console.log('✅ Table created: pattern_detections');

// ============================================
// 8. AUTO SEGMENTS TABLE
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS auto_segments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    segment_type TEXT NOT NULL, -- 'behavioral', 'rfm', 'predictive', 'clustering'

    -- Segment criteria
    criteria TEXT NOT NULL, -- JSON
    features_used TEXT, -- JSON array

    -- Statistics
    user_count INTEGER DEFAULT 0,
    avg_ltv REAL,
    avg_engagement_score REAL,
    churn_rate REAL,

    -- Metadata
    confidence_score REAL,
    created_by TEXT DEFAULT 'autopilot',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_updated TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);
console.log('✅ Table created: auto_segments');

// ============================================
// 9. AUTO SEGMENT MEMBERSHIPS TABLE
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS auto_segment_memberships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    segment_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    membership_score REAL DEFAULT 1.0, -- 0-1 (for fuzzy clustering)
    joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (segment_id) REFERENCES auto_segments(id) ON DELETE CASCADE,
    UNIQUE(segment_id, user_id)
  )
`);
console.log('✅ Table created: auto_segment_memberships');

// ============================================
// 10. GROWTH LOOPS TABLE
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS growth_loops (
    id TEXT PRIMARY KEY,
    loop_type TEXT NOT NULL, -- 'viral', 'retention', 'engagement', 'monetization'
    name TEXT NOT NULL,
    description TEXT,

    -- Loop metrics
    loop_strength REAL, -- K-factor for viral, retention rate for retention loops
    cycle_time_hours REAL,
    conversion_rate REAL,

    -- Components
    trigger_event TEXT, -- JSON
    loop_steps TEXT, -- JSON array
    success_metric TEXT,

    -- Performance
    users_in_loop INTEGER DEFAULT 0,
    weekly_completions INTEGER DEFAULT 0,
    avg_completion_time_minutes REAL,

    -- Status
    status TEXT DEFAULT 'active', -- 'active', 'paused', 'archived'

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_analyzed TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);
console.log('✅ Table created: growth_loops');

// ============================================
// 11. CHURN PREDICTIONS TABLE
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS churn_predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,

    -- Prediction
    churn_probability REAL NOT NULL, -- 0-1
    churn_risk_level TEXT NOT NULL, -- 'critical', 'high', 'medium', 'low'
    predicted_churn_date TEXT,

    -- Contributing factors
    factors TEXT NOT NULL, -- JSON array

    -- Features used
    days_since_last_activity INTEGER,
    total_sessions INTEGER,
    avg_session_duration REAL,
    feature_usage_score REAL,
    engagement_trend TEXT, -- 'increasing', 'stable', 'declining'

    -- Actions
    recommended_action TEXT,
    action_taken TEXT,
    action_result TEXT,

    -- Metadata
    predicted_at TEXT DEFAULT CURRENT_TIMESTAMP,
    prediction_model_version TEXT DEFAULT 'v1.0',

    UNIQUE(user_id, predicted_at)
  )
`);
console.log('✅ Table created: churn_predictions');

// ============================================
// 12. LTV PREDICTIONS TABLE
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS ltv_predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,

    -- LTV Prediction
    predicted_ltv REAL NOT NULL,
    ltv_segment TEXT NOT NULL, -- 'whale', 'high_value', 'medium_value', 'low_value'
    confidence_score REAL NOT NULL, -- 0-1

    -- Time horizons
    ltv_30d REAL,
    ltv_90d REAL,
    ltv_180d REAL,
    ltv_365d REAL,

    -- Contributing factors
    factors TEXT NOT NULL, -- JSON array

    -- User features
    current_revenue REAL DEFAULT 0,
    purchase_frequency REAL,
    avg_order_value REAL,
    days_as_customer INTEGER,
    engagement_score REAL,

    -- Growth potential
    growth_potential TEXT, -- 'high', 'medium', 'low'
    recommended_strategy TEXT,

    -- Metadata
    predicted_at TEXT DEFAULT CURRENT_TIMESTAMP,
    prediction_model_version TEXT DEFAULT 'v1.0',

    UNIQUE(user_id, predicted_at)
  )
`);
console.log('✅ Table created: ltv_predictions');

// ============================================
// 13. BEHAVIORAL TRIGGERS TABLE
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS behavioral_triggers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,

    -- Trigger conditions
    event_type TEXT NOT NULL,
    conditions TEXT NOT NULL, -- JSON array of conditions

    -- Target
    target_segment TEXT,
    target_user_filter TEXT, -- JSON

    -- Actions
    action_type TEXT NOT NULL, -- 'email', 'push', 'in_app_modal', 'discount', 'feature_unlock'
    action_config TEXT NOT NULL, -- JSON

    -- Frequency control
    max_triggers_per_user INTEGER DEFAULT 1,
    cooldown_hours INTEGER DEFAULT 24,

    -- Performance
    total_triggers INTEGER DEFAULT 0,
    successful_conversions INTEGER DEFAULT 0,
    conversion_rate REAL DEFAULT 0,

    -- Status
    status TEXT DEFAULT 'active', -- 'active', 'paused', 'archived'
    priority INTEGER DEFAULT 5, -- 1-10

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);
console.log('✅ Table created: behavioral_triggers');

// ============================================
// 14. TRIGGER EXECUTIONS TABLE
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS trigger_executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trigger_id TEXT NOT NULL,
    user_id TEXT NOT NULL,

    -- Execution details
    triggered_at TEXT DEFAULT CURRENT_TIMESTAMP,
    trigger_conditions_met TEXT, -- JSON

    -- Result
    action_delivered BOOLEAN DEFAULT 0,
    action_delivered_at TEXT,
    user_response TEXT, -- 'accepted', 'dismissed', 'ignored'
    response_at TEXT,

    -- Conversion tracking
    converted BOOLEAN DEFAULT 0,
    conversion_value REAL,
    conversion_at TEXT,

    FOREIGN KEY (trigger_id) REFERENCES behavioral_triggers(id) ON DELETE CASCADE
  )
`);
console.log('✅ Table created: trigger_executions');

// ============================================
// CREATE INDEXES FOR PERFORMANCE
// ============================================
db.exec(`
  -- Auto insights indexes
  CREATE INDEX IF NOT EXISTS idx_auto_insights_status ON auto_insights(status);
  CREATE INDEX IF NOT EXISTS idx_auto_insights_source ON auto_insights(source_type);
  CREATE INDEX IF NOT EXISTS idx_auto_insights_detected ON auto_insights(detected_at);

  -- Pattern detections indexes
  CREATE INDEX IF NOT EXISTS idx_pattern_detections_insight ON pattern_detections(auto_insight_id);
  CREATE INDEX IF NOT EXISTS idx_pattern_detections_name ON pattern_detections(pattern_name);

  -- Auto segments indexes
  CREATE INDEX IF NOT EXISTS idx_auto_segments_type ON auto_segments(segment_type);
  CREATE INDEX IF NOT EXISTS idx_auto_segment_memberships_user ON auto_segment_memberships(user_id);
  CREATE INDEX IF NOT EXISTS idx_auto_segment_memberships_segment ON auto_segment_memberships(segment_id);

  -- Growth loops indexes
  CREATE INDEX IF NOT EXISTS idx_growth_loops_type ON growth_loops(loop_type);
  CREATE INDEX IF NOT EXISTS idx_growth_loops_status ON growth_loops(status);

  -- Churn predictions indexes
  CREATE INDEX IF NOT EXISTS idx_churn_predictions_user ON churn_predictions(user_id);
  CREATE INDEX IF NOT EXISTS idx_churn_predictions_risk ON churn_predictions(churn_risk_level);
  CREATE INDEX IF NOT EXISTS idx_churn_predictions_date ON churn_predictions(predicted_at);

  -- LTV predictions indexes
  CREATE INDEX IF NOT EXISTS idx_ltv_predictions_user ON ltv_predictions(user_id);
  CREATE INDEX IF NOT EXISTS idx_ltv_predictions_segment ON ltv_predictions(ltv_segment);
  CREATE INDEX IF NOT EXISTS idx_ltv_predictions_date ON ltv_predictions(predicted_at);

  -- Behavioral triggers indexes
  CREATE INDEX IF NOT EXISTS idx_behavioral_triggers_status ON behavioral_triggers(status);
  CREATE INDEX IF NOT EXISTS idx_behavioral_triggers_event ON behavioral_triggers(event_type);
  CREATE INDEX IF NOT EXISTS idx_trigger_executions_trigger ON trigger_executions(trigger_id);
  CREATE INDEX IF NOT EXISTS idx_trigger_executions_user ON trigger_executions(user_id);
  CREATE INDEX IF NOT EXISTS idx_trigger_executions_triggered ON trigger_executions(triggered_at);

  -- Competitors indexes
  CREATE INDEX IF NOT EXISTS idx_competitors_category ON competitors(category);
  CREATE INDEX IF NOT EXISTS idx_competitors_country ON competitors(country);

  -- Benchmarks indexes
  CREATE INDEX IF NOT EXISTS idx_benchmarks_category ON benchmarks(category, country);

  -- Autopilot recommendations indexes
  CREATE INDEX IF NOT EXISTS idx_autopilot_recs_status ON autopilot_recommendations(status);
  CREATE INDEX IF NOT EXISTS idx_autopilot_recs_priority ON autopilot_recommendations(priority_score);
  CREATE INDEX IF NOT EXISTS idx_autopilot_recs_type ON autopilot_recommendations(test_type);

  -- Market intelligence indexes
  CREATE INDEX IF NOT EXISTS idx_market_intel_category ON market_intelligence(category);
  CREATE INDEX IF NOT EXISTS idx_market_intel_type ON market_intelligence(insight_type);
`);
console.log('✅ Indexes created for all autopilot tables');

// ============================================
// SEED SAMPLE DATA
// ============================================

// Insert sample benchmarks
const sampleBenchmarks = [
  { category: 'productivity', metric: 'trial_conversion_rate', p25: 0.08, p50: 0.15, p75: 0.25, p90: 0.35 },
  { category: 'productivity', metric: 'free_to_paid_conversion', p25: 0.02, p50: 0.04, p75: 0.08, p90: 0.15 },
  { category: 'productivity', metric: 'retention_d7', p25: 0.20, p50: 0.35, p75: 0.50, p90: 0.65 },
  { category: 'productivity', metric: 'retention_d30', p25: 0.10, p50: 0.20, p75: 0.35, p90: 0.50 },
  { category: 'productivity', metric: 'arpu_monthly', p25: 2.50, p50: 4.99, p75: 9.99, p90: 19.99 }
];

const insertBenchmark = db.prepare(`
  INSERT OR IGNORE INTO benchmarks (
    id, category, country, metric_name, p25, p50, p75, p90,
    sample_size, data_source, confidence
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertBenchmarks = db.transaction((benchmarks) => {
  for (const b of benchmarks) {
    insertBenchmark.run(
      `benchmark_${b.category}_${b.metric}`,
      b.category,
      'global',
      b.metric,
      b.p25,
      b.p50,
      b.p75,
      b.p90,
      1000,
      'industry_report',
      'medium'
    );
  }
});

insertBenchmarks(sampleBenchmarks);
console.log(`✅ Inserted ${sampleBenchmarks.length} sample benchmarks`);

// Insert sample competitor
const sampleCompetitor = {
  id: 'comp_todoist_2024',
  app_name: 'Todoist',
  bundle_id: 'com.todoist',
  category: 'productivity',
  pricing_monthly: 4.99,
  pricing_yearly: 39.99,
  trial_duration: 30,
  trial_type: 'free',
  market_position: 'premium',
  notes: 'Market leader in task management'
};

db.prepare(`
  INSERT OR IGNORE INTO competitors (
    id, app_name, bundle_id, category, pricing_monthly, pricing_yearly,
    trial_duration, trial_type, market_position, notes, added_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
`).run(
  sampleCompetitor.id,
  sampleCompetitor.app_name,
  sampleCompetitor.bundle_id,
  sampleCompetitor.category,
  sampleCompetitor.pricing_monthly,
  sampleCompetitor.pricing_yearly,
  sampleCompetitor.trial_duration,
  sampleCompetitor.trial_type,
  sampleCompetitor.market_position,
  sampleCompetitor.notes
);

console.log('✅ Inserted sample competitor (Todoist)');

// ============================================
// SUMMARY
// ============================================
const tableCount = db.prepare(`
  SELECT COUNT(*) as count
  FROM sqlite_master
  WHERE type='table' AND name NOT LIKE 'sqlite_%'
`).get();

const benchmarkCount = db.prepare('SELECT COUNT(*) as count FROM benchmarks').get();
const competitorCount = db.prepare('SELECT COUNT(*) as count FROM competitors').get();

console.log('\n📊 Growth Autopilot Database Summary:');
console.log('─────────────────────────────────────');
console.log(`Total tables: ${tableCount.count}`);
console.log(`Benchmarks: ${benchmarkCount.count}`);
console.log(`Competitors: ${competitorCount.count}`);
console.log('─────────────────────────────────────');

db.close();
console.log('\n✅ Growth Autopilot database initialization complete!');
