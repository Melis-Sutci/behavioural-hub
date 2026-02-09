-- ============================================
-- PERFORMANCE OPTIMIZATION: DATABASE INDEXING
-- Add indexes for commonly queried columns
-- ============================================

-- Insights Table Indexes
CREATE INDEX IF NOT EXISTS idx_insights_target_segment ON insights(target_segment);
CREATE INDEX IF NOT EXISTS idx_insights_psychology_principle ON insights(psychology_principle);
CREATE INDEX IF NOT EXISTS idx_insights_created_at ON insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insights_impact_score ON insights(impact_score DESC);
CREATE INDEX IF NOT EXISTS idx_insights_status ON insights(status);
CREATE INDEX IF NOT EXISTS idx_insights_category ON insights(category);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_insights_segment_status ON insights(target_segment, status);
CREATE INDEX IF NOT EXISTS idx_insights_segment_impact ON insights(target_segment, impact_score DESC);
CREATE INDEX IF NOT EXISTS idx_insights_category_status ON insights(category, status);

-- Segments Table Indexes
CREATE INDEX IF NOT EXISTS idx_segments_name ON segments(name);
CREATE INDEX IF NOT EXISTS idx_segments_active ON segments(is_active);
CREATE INDEX IF NOT EXISTS idx_segments_created_at ON segments(created_at DESC);

-- Segment Rules Indexes
-- Note: Column is 'rule_key' not 'field_name'
CREATE INDEX IF NOT EXISTS idx_segment_rules_segment_id ON segment_rules(segment_id);
CREATE INDEX IF NOT EXISTS idx_segment_rules_key ON segment_rules(rule_key);

-- Segment History Indexes
CREATE INDEX IF NOT EXISTS idx_segment_history_segment_id ON segment_history(segment_id);
CREATE INDEX IF NOT EXISTS idx_segment_history_created_at ON segment_history(created_at DESC);

-- Settings Table Indexes
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);

-- Users Table Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- API Keys Indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON api_keys(expires_at);

-- Industry News Indexes
CREATE INDEX IF NOT EXISTS idx_industry_news_published ON industry_news(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_industry_news_priority_status ON industry_news(priority, status);
