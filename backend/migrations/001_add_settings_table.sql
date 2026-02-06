-- Settings table for platform configuration
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL, -- 'testing', 'ai', 'notifications', 'segments', etc.
  key TEXT NOT NULL, -- specific setting key
  value TEXT NOT NULL, -- JSON string for complex values
  value_type TEXT NOT NULL DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category, key)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(category, key);

-- Insert default settings
INSERT OR IGNORE INTO settings (category, key, value, value_type, description) VALUES
  -- Testing settings
  ('testing', 'confidence_level', '95', 'number', 'Default confidence level for A/B tests'),
  ('testing', 'min_sample_size', '5000', 'number', 'Minimum sample size before concluding tests'),
  ('testing', 'statistical_method', 'Bayesian', 'string', 'Statistical method: Bayesian, Frequentist, or Sequential'),
  ('testing', 'auto_ship_enabled', 'true', 'boolean', 'Enable automatic rollout of winning variations'),
  ('testing', 'auto_ship_threshold', '95% confidence + 14 days minimum', 'string', 'Threshold for auto-shipping'),
  ('testing', 'rollout_strategy', 'Gradual: 25% → 50% → 100% (3 days each)', 'string', 'Rollout strategy for winners'),
  ('testing', 'max_test_duration', '30', 'number', 'Maximum test duration in days'),
  ('testing', 'min_test_duration', '7', 'number', 'Minimum test duration in days'),
  ('testing', 'include_weekends', 'true', 'boolean', 'Include weekend data in analysis'),
  ('testing', 'correction_method', 'Bonferroni', 'string', 'Multiple testing correction method'),
  ('testing', 'max_concurrent_tests', '3', 'number', 'Maximum concurrent tests per segment'),

  -- AI settings
  ('ai', 'confidence_threshold', 'balanced', 'string', 'AI confidence threshold: conservative, balanced, or aggressive'),
  ('ai', 'insight_frequency', 'Weekly', 'string', 'Insight generation frequency'),
  ('ai', 'auto_generate_tests', 'true', 'boolean', 'Auto-generate test scenarios'),
  ('ai', 'pattern_detection', 'true', 'boolean', 'Enable pattern detection for new segments'),
  ('ai', 'prioritized_principles', '["social-proof", "loss-aversion", "scarcity", "authority", "reciprocity"]', 'json', 'Prioritized psychology principles'),

  -- Notification settings
  ('notifications', 'email_enabled', 'false', 'boolean', 'Enable email notifications'),
  ('notifications', 'slack_enabled', 'false', 'boolean', 'Enable Slack notifications'),
  ('notifications', 'slack_webhook_url', '', 'string', 'Slack webhook URL'),
  ('notifications', 'notify_new_segment', 'true', 'boolean', 'Notify when new segment discovered'),
  ('notifications', 'notify_test_significant', 'true', 'boolean', 'Notify when test reaches significance'),
  ('notifications', 'notify_insight_validated', 'true', 'boolean', 'Notify when major insight validated'),
  ('notifications', 'daily_summary', 'false', 'boolean', 'Send daily summary email'),

  -- Segment settings
  ('segments', 'auto_archive_small', 'true', 'boolean', 'Auto-archive segments with <5% population'),
  ('segments', 'ai_suggest_new', 'true', 'boolean', 'AI can suggest new segments'),
  ('segments', 'require_manual_approval', 'true', 'boolean', 'Require manual approval for segment changes'),
  ('segments', 'auto_merge_similar', 'false', 'boolean', 'Auto-merge segments with >85% overlap'),
  ('segments', 'data_retention_archived', 'forever', 'string', 'Historical data retention for archived segments'),
  ('segments', 'change_log_retention', '5_years', 'string', 'Segment change log retention period');
