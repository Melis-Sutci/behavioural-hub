/**
 * Lifetime Value (LTV) Predictor
 *
 * Predicts the lifetime value of users based on:
 * - Historical spending patterns
 * - Engagement metrics
 * - Cohort benchmarks
 *
 * Uses historical data and cohort analysis for prediction
 */

const { mean } = require('../../utils/helpers');

class LTVPredictor {
  constructor(db) {
    this.db = db;
  }

  /**
   * Predict LTV for a user
   */
  async predictLTV(userId) {
    try {
      // Extract features
      const features = await this.extractFeatures(userId);

      if (!features) {
        return {
          user_id: userId,
          predicted_ltv: 0,
          confidence: 'low',
          reason: 'Insufficient data'
        };
      }

      // Calculate predicted LTV
      const prediction = this.calculatePredictedLTV(features);

      // Calculate growth potential
      const growthPotential = await this.calculateGrowthPotential(userId, prediction);

      return {
        user_id: userId,
        predicted_ltv: prediction.value,
        confidence_interval: prediction.confidence,
        ltv_segment: this.getLTVSegment(prediction.value),
        current_value: features.current_ltv,
        growth_potential: growthPotential,
        features
      };
    } catch (error) {
      console.error(`Error predicting LTV for user ${userId}:`, error);
      return {
        user_id: userId,
        predicted_ltv: 0,
        error: error.message
      };
    }
  }

  /**
   * Extract features for LTV prediction
   */
  async extractFeatures(userId) {
    const userMetrics = this.db.get(`
      SELECT
        user_id,
        COUNT(CASE WHEN event_type = 'conversion' THEN 1 END) as total_conversions,
        COUNT(DISTINCT DATE(created_at)) as active_days,
        julianday('now') - julianday(MIN(created_at)) as days_since_signup,
        COUNT(DISTINCT session_id) as total_sessions,
        COUNT(DISTINCT event_type) as feature_diversity
      FROM events
      WHERE user_id = ?
      GROUP BY user_id
    `, [userId]);

    if (!userMetrics || !userMetrics.user_id) {
      return null;
    }

    // Calculate current LTV (simplified - assume $50 per conversion)
    const currentLTV = userMetrics.total_conversions * 50;

    // Calculate average order value (simplified)
    const avgOrderValue = userMetrics.total_conversions > 0 ? currentLTV / userMetrics.total_conversions : 0;

    // Calculate engagement score
    const engagementScore = userMetrics.days_since_signup > 0
      ? (userMetrics.total_sessions / userMetrics.days_since_signup) * 10
      : 0;

    // Get cohort information
    const cohortLTV = await this.getCohortAverageLTV(userMetrics.days_since_signup);

    return {
      user_id: userId,
      current_ltv: currentLTV,
      total_conversions: userMetrics.total_conversions,
      days_since_signup: userMetrics.days_since_signup,
      active_days: userMetrics.active_days,
      total_sessions: userMetrics.total_sessions,
      feature_diversity: userMetrics.feature_diversity,
      avg_order_value: avgOrderValue,
      engagement_score: engagementScore,
      cohort_avg_ltv: cohortLTV
    };
  }

  /**
   * Get average LTV for similar cohort
   */
  async getCohortAverageLTV(daysSinceSignup) {
    // Find users with similar tenure (±30 days)
    const cohort = this.db.get(`
      SELECT
        AVG(conversion_count * 50) as avg_ltv
      FROM (
        SELECT
          user_id,
          COUNT(CASE WHEN event_type = 'conversion' THEN 1 END) as conversion_count,
          julianday('now') - julianday(MIN(created_at)) as tenure
        FROM events
        GROUP BY user_id
        HAVING tenure BETWEEN ? AND ?
      )
    `, [daysSinceSignup - 30, daysSinceSignup + 30]);

    return cohort?.avg_ltv || 100; // Default to $100 if no data
  }

  /**
   * Calculate predicted LTV
   */
  calculatePredictedLTV(features) {
    let predictedLTV = features.current_ltv;

    // Factor 1: Engagement-based projection
    // Higher engagement = higher future LTV
    const engagementMultiplier = 1 + (features.engagement_score / 10);
    predictedLTV *= engagementMultiplier;

    // Factor 2: Feature diversity
    // More features used = higher retention = higher LTV
    const diversityBonus = features.feature_diversity * 10;
    predictedLTV += diversityBonus;

    // Factor 3: Cohort benchmark
    // If user is below cohort average, pull towards average
    if (predictedLTV < features.cohort_avg_ltv) {
      const gap = features.cohort_avg_ltv - predictedLTV;
      predictedLTV += gap * 0.3; // Close 30% of the gap
    }

    // Factor 4: Time-based projection
    // Assume some growth over time
    const monthsSinceSignup = features.days_since_signup / 30;
    if (monthsSinceSignup < 12) {
      // Early users have more growth potential
      const growthFactor = 1 + ((12 - monthsSinceSignup) / 12) * 0.5;
      predictedLTV *= growthFactor;
    }

    // Calculate confidence interval (±20%)
    const confidence = {
      lower: predictedLTV * 0.8,
      upper: predictedLTV * 1.2,
      level: 0.80
    };

    return {
      value: Math.round(predictedLTV),
      confidence
    };
  }

  /**
   * Get LTV segment
   */
  getLTVSegment(ltv) {
    if (ltv > 1000) return 'whale';
    if (ltv > 500) return 'high_value';
    if (ltv > 100) return 'medium_value';
    return 'low_value';
  }

  /**
   * Calculate growth potential
   */
  async calculateGrowthPotential(userId, prediction) {
    const currentLTV = this.db.get(`
      SELECT COUNT(CASE WHEN event_type = 'conversion' THEN 1 END) * 50 as ltv
      FROM events
      WHERE user_id = ?
    `, [userId]);

    const current = currentLTV?.ltv || 0;
    const potential = prediction.value - current;

    // Get actions that could unlock this potential
    const actions = await this.getGrowthActions(userId, potential);

    return {
      current_ltv: current,
      predicted_ltv: prediction.value,
      growth_potential: potential,
      growth_percentage: current > 0 ? (potential / current) * 100 : 0,
      actions_to_unlock: actions
    };
  }

  /**
   * Get actions to unlock growth potential
   */
  async getGrowthActions(userId, potential) {
    if (potential < 50) {
      return [];
    }

    const actions = [];

    // Check feature usage
    const features = this.db.get(`
      SELECT COUNT(DISTINCT event_type) as feature_count
      FROM events
      WHERE user_id = ?
    `, [userId]);

    if (features.feature_count < 5) {
      actions.push({
        type: 'feature_adoption',
        title: 'Increase Feature Usage',
        description: 'Encourage user to try unused features',
        expected_ltv_increase: potential * 0.3
      });
    }

    // Check conversion frequency
    const lastConversion = this.db.get(`
      SELECT julianday('now') - julianday(MAX(created_at)) as days_since
      FROM events
      WHERE user_id = ? AND event_type = 'conversion'
    `, [userId]);

    if (lastConversion && lastConversion.days_since > 30) {
      actions.push({
        type: 'reactivate_purchases',
        title: 'Reactivate Purchasing',
        description: 'Send targeted offers to encourage repeat purchase',
        expected_ltv_increase: potential * 0.4
      });
    }

    // Upsell opportunities
    actions.push({
      type: 'upsell_premium',
      title: 'Upgrade to Premium',
      description: 'Offer premium tier with higher value',
      expected_ltv_increase: potential * 0.5
    });

    return actions;
  }

  /**
   * Batch predict LTV for all users
   */
  async predictForAllUsers() {
    console.log('💰 Predicting LTV for all users...');

    const allUsers = this.db.all(`
      SELECT DISTINCT user_id
      FROM events
    `);

    const predictions = [];
    for (const { user_id } of allUsers) {
      const prediction = await this.predictLTV(user_id);
      predictions.push(prediction);
    }

    console.log(`✅ Predicted LTV for ${predictions.length} users`);
    return predictions;
  }

  /**
   * Get LTV segments summary
   */
  async getLTVSegmentsSummary() {
    const predictions = await this.predictForAllUsers();

    const summary = {
      whale: predictions.filter(p => p.ltv_segment === 'whale'),
      high_value: predictions.filter(p => p.ltv_segment === 'high_value'),
      medium_value: predictions.filter(p => p.ltv_segment === 'medium_value'),
      low_value: predictions.filter(p => p.ltv_segment === 'low_value')
    };

    return {
      whale: {
        count: summary.whale.length,
        total_ltv: summary.whale.reduce((sum, p) => sum + p.predicted_ltv, 0),
        avg_ltv: summary.whale.length > 0 ? mean(summary.whale.map(p => p.predicted_ltv)) : 0
      },
      high_value: {
        count: summary.high_value.length,
        total_ltv: summary.high_value.reduce((sum, p) => sum + p.predicted_ltv, 0),
        avg_ltv: summary.high_value.length > 0 ? mean(summary.high_value.map(p => p.predicted_ltv)) : 0
      },
      medium_value: {
        count: summary.medium_value.length,
        total_ltv: summary.medium_value.reduce((sum, p) => sum + p.predicted_ltv, 0),
        avg_ltv: summary.medium_value.length > 0 ? mean(summary.medium_value.map(p => p.predicted_ltv)) : 0
      },
      low_value: {
        count: summary.low_value.length,
        total_ltv: summary.low_value.reduce((sum, p) => sum + p.predicted_ltv, 0),
        avg_ltv: summary.low_value.length > 0 ? mean(summary.low_value.map(p => p.predicted_ltv)) : 0
      }
    };
  }
}

module.exports = LTVPredictor;
