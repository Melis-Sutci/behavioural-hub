-- ============================================
-- INSIGHT GENERATION SYSTEM - KNOWLEDGE BASE
-- ============================================
-- Phase 1: Foundation - Adding psychology principles,
-- sources, and citation tracking system
-- Based on: INSIGHT_STRATEGY.md

-- ============================================
-- PSYCHOLOGY PRINCIPLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS psychology_principles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- 'behavioral', 'cognitive', 'social', 'neuroscience', 'ux'
  description TEXT NOT NULL,
  framework_owner TEXT, -- 'Nir Eyal', 'BJ Fogg', 'Daniel Kahneman', etc.

  -- Academic grounding
  primary_citation TEXT,
  academic_papers TEXT, -- JSON array of research papers
  confidence_score REAL DEFAULT 0.8, -- 0-1 scale

  -- Practical application
  use_cases TEXT, -- JSON array of use cases
  real_world_examples TEXT, -- JSON array of examples
  anti_patterns TEXT, -- JSON array of what NOT to do

  -- Metadata
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_reviewed TEXT DEFAULT CURRENT_TIMESTAMP,
  review_status TEXT DEFAULT 'verified' -- 'verified', 'pending', 'disputed'
);

CREATE INDEX IF NOT EXISTS idx_psychology_principles_category ON psychology_principles(category);
CREATE INDEX IF NOT EXISTS idx_psychology_principles_confidence ON psychology_principles(confidence_score DESC);

-- ============================================
-- SOURCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT UNIQUE,
  title TEXT NOT NULL,
  author TEXT,
  publication_date TEXT,

  -- Classification
  tier INTEGER NOT NULL, -- 1: Academic, 2: Industry Expert, 3: Community
  confidence_level REAL DEFAULT 0.8,
  content_type TEXT, -- 'research', 'case-study', 'blog', 'book', 'documentation'

  -- Content
  summary TEXT,
  key_takeaways TEXT, -- JSON array
  relevant_principles TEXT, -- JSON array of principle IDs

  -- Metadata
  last_fetched TEXT DEFAULT CURRENT_TIMESTAMP,
  fetch_frequency TEXT DEFAULT 'monthly', -- 'daily', 'weekly', 'monthly', 'manual'
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sources_tier ON sources(tier);
CREATE INDEX IF NOT EXISTS idx_sources_confidence ON sources(confidence_level DESC);
CREATE INDEX IF NOT EXISTS idx_sources_content_type ON sources(content_type);

-- ============================================
-- CITATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS citations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  insight_id INTEGER NOT NULL,
  source_id INTEGER NOT NULL,
  quote TEXT,
  relevance_score REAL DEFAULT 0.8,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (insight_id) REFERENCES insights(id) ON DELETE CASCADE,
  FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_citations_insight ON citations(insight_id);
CREATE INDEX IF NOT EXISTS idx_citations_source ON citations(source_id);
CREATE INDEX IF NOT EXISTS idx_citations_relevance ON citations(relevance_score DESC);

-- ============================================
-- ENHANCE EXISTING INSIGHTS TABLE
-- ============================================
-- Add new columns to insights table for enhanced tracking

-- Psychology evidence
ALTER TABLE insights ADD COLUMN psychology_evidence TEXT; -- JSON array of principle references

-- Confidence scoring
ALTER TABLE insights ADD COLUMN overall_confidence REAL DEFAULT 0.5;
ALTER TABLE insights ADD COLUMN data_confidence REAL DEFAULT 0.5;
ALTER TABLE insights ADD COLUMN theory_confidence REAL DEFAULT 0.5;

-- Review tracking
ALTER TABLE insights ADD COLUMN ai_generated BOOLEAN DEFAULT 1;
ALTER TABLE insights ADD COLUMN human_reviewed BOOLEAN DEFAULT 0;
ALTER TABLE insights ADD COLUMN expert_reviewed BOOLEAN DEFAULT 0;
ALTER TABLE insights ADD COLUMN reviewers TEXT; -- JSON array of reviewer IDs

-- Additional metadata
ALTER TABLE insights ADD COLUMN updated_at TEXT;
ALTER TABLE insights ADD COLUMN severity TEXT DEFAULT 'medium'; -- 'critical', 'high', 'medium', 'low'

-- Implementation tracking
ALTER TABLE insights ADD COLUMN implementation_effort TEXT; -- 'low', 'medium', 'high'
ALTER TABLE insights ADD COLUMN expected_impact TEXT;
ALTER TABLE insights ADD COLUMN test_results TEXT; -- JSON object with A/B test results

CREATE INDEX IF NOT EXISTS idx_insights_confidence ON insights(overall_confidence DESC);
CREATE INDEX IF NOT EXISTS idx_insights_severity ON insights(severity);
CREATE INDEX IF NOT EXISTS idx_insights_segment ON insights(target_segment);
CREATE INDEX IF NOT EXISTS idx_insights_reviewed ON insights(human_reviewed, expert_reviewed);

-- ============================================
-- PRINCIPLE-SOURCE MAPPING TABLE
-- ============================================
-- Many-to-many relationship between principles and sources
CREATE TABLE IF NOT EXISTS principle_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  principle_id INTEGER NOT NULL,
  source_id INTEGER NOT NULL,
  relevance_score REAL DEFAULT 0.8,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (principle_id) REFERENCES psychology_principles(id) ON DELETE CASCADE,
  FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE,
  UNIQUE(principle_id, source_id)
);

CREATE INDEX IF NOT EXISTS idx_principle_sources_principle ON principle_sources(principle_id);
CREATE INDEX IF NOT EXISTS idx_principle_sources_source ON principle_sources(source_id);
