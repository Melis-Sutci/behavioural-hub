-- Segments table for user segment management
CREATE TABLE IF NOT EXISTS segments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE, -- 'detective', 'victim', 'passive'
  description TEXT NOT NULL,
  emoji TEXT DEFAULT '👥',
  color TEXT DEFAULT 'gray', -- 'purple', 'teal', 'gray', etc.

  -- Population metrics
  population_count INTEGER DEFAULT 0,
  population_percentage REAL DEFAULT 0.0,

  -- Performance metrics
  insights_tested INTEGER DEFAULT 0,
  success_rate REAL DEFAULT 0.0,
  total_revenue_impact REAL DEFAULT 0.0,
  avg_impact_score REAL DEFAULT 0.0,

  -- Core traits (JSON array)
  traits TEXT DEFAULT '[]', -- JSON array of traits

  -- Metadata
  status TEXT DEFAULT 'active', -- 'active', 'archived', 'draft'
  created_by TEXT DEFAULT 'system',
  discovery_method TEXT DEFAULT 'manual', -- 'manual', 'ai', 'split', 'merge'
  parent_segment_id INTEGER NULL, -- if created by split

  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  archived_at DATETIME NULL,

  FOREIGN KEY (parent_segment_id) REFERENCES segments(id)
);

-- Segment rules table for defining segment membership criteria
CREATE TABLE IF NOT EXISTS segment_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  segment_id INTEGER NOT NULL,
  rule_type TEXT NOT NULL, -- 'behavior', 'demographic', 'event', 'custom'
  rule_key TEXT NOT NULL, -- e.g., 'profile_views_per_week', 'spam_exposure'
  operator TEXT NOT NULL, -- 'gt', 'lt', 'eq', 'contains', 'between'
  value TEXT NOT NULL, -- JSON value
  weight REAL DEFAULT 1.0, -- for AI scoring
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (segment_id) REFERENCES segments(id) ON DELETE CASCADE
);

-- Segment evolution history
CREATE TABLE IF NOT EXISTS segment_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  segment_id INTEGER NOT NULL,
  action TEXT NOT NULL, -- 'created', 'updated', 'archived', 'merged', 'split', 'trait_added', 'trait_removed'
  description TEXT NOT NULL,
  changes TEXT, -- JSON object of what changed
  performed_by TEXT DEFAULT 'system',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (segment_id) REFERENCES segments(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_segments_status ON segments(status);
CREATE INDEX IF NOT EXISTS idx_segments_slug ON segments(slug);
CREATE INDEX IF NOT EXISTS idx_segment_rules_segment ON segment_rules(segment_id);
CREATE INDEX IF NOT EXISTS idx_segment_history_segment ON segment_history(segment_id);
CREATE INDEX IF NOT EXISTS idx_segment_history_created ON segment_history(created_at);

-- Insert default segments
INSERT OR IGNORE INTO segments (name, slug, description, emoji, color, population_count, population_percentage, insights_tested, success_rate, total_revenue_impact, avg_impact_score, traits, status) VALUES
  (
    'Dedektifler',
    'detective',
    'Curiosity-driven explorers who actively investigate and explore features',
    '🕵️',
    'purple',
    3800,
    38.0,
    47,
    72.0,
    94000,
    7.8,
    '["High FOMO", "Info-seeking", "Social aware", "Rejection-curious"]',
    'active'
  ),
  (
    'Mağdurlar',
    'victim',
    'Safety-focused protectors who prioritize security and trust signals',
    '🛡️',
    'teal',
    2900,
    29.0,
    34,
    68.0,
    71000,
    7.2,
    '["Risk-averse", "Trust-focused", "Authority-responsive"]',
    'active'
  ),
  (
    'Pasifler',
    'passive',
    'Utility-focused minimalists who engage only when necessary',
    '😴',
    'gray',
    3300,
    33.0,
    28,
    54.0,
    42000,
    5.4,
    '["Low engagement", "Utility-driven", "Reciprocity-responsive"]',
    'active'
  );

-- Insert segment creation history
INSERT INTO segment_history (segment_id, action, description, performed_by) VALUES
  (1, 'created', 'Initial segment created from user behavior analysis', 'system'),
  (2, 'created', 'Initial segment created from user behavior analysis', 'system'),
  (3, 'created', 'Initial segment created from user behavior analysis', 'system');

-- Insert example rules for Detective segment
INSERT INTO segment_rules (segment_id, rule_type, rule_key, operator, value, weight) VALUES
  (1, 'behavior', 'profile_views_per_week', 'gt', '10', 1.0),
  (1, 'behavior', 'feature_exploration_score', 'gt', '7', 0.8),
  (1, 'behavior', 'social_engagement_level', 'gt', '5', 0.7);

-- Insert example rules for Victim segment
INSERT INTO segment_rules (segment_id, rule_type, rule_key, operator, value, weight) VALUES
  (2, 'behavior', 'spam_exposure_count', 'gt', '5', 1.0),
  (2, 'behavior', 'security_feature_usage', 'gt', '3', 0.9),
  (2, 'behavior', 'trust_signal_response', 'gt', '0.7', 0.8);

-- Insert example rules for Passive segment
INSERT INTO segment_rules (segment_id, rule_type, rule_key, operator, value, weight) VALUES
  (3, 'behavior', 'weekly_active_days', 'lt', '3', 1.0),
  (3, 'behavior', 'feature_usage_count', 'lt', '5', 0.8),
  (3, 'behavior', 'engagement_score', 'lt', '4', 0.7);
