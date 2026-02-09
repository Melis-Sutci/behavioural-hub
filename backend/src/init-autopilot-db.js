const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'behavioural_hub.db');
const db = new Database(dbPath);

console.log(`📂 Using database: ${dbPath}`);
console.log('🚀 Initializing Growth Autopilot tables...');

// ============================================
// 1. PAYWALL COMPETITORS TABLE
// ============================================
// Note: Renamed from 'competitors' to 'paywall_competitors' to avoid conflict
// with the 'competitors' table in migration 012 (industry tracking)
db.exec(`
  CREATE TABLE IF NOT EXISTS paywall_competitors (
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
console.log('✅ Table created: paywall_competitors');

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
  CREATE INDEX IF NOT EXISTS idx_paywall_competitors_category ON paywall_competitors(category);
  CREATE INDEX IF NOT EXISTS idx_paywall_competitors_country ON paywall_competitors(country);

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
  INSERT OR IGNORE INTO paywall_competitors (
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
// 15. PAYWALL TEMPLATES TABLE
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS paywall_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,

    -- Template metadata
    template_type TEXT NOT NULL, -- 'ai_generated', 'competitor_inspired', 'custom', 'seasonal'
    target_segment TEXT, -- 'all', 'detective', 'victim', 'passive', 'high_ltv', 'churn_risk', etc.

    -- Design config
    layout_config TEXT NOT NULL, -- JSON: {structure, positioning, elements}
    copy_config TEXT NOT NULL, -- JSON: {headline, subheadline, features, cta, social_proof}
    pricing_display TEXT NOT NULL, -- JSON: {plans_to_show, price_positioning, trial_emphasis}
    visual_config TEXT, -- JSON: {colors, fonts, images, backgrounds}

    -- Performance & Analytics
    performance_score REAL DEFAULT 0, -- 0-100
    conversion_rate REAL,
    total_views INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,

    -- Source & Attribution
    created_from TEXT, -- competitor_id, 'ai_generated', generation_id
    competitor_references TEXT, -- JSON array of competitor IDs
    ai_rationale TEXT, -- Why AI generated this design

    -- Seasonal/Campaign
    campaign_id TEXT,
    is_seasonal BOOLEAN DEFAULT 0,
    seasonal_event TEXT, -- 'black_friday', 'ramadan', 'diwali', 'new_year', etc.
    active_from TEXT,
    active_until TEXT,

    -- Status
    status TEXT DEFAULT 'draft', -- 'draft', 'active', 'testing', 'archived', 'winner'

    -- Timestamps
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_used_at TEXT
  )
`);
console.log('✅ Table created: paywall_templates');

// ============================================
// 16. PAYWALL CHAT SESSIONS TABLE
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS paywall_chat_sessions (
    id TEXT PRIMARY KEY,

    -- Session context
    objective TEXT NOT NULL, -- 'generate_new', 'refine_existing', 'seasonal_campaign', 'ab_test'
    target_segment TEXT,
    template_id TEXT, -- If refining existing template

    -- Input parameters
    initial_prompt TEXT NOT NULL,
    context_data TEXT, -- JSON: {competitors, benchmarks, user_data, etc.}

    -- Generated outputs
    generated_templates TEXT, -- JSON array of template IDs
    final_template_id TEXT,

    -- Session metadata
    total_messages INTEGER DEFAULT 0,
    iterations INTEGER DEFAULT 0, -- How many times user refined

    -- Status
    status TEXT DEFAULT 'active', -- 'active', 'completed', 'abandoned'

    -- Timestamps
    started_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_message_at TEXT DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT,

    FOREIGN KEY (template_id) REFERENCES paywall_templates(id) ON DELETE SET NULL,
    FOREIGN KEY (final_template_id) REFERENCES paywall_templates(id) ON DELETE SET NULL
  )
`);
console.log('✅ Table created: paywall_chat_sessions');

// ============================================
// 17. PAYWALL CHAT MESSAGES TABLE
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS paywall_chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,

    -- Message details
    role TEXT NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,

    -- Attachments
    generated_templates TEXT, -- JSON array of template configs (for assistant messages)
    refinement_request TEXT, -- JSON: what user wants to change

    -- Metadata
    tokens_used INTEGER,
    processing_time_ms INTEGER,

    -- Timestamp
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (session_id) REFERENCES paywall_chat_sessions(id) ON DELETE CASCADE
  )
`);
console.log('✅ Table created: paywall_chat_messages');

// ============================================
// 18. SEASONAL CAMPAIGNS TABLE
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS seasonal_campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,

    -- Campaign details
    event_type TEXT NOT NULL, -- 'black_friday', 'ramadan', 'diwali', 'new_year', 'christmas', 'custom'
    event_country TEXT, -- Specific to certain regions (e.g., 'ramadan' -> MENA)

    -- Timing
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    timezone TEXT DEFAULT 'UTC',

    -- Campaign config
    discount_percentage REAL,
    special_pricing TEXT, -- JSON: custom pricing for this period
    urgency_level TEXT, -- 'low', 'medium', 'high', 'critical'

    -- Messaging
    campaign_theme TEXT, -- JSON: {colors, messaging_tone, cultural_elements}
    headline_template TEXT,
    cta_template TEXT,

    -- Targeting
    target_countries TEXT, -- JSON array
    target_segments TEXT, -- JSON array

    -- Associated paywalls
    paywall_template_ids TEXT, -- JSON array

    -- Performance
    total_revenue REAL DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,

    -- Status
    status TEXT DEFAULT 'planned', -- 'planned', 'active', 'completed', 'cancelled'

    -- Timestamps
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);
console.log('✅ Table created: seasonal_campaigns');

// ============================================
// 19. PAYWALL GENERATIONS TABLE
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS paywall_generations (
    id TEXT PRIMARY KEY,
    session_id TEXT,

    -- Generation request
    generation_type TEXT NOT NULL, -- 'new_design', 'variant', 'seasonal', 'competitor_remix'
    input_prompt TEXT NOT NULL,
    input_parameters TEXT NOT NULL, -- JSON

    -- AI model info
    model_used TEXT, -- 'claude-sonnet-4-5-20250929'
    temperature REAL,
    tokens_used INTEGER,
    processing_time_ms INTEGER,

    -- Generated output
    output_templates TEXT NOT NULL, -- JSON array of 3 paywall configs
    ai_explanation TEXT, -- Why AI chose these designs
    design_principles TEXT, -- JSON array of principles applied

    -- User feedback
    user_rating INTEGER, -- 1-5
    user_feedback TEXT,
    selected_template_index INTEGER, -- Which of the 3 templates user selected

    -- Timestamps
    generated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (session_id) REFERENCES paywall_chat_sessions(id) ON DELETE SET NULL
  )
`);
console.log('✅ Table created: paywall_generations');

// ============================================
// 20. PAYWALL EXPERIMENTS TABLE (Extension of experiments)
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS paywall_experiments (
    id TEXT PRIMARY KEY,
    experiment_id TEXT NOT NULL, -- Links to main experiments table

    -- Paywall-specific test details
    test_type TEXT NOT NULL, -- 'layout', 'copy', 'pricing', 'elements', 'full_design'

    -- Templates being tested
    control_template_id TEXT NOT NULL,
    variant_template_ids TEXT NOT NULL, -- JSON array

    -- Test hypothesis
    hypothesis TEXT NOT NULL,
    expected_improvement REAL, -- Percentage

    -- Targeting
    segment_targeting TEXT, -- JSON
    traffic_allocation TEXT, -- JSON: {control: 50, variant_a: 25, variant_b: 25}

    -- Results
    winner_template_id TEXT,
    improvement_percentage REAL,
    statistical_significance REAL,

    -- Status
    status TEXT DEFAULT 'draft', -- 'draft', 'running', 'completed', 'stopped'

    -- Timestamps
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    started_at TEXT,
    completed_at TEXT,

    FOREIGN KEY (control_template_id) REFERENCES paywall_templates(id),
    FOREIGN KEY (winner_template_id) REFERENCES paywall_templates(id)
  )
`);
console.log('✅ Table created: paywall_experiments');

// ============================================
// CREATE INDEXES FOR PAYWALL TABLES
// ============================================
db.exec(`
  -- Paywall templates indexes
  CREATE INDEX IF NOT EXISTS idx_paywall_templates_type ON paywall_templates(template_type);
  CREATE INDEX IF NOT EXISTS idx_paywall_templates_segment ON paywall_templates(target_segment);
  CREATE INDEX IF NOT EXISTS idx_paywall_templates_status ON paywall_templates(status);
  CREATE INDEX IF NOT EXISTS idx_paywall_templates_seasonal ON paywall_templates(is_seasonal, seasonal_event);
  CREATE INDEX IF NOT EXISTS idx_paywall_templates_campaign ON paywall_templates(campaign_id);
  CREATE INDEX IF NOT EXISTS idx_paywall_templates_performance ON paywall_templates(performance_score DESC);

  -- Paywall chat sessions indexes
  CREATE INDEX IF NOT EXISTS idx_paywall_chat_sessions_status ON paywall_chat_sessions(status);
  CREATE INDEX IF NOT EXISTS idx_paywall_chat_sessions_objective ON paywall_chat_sessions(objective);
  CREATE INDEX IF NOT EXISTS idx_paywall_chat_sessions_started ON paywall_chat_sessions(started_at);

  -- Paywall chat messages indexes
  CREATE INDEX IF NOT EXISTS idx_paywall_chat_messages_session ON paywall_chat_messages(session_id);
  CREATE INDEX IF NOT EXISTS idx_paywall_chat_messages_role ON paywall_chat_messages(role);
  CREATE INDEX IF NOT EXISTS idx_paywall_chat_messages_created ON paywall_chat_messages(created_at);

  -- Seasonal campaigns indexes
  CREATE INDEX IF NOT EXISTS idx_seasonal_campaigns_event ON seasonal_campaigns(event_type);
  CREATE INDEX IF NOT EXISTS idx_seasonal_campaigns_status ON seasonal_campaigns(status);
  CREATE INDEX IF NOT EXISTS idx_seasonal_campaigns_dates ON seasonal_campaigns(start_date, end_date);

  -- Paywall generations indexes
  CREATE INDEX IF NOT EXISTS idx_paywall_generations_session ON paywall_generations(session_id);
  CREATE INDEX IF NOT EXISTS idx_paywall_generations_type ON paywall_generations(generation_type);
  CREATE INDEX IF NOT EXISTS idx_paywall_generations_generated ON paywall_generations(generated_at);

  -- Paywall experiments indexes
  CREATE INDEX IF NOT EXISTS idx_paywall_experiments_experiment ON paywall_experiments(experiment_id);
  CREATE INDEX IF NOT EXISTS idx_paywall_experiments_status ON paywall_experiments(status);
  CREATE INDEX IF NOT EXISTS idx_paywall_experiments_control ON paywall_experiments(control_template_id);
`);
console.log('✅ Indexes created for paywall tables');

// ============================================
// SUMMARY
// ============================================
const tableCount = db.prepare(`
  SELECT COUNT(*) as count
  FROM sqlite_master
  WHERE type='table' AND name NOT LIKE 'sqlite_%'
`).get();

const benchmarkCount = db.prepare('SELECT COUNT(*) as count FROM benchmarks').get();
const competitorCount = db.prepare('SELECT COUNT(*) as count FROM paywall_competitors').get();
const paywallTemplateCount = db.prepare('SELECT COUNT(*) as count FROM paywall_templates').get();
const paywallChatSessionCount = db.prepare('SELECT COUNT(*) as count FROM paywall_chat_sessions').get();
const seasonalCampaignCount = db.prepare('SELECT COUNT(*) as count FROM seasonal_campaigns').get();

console.log('\n📊 Growth Autopilot Database Summary:');
console.log('─────────────────────────────────────');
console.log(`Total tables: ${tableCount.count}`);
console.log(`Benchmarks: ${benchmarkCount.count}`);
console.log(`Competitors: ${competitorCount.count}`);
console.log(`Paywall Templates: ${paywallTemplateCount.count}`);
console.log(`Chat Sessions: ${paywallChatSessionCount.count}`);
console.log(`Seasonal Campaigns: ${seasonalCampaignCount.count}`);
console.log('─────────────────────────────────────');

db.close();
console.log('\n✅ Growth Autopilot database initialization complete!');
