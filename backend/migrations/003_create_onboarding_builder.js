/**
 * Migration: Onboarding Builder Tables
 * Creates tables for the Onboarding Builder feature with AI-powered suggestions
 */

module.exports = {
  up: (db) => {
    console.log('📦 Creating Onboarding Builder tables...');

    // ============================================
    // ONBOARDING FLOWS TABLE
    // Main onboarding flows by country/version
    // ============================================
    db.exec(`
      CREATE TABLE IF NOT EXISTS onboarding_flows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        country_code TEXT NOT NULL,
        app_version TEXT,
        platform TEXT DEFAULT 'both',
        status TEXT DEFAULT 'draft',
        is_default BOOLEAN DEFAULT 0,
        total_screens INTEGER DEFAULT 0,
        avg_completion_rate REAL DEFAULT 0,
        avg_time_to_complete INTEGER DEFAULT 0,
        total_users INTEGER DEFAULT 0,
        conversion_rate REAL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT,
        UNIQUE(country_code, app_version)
      )
    `);
    console.log('✅ Table created: onboarding_flows');

    // ============================================
    // ONBOARDING SCREENS TABLE
    // Individual screens/steps in an onboarding flow
    // ============================================
    db.exec(`
      CREATE TABLE IF NOT EXISTS onboarding_screens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        flow_id INTEGER NOT NULL,
        order_index INTEGER NOT NULL,
        screen_type TEXT NOT NULL,
        title TEXT,
        subtitle TEXT,
        description TEXT,
        background_type TEXT DEFAULT 'color',
        background_value TEXT,
        cta_text TEXT,
        cta_style TEXT,
        skip_enabled BOOLEAN DEFAULT 0,
        animation_type TEXT,
        duration_hint INTEGER DEFAULT 5,
        analytics_label TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (flow_id) REFERENCES onboarding_flows(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Table created: onboarding_screens');

    // ============================================
    // ONBOARDING VARIANTS TABLE
    // A/B test variants for specific screens
    // ============================================
    db.exec(`
      CREATE TABLE IF NOT EXISTS onboarding_variants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        screen_id INTEGER NOT NULL,
        variant_name TEXT NOT NULL,
        title TEXT,
        subtitle TEXT,
        description TEXT,
        background_value TEXT,
        cta_text TEXT,
        is_control BOOLEAN DEFAULT 0,
        traffic_weight REAL DEFAULT 1.0,
        views INTEGER DEFAULT 0,
        completions INTEGER DEFAULT 0,
        conversions INTEGER DEFAULT 0,
        avg_time_spent INTEGER DEFAULT 0,
        status TEXT DEFAULT 'draft',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (screen_id) REFERENCES onboarding_screens(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Table created: onboarding_variants');

    // ============================================
    // ONBOARDING SUGGESTIONS TABLE
    // AI-powered suggestions based on industry best practices
    // ============================================
    db.exec(`
      CREATE TABLE IF NOT EXISTS onboarding_suggestions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        flow_id INTEGER,
        suggestion_type TEXT NOT NULL,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        rationale TEXT,
        expected_impact TEXT,
        confidence_score REAL DEFAULT 0.7,
        priority TEXT DEFAULT 'medium',
        industry_examples TEXT,
        implementation_notes TEXT,
        status TEXT DEFAULT 'suggested',
        planned_date TEXT,
        tested_date TEXT,
        test_results TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT DEFAULT 'ai',
        FOREIGN KEY (flow_id) REFERENCES onboarding_flows(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Table created: onboarding_suggestions');

    // ============================================
    // ONBOARDING ANALYTICS TABLE
    // Track performance metrics per screen/flow
    // ============================================
    db.exec(`
      CREATE TABLE IF NOT EXISTS onboarding_analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        flow_id INTEGER NOT NULL,
        screen_id INTEGER,
        variant_id INTEGER,
        date TEXT NOT NULL,
        views INTEGER DEFAULT 0,
        completions INTEGER DEFAULT 0,
        skip_count INTEGER DEFAULT 0,
        drop_off_count INTEGER DEFAULT 0,
        avg_time_spent INTEGER DEFAULT 0,
        conversion_count INTEGER DEFAULT 0,
        revenue REAL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (flow_id) REFERENCES onboarding_flows(id) ON DELETE CASCADE,
        FOREIGN KEY (screen_id) REFERENCES onboarding_screens(id) ON DELETE CASCADE,
        FOREIGN KEY (variant_id) REFERENCES onboarding_variants(id) ON DELETE CASCADE,
        UNIQUE(flow_id, screen_id, variant_id, date)
      )
    `);
    console.log('✅ Table created: onboarding_analytics');

    // ============================================
    // ONBOARDING SCREEN ELEMENTS TABLE
    // Detailed elements/components within each screen
    // ============================================
    db.exec(`
      CREATE TABLE IF NOT EXISTS onboarding_screen_elements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        screen_id INTEGER NOT NULL,
        element_type TEXT NOT NULL,
        element_config TEXT,
        order_index INTEGER NOT NULL,
        is_interactive BOOLEAN DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (screen_id) REFERENCES onboarding_screens(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Table created: onboarding_screen_elements');

    // ============================================
    // INDEXES
    // ============================================
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_onboarding_flows_country ON onboarding_flows(country_code);
      CREATE INDEX IF NOT EXISTS idx_onboarding_flows_status ON onboarding_flows(status);
      CREATE INDEX IF NOT EXISTS idx_onboarding_screens_flow ON onboarding_screens(flow_id);
      CREATE INDEX IF NOT EXISTS idx_onboarding_variants_screen ON onboarding_variants(screen_id);
      CREATE INDEX IF NOT EXISTS idx_onboarding_suggestions_flow ON onboarding_suggestions(flow_id);
      CREATE INDEX IF NOT EXISTS idx_onboarding_suggestions_status ON onboarding_suggestions(status);
      CREATE INDEX IF NOT EXISTS idx_onboarding_analytics_flow ON onboarding_analytics(flow_id);
      CREATE INDEX IF NOT EXISTS idx_onboarding_analytics_date ON onboarding_analytics(date);
    `);
    console.log('✅ Indexes created for Onboarding Builder tables');

    // ============================================
    // SEED DATA
    // ============================================
    const flowCount = db.prepare('SELECT COUNT(*) as count FROM onboarding_flows').get();

    if (flowCount.count === 0) {
      console.log('📝 Inserting seed data for Onboarding Builder...');

      // Insert default flows
      const insertFlow = db.prepare(`
        INSERT INTO onboarding_flows (
          name, description, country_code, app_version, platform, status,
          is_default, total_screens, avg_completion_rate, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const flows = [
        {
          name: 'Default US Onboarding',
          description: 'Standard onboarding flow for US users',
          country_code: 'US',
          app_version: '2.0.0',
          platform: 'both',
          status: 'active',
          is_default: 1,
          total_screens: 4,
          avg_completion_rate: 0.78,
          created_by: 'system'
        },
        {
          name: 'Turkey Onboarding v1',
          description: 'Localized onboarding for Turkish market',
          country_code: 'TR',
          app_version: '2.0.0',
          platform: 'both',
          status: 'active',
          is_default: 1,
          total_screens: 5,
          avg_completion_rate: 0.65,
          created_by: 'system'
        },
        {
          name: 'Azerbaijan Premium Focus',
          description: 'Onboarding optimized for Azerbaijan with premium conversion focus',
          country_code: 'AZ',
          app_version: '2.0.0',
          platform: 'both',
          status: 'draft',
          is_default: 0,
          total_screens: 6,
          avg_completion_rate: 0.0,
          created_by: 'system'
        }
      ];

      const insertFlows = db.transaction((flows) => {
        for (const flow of flows) {
          insertFlow.run(
            flow.name, flow.description, flow.country_code, flow.app_version,
            flow.platform, flow.status, flow.is_default, flow.total_screens,
            flow.avg_completion_rate, flow.created_by
          );
        }
      });

      insertFlows(flows);
      console.log(`✅ Inserted ${flows.length} default onboarding flows`);

      // Insert sample screens for US flow
      const insertScreen = db.prepare(`
        INSERT INTO onboarding_screens (
          flow_id, order_index, screen_type, title, subtitle, description,
          background_type, background_value, cta_text, skip_enabled, analytics_label
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const screens = [
        {
          flow_id: 1,
          order_index: 1,
          screen_type: 'welcome',
          title: 'Welcome to CallGuard',
          subtitle: 'Your personal spam call detective',
          description: 'Block spam calls, identify unknown numbers, and protect your privacy',
          background_type: 'gradient',
          background_value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          cta_text: 'Get Started',
          skip_enabled: 0,
          analytics_label: 'onb_welcome'
        },
        {
          flow_id: 1,
          order_index: 2,
          screen_type: 'feature',
          title: 'Real-time Spam Detection',
          subtitle: 'Powered by AI',
          description: 'Our advanced AI analyzes patterns and identifies spam calls before they reach you',
          background_type: 'image',
          background_value: '/assets/spam-detection.png',
          cta_text: 'Continue',
          skip_enabled: 1,
          analytics_label: 'onb_feature_1'
        },
        {
          flow_id: 1,
          order_index: 3,
          screen_type: 'permission',
          title: 'Enable Call Protection',
          subtitle: 'Allow CallGuard to identify incoming calls',
          description: 'We need permission to analyze incoming calls and protect you from spam',
          background_type: 'color',
          background_value: '#ffffff',
          cta_text: 'Allow Access',
          skip_enabled: 0,
          analytics_label: 'onb_permission'
        },
        {
          flow_id: 1,
          order_index: 4,
          screen_type: 'premium',
          title: 'Unlock Premium Features',
          subtitle: 'Get the full protection',
          description: 'Advanced analytics, custom blocklists, and priority support',
          background_type: 'gradient',
          background_value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          cta_text: 'Try 7 Days Free',
          skip_enabled: 1,
          analytics_label: 'onb_premium'
        }
      ];

      const insertScreens = db.transaction((screens) => {
        for (const screen of screens) {
          insertScreen.run(
            screen.flow_id, screen.order_index, screen.screen_type,
            screen.title, screen.subtitle, screen.description,
            screen.background_type, screen.background_value, screen.cta_text,
            screen.skip_enabled, screen.analytics_label
          );
        }
      });

      insertScreens(screens);
      console.log(`✅ Inserted ${screens.length} sample onboarding screens`);

      // Insert AI suggestions
      const insertSuggestion = db.prepare(`
        INSERT INTO onboarding_suggestions (
          flow_id, suggestion_type, category, title, description, rationale,
          expected_impact, confidence_score, priority, industry_examples, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const suggestions = [
        {
          flow_id: 1,
          suggestion_type: 'add_screen',
          category: 'social_proof',
          title: 'Add Social Proof Screen',
          description: 'Insert a screen showing "Join 2.4M+ protected users" with testimonials',
          rationale: 'Industry leaders like Truecaller, Robokiller show 20-30% conversion lift with social proof',
          expected_impact: '+15-20% completion rate, +8% premium conversion',
          confidence_score: 0.85,
          priority: 'high',
          industry_examples: JSON.stringify([
            { company: 'Truecaller', metric: '+22% conversion', source: 'Case study 2024' },
            { company: 'Robokiller', metric: '+18% completion', source: 'App teardown' }
          ]),
          status: 'suggested'
        },
        {
          flow_id: 1,
          suggestion_type: 'modify_screen',
          category: 'value_proposition',
          title: 'Personalize Welcome Message',
          description: 'Use dynamic content: "We\'ve already blocked 500+ spam calls in your area today"',
          rationale: 'Personalization increases perceived value and relevance (Duolingo: +24% engagement)',
          expected_impact: '+12% engagement, higher emotional connection',
          confidence_score: 0.78,
          priority: 'medium',
          industry_examples: JSON.stringify([
            { company: 'Duolingo', metric: '+24% engagement', source: 'Growth study 2023' },
            { company: 'Headspace', metric: '+16% retention', source: 'Blog post' }
          ]),
          status: 'suggested'
        },
        {
          flow_id: 2,
          suggestion_type: 'add_screen',
          category: 'localization',
          title: 'Add Turkish Testimonial Screen',
          description: 'Show testimonials from Turkish users with local success stories',
          rationale: 'Local social proof increases trust in emerging markets (WhatsApp India case)',
          expected_impact: '+25-30% trust score, +10% completion',
          confidence_score: 0.82,
          priority: 'high',
          industry_examples: JSON.stringify([
            { company: 'WhatsApp', metric: '+30% adoption', source: 'India market study' },
            { company: 'Spotify', metric: '+22% retention', source: 'LATAM expansion' }
          ]),
          status: 'suggested'
        },
        {
          flow_id: 1,
          suggestion_type: 'ab_test',
          category: 'cta_optimization',
          title: 'Test Loss Aversion vs Gain Framing',
          description: 'Compare "Don\'t miss spam calls" vs "Catch every spam call"',
          rationale: 'Loss aversion typically outperforms gain framing by 2x (Kahneman)',
          expected_impact: '+30-50% CTA clicks, higher perceived urgency',
          confidence_score: 0.91,
          priority: 'high',
          industry_examples: JSON.stringify([
            { company: 'Booking.com', metric: '2x conversion', source: 'Scarcity study' },
            { company: 'Airbnb', metric: '+35% bookings', source: 'Loss framing test' }
          ]),
          status: 'suggested'
        }
      ];

      const insertSuggestions = db.transaction((suggestions) => {
        for (const sugg of suggestions) {
          insertSuggestion.run(
            sugg.flow_id, sugg.suggestion_type, sugg.category, sugg.title,
            sugg.description, sugg.rationale, sugg.expected_impact,
            sugg.confidence_score, sugg.priority, sugg.industry_examples, sugg.status
          );
        }
      });

      insertSuggestions(suggestions);
      console.log(`✅ Inserted ${suggestions.length} AI-powered suggestions`);
    }

    console.log('✅ Onboarding Builder migration complete!');
  },

  down: (db) => {
    console.log('⏪ Rolling back Onboarding Builder tables...');

    db.exec('DROP TABLE IF EXISTS onboarding_screen_elements');
    db.exec('DROP TABLE IF EXISTS onboarding_analytics');
    db.exec('DROP TABLE IF EXISTS onboarding_suggestions');
    db.exec('DROP TABLE IF EXISTS onboarding_variants');
    db.exec('DROP TABLE IF EXISTS onboarding_screens');
    db.exec('DROP TABLE IF EXISTS onboarding_flows');

    console.log('✅ Onboarding Builder tables removed');
  }
};
