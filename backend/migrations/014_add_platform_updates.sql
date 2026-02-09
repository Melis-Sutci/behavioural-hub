-- Platform updates tracking
CREATE TABLE IF NOT EXISTS platform_updates (id INTEGER PRIMARY KEY AUTOINCREMENT, platform TEXT NOT NULL, version TEXT NOT NULL, title TEXT NOT NULL, description TEXT, release_date TEXT, features TEXT, api_changes TEXT, deprecations TEXT, affects_us BOOLEAN DEFAULT 0, impact_level TEXT, opportunities TEXT, risks TEXT, action_required TEXT, status TEXT DEFAULT 'new', reviewed_by INTEGER, reviewed_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (reviewed_by) REFERENCES users(id));

CREATE INDEX IF NOT EXISTS idx_platform_updates_platform ON platform_updates(platform);
CREATE INDEX IF NOT EXISTS idx_platform_updates_impact ON platform_updates(impact_level);
CREATE INDEX IF NOT EXISTS idx_platform_updates_status ON platform_updates(status);
CREATE INDEX IF NOT EXISTS idx_platform_updates_affects ON platform_updates(affects_us);
