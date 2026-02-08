/**
 * Pattern Detector
 *
 * Detects behavioral patterns from user data:
 * - Anomalies in metrics
 * - Cohort patterns
 * - Correlations between events and conversions
 * - Funnel drop-off patterns
 */

const StatisticalAnalyzer = require('../../utils/statistics');
const { mean, percentile } = require('../../utils/helpers');

class PatternDetector {
  constructor(db) {
    this.db = db;
    this.stats = new StatisticalAnalyzer();
  }

  /**
   * Detect all patterns
   */
  async detectAll() {
    console.log('🔍 Starting pattern detection...');

    const patterns = [];

    try {
      // 1. Detect anomalies in key metrics
      const anomalies = await this.detectAnomalies();
      patterns.push(...anomalies);

      // 2. Analyze cohorts
      const cohortPatterns = await this.analyzeCohorts();
      patterns.push(...cohortPatterns);

      // 3. Find correlations
      const correlations = await this.findCorrelations();
      patterns.push(...correlations);

      // 4. Analyze funnels
      const funnelPatterns = await this.analyzeFunnels();
      patterns.push(...funnelPatterns);

      console.log(`✅ Detected ${patterns.length} patterns`);
      return patterns;
    } catch (error) {
      console.error('❌ Error detecting patterns:', error);
      return [];
    }
  }

  /**
   * Detect anomalies in key metrics
   */
  async detectAnomalies() {
    const patterns = [];

    try {
      // Get daily metrics for last 30 days
      const metrics = this.db.all(`
        SELECT
          DATE(created_at) as date,
          COUNT(*) as daily_events,
          COUNT(DISTINCT user_id) as daily_users,
          COUNT(CASE WHEN event_type = 'conversion' THEN 1 END) as conversions
        FROM events
        WHERE created_at >= date('now', '-30 days')
        GROUP BY DATE(created_at)
        ORDER BY date
      `);

      if (metrics.length < 7) {
        return patterns; // Need at least a week of data
      }

      // Check conversions for anomalies
      const conversionValues = metrics.map(m => m.conversions);
      const anomalies = this.stats.detectAnomalies(conversionValues, 2); // 2 standard deviations

      for (const anomaly of anomalies.anomalies) {
        const date = metrics[anomaly.index].date;
        patterns.push({
          type: 'anomaly',
          metric: 'conversions',
          date: date,
          value: anomaly.value,
          zScore: anomaly.zScore,
          anomalyType: anomaly.type, // 'spike' or 'drop'
          severity: Math.abs(anomaly.zScore) > 3 ? 'high' : 'medium',
          description: `${anomaly.type === 'spike' ? 'Spike' : 'Drop'} in conversions on ${date}`,
          confidence: 0.9
        });
      }

      // Check for trends
      const trend = this.stats.detectTrend(conversionValues);
      if (trend.trend !== 'stable' && trend.confidence > 0.6) {
        patterns.push({
          type: 'trend',
          metric: 'conversions',
          trend: trend.trend,
          slope: trend.slope,
          confidence: trend.confidence,
          description: `Conversions are ${trend.trend} over the last 30 days`,
          severity: 'medium'
        });
      }
    } catch (error) {
      console.error('Error detecting anomalies:', error);
    }

    return patterns;
  }

  /**
   * Analyze cohorts
   */
  async analyzeCohorts() {
    const patterns = [];

    try {
      // Get retention by cohort (weekly cohorts)
      const cohorts = this.db.all(`
        SELECT
          strftime('%Y-%W', first_seen) as cohort_week,
          COUNT(DISTINCT user_id) as cohort_size,
          COUNT(DISTINCT CASE
            WHEN julianday(last_seen) - julianday(first_seen) >= 7 THEN user_id
          END) as retained_d7,
          COUNT(DISTINCT CASE
            WHEN julianday(last_seen) - julianday(first_seen) >= 30 THEN user_id
          END) as retained_d30
        FROM (
          SELECT
            user_id,
            MIN(created_at) as first_seen,
            MAX(created_at) as last_seen
          FROM events
          WHERE created_at >= date('now', '-90 days')
          GROUP BY user_id
        )
        GROUP BY cohort_week
        ORDER BY cohort_week
      `);

      if (cohorts.length < 4) {
        return patterns; // Need at least 4 weeks
      }

      // Calculate retention rates
      const retentionRates = cohorts.map(c => ({
        week: c.cohort_week,
        size: c.cohort_size,
        d7_rate: c.retained_d7 / c.cohort_size,
        d30_rate: c.retained_d30 / c.cohort_size
      }));

      // Check if retention is declining
      const d7Rates = retentionRates.slice(-4).map(r => r.d7_rate);
      const trend = this.stats.detectTrend(d7Rates);

      if (trend.trend === 'decreasing' && trend.confidence > 0.6) {
        patterns.push({
          type: 'cohort_retention_decline',
          metric: 'retention_d7',
          trend: trend.trend,
          confidence: trend.confidence,
          description: 'User retention is declining in recent cohorts',
          severity: 'high',
          data: retentionRates.slice(-4)
        });
      }

      // Check if latest cohort has unusually low retention
      if (retentionRates.length >= 2) {
        const latest = retentionRates[retentionRates.length - 1];
        const historical = retentionRates.slice(0, -1).map(r => r.d7_rate);
        const historicalMean = mean(historical);
        const deviation = (latest.d7_rate - historicalMean) / historicalMean;

        if (deviation < -0.2) { // 20% below average
          patterns.push({
            type: 'low_cohort_retention',
            metric: 'retention_d7',
            cohort: latest.week,
            value: latest.d7_rate,
            baseline: historicalMean,
            deviation: deviation,
            description: `Latest cohort has ${Math.abs(deviation * 100).toFixed(0)}% lower retention than average`,
            severity: 'high',
            confidence: 0.85
          });
        }
      }
    } catch (error) {
      console.error('Error analyzing cohorts:', error);
    }

    return patterns;
  }

  /**
   * Find correlations between events and conversions
   */
  async findCorrelations() {
    const patterns = [];

    try {
      // Get event types and their correlation with conversions
      const eventTypes = this.db.all(`
        SELECT DISTINCT event_type
        FROM events
        WHERE created_at >= date('now', '-30 days')
        AND event_type != 'conversion'
        LIMIT 20
      `);

      for (const { event_type } of eventTypes) {
        // For each user, check if they performed this event and if they converted
        const userData = this.db.all(`
          SELECT
            user_id,
            MAX(CASE WHEN event_type = ? THEN 1 ELSE 0 END) as performed_event,
            MAX(CASE WHEN event_type = 'conversion' THEN 1 ELSE 0 END) as converted
          FROM events
          WHERE created_at >= date('now', '-30 days')
          GROUP BY user_id
        `, [event_type]);

        if (userData.length < 50) continue; // Need sufficient data

        // Calculate conversion rates
        const performedAndConverted = userData.filter(u => u.performed_event === 1 && u.converted === 1).length;
        const performedTotal = userData.filter(u => u.performed_event === 1).length;
        const notPerformedAndConverted = userData.filter(u => u.performed_event === 0 && u.converted === 1).length;
        const notPerformedTotal = userData.filter(u => u.performed_event === 0).length;

        if (performedTotal === 0 || notPerformedTotal === 0) continue;

        const conversionWithEvent = performedAndConverted / performedTotal;
        const conversionWithoutEvent = notPerformedAndConverted / notPerformedTotal;
        const lift = (conversionWithEvent - conversionWithoutEvent) / conversionWithoutEvent;

        // If strong positive correlation (>30% lift)
        if (lift > 0.3 && performedTotal > 20) {
          patterns.push({
            type: 'event_conversion_correlation',
            event_type: event_type,
            conversion_with_event: conversionWithEvent,
            conversion_without_event: conversionWithoutEvent,
            lift: lift,
            sample_size: performedTotal,
            description: `Users who perform '${event_type}' are ${(lift * 100).toFixed(0)}% more likely to convert`,
            severity: 'medium',
            confidence: Math.min(0.95, 0.5 + (performedTotal / 200))
          });
        }
      }
    } catch (error) {
      console.error('Error finding correlations:', error);
    }

    return patterns;
  }

  /**
   * Analyze funnels for drop-off patterns
   */
  async analyzeFunnels() {
    const patterns = [];

    try {
      // Define a standard funnel (customize based on your app)
      const funnelSteps = [
        { name: 'page_view', order: 1 },
        { name: 'signup', order: 2 },
        { name: 'onboarding_complete', order: 3 },
        { name: 'first_action', order: 4 },
        { name: 'conversion', order: 5 }
      ];

      // Calculate drop-off at each step
      const dropOffs = [];

      for (let i = 0; i < funnelSteps.length - 1; i++) {
        const currentStep = funnelSteps[i];
        const nextStep = funnelSteps[i + 1];

        const stepData = this.db.get(`
          SELECT
            COUNT(DISTINCT e1.user_id) as users_at_current,
            COUNT(DISTINCT e2.user_id) as users_at_next
          FROM events e1
          LEFT JOIN events e2 ON e1.user_id = e2.user_id
            AND e2.event_type = ?
            AND e2.created_at > e1.created_at
          WHERE e1.event_type = ?
          AND e1.created_at >= date('now', '-30 days')
        `, [nextStep.name, currentStep.name]);

        if (stepData && stepData.users_at_current > 0) {
          const conversionRate = stepData.users_at_next / stepData.users_at_current;
          const dropOffRate = 1 - conversionRate;

          dropOffs.push({
            from: currentStep.name,
            to: nextStep.name,
            usersAtCurrent: stepData.users_at_current,
            usersAtNext: stepData.users_at_next,
            conversionRate,
            dropOffRate
          });

          // Flag if drop-off is high (>50%)
          if (dropOffRate > 0.5 && stepData.users_at_current > 50) {
            patterns.push({
              type: 'high_funnel_dropoff',
              from_step: currentStep.name,
              to_step: nextStep.name,
              drop_off_rate: dropOffRate,
              users_lost: stepData.users_at_current - stepData.users_at_next,
              description: `High drop-off (${(dropOffRate * 100).toFixed(0)}%) between ${currentStep.name} and ${nextStep.name}`,
              severity: dropOffRate > 0.7 ? 'high' : 'medium',
              confidence: 0.9
            });
          }
        }
      }
    } catch (error) {
      console.error('Error analyzing funnels:', error);
    }

    return patterns;
  }
}

module.exports = PatternDetector;
