const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'behavioural_hub.db');
const db = new Database(dbPath);

console.log('🗄️  Initializing database...');

// Create insights table
db.exec(`
  CREATE TABLE IF NOT EXISTS insights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    impact_score REAL DEFAULT 0,
    impact_type TEXT DEFAULT 'unknown',
    discovery_date TEXT DEFAULT CURRENT_TIMESTAMP,
    target_segment TEXT DEFAULT 'all',
    psychological_principle TEXT,
    evidence TEXT,
    recommendation TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log('✅ Table created: insights');

// Check if data already exists
const count = db.prepare('SELECT COUNT(*) as count FROM insights').get();

if (count.count === 0) {
  console.log('📝 Inserting seed data...');

  const insertInsight = db.prepare(`
    INSERT INTO insights (
      title, description, category, status, impact_score, impact_type,
      discovery_date, target_segment, psychological_principle, evidence, recommendation
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insights = [
    {
      title: 'FOMO-Based Call Notifications Increase Detective Engagement',
      description: 'Detectives respond 47% faster to notifications that highlight missed spam detection opportunities',
      category: 'psychology',
      status: 'active',
      impact_score: 32000,
      impact_type: 'retention',
      discovery_date: '2025-12-15',
      target_segment: 'detective',
      psychological_principle: 'Fear of Missing Out (FOMO)',
      evidence: 'A/B test with 2,500 users showed 47% faster response time',
      recommendation: 'Implement notification copy: "5 spam calls detected while you were away"'
    },
    {
      title: 'Social Proof Reduces Victim Anxiety by 38%',
      description: 'Showing "2.4M users protected today" badge reduces uninstall rate among victims',
      category: 'psychology',
      status: 'active',
      impact_score: 28000,
      impact_type: 'retention',
      discovery_date: '2025-11-20',
      target_segment: 'victim',
      psychological_principle: 'Social Proof & Authority',
      evidence: 'Cohort analysis: 38% reduction in Day-3 uninstalls',
      recommendation: 'Display real-time protection stats prominently on home screen'
    },
    {
      title: 'Reciprocity Triggers Work Better for Passive Users',
      description: 'Free premium trial offers convert 23% of passive users to paid subscribers',
      category: 'experiments',
      status: 'active',
      impact_score: 45000,
      impact_type: 'revenue',
      discovery_date: '2025-10-05',
      target_segment: 'passive',
      psychological_principle: 'Reciprocity Principle',
      evidence: 'Conversion rate increased from 6% to 23% with 7-day trial',
      recommendation: 'Offer passive users 7-day premium trial after 3rd spam call block'
    },
    {
      title: 'Loss Aversion Messaging Boosts Detective Premium Conversion',
      description: 'Messaging focused on "what you\'ll lose" converts 2x better than "what you\'ll gain"',
      category: 'psychology',
      status: 'active',
      impact_score: 52000,
      impact_type: 'revenue',
      discovery_date: '2026-01-10',
      target_segment: 'detective',
      psychological_principle: 'Loss Aversion',
      evidence: 'Copy test: "Don\'t miss spam patterns" vs "Discover spam patterns" - 2x conversion',
      recommendation: 'Use loss-framed copy in premium upsell modals for detectives'
    },
    {
      title: 'Authority Badges Reduce Victim Churn',
      description: 'Displaying security certifications reduces victim segment uninstall rate by 41%',
      category: 'data',
      status: 'active',
      impact_score: 36000,
      impact_type: 'retention',
      discovery_date: '2025-09-18',
      target_segment: 'victim',
      psychological_principle: 'Authority & Trust',
      evidence: 'Retention cohort: 41% reduction in Day-7 churn',
      recommendation: 'Add trust badges (Norton, McAfee verified) to settings page'
    },
    {
      title: 'Gamification Increases Detective Session Length by 3.2x',
      description: 'Spam detection leaderboard increases average session time from 2.1 to 6.7 minutes',
      category: 'experiments',
      status: 'active',
      impact_score: 18000,
      impact_type: 'engagement',
      discovery_date: '2025-12-01',
      target_segment: 'detective',
      psychological_principle: 'Gamification & Competition',
      evidence: 'Feature rollout: Session length 3.2x increase, DAU +12%',
      recommendation: 'Expand leaderboard with weekly challenges'
    },
    {
      title: 'Passive Users Need Clear Value Reminders',
      description: 'Monthly email reminders showing blocked spam count re-activate 19% of dormant users',
      category: 'data',
      status: 'active',
      impact_score: 14000,
      impact_type: 'retention',
      discovery_date: '2026-01-05',
      target_segment: 'passive',
      psychological_principle: 'Value Reminder',
      evidence: 'Email campaign: 19% reactivation rate, 8% upgrade to premium',
      recommendation: 'Send monthly "You\'re Protected" summary emails to passive users'
    },
    {
      title: 'Scarcity Tactics Fail with Victim Segment',
      description: 'Limited-time offers create anxiety and increase uninstalls by 22% among victims',
      category: 'experiments',
      status: 'archived',
      impact_score: -8000,
      impact_type: 'retention',
      discovery_date: '2025-08-12',
      target_segment: 'victim',
      psychological_principle: 'Scarcity (Failed)',
      evidence: 'A/B test: "Only 2 hours left!" messaging increased uninstalls 22%',
      recommendation: 'AVOID scarcity tactics for victims. Use reassurance instead.'
    },
    {
      title: 'Personalized Threat Detection Increases Victim Engagement',
      description: 'AI-powered personalized threat alerts boost victim app opens by 64%',
      category: 'data',
      status: 'active',
      impact_score: 42000,
      impact_type: 'engagement',
      discovery_date: '2025-11-28',
      target_segment: 'victim',
      psychological_principle: 'Personalization & Relevance',
      evidence: 'ML model rollout: 64% increase in notification CTR',
      recommendation: 'Deploy ML-based threat personalization to all victim users'
    },
    {
      title: 'Detective Users Prefer Detailed Analytics Over Simplicity',
      description: 'Complex dashboards with granular data increase detective retention by 31%',
      category: 'archetypes',
      status: 'active',
      impact_score: 27000,
      impact_type: 'retention',
      discovery_date: '2025-10-20',
      target_segment: 'detective',
      psychological_principle: 'Information Seeking Behavior',
      evidence: 'Feature comparison: Detailed analytics increased 7-day retention 31%',
      recommendation: 'Offer "Advanced Mode" dashboard for detective segment'
    },
    {
      title: 'Passive Users Respond to Effortless Engagement',
      description: 'One-tap actions increase passive user participation by 56%',
      category: 'archetypes',
      status: 'active',
      impact_score: 21000,
      impact_type: 'engagement',
      discovery_date: '2025-09-05',
      target_segment: 'passive',
      psychological_principle: 'Cognitive Ease',
      evidence: 'UI simplification: 56% increase in feature usage',
      recommendation: 'Reduce friction: add quick action buttons, minimize steps'
    },
    {
      title: 'Emotional Safety Messaging Reduces Victim Anxiety',
      description: 'Reassuring tone in push notifications reduces stress-related uninstalls by 29%',
      category: 'psychology',
      status: 'active',
      impact_score: 33000,
      impact_type: 'retention',
      discovery_date: '2026-01-15',
      target_segment: 'victim',
      psychological_principle: 'Emotional Safety',
      evidence: 'Copy A/B test: Calming language reduced uninstalls 29%',
      recommendation: 'Use empathetic, protective language in all victim-facing communications'
    }
  ];

  const insertMany = db.transaction((insights) => {
    for (const insight of insights) {
      insertInsight.run(
        insight.title,
        insight.description,
        insight.category,
        insight.status,
        insight.impact_score,
        insight.impact_type,
        insight.discovery_date,
        insight.target_segment,
        insight.psychological_principle,
        insight.evidence,
        insight.recommendation
      );
    }
  });

  insertMany(insights);
  console.log(`✅ Inserted ${insights.length} sample insights`);
} else {
  console.log(`ℹ️  Database already contains ${count.count} insights`);
}

// Show summary
const summary = db.prepare(`
  SELECT
    category,
    COUNT(*) as count,
    SUM(impact_score) as total_impact
  FROM insights
  GROUP BY category
`).all();

console.log('\n📊 Database Summary:');
console.log('─────────────────────────────────────');
summary.forEach(row => {
  console.log(`${row.category.padEnd(15)} ${String(row.count).padEnd(5)} insights   $${(row.total_impact / 1000).toFixed(0)}K impact`);
});
console.log('─────────────────────────────────────');

db.close();
console.log('\n✅ Database initialization complete!');
