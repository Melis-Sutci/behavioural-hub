/**
 * Autopilot Scheduled Jobs
 *
 * Cron jobs that run automatically to:
 * - Detect patterns and generate insights
 * - Update segment memberships
 * - Calculate growth loop metrics
 * - Predict churn and LTV
 * - Check experiment stopping rules
 */

const cron = require('node-cron');
const Database = require('better-sqlite3');
const path = require('path');

// Import services
const PatternDetector = require('../services/autopilot/patternDetector');
const AutopilotAIService = require('../services/autopilot/aiService');
const BehavioralClusteringEngine = require('../services/segmentation/clusteringEngine');
const RFMAnalysisEngine = require('../services/segmentation/rfmEngine');
const GrowthLoopDetector = require('../services/growthLoops/loopDetector');
const ChurnPredictor = require('../services/predictive/churnPredictor');
const LTVPredictor = require('../services/predictive/ltvPredictor');

class AutopilotJobs {
  constructor(db) {
    this.db = db;
    this.patternDetector = new PatternDetector(db);
    this.aiService = new AutopilotAIService(db);
    this.clusteringEngine = new BehavioralClusteringEngine(db);
    this.rfmEngine = new RFMAnalysisEngine(db);
    this.loopDetector = new GrowthLoopDetector(db);
    this.churnPredictor = new ChurnPredictor(db);
    this.ltvPredictor = new LTVPredictor(db);

    this.jobs = [];
  }

  /**
   * Start all cron jobs
   */
  startAll() {
    console.log('🤖 Starting Autopilot scheduled jobs...');

    // Job 1: Pattern Detection (Every 6 hours)
    this.jobs.push(
      cron.schedule('0 */6 * * *', async () => {
        await this.runPatternDetection();
      })
    );

    // Job 2: RFM Analysis (Daily at 5 AM)
    this.jobs.push(
      cron.schedule('0 5 * * *', async () => {
        await this.runRFMAnalysis();
      })
    );

    // Job 3: Clustering for Segmentation (Weekly on Sunday at 4 AM)
    this.jobs.push(
      cron.schedule('0 4 * * 0', async () => {
        await this.runClustering();
      })
    );

    // Job 4: Growth Loop Metrics (Daily at 6 AM)
    this.jobs.push(
      cron.schedule('0 6 * * *', async () => {
        await this.updateGrowthLoopMetrics();
      })
    );

    // Job 5: Churn Prediction (Daily at 8 AM)
    this.jobs.push(
      cron.schedule('0 8 * * *', async () => {
        await this.runChurnPrediction();
      })
    );

    // Job 6: LTV Prediction (Weekly on Monday at 9 AM)
    this.jobs.push(
      cron.schedule('0 9 * * 1', async () => {
        await this.runLTVPrediction();
      })
    );

    // Job 7: Cleanup old data (Daily at 3 AM)
    this.jobs.push(
      cron.schedule('0 3 * * *', async () => {
        await this.cleanupOldData();
      })
    );

    console.log(`✅ Started ${this.jobs.length} autopilot jobs`);
  }

  /**
   * Stop all jobs
   */
  stopAll() {
    console.log('🛑 Stopping all autopilot jobs...');
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
  }

  /**
   * Job 1: Pattern Detection
   */
  async runPatternDetection() {
    console.log('🔍 [JOB] Running pattern detection...');

    try {
      const patterns = await this.patternDetector.detectAll();

      // Save patterns to database
      for (const pattern of patterns) {
        try {
          this.db.run(`
            INSERT INTO auto_insights (
              source_type, raw_data, confidence_score,
              pattern_type, detected_at, status
            ) VALUES (?, ?, ?, ?, datetime('now'), 'pending')
          `, [
            'event_pattern',
            JSON.stringify(pattern),
            pattern.confidence || 0.7,
            pattern.type
          ]);
        } catch (error) {
          console.error('Error saving pattern:', error);
        }
      }

      console.log(`✅ [JOB] Pattern detection complete. Found ${patterns.length} patterns`);
    } catch (error) {
      console.error('❌ [JOB] Pattern detection failed:', error);
    }
  }

  /**
   * Job 2: RFM Analysis
   */
  async runRFMAnalysis() {
    console.log('📊 [JOB] Running RFM analysis...');

    try {
      const segments = await this.rfmEngine.performRFMAnalysis();

      // Save segments to database
      for (const segment of segments) {
        if (segment.user_count === 0) continue;

        try {
          this.db.run(`
            INSERT INTO auto_segments (
              name, description, detection_method,
              traits, user_count, avg_conversion_rate,
              behavioral_patterns, confidence_score,
              detected_at, status
            ) VALUES (?, ?, 'rule_based', ?, ?, ?, ?, 0.9, datetime('now'), 'pending')
          `, [
            segment.name,
            segment.description,
            JSON.stringify(segment),
            segment.user_count,
            segment.avg_monetary / 50, // Simplified conversion rate
            JSON.stringify(segment.recommended_actions)
          ]);
        } catch (error) {
          console.error('Error saving RFM segment:', error);
        }
      }

      console.log(`✅ [JOB] RFM analysis complete. Created ${segments.length} segments`);
    } catch (error) {
      console.error('❌ [JOB] RFM analysis failed:', error);
    }
  }

  /**
   * Job 3: Clustering for Segmentation
   */
  async runClustering() {
    console.log('👥 [JOB] Running clustering for segmentation...');

    try {
      const segments = await this.clusteringEngine.detectSegments(30);

      // Save segments to database
      for (const segment of segments) {
        try {
          const segmentId = this.db.run(`
            INSERT INTO auto_segments (
              name, description, detection_method,
              traits, user_count, avg_ltv, avg_conversion_rate,
              behavioral_patterns, confidence_score,
              detected_at, status
            ) VALUES (?, ?, 'clustering', ?, ?, ?, ?, ?, 0.85, datetime('now'), 'pending')
          `, [
            segment.name,
            segment.description,
            JSON.stringify(segment.traits),
            segment.user_count,
            segment.avg_lifetime_value,
            segment.avg_conversion_rate,
            JSON.stringify(segment.behavioral_patterns)
          ]).lastInsertRowid;

          // Save segment memberships
          for (const userId of segment.members) {
            this.db.run(`
              INSERT OR IGNORE INTO auto_segment_memberships (
                auto_segment_id, user_id, membership_score, assigned_at
              ) VALUES (?, ?, 1.0, datetime('now'))
            `, [segmentId, userId]);
          }
        } catch (error) {
          console.error('Error saving cluster segment:', error);
        }
      }

      console.log(`✅ [JOB] Clustering complete. Created ${segments.length} segments`);
    } catch (error) {
      console.error('❌ [JOB] Clustering failed:', error);
    }
  }

  /**
   * Job 4: Update Growth Loop Metrics
   */
  async updateGrowthLoopMetrics() {
    console.log('🔄 [JOB] Updating growth loop metrics...');

    try {
      const loops = await this.loopDetector.detectLoops();

      // Save or update each loop
      for (const [type, loop] of Object.entries(loops)) {
        try {
          this.db.run(`
            INSERT OR REPLACE INTO growth_loops (
              name, type, description,
              current_performance, health_score,
              detected_at, status
            ) VALUES (?, ?, ?, ?, ?, datetime('now'), ?)
          `, [
            `${type.charAt(0).toUpperCase() + type.slice(1)} Loop`,
            type,
            `Automatically detected ${type} growth loop`,
            JSON.stringify(loop.metrics),
            loop.health_score,
            loop.status
          ]);
        } catch (error) {
          console.error(`Error saving ${type} loop:`, error);
        }
      }

      console.log('✅ [JOB] Growth loop metrics updated');
    } catch (error) {
      console.error('❌ [JOB] Growth loop update failed:', error);
    }
  }

  /**
   * Job 5: Churn Prediction
   */
  async runChurnPrediction() {
    console.log('🔮 [JOB] Running churn prediction...');

    try {
      const predictions = await this.churnPredictor.predictForAllUsers();

      // Save predictions
      for (const prediction of predictions) {
        if (prediction.risk_level === 'error' || prediction.risk_level === 'unknown') {
          continue;
        }

        try {
          this.db.run(`
            INSERT INTO churn_predictions (
              user_id, churn_probability, risk_level,
              contributing_factors, recommended_actions,
              predicted_at, model_version
            ) VALUES (?, ?, ?, ?, ?, datetime('now'), 'v1.0')
          `, [
            prediction.user_id,
            prediction.churn_probability,
            prediction.risk_level,
            JSON.stringify(prediction.contributing_factors),
            JSON.stringify(prediction.recommended_actions)
          ]);

          // Auto-execute critical actions
          if (prediction.risk_level === 'critical' && prediction.recommended_actions.length > 0) {
            // Log that we would execute action
            console.log(`⚠️  Critical churn risk for user ${prediction.user_id}`);
          }
        } catch (error) {
          console.error('Error saving churn prediction:', error);
        }
      }

      const highRisk = predictions.filter(p => p.risk_level === 'high' || p.risk_level === 'critical').length;
      console.log(`✅ [JOB] Churn prediction complete. ${highRisk} high-risk users identified`);
    } catch (error) {
      console.error('❌ [JOB] Churn prediction failed:', error);
    }
  }

  /**
   * Job 6: LTV Prediction
   */
  async runLTVPrediction() {
    console.log('💰 [JOB] Running LTV prediction...');

    try {
      const summary = await this.ltvPredictor.getLTVSegmentsSummary();

      console.log('📊 LTV Segments:');
      console.log(`  Whales: ${summary.whale.count} users, avg LTV: $${summary.whale.avg_ltv.toFixed(2)}`);
      console.log(`  High Value: ${summary.high_value.count} users, avg LTV: $${summary.high_value.avg_ltv.toFixed(2)}`);
      console.log(`  Medium Value: ${summary.medium_value.count} users, avg LTV: $${summary.medium_value.avg_ltv.toFixed(2)}`);
      console.log(`  Low Value: ${summary.low_value.count} users, avg LTV: $${summary.low_value.avg_ltv.toFixed(2)}`);

      console.log('✅ [JOB] LTV prediction complete');
    } catch (error) {
      console.error('❌ [JOB] LTV prediction failed:', error);
    }
  }

  /**
   * Job 7: Cleanup old data
   */
  async cleanupOldData() {
    console.log('🧹 [JOB] Cleaning up old data...');

    try {
      // Delete trigger executions older than 90 days
      const deleted1 = this.db.run(`
        DELETE FROM trigger_executions
        WHERE executed_at < date('now', '-90 days')
      `).changes;

      // Delete old churn predictions (keep last 30 days)
      const deleted2 = this.db.run(`
        DELETE FROM churn_predictions
        WHERE predicted_at < date('now', '-30 days')
      `).changes;

      // Delete rejected auto-insights older than 30 days
      const deleted3 = this.db.run(`
        DELETE FROM auto_insights
        WHERE status = 'rejected'
        AND detected_at < date('now', '-30 days')
      `).changes;

      console.log(`✅ [JOB] Cleanup complete. Deleted ${deleted1 + deleted2 + deleted3} old records`);
    } catch (error) {
      console.error('❌ [JOB] Cleanup failed:', error);
    }
  }
}

module.exports = AutopilotJobs;
