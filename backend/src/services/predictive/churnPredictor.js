/**
 * Churn Prediction Model
 *
 * Predicts which users are at risk of churning based on:
 * - Recency (days since last visit)
 * - Frequency (engagement frequency)
 * - Feature usage
 * - Engagement trend
 *
 * Uses a simple scoring model (can be replaced with ML model later)
 */

const { mean, standardDeviation } = require('../../utils/helpers');

class ChurnPredictor {
  constructor(db) {
    this.db = db;
  }

  /**
   * Predict churn risk for a user
   */
  async predictChurnRisk(userId) {
    try {
      // Extract features
      const features = await this.extractFeatures(userId);

      if (!features) {
        return {
          user_id: userId,
          churn_probability: 0,
          risk_level: 'unknown',
          reason: 'Insufficient data'
        };
      }

      // Calculate churn probability using weighted scoring
      const probability = this.calculateChurnProbability(features);
      const riskLevel = this.getRiskLevel(probability);
      const contributingFactors = this.analyzeContributingFactors(features);
      const recommendedActions = await this.getRetentionActions(features, contributingFactors);

      return {
        user_id: userId,
        churn_probability: probability,
        risk_level: riskLevel,
        contributing_factors: contributingFactors,
        recommended_actions: recommendedActions,
        features
      };
    } catch (error) {
      console.error(`Error predicting churn for user ${userId}:`, error);
      return {
        user_id: userId,
        churn_probability: 0,
        risk_level: 'error',
        error: error.message
      };
    }
  }

  /**
   * Extract features for churn prediction
   */
  async extractFeatures(userId) {
    const userMetrics = this.db.get(`
      SELECT
        user_id,
        julianday('now') - julianday(MAX(created_at)) as days_since_last_visit,
        COUNT(DISTINCT DATE(created_at)) as active_days_last_30,
        COUNT(DISTINCT session_id) as sessions_last_30,
        AVG(CASE
          WHEN session_id IS NOT NULL
          THEN (SELECT COUNT(*) FROM events e2 WHERE e2.session_id = events.session_id)
        END) as avg_session_length,
        COUNT(DISTINCT event_type) as feature_diversity,
        COUNT(CASE WHEN event_type = 'conversion' THEN 1 END) as conversions_last_30
      FROM events
      WHERE user_id = ?
      AND created_at >= date('now', '-30 days')
    `, [userId]);

    if (!userMetrics || !userMetrics.user_id) {
      return null;
    }

    // Calculate engagement trend (last 7 days vs previous 7 days)
    const engagementTrend = await this.calculateEngagementTrend(userId);

    return {
      recency: userMetrics.days_since_last_visit || 0,
      frequency: userMetrics.active_days_last_30 || 0,
      avg_session_length: userMetrics.avg_session_length || 0,
      feature_diversity: userMetrics.feature_diversity || 0,
      conversions: userMetrics.conversions_last_30 || 0,
      sessions: userMetrics.sessions_last_30 || 0,
      engagement_trend: engagementTrend
    };
  }

  /**
   * Calculate engagement trend
   */
  async calculateEngagementTrend(userId) {
    const last7Days = this.db.get(`
      SELECT COUNT(*) as events
      FROM events
      WHERE user_id = ?
      AND created_at >= date('now', '-7 days')
    `, [userId]);

    const previous7Days = this.db.get(`
      SELECT COUNT(*) as events
      FROM events
      WHERE user_id = ?
      AND created_at >= date('now', '-14 days')
      AND created_at < date('now', '-7 days')
    `, [userId]);

    const last = last7Days?.events || 0;
    const prev = previous7Days?.events || 1; // Avoid division by zero

    return (last - prev) / prev; // Percentage change
  }

  /**
   * Calculate churn probability using weighted features
   */
  calculateChurnProbability(features) {
    let score = 0;

    // Recency (weight: 0.35) - More recent = lower churn risk
    if (features.recency > 14) {
      score += 0.35;
    } else if (features.recency > 7) {
      score += 0.20;
    } else if (features.recency > 3) {
      score += 0.10;
    }

    // Frequency (weight: 0.25) - More active days = lower churn risk
    if (features.frequency < 3) {
      score += 0.25;
    } else if (features.frequency < 7) {
      score += 0.15;
    } else if (features.frequency < 15) {
      score += 0.05;
    }

    // Engagement trend (weight: 0.20) - Declining = higher churn risk
    if (features.engagement_trend < -0.5) {
      score += 0.20;
    } else if (features.engagement_trend < -0.2) {
      score += 0.10;
    } else if (features.engagement_trend < 0) {
      score += 0.05;
    }

    // Feature diversity (weight: 0.10) - Low diversity = higher churn risk
    if (features.feature_diversity < 2) {
      score += 0.10;
    } else if (features.feature_diversity < 4) {
      score += 0.05;
    }

    // Conversions (weight: 0.10) - No conversions = higher churn risk
    if (features.conversions === 0) {
      score += 0.10;
    } else if (features.conversions < 2) {
      score += 0.05;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Get risk level from probability
   */
  getRiskLevel(probability) {
    if (probability > 0.7) return 'critical';
    if (probability > 0.5) return 'high';
    if (probability > 0.3) return 'medium';
    return 'low';
  }

  /**
   * Analyze which factors contribute most to churn risk
   */
  analyzeContributingFactors(features) {
    const factors = {};

    // Recency contribution
    if (features.recency > 14) {
      factors.recency = 0.8;
    } else if (features.recency > 7) {
      factors.recency = 0.5;
    } else {
      factors.recency = 0.2;
    }

    // Engagement trend contribution
    if (features.engagement_trend < -0.5) {
      factors.engagement_trend = 0.9;
    } else if (features.engagement_trend < 0) {
      factors.engagement_trend = 0.4;
    } else {
      factors.engagement_trend = 0.1;
    }

    // Feature diversity contribution
    if (features.feature_diversity < 2) {
      factors.feature_diversity = 0.7;
    } else if (features.feature_diversity < 4) {
      factors.feature_diversity = 0.3;
    } else {
      factors.feature_diversity = 0.1;
    }

    // Frequency contribution
    if (features.frequency < 3) {
      factors.frequency = 0.8;
    } else if (features.frequency < 7) {
      factors.frequency = 0.4;
    } else {
      factors.frequency = 0.1;
    }

    return factors;
  }

  /**
   * Get retention actions based on features and factors
   */
  async getRetentionActions(features, contributingFactors) {
    const actions = [];

    // Action 1: Re-engagement based on recency
    if (contributingFactors.recency > 0.5) {
      actions.push({
        type: 'send_reengagement_email',
        priority: 'high',
        title: 'Win-back Campaign',
        description: 'Send personalized re-engagement email',
        message: 'We miss you! Come back and see what\'s new',
        expected_impact: 0.25
      });
    }

    // Action 2: Feature education
    if (contributingFactors.feature_diversity > 0.5) {
      actions.push({
        type: 'feature_education',
        priority: 'medium',
        title: 'Feature Discovery',
        description: 'Educate user on underutilized features',
        message: 'Discover features you haven\'t tried yet',
        expected_impact: 0.20
      });
    }

    // Action 3: Incentive for declining engagement
    if (contributingFactors.engagement_trend > 0.7) {
      actions.push({
        type: 'offer_incentive',
        priority: 'high',
        title: 'Special Offer',
        description: 'Provide discount or bonus to re-engage',
        message: 'Special offer just for you - 20% off!',
        expected_impact: 0.30
      });
    }

    // Action 4: Personalized outreach for high-value at-risk users
    if (features.conversions > 0 && contributingFactors.recency > 0.6) {
      actions.push({
        type: 'personal_outreach',
        priority: 'critical',
        title: 'Personal Check-in',
        description: 'Personal email or call from account manager',
        message: 'We value your business - let\'s chat',
        expected_impact: 0.35
      });
    }

    // Action 5: Push notification for moderately at-risk users
    if (features.recency >= 3 && features.recency <= 7) {
      actions.push({
        type: 'push_notification',
        priority: 'medium',
        title: 'Gentle Reminder',
        description: 'Send push notification with relevant content',
        message: 'Check out what\'s trending today',
        expected_impact: 0.15
      });
    }

    return actions;
  }

  /**
   * Batch predict churn for all active users
   */
  async predictForAllUsers() {
    console.log('🔮 Predicting churn for all active users...');

    const activeUsers = this.db.all(`
      SELECT DISTINCT user_id
      FROM events
      WHERE created_at >= date('now', '-30 days')
    `);

    const predictions = [];
    for (const { user_id } of activeUsers) {
      const prediction = await this.predictChurnRisk(user_id);
      predictions.push(prediction);
    }

    console.log(`✅ Predicted churn for ${predictions.length} users`);
    return predictions;
  }
}

module.exports = ChurnPredictor;
