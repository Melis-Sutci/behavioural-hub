-- ============================================
-- COMPETITOR APPS TRACKING
-- ============================================
-- Separate from paywall competitors table
-- Track broader competitive landscape

CREATE TABLE IF NOT EXISTS competitor_apps (
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

CREATE INDEX IF NOT EXISTS idx_competitor_apps_tier ON competitor_apps(tier);
CREATE INDEX IF NOT EXISTS idx_competitor_apps_active ON competitor_apps(is_active);

-- Update competitor_features to reference competitor_apps
-- Note: We'll keep the existing competitor_id for now (backwards compat)
ALTER TABLE competitor_features ADD COLUMN competitor_app_id INTEGER REFERENCES competitor_apps(id);

-- ============================================
-- SEED COMPETITOR APPS
-- ============================================
INSERT OR IGNORE INTO competitor_apps (name, tier, category, market_position, app_store_url, play_store_url, description) VALUES
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
   'Contact sync and caller ID'),

  ('Begone', 'secondary', 'spam_blocking', 'emerging',
   NULL, NULL,
   'Spam call blocker'),

  ('JunkMan', 'secondary', 'spam_blocking', 'emerging',
   NULL, NULL,
   'Junk call blocking'),

  ('UpCall', 'secondary', 'caller_id', 'emerging',
   NULL, NULL,
   'Caller identification service');
