/**
 * Behavioral Clustering Engine
 *
 * Uses K-means clustering to automatically detect user segments
 * based on behavioral features.
 */

const kmeans = require('ml-kmeans');
const { mean, standardDeviation, normalize } = require('../../utils/helpers');

class BehavioralClusteringEngine {
  constructor(db) {
    this.db = db;
  }

  /**
   * Detect segments using K-means clustering
   */
  async detectSegments(lookbackDays = 30) {
    console.log(`🔍 Detecting segments from last ${lookbackDays} days of data...`);

    try {
      // 1. Extract user features
      const userFeatures = await this.extractUserFeatures(lookbackDays);

      if (userFeatures.length < 10) {
        console.warn('⚠️  Not enough users for clustering (need at least 10)');
        return [];
      }

      // 2. Perform clustering
      const clusters = await this.performClustering(userFeatures);

      // 3. Analyze each cluster
      const segments = [];
      for (let i = 0; i < clusters.clusters.length; i++) {
        const clusterMembers = userFeatures.filter((_, idx) => clusters.clusters[idx] === i);

        if (clusterMembers.length < 3) continue; // Skip tiny clusters

        const characteristics = this.analyzeCluster(clusterMembers);
        const name = this.generateSegmentName(characteristics);

        segments.push({
          cluster_id: i,
          name,
          description: characteristics.description,
          user_count: clusterMembers.length,
          avg_lifetime_value: characteristics.ltv,
          avg_conversion_rate: characteristics.conversionRate,
          behavioral_patterns: characteristics.patterns,
          traits: characteristics.traits,
          members: clusterMembers.map(u => u.user_id)
        });
      }

      console.log(`✅ Detected ${segments.length} segments`);
      return segments;
    } catch (error) {
      console.error('❌ Error detecting segments:', error);
      return [];
    }
  }

  /**
   * Extract behavioral features for each user
   */
  async extractUserFeatures(lookbackDays) {
    const users = this.db.all(`
      SELECT
        e.user_id,
        COUNT(DISTINCT e.session_id) as total_sessions,
        AVG(CASE
          WHEN e.session_id IS NOT NULL
          THEN (SELECT COUNT(*) FROM events e2 WHERE e2.session_id = e.session_id)
        END) as avg_session_length,
        COUNT(*) as total_events,
        COUNT(DISTINCT e.event_type) as event_type_diversity,
        COUNT(CASE WHEN e.event_type = 'conversion' THEN 1 END) as conversions,
        julianday('now') - julianday(MIN(e.created_at)) as days_since_first_visit,
        julianday('now') - julianday(MAX(e.created_at)) as days_since_last_visit,
        COUNT(DISTINCT DATE(e.created_at)) as active_days
      FROM events e
      WHERE e.created_at >= date('now', '-${lookbackDays} days')
      GROUP BY e.user_id
      HAVING total_events >= 3
    `);

    return users.map(u => ({
      user_id: u.user_id,
      total_sessions: u.total_sessions || 0,
      avg_session_length: u.avg_session_length || 0,
      total_events: u.total_events || 0,
      event_type_diversity: u.event_type_diversity || 0,
      conversions: u.conversions || 0,
      days_since_first_visit: u.days_since_first_visit || 0,
      days_since_last_visit: u.days_since_last_visit || 0,
      active_days: u.active_days || 0,
      conversion_rate: u.total_sessions > 0 ? (u.conversions / u.total_sessions) : 0,
      engagement_score: (u.total_events / Math.max(u.days_since_first_visit, 1))
    }));
  }

  /**
   * Perform K-means clustering
   */
  async performClustering(userFeatures) {
    // Feature columns for clustering
    const featureKeys = [
      'total_sessions',
      'avg_session_length',
      'event_type_diversity',
      'conversion_rate',
      'days_since_last_visit',
      'engagement_score'
    ];

    // Extract feature matrix
    const data = userFeatures.map(user =>
      featureKeys.map(key => user[key])
    );

    // Normalize features (Z-score normalization)
    const normalized = this.normalizeFeatures(data);

    // Find optimal K using elbow method
    const optimalK = this.findOptimalK(normalized);

    console.log(`📊 Optimal number of clusters: ${optimalK}`);

    // Run K-means
    const result = kmeans(normalized, optimalK, {
      initialization: 'kmeans++',
      maxIterations: 100
    });

    return result;
  }

  /**
   * Normalize features using Z-score
   */
  normalizeFeatures(data) {
    const numFeatures = data[0].length;
    const normalized = [];

    // Calculate mean and std for each feature
    const stats = [];
    for (let f = 0; f < numFeatures; f++) {
      const featureValues = data.map(row => row[f]);
      stats.push({
        mean: mean(featureValues),
        std: standardDeviation(featureValues) || 1 // Avoid division by zero
      });
    }

    // Normalize each data point
    for (const row of data) {
      const normalizedRow = row.map((value, f) => {
        return (value - stats[f].mean) / stats[f].std;
      });
      normalized.push(normalizedRow);
    }

    return normalized;
  }

  /**
   * Find optimal K using elbow method
   */
  findOptimalK(data) {
    const maxK = Math.min(8, Math.floor(data.length / 3));
    const minK = 2;

    if (maxK < minK) return 3; // Default

    const wcss = []; // Within-cluster sum of squares

    for (let k = minK; k <= maxK; k++) {
      const result = kmeans(data, k, {
        initialization: 'kmeans++',
        maxIterations: 50
      });

      // Calculate WCSS
      let totalDistance = 0;
      result.clusters.forEach((cluster, i) => {
        const centroid = result.centroids[cluster];
        const point = data[i];
        const distance = this.euclideanDistance(point, centroid);
        totalDistance += distance * distance;
      });

      wcss.push({ k, wcss: totalDistance });
    }

    // Find elbow point (where rate of decrease slows down)
    let optimalK = minK;
    let maxDecrease = 0;

    for (let i = 1; i < wcss.length - 1; i++) {
      const decrease1 = wcss[i - 1].wcss - wcss[i].wcss;
      const decrease2 = wcss[i].wcss - wcss[i + 1].wcss;
      const decreaseChange = decrease1 - decrease2;

      if (decreaseChange > maxDecrease) {
        maxDecrease = decreaseChange;
        optimalK = wcss[i].k;
      }
    }

    return optimalK;
  }

  /**
   * Calculate Euclidean distance
   */
  euclideanDistance(point1, point2) {
    let sum = 0;
    for (let i = 0; i < point1.length; i++) {
      sum += Math.pow(point1[i] - point2[i], 2);
    }
    return Math.sqrt(sum);
  }

  /**
   * Analyze cluster characteristics
   */
  analyzeCluster(members) {
    const avgSessions = mean(members.map(u => u.total_sessions));
    const avgConversionRate = mean(members.map(u => u.conversion_rate));
    const avgEngagement = mean(members.map(u => u.engagement_score));
    const avgRecency = mean(members.map(u => u.days_since_last_visit));

    // Calculate LTV (simplified - in reality you'd calculate from revenue)
    const ltv = avgConversionRate * 50; // Assume $50 per conversion

    // Identify patterns
    const patterns = [];
    if (avgConversionRate > 0.1) patterns.push('high_converter');
    if (avgConversionRate < 0.02) patterns.push('low_converter');
    if (avgRecency < 3) patterns.push('highly_active');
    if (avgRecency > 14) patterns.push('at_risk');
    if (avgEngagement > 5) patterns.push('power_user');
    if (avgEngagement < 1) patterns.push('passive');
    if (avgSessions > 20) patterns.push('loyal');
    if (avgSessions < 3) patterns.push('new_or_churned');

    // Generate description
    const description = this.generateClusterDescription({
      avgSessions,
      avgConversionRate,
      avgEngagement,
      avgRecency,
      patterns
    });

    // Generate traits
    const traits = [
      { name: 'Avg Sessions', value: avgSessions.toFixed(1) },
      { name: 'Conversion Rate', value: `${(avgConversionRate * 100).toFixed(1)}%` },
      { name: 'Engagement Score', value: avgEngagement.toFixed(1) },
      { name: 'Days Since Last Visit', value: avgRecency.toFixed(0) }
    ];

    return {
      ltv,
      conversionRate: avgConversionRate,
      retentionRate: avgRecency < 7 ? 0.8 : 0.3, // Simplified
      patterns,
      traits,
      description
    };
  }

  /**
   * Generate cluster description
   */
  generateClusterDescription(stats) {
    const { avgConversionRate, avgRecency, avgEngagement, patterns } = stats;

    if (patterns.includes('power_user') && patterns.includes('high_converter')) {
      return 'Highly engaged users with strong conversion rates. VIP segment.';
    } else if (patterns.includes('at_risk')) {
      return 'Users who were active but haven\'t returned recently. At risk of churning.';
    } else if (patterns.includes('new_or_churned') && avgRecency > 30) {
      return 'Inactive users who have likely churned. Low engagement.';
    } else if (patterns.includes('highly_active') && patterns.includes('low_converter')) {
      return 'Active users who browse frequently but don\'t convert. Window shoppers.';
    } else if (patterns.includes('loyal')) {
      return 'Loyal users with consistent engagement over time.';
    } else {
      return 'General user segment with moderate engagement.';
    }
  }

  /**
   * Generate segment name
   */
  generateSegmentName(characteristics) {
    const { patterns, conversionRate } = characteristics;

    // Rule-based naming
    if (patterns.includes('power_user') && patterns.includes('high_converter')) {
      return 'Power Users';
    } else if (patterns.includes('at_risk')) {
      return 'At-Risk Users';
    } else if (patterns.includes('new_or_churned')) {
      return 'Churned Users';
    } else if (patterns.includes('highly_active') && patterns.includes('low_converter')) {
      return 'Window Shoppers';
    } else if (patterns.includes('loyal')) {
      return 'Loyal Customers';
    } else if (conversionRate > 0.05) {
      return 'Regular Converters';
    } else {
      return 'Casual Browsers';
    }
  }
}

module.exports = BehavioralClusteringEngine;
