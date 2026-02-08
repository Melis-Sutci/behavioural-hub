/**
 * RFM Analysis Engine
 *
 * Performs Recency, Frequency, Monetary analysis
 * to segment users based on their behavior.
 *
 * RFM Model:
 * - Recency: How recently did the user engage?
 * - Frequency: How often do they engage?
 * - Monetary: How much value do they bring?
 */

const { percentile } = require('../../utils/helpers');

class RFMAnalysisEngine {
  constructor(db) {
    this.db = db;
  }

  /**
   * Perform RFM analysis
   */
  async performRFMAnalysis() {
    console.log('📊 Performing RFM analysis...');

    try {
      // 1. Calculate RFM scores for all users
      const rfmData = await this.calculateRFMScores();

      // 2. Segment users based on RFM cells
      const segments = this.segmentByRFM(rfmData);

      console.log(`✅ RFM analysis complete. Found ${Object.keys(segments).length} segments`);
      return segments;
    } catch (error) {
      console.error('❌ Error in RFM analysis:', error);
      return {};
    }
  }

  /**
   * Calculate RFM scores for all users
   */
  async calculateRFMScores() {
    const users = this.db.all(`
      SELECT
        user_id,
        julianday('now') - julianday(MAX(created_at)) as recency_days,
        COUNT(DISTINCT session_id) as frequency,
        COUNT(CASE WHEN event_type = 'conversion' THEN 1 END) as monetary
      FROM events
      WHERE created_at >= date('now', '-90 days')
      GROUP BY user_id
      HAVING frequency > 0
    `);

    if (users.length === 0) {
      return [];
    }

    // Calculate percentiles for scoring
    const recencies = users.map(u => u.recency_days);
    const frequencies = users.map(u => u.frequency);
    const monetaries = users.map(u => u.monetary);

    const recencyQuintiles = this.calculateQuintiles(recencies);
    const frequencyQuintiles = this.calculateQuintiles(frequencies);
    const monetaryQuintiles = this.calculateQuintiles(monetaries);

    // Assign scores (1-5)
    const scored = users.map(user => ({
      user_id: user.user_id,
      recency: user.recency_days,
      frequency: user.frequency,
      monetary: user.monetary,
      r_score: this.scoreRecency(user.recency_days, recencyQuintiles),
      f_score: this.scoreFrequency(user.frequency, frequencyQuintiles),
      m_score: this.scoreMonetary(user.monetary, monetaryQuintiles),
      rfm_cell: null
    }));

    // Create RFM cell (e.g., "555" for best customers)
    scored.forEach(user => {
      user.rfm_cell = `${user.r_score}${user.f_score}${user.m_score}`;
    });

    return scored;
  }

  /**
   * Calculate quintiles (20th, 40th, 60th, 80th percentiles)
   */
  calculateQuintiles(data) {
    return {
      q1: percentile(data, 20),
      q2: percentile(data, 40),
      q3: percentile(data, 60),
      q4: percentile(data, 80)
    };
  }

  /**
   * Score recency (lower is better)
   */
  scoreRecency(days, quintiles) {
    if (days <= quintiles.q1) return 5;
    if (days <= quintiles.q2) return 4;
    if (days <= quintiles.q3) return 3;
    if (days <= quintiles.q4) return 2;
    return 1;
  }

  /**
   * Score frequency (higher is better)
   */
  scoreFrequency(sessions, quintiles) {
    if (sessions >= quintiles.q4) return 5;
    if (sessions >= quintiles.q3) return 4;
    if (sessions >= quintiles.q2) return 3;
    if (sessions >= quintiles.q1) return 2;
    return 1;
  }

  /**
   * Score monetary (higher is better)
   */
  scoreMonetary(conversions, quintiles) {
    if (conversions >= quintiles.q4) return 5;
    if (conversions >= quintiles.q3) return 4;
    if (conversions >= quintiles.q2) return 3;
    if (conversions >= quintiles.q1) return 2;
    return 1;
  }

  /**
   * Segment users based on RFM scores
   */
  segmentByRFM(rfmData) {
    const segments = {
      Champions: [],
      'Loyal Customers': [],
      'Potential Loyalists': [],
      'Recent Customers': [],
      'Promising': [],
      'Customers Needing Attention': [],
      'About to Sleep': [],
      'At Risk': [],
      'Cannot Lose Them': [],
      Hibernating: [],
      Lost: []
    };

    for (const user of rfmData) {
      const { r_score, f_score, m_score } = user;

      // Segmentation rules
      if (r_score >= 4 && f_score >= 4 && m_score >= 4) {
        segments['Champions'].push(user);
      } else if (r_score >= 3 && f_score >= 4 && m_score >= 4) {
        segments['Loyal Customers'].push(user);
      } else if (r_score >= 4 && f_score <= 3 && m_score <= 3) {
        segments['Recent Customers'].push(user);
      } else if (r_score >= 4 && f_score <= 3 && m_score >= 3) {
        segments['Potential Loyalists'].push(user);
      } else if (r_score >= 3 && f_score <= 3 && m_score <= 3) {
        segments['Promising'].push(user);
      } else if (r_score <= 2 && f_score >= 3 && m_score >= 3) {
        segments['Cannot Lose Them'].push(user);
      } else if (r_score <= 2 && f_score >= 3 && m_score <= 2) {
        segments['At Risk'].push(user);
      } else if (r_score <= 2 && f_score <= 2 && m_score >= 3) {
        segments['Hibernating'].push(user);
      } else if (r_score === 1 && f_score <= 2 && m_score <= 2) {
        segments['Lost'].push(user);
      } else if (r_score >= 2 && r_score <= 3 && f_score <= 2 && m_score <= 2) {
        segments['About to Sleep'].push(user);
      } else {
        segments['Customers Needing Attention'].push(user);
      }
    }

    // Add segment characteristics
    return Object.entries(segments).map(([name, users]) => ({
      name,
      user_count: users.length,
      users: users.map(u => u.user_id),
      avg_recency: users.length > 0 ? users.reduce((sum, u) => sum + u.recency, 0) / users.length : 0,
      avg_frequency: users.length > 0 ? users.reduce((sum, u) => sum + u.frequency, 0) / users.length : 0,
      avg_monetary: users.length > 0 ? users.reduce((sum, u) => sum + u.monetary, 0) / users.length : 0,
      description: this.getSegmentDescription(name),
      recommended_actions: this.getRecommendedActions(name)
    })).filter(segment => segment.user_count > 0);
  }

  /**
   * Get description for RFM segment
   */
  getSegmentDescription(segmentName) {
    const descriptions = {
      'Champions': 'Best customers. Bought recently, buy often, and spend the most.',
      'Loyal Customers': 'Buy regularly. Responsive to promotions.',
      'Potential Loyalists': 'Recent customers with average frequency. Potential to become loyal.',
      'Recent Customers': 'Bought recently but not frequently yet.',
      'Promising': 'Recent shoppers but haven\'t spent much yet.',
      'Customers Needing Attention': 'Above average recency, frequency, and monetary. May not buy as often.',
      'About to Sleep': 'Below average recency and frequency. Will lose them if not reactivated.',
      'At Risk': 'Spent big money and purchased often but long time ago. Need to bring them back!',
      'Cannot Lose Them': 'Made big purchases and often but long time ago. Bring them back!',
      'Hibernating': 'Last purchase was long back, low spenders, and low number of orders.',
      'Lost': 'Lowest recency, frequency, and monetary scores. Lost customers.'
    };

    return descriptions[segmentName] || 'User segment based on RFM analysis.';
  }

  /**
   * Get recommended actions for segment
   */
  getRecommendedActions(segmentName) {
    const actions = {
      'Champions': [
        'Reward with exclusive offers',
        'Ask for reviews and referrals',
        'Engage with new products',
        'Make them brand ambassadors'
      ],
      'Loyal Customers': [
        'Upsell higher value products',
        'Ask for reviews',
        'Engage on social media',
        'Offer loyalty rewards'
      ],
      'Potential Loyalists': [
        'Offer membership program',
        'Recommend relevant products',
        'Keep engaged with content',
        'Offer free shipping on next order'
      ],
      'Recent Customers': [
        'Provide onboarding support',
        'Start building relationship',
        'Offer product recommendations',
        'Send educational content'
      ],
      'Promising': [
        'Create brand awareness',
        'Offer free trials',
        'Provide special offers',
        'Engage with content marketing'
      ],
      'Customers Needing Attention': [
        'Make limited time offers',
        'Recommend based on past purchases',
        'Reactivate with promotions',
        'Share valuable content'
      ],
      'About to Sleep': [
        'Win them back with renewals or newer products',
        'Send personalized reactivation emails',
        'Offer special discounts',
        'Survey why they stopped'
      ],
      'At Risk': [
        'Send personalized emails',
        'Offer special deals',
        'Provide helpful resources',
        'Win back campaign'
      ],
      'Cannot Lose Them': [
        'Win them back via renewals',
        'Provide helpful resources',
        'Recognize their contribution',
        'Personalized reactivation campaign'
      ],
      'Hibernating': [
        'Offer other product categories',
        'Special promotions',
        'Recreate brand value',
        'Survey for feedback'
      ],
      'Lost': [
        'Revive interest with new products',
        'Ignore or minimal marketing spend',
        'Win-back campaign with aggressive offers',
        'Survey for product/service improvement'
      ]
    };

    return actions[segmentName] || ['Monitor behavior', 'Engage with targeted content'];
  }
}

module.exports = RFMAnalysisEngine;
