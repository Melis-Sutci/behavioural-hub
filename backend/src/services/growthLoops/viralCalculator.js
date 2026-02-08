/**
 * Viral Coefficient Calculator
 *
 * Calculates viral growth metrics:
 * - K-factor
 * - Viral coefficient
 * - Viral cycle time
 * - Growth rate
 */

class ViralCoefficientCalculator {
  constructor(db) {
    this.db = db;
  }

  /**
   * Calculate all viral metrics
   */
  async calculateMetrics() {
    console.log('📈 Calculating viral metrics...');

    try {
      // Get referral/invitation data
      const metrics = this.db.get(`
        SELECT
          COUNT(DISTINCT user_id) as total_users,
          COUNT(DISTINCT CASE WHEN invited_users > 0 THEN user_id END) as inviters,
          SUM(invited_users) as total_invites,
          SUM(accepted_invites) as accepted_invites,
          AVG(CASE
            WHEN accepted_invites > 0 THEN days_to_accept
          END) as avg_cycle_time_days
        FROM (
          SELECT
            e1.user_id,
            COUNT(DISTINCT e2.user_id) as invited_users,
            COUNT(DISTINCT CASE
              WHEN e2.event_type = 'signup_from_invite' THEN e2.user_id
            END) as accepted_invites,
            AVG(CASE
              WHEN e2.event_type = 'signup_from_invite'
              THEN julianday(e2.created_at) - julianday(e1.created_at)
            END) as days_to_accept
          FROM events e1
          LEFT JOIN events e2 ON e2.referrer_id = e1.user_id
            AND e2.created_at > e1.created_at
          WHERE e1.created_at >= date('now', '-30 days')
          GROUP BY e1.user_id
        )
      `);

      if (!metrics || metrics.total_users === 0) {
        return this.getDefaultMetrics();
      }

      // Calculate metrics
      const invitesPerUser = metrics.inviters > 0
        ? metrics.total_invites / metrics.inviters
        : 0;

      const conversionRate = metrics.total_invites > 0
        ? metrics.accepted_invites / metrics.total_invites
        : 0;

      const kFactor = invitesPerUser * conversionRate;
      const viralCycleTime = metrics.avg_cycle_time_days || 0;
      const monthlyGrowthRate = this.calculateGrowthRate(kFactor, viralCycleTime);
      const health = this.assessViralHealth(kFactor);

      console.log(`✅ K-factor: ${kFactor.toFixed(3)}, Health: ${health}`);

      return {
        k_factor: kFactor,
        invites_per_user: invitesPerUser,
        invite_conversion_rate: conversionRate,
        viral_cycle_time_days: viralCycleTime,
        monthly_growth_rate: monthlyGrowthRate,
        health,
        metrics: {
          total_users: metrics.total_users,
          total_inviters: metrics.inviters,
          total_invites: metrics.total_invites,
          accepted_invites: metrics.accepted_invites
        }
      };
    } catch (error) {
      console.error('❌ Error calculating viral metrics:', error);
      return this.getDefaultMetrics();
    }
  }

  /**
   * Calculate monthly growth rate from K-factor and cycle time
   */
  calculateGrowthRate(kFactor, cycleTimeDays) {
    if (cycleTimeDays === 0 || kFactor <= 0) return 0;

    // Compound growth formula
    const cyclesPerMonth = 30 / cycleTimeDays;
    const growthRate = Math.pow(1 + kFactor, cyclesPerMonth) - 1;
    return growthRate * 100; // Percentage
  }

  /**
   * Assess viral health based on K-factor
   */
  assessViralHealth(kFactor) {
    if (kFactor >= 1) return 'excellent'; // Exponential growth
    if (kFactor >= 0.5) return 'good'; // Strong viral potential
    if (kFactor >= 0.25) return 'moderate'; // Some virality
    return 'weak'; // Needs improvement
  }

  /**
   * Suggest optimizations to improve viral coefficient
   */
  async suggestViralOptimizations(metrics) {
    const suggestions = [];

    // Suggestion 1: Increase invite rate
    if (metrics.invites_per_user < 1) {
      suggestions.push({
        type: 'increase_invite_rate',
        priority: 'high',
        current: metrics.invites_per_user,
        target: 2,
        impact: 'Would improve K-factor by up to 2x',
        tactics: [
          'Add invite CTA in more places',
          'Incentivize invitations (referral rewards)',
          'Make sharing easier (one-click share)',
          'Use social proof (show who else invited)'
        ]
      });
    }

    // Suggestion 2: Improve conversion rate
    if (metrics.invite_conversion_rate < 0.3) {
      suggestions.push({
        type: 'improve_conversion',
        priority: 'high',
        current: metrics.invite_conversion_rate,
        target: 0.4,
        impact: `Would improve K-factor by ${((0.4 / metrics.invite_conversion_rate - 1) * 100).toFixed(0)}%`,
        tactics: [
          'Improve landing page for invited users',
          'Personalize invite messages',
          'Reduce friction in signup',
          'Add social proof and trust signals'
        ]
      });
    }

    // Suggestion 3: Reduce cycle time
    if (metrics.viral_cycle_time_days > 7) {
      suggestions.push({
        type: 'reduce_cycle_time',
        priority: 'medium',
        current: metrics.viral_cycle_time_days,
        target: 3,
        impact: 'Would accelerate viral growth by 2-3x',
        tactics: [
          'Onboard users faster',
          'Trigger invite prompts earlier',
          'Use push notifications',
          'Gamify invitations'
        ]
      });
    }

    // Suggestion 4: Increase inviter ratio
    const inviterRatio = metrics.metrics.total_inviters / metrics.metrics.total_users;
    if (inviterRatio < 0.2) {
      suggestions.push({
        type: 'increase_inviter_participation',
        priority: 'medium',
        current: inviterRatio,
        target: 0.4,
        impact: 'Would double viral reach',
        tactics: [
          'Make invite feature more prominent',
          'Offer rewards for first invite',
          'Explain benefits of inviting',
          'Show success stories from referrers'
        ]
      });
    }

    return suggestions;
  }

  /**
   * Get default metrics (when no data available)
   */
  getDefaultMetrics() {
    return {
      k_factor: 0,
      invites_per_user: 0,
      invite_conversion_rate: 0,
      viral_cycle_time_days: 0,
      monthly_growth_rate: 0,
      health: 'unknown',
      metrics: {
        total_users: 0,
        total_inviters: 0,
        total_invites: 0,
        accepted_invites: 0
      }
    };
  }
}

module.exports = ViralCoefficientCalculator;
