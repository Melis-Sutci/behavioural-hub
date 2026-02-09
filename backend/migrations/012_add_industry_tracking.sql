-- ============================================
-- INDUSTRY TRACKING & COMPETITOR ANALYSIS
-- ============================================
-- Track industry news, platform updates, and competitor features
-- for GetContact and future apps

-- ============================================
-- INDUSTRY NEWS SOURCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS industry_news_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- 'platform', 'security', 'telecom', 'ux', 'competitor'
  app_context TEXT DEFAULT 'getcontact', -- Which app this is relevant for

  -- Tracking config
  check_frequency TEXT DEFAULT 'daily', -- 'hourly', 'daily', 'weekly'
  last_checked TEXT,
  is_active BOOLEAN DEFAULT 1,

  -- Metadata
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_industry_sources_category ON industry_news_sources(category);
CREATE INDEX IF NOT EXISTS idx_industry_sources_app ON industry_news_sources(app_context);
CREATE INDEX IF NOT EXISTS idx_industry_sources_active ON industry_news_sources(is_active);

-- ============================================
-- INDUSTRY NEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS industry_news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  url TEXT UNIQUE,
  summary TEXT,

  -- Classification
  category TEXT NOT NULL, -- 'platform_update', 'security_threat', 'competitor_feature', 'regulation', 'trend'
  platform TEXT, -- 'ios', 'android', 'pixel', 'samsung', etc.
  relevance_score REAL DEFAULT 0.5, -- 0-1 scale
  priority TEXT DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'

  -- Content
  key_points TEXT, -- JSON array of key takeaways
  impact_analysis TEXT, -- How this affects our product
  action_items TEXT, -- JSON array of suggested actions

  -- Status
  status TEXT DEFAULT 'new', -- 'new', 'reviewed', 'implemented', 'irrelevant'
  reviewed_by INTEGER, -- user_id who reviewed
  reviewed_at TEXT,

  -- Metadata
  published_date TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (source_id) REFERENCES industry_news_sources(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_industry_news_source ON industry_news(source_id);
CREATE INDEX IF NOT EXISTS idx_industry_news_category ON industry_news(category);
CREATE INDEX IF NOT EXISTS idx_industry_news_platform ON industry_news(platform);
CREATE INDEX IF NOT EXISTS idx_industry_news_relevance ON industry_news(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_industry_news_status ON industry_news(status);
CREATE INDEX IF NOT EXISTS idx_industry_news_priority ON industry_news(priority);
CREATE INDEX IF NOT EXISTS idx_industry_news_date ON industry_news(published_date DESC);

-- ============================================
-- COMPETITORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS competitors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  website TEXT,
  app_store_url TEXT,
  play_store_url TEXT,

  -- Classification
  tier TEXT NOT NULL DEFAULT 'secondary', -- 'primary', 'secondary', 'emerging'
  category TEXT NOT NULL, -- 'caller_id', 'spam_blocking', 'contact_management'
  market_position TEXT, -- 'leader', 'challenger', 'niche'

  -- Tracking
  track_frequency TEXT DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly'
  last_checked TEXT,
  is_active BOOLEAN DEFAULT 1,

  -- Metadata
  description TEXT,
  founded_year INTEGER,
  employee_count TEXT,
  funding TEXT,
  key_strengths TEXT, -- JSON array
  key_weaknesses TEXT, -- JSON array

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_competitors_tier ON competitors(tier);
CREATE INDEX IF NOT EXISTS idx_competitors_active ON competitors(is_active);

-- ============================================
-- COMPETITOR FEATURES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS competitor_features (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  competitor_id INTEGER NOT NULL,
  feature_name TEXT NOT NULL,
  description TEXT,

  -- Analysis
  category TEXT, -- 'onboarding', 'core_feature', 'monetization', 'ux', 'growth'
  implementation_quality TEXT, -- 'excellent', 'good', 'average', 'poor'
  user_impact TEXT, -- 'high', 'medium', 'low'
  uniqueness TEXT, -- 'unique', 'common', 'standard'

  -- Our status
  we_have_it BOOLEAN DEFAULT 0,
  our_version_better BOOLEAN DEFAULT 0,
  should_implement BOOLEAN DEFAULT 0,
  implementation_priority TEXT, -- 'critical', 'high', 'medium', 'low', 'wont_do'

  -- Screenshots/evidence
  screenshot_url TEXT,
  notes TEXT,

  -- Metadata
  discovered_date TEXT DEFAULT CURRENT_TIMESTAMP,
  last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
  reviewed_by INTEGER,

  FOREIGN KEY (competitor_id) REFERENCES competitors(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_competitor_features_competitor ON competitor_features(competitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_features_category ON competitor_features(category);
CREATE INDEX IF NOT EXISTS idx_competitor_features_priority ON competitor_features(implementation_priority);
CREATE INDEX IF NOT EXISTS idx_competitor_features_should_implement ON competitor_features(should_implement);

-- ============================================
-- PLATFORM UPDATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS platform_updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL, -- 'ios', 'android', 'pixel', 'samsung'
  version TEXT NOT NULL, -- 'iOS 18', 'Android 15', etc.

  -- Update info
  title TEXT NOT NULL,
  description TEXT,
  release_date TEXT,

  -- Relevant features
  features TEXT, -- JSON array of new features
  api_changes TEXT, -- JSON array of API changes
  deprecations TEXT, -- JSON array of deprecated features

  -- Impact analysis
  affects_us BOOLEAN DEFAULT 0,
  impact_level TEXT, -- 'critical', 'high', 'medium', 'low'
  opportunities TEXT, -- JSON array of opportunities
  risks TEXT, -- JSON array of risks
  action_required TEXT,

  -- Status
  status TEXT DEFAULT 'new', -- 'new', 'analyzed', 'implemented', 'not_applicable'
  reviewed_by INTEGER,
  reviewed_at TEXT,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_platform_updates_platform ON platform_updates(platform);
CREATE INDEX IF NOT EXISTS idx_platform_updates_impact ON platform_updates(impact_level);
CREATE INDEX IF NOT EXISTS idx_platform_updates_status ON platform_updates(status);
CREATE INDEX IF NOT EXISTS idx_platform_updates_affects ON platform_updates(affects_us);

-- ============================================
-- SEED DEFAULT SOURCES
-- ============================================
INSERT OR IGNORE INTO industry_news_sources (name, url, category, check_frequency) VALUES
  -- Security & Spam
  ('PopSci Spam Call News', 'https://www.popsci.com/?s=spam+call', 'security', 'daily'),
  ('Norton Online Scams', 'https://us.norton.com/blog/online-scams', 'security', 'daily'),

  -- Telecom Industry
  ('Voice & Data News', 'https://www.voicendata.com/news', 'telecom', 'daily'),
  ('FCC News & Events', 'https://www.fcc.gov/news-events', 'telecom', 'weekly'),

  -- Competitor News
  ('Truecaller Blog', 'https://www.truecaller.com/blog/category/news', 'competitor', 'daily'),
  ('CallApp Features', 'https://callapp.com/app-features', 'competitor', 'weekly'),

  -- UX & Onboarding
  ('UserOnboard Teardowns', 'https://www.useronboard.com/user-onboarding-teardowns/', 'ux', 'weekly'),
  ('Context Partners', 'https://www.contextpartners.com/', 'ux', 'weekly'),

  -- Platform Updates
  ('Apple Developer News', 'https://developer.apple.com/news/', 'platform', 'daily'),
  ('Android Developer Blog', 'https://android-developers.googleblog.com/', 'platform', 'daily'),
  ('Google Pixel Blog', 'https://blog.google/products/pixel/', 'platform', 'weekly');

-- ============================================
-- SEED COMPETITORS
-- ============================================
INSERT OR IGNORE INTO competitors (name, tier, category, market_position, app_store_url, play_store_url, description) VALUES
  ('Truecaller', 'primary', 'caller_id', 'leader',
   'https://apps.apple.com/app/truecaller/id448142450',
   'https://play.google.com/store/apps/details?id=com.truecaller',
   'Leading caller ID and spam blocking app'),

  ('Hiya', 'primary', 'spam_blocking', 'challenger',
   'https://apps.apple.com/app/hiya-spam-blocker/id986999874',
   'https://play.google.com/store/apps/details?id=com.webascender.callerid',
   'Spam call blocker and caller ID'),

  ('Showcaller', 'secondary', 'caller_id', 'niche',
   NULL, 'https://play.google.com/store/apps/details?id=com.showcaller',
   'Caller ID and spam detection'),

  ('Eyecon', 'secondary', 'contact_management', 'niche',
   'https://apps.apple.com/app/eyecon-caller-id/id947399910',
   'https://play.google.com/store/apps/details?id=com.eyecon.global',
   'Visual caller ID and contacts app'),

  ('Mr.Number', 'secondary', 'spam_blocking', 'niche',
   'https://apps.apple.com/app/mr-number/id1047334922',
   'https://play.google.com/store/apps/details?id=com.mrnumber.blocker',
   'Call blocker and reverse lookup'),

  ('RoboKiller', 'primary', 'spam_blocking', 'challenger',
   'https://apps.apple.com/app/robokiller-spam-call-blocker/id1022831885',
   'https://play.google.com/store/apps/details?id=com.robokiller.app',
   'AI-powered spam call blocker'),

  ('Sync.me', 'secondary', 'contact_management', 'niche',
   NULL, NULL,
   'Contact sync and caller ID');

-- ============================================
-- INSIGHTS LINK TO INDUSTRY NEWS
-- ============================================
-- Add column to link insights to industry news/updates
ALTER TABLE insights ADD COLUMN industry_news_refs TEXT; -- JSON array of news IDs
ALTER TABLE insights ADD COLUMN competitor_refs TEXT; -- JSON array of competitor feature IDs
