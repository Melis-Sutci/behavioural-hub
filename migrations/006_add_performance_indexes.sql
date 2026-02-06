-- ============================================
-- QUICK WIN #9: DATABASE INDEXING
-- Performance Optimization Migration
-- ============================================

-- Insights Table Indexes
CREATE INDEX IF NOT EXISTS idx_insights_target_segment ON insights(target_segment);
CREATE INDEX IF NOT EXISTS idx_insights_psychology_principle ON insights(psychology_principle);
CREATE INDEX IF NOT EXISTS idx_insights_created_at ON insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insights_impact_score ON insights(impact_score DESC);
CREATE INDEX IF NOT EXISTS idx_insights_status ON insights(status);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_insights_segment_status ON insights(target_segment, status);
CREATE INDEX IF NOT EXISTS idx_insights_segment_impact ON insights(target_segment, impact_score DESC);

-- Scenarios Table Indexes
CREATE INDEX IF NOT EXISTS idx_scenarios_insight_id ON scenarios(insight_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_status ON scenarios(status);
CREATE INDEX IF NOT EXISTS idx_scenarios_created_at ON scenarios(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scenarios_success_rate ON scenarios(success_rate DESC);

-- Composite index for scenario queries
CREATE INDEX IF NOT EXISTS idx_scenarios_insight_status ON scenarios(insight_id, status);

-- Tests Table Indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_tests_scenario_id ON tests(scenario_id);
CREATE INDEX IF NOT EXISTS idx_tests_status ON tests(status);
CREATE INDEX IF NOT EXISTS idx_tests_created_at ON tests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tests_end_date ON tests(end_date);

-- Composite index for active tests
CREATE INDEX IF NOT EXISTS idx_tests_status_dates ON tests(status, start_date, end_date);

-- Segments Table Indexes
CREATE INDEX IF NOT EXISTS idx_segments_name ON segments(name);
CREATE INDEX IF NOT EXISTS idx_segments_active ON segments(is_active);
CREATE INDEX IF NOT EXISTS idx_segments_created_at ON segments(created_at DESC);

-- Segment Rules Indexes
CREATE INDEX IF NOT EXISTS idx_segment_rules_segment_id ON segment_rules(segment_id);
CREATE INDEX IF NOT EXISTS idx_segment_rules_field ON segment_rules(field_name);

-- Segment History Indexes
CREATE INDEX IF NOT EXISTS idx_segment_history_segment_id ON segment_history(segment_id);
CREATE INDEX IF NOT EXISTS idx_segment_history_created_at ON segment_history(created_at DESC);

-- Settings Table Indexes
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);

-- Full-text search indexes (if PostgreSQL)
-- For MySQL, use FULLTEXT index instead
-- CREATE INDEX IF NOT EXISTS idx_insights_fulltext ON insights USING gin(to_tsvector('english', title || ' ' || description));
-- CREATE INDEX IF NOT EXISTS idx_scenarios_fulltext ON scenarios USING gin(to_tsvector('english', name || ' ' || description));

-- Add comments for documentation
COMMENT ON INDEX idx_insights_target_segment IS 'Optimize queries filtering by segment';
COMMENT ON INDEX idx_insights_impact_score IS 'Optimize sorting by impact score';
COMMENT ON INDEX idx_insights_segment_status IS 'Optimize combined segment and status queries';
COMMENT ON INDEX idx_scenarios_insight_id IS 'Optimize scenario lookups by insight';
COMMENT ON INDEX idx_tests_status_dates IS 'Optimize active test queries';
COMMENT ON INDEX idx_segments_active IS 'Optimize active segment queries';

-- Performance monitoring query
-- Use this to check index usage:
-- SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public' ORDER BY idx_scan DESC;

-- Analyze tables to update statistics
ANALYZE insights;
ANALYZE scenarios;
ANALYZE tests;
ANALYZE segments;
ANALYZE segment_rules;
ANALYZE segment_history;
ANALYZE settings;
