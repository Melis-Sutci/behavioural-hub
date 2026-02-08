/**
 * Growth Loop Detector
 *
 * Detects and analyzes growth loops:
 * - Viral loops
 * - Retention loops
 * - Engagement loops
 * - Monetization loops
 */

const ViralCoefficientCalculator = require('./viralCalculator');
const { mean } = require('../../utils/helpers');

class GrowthLoopDetector {
  constructor(db) {
    this.db = db;
    this.viralCalc = new ViralCoefficientCalculator(db);
  }

  /**
   * Detect all growth loops
   */
  async detectLoops() {
    console.log('🔄 Detecting growth loops...');

    const loops = {
      viral: await this.detectViralLoops(),
      retention: await this.detectRetentionLoops(),
      engagement: await this.detectEngagementLoops(),
      monetization: await this.detectMonetizationLoops()
    };

    console.log('✅ Growth loop detection complete');
    return loops;
  }

  /**
   * Detect viral loops
   */
  async detectViralLoops() {
    try {
      // Calculate viral metrics
      const viralMetrics = await this.viralCalc.calculateMetrics();

      // Get optimization suggestions
      const optimizations = await this.viralCalc.suggestViralOptimizations(viralMetrics);

      return {
        type: 'viral',
        health: viralMetrics.health,
        health_score: this.calculateHealthScore(viralMetrics.k_factor, 'viral'),
        metrics: {
          k_factor: viralMetrics.k_factor,
          viral_coefficient: viralMetrics.k_factor,
          invites_per_user: viralMetrics.invites_per_user,
          conversion_rate: viralMetrics.invite_conversion_rate,
          cycle_time_days: viralMetrics.viral_cycle_time_days,
          monthly_growth_rate: viralMetrics.monthly_growth_rate
        },
        status: viralMetrics.k_factor >= 0.5 ? 'healthy' : 'needs_improvement',
        opportunities: optimizations
      };
    } catch (error) {
      console.error('Error detecting viral loops:', error);
      return this.getDefaultLoop('viral');
    }
  }

  /**
   * Detect retention loops
   */
  async detectRetentionLoops() {
    try {
      // Analyze cohort retention
      const cohorts = this.db.all(`
        SELECT
          strftime('%Y-%W', MIN(created_at)) as cohort_week,
          COUNT(DISTINCT user_id) as cohort_size,
          COUNT(DISTINCT CASE
            WHEN julianday(MAX(created_at)) - julianday(MIN(created_at)) >= 1 THEN user_id
          END) as retained_d1,
          COUNT(DISTINCT CASE
            WHEN julianday(MAX(created_at)) - julianday(MIN(created_at)) >= 7 THEN user_id
          END) as retained_d7,
          COUNT(DISTINCT CASE
            WHEN julianday(MAX(created_at)) - julianday(MIN(created_at)) >= 30 THEN user_id
          END) as retained_d30
        FROM events
        WHERE created_at >= date('now', '-90 days')
        GROUP BY user_id
      `);

      // Calculate average retention rates
      const avgD1 = cohorts.length > 0
        ? mean(cohorts.map(c => c.retained_d1 / c.cohort_size))
        : 0;
      const avgD7 = cohorts.length > 0
        ? mean(cohorts.map(c => c.retained_d7 / c.cohort_size))
        : 0;
      const avgD30 = cohorts.length > 0
        ? mean(cohorts.map(c => c.retained_d30 / c.cohort_size))
        : 0;

      // Identify habit-forming actions
      const habitActions = await this.identifyHabitFormingActions();

      // Generate opportunities
      const opportunities = [];
      if (avgD7 < 0.3) {
        opportunities.push({
          type: 'improve_d7_retention',
          current: avgD7,
          target: 0.4,
          tactics: [
            'Implement onboarding checklist',
            'Send day 3 and day 7 engagement emails',
            'Highlight habit-forming features',
            'Add push notifications for key actions'
          ]
        });
      }

      if (habitActions.length < 3) {
        opportunities.push({
          type: 'create_habit_loops',
          tactics: [
            'Identify and promote core actions',
            'Add daily streaks or challenges',
            'Implement reminder system',
            'Gamify regular engagement'
          ]
        });
      }

      return {
        type: 'retention',
        health_score: this.calculateHealthScore(avgD7, 'retention'),
        metrics: {
          day_1_retention: avgD1,
          day_7_retention: avgD7,
          day_30_retention: avgD30,
          cohorts_analyzed: cohorts.length
        },
        habit_forming_actions: habitActions.slice(0, 5),
        status: avgD7 >= 0.3 ? 'healthy' : 'needs_improvement',
        opportunities
      };
    } catch (error) {
      console.error('Error detecting retention loops:', error);
      return this.getDefaultLoop('retention');
    }
  }

  /**
   * Identify habit-forming actions
   */
  async identifyHabitFormingActions() {
    try {
      const actions = this.db.all(`
        SELECT
          action_name,
          COUNT(DISTINCT user_id) as users,
          AVG(retention_rate) as avg_retention
        FROM (
          SELECT
            e1.user_id,
            e1.event_type as action_name,
            CASE
              WHEN EXISTS(
                SELECT 1 FROM events e2
                WHERE e2.user_id = e1.user_id
                AND julianday(e2.created_at) - julianday(e1.created_at) >= 30
              ) THEN 1 ELSE 0
            END as retention_rate
          FROM events e1
          WHERE e1.created_at >= date('now', '-60 days')
        )
        GROUP BY action_name
        HAVING users > 10
        ORDER BY avg_retention DESC
        LIMIT 10
      `);

      return actions.map(a => ({
        action: a.action_name,
        users: a.users,
        retention_correlation: a.avg_retention
      }));
    } catch (error) {
      console.error('Error identifying habit-forming actions:', error);
      return [];
    }
  }

  /**
   * Detect engagement loops
   */
  async detectEngagementLoops() {
    try {
      // Calculate DAU/MAU ratio
      const dauMau = this.db.get(`
        SELECT
          COUNT(DISTINCT CASE
            WHEN created_at >= date('now', '-1 day') THEN user_id
          END) * 1.0 / NULLIF(COUNT(DISTINCT CASE
            WHEN created_at >= date('now', '-30 days') THEN user_id
          END), 0) as dau_mau_ratio
        FROM events
      `);

      const dauMauRatio = dauMau?.dau_mau_ratio || 0;

      // Find engagement triggers
      const triggers = await this.identifyEngagementTriggers();

      // Generate opportunities
      const opportunities = [];
      if (dauMauRatio < 0.2) {
        opportunities.push({
          type: 'improve_daily_engagement',
          current: dauMauRatio,
          target: 0.3,
          tactics: [
            'Add daily challenges or missions',
            'Implement push notifications',
            'Create daily content updates',
            'Add social features'
          ]
        });
      }

      return {
        type: 'engagement',
        health_score: this.calculateHealthScore(dauMauRatio, 'engagement'),
        metrics: {
          dau_mau_ratio: dauMauRatio
        },
        engagement_triggers: triggers,
        status: dauMauRatio >= 0.2 ? 'healthy' : 'needs_improvement',
        opportunities
      };
    } catch (error) {
      console.error('Error detecting engagement loops:', error);
      return this.getDefaultLoop('engagement');
    }
  }

  /**
   * Identify engagement triggers
   */
  async identifyEngagementTriggers() {
    try {
      // Find events that lead to increased session frequency
      const triggers = this.db.all(`
        SELECT
          trigger_event,
          COUNT(*) as occurrences,
          AVG(sessions_after) as avg_sessions_increase
        FROM (
          SELECT
            e1.event_type as trigger_event,
            e1.user_id,
            (SELECT COUNT(DISTINCT session_id)
             FROM events e3
             WHERE e3.user_id = e1.user_id
             AND e3.created_at BETWEEN e1.created_at AND date(e1.created_at, '+7 days')
            ) as sessions_after
          FROM events e1
          WHERE e1.created_at >= date('now', '-30 days')
        )
        GROUP BY trigger_event
        HAVING occurrences > 5 AND avg_sessions_increase > 2
        ORDER BY avg_sessions_increase DESC
        LIMIT 5
      `);

      return triggers.map(t => ({
        trigger: t.trigger_event,
        engagement_lift: t.avg_sessions_increase
      }));
    } catch (error) {
      console.error('Error identifying engagement triggers:', error);
      return [];
    }
  }

  /**
   * Detect monetization loops
   */
  async detectMonetizationLoops() {
    try {
      // Analyze conversion patterns
      const conversionMetrics = this.db.get(`
        SELECT
          COUNT(DISTINCT user_id) as total_users,
          COUNT(DISTINCT CASE WHEN event_type = 'conversion' THEN user_id END) as converters,
          COUNT(CASE WHEN event_type = 'conversion' THEN 1 END) as total_conversions,
          AVG(CASE
            WHEN event_type = 'conversion' THEN
              julianday(created_at) - julianday((
                SELECT MIN(e2.created_at)
                FROM events e2
                WHERE e2.user_id = events.user_id
              ))
          END) as avg_days_to_conversion
        FROM events
        WHERE created_at >= date('now', '-30 days')
      `);

      const conversionRate = conversionMetrics.total_users > 0
        ? conversionMetrics.converters / conversionMetrics.total_users
        : 0;

      const repeatRate = conversionMetrics.converters > 0
        ? (conversionMetrics.total_conversions - conversionMetrics.converters) / conversionMetrics.converters
        : 0;

      // Generate opportunities
      const opportunities = [];
      if (conversionRate < 0.05) {
        opportunities.push({
          type: 'improve_conversion_rate',
          current: conversionRate,
          target: 0.1,
          tactics: [
            'Optimize pricing page',
            'Add social proof',
            'Reduce checkout friction',
            'Offer time-limited promotions'
          ]
        });
      }

      if (repeatRate < 0.3) {
        opportunities.push({
          type: 'increase_repeat_purchases',
          current: repeatRate,
          target: 0.5,
          tactics: [
            'Implement subscription model',
            'Create loyalty program',
            'Offer bundle deals',
            'Send personalized recommendations'
          ]
        });
      }

      return {
        type: 'monetization',
        health_score: this.calculateHealthScore(conversionRate * 100, 'monetization'),
        metrics: {
          conversion_rate: conversionRate,
          repeat_purchase_rate: repeatRate,
          avg_days_to_conversion: conversionMetrics.avg_days_to_conversion || 0
        },
        status: conversionRate >= 0.05 ? 'healthy' : 'needs_improvement',
        opportunities
      };
    } catch (error) {
      console.error('Error detecting monetization loops:', error);
      return this.getDefaultLoop('monetization');
    }
  }

  /**
   * Calculate health score (0-100)
   */
  calculateHealthScore(value, loopType) {
    switch (loopType) {
      case 'viral':
        // K-factor of 1 = 100, 0.5 = 75, 0.25 = 50, 0 = 0
        return Math.min(100, value * 100);

      case 'retention':
        // D7 retention: 0.5 = 100, 0.3 = 60, 0.1 = 20
        return Math.min(100, value * 200);

      case 'engagement':
        // DAU/MAU: 0.3 = 100, 0.2 = 66, 0.1 = 33
        return Math.min(100, value * 333);

      case 'monetization':
        // Conversion rate: 10% = 100, 5% = 50, 1% = 10
        return Math.min(100, value * 10);

      default:
        return 50;
    }
  }

  /**
   * Get default loop structure
   */
  getDefaultLoop(type) {
    return {
      type,
      health_score: 0,
      metrics: {},
      status: 'unknown',
      opportunities: []
    };
  }
}

module.exports = GrowthLoopDetector;
