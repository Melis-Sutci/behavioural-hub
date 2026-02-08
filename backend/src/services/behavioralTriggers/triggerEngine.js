/**
 * Behavioral Trigger Engine
 *
 * Evaluates trigger conditions and fires actions based on user behavior.
 * Supports:
 * - Event sequence conditions
 * - Time-based conditions
 * - Metric threshold conditions
 * - Segment membership conditions
 */

class BehavioralTriggerEngine {
  constructor(db) {
    this.db = db;
  }

  /**
   * Evaluate triggers for a user and event
   */
  async evaluateTriggers(userId, event) {
    try {
      // Get all active triggers
      const triggers = this.db.all(`
        SELECT * FROM behavioral_triggers
        WHERE status = 'active'
        AND (target_segment IS NULL OR EXISTS(
          SELECT 1 FROM segment_memberships sm
          WHERE sm.user_id = ? AND sm.segment_id = behavioral_triggers.target_segment
        ))
        ORDER BY priority DESC
      `, [userId]);

      if (!triggers || triggers.length === 0) {
        return [];
      }

      const firedTriggers = [];

      for (const trigger of triggers) {
        try {
          const conditions = JSON.parse(trigger.conditions);

          // Evaluate all conditions
          const conditionsMet = await this.evaluateConditions(userId, event, conditions);

          if (conditionsMet) {
            // Check frequency cap
            if (await this.canFire(trigger.id, userId)) {
              await this.fireTrigger(trigger, userId, event);
              firedTriggers.push(trigger);
            }
          }
        } catch (error) {
          console.error(`Error evaluating trigger ${trigger.id}:`, error);
        }
      }

      return firedTriggers;
    } catch (error) {
      console.error('Error in evaluateTriggers:', error);
      return [];
    }
  }

  /**
   * Evaluate all conditions for a trigger
   */
  async evaluateConditions(userId, event, conditions) {
    for (const condition of conditions) {
      let met = false;

      switch (condition.type) {
        case 'event_sequence':
          met = await this.checkEventSequence(userId, condition.events);
          break;

        case 'time_since_last_action':
          met = await this.checkTimeSince(userId, condition);
          break;

        case 'metric_threshold':
          met = await this.checkMetricThreshold(userId, condition);
          break;

        case 'segment_membership':
          met = await this.checkSegment(userId, condition.segment_id);
          break;

        case 'event_occurred':
          met = await this.checkEventOccurred(userId, condition.event, condition.within_hours);
          break;

        case 'event_not_occurred':
          met = await this.checkEventNotOccurred(userId, condition.event, condition.within_hours);
          break;

        case 'days_since_last_visit':
          met = await this.checkDaysSinceLastVisit(userId, condition.operator, condition.value);
          break;

        case 'account_type':
          met = await this.checkAccountType(userId, condition.value);
          break;

        case 'churn_probability':
          met = await this.checkChurnProbability(userId, condition.operator, condition.value);
          break;

        default:
          console.warn(`Unknown condition type: ${condition.type}`);
          met = false;
      }

      if (!met) {
        return false; // All conditions must be met
      }
    }

    return true;
  }

  /**
   * Check if event sequence occurred
   */
  async checkEventSequence(userId, events) {
    // Check if events occurred in order
    for (let i = 0; i < events.length; i++) {
      const eventType = events[i];
      const previousEvent = i > 0 ? events[i - 1] : null;

      const query = previousEvent
        ? `
          SELECT 1 FROM events e1
          WHERE e1.user_id = ? AND e1.event_type = ?
          AND EXISTS (
            SELECT 1 FROM events e2
            WHERE e2.user_id = ? AND e2.event_type = ?
            AND e2.created_at < e1.created_at
          )
        `
        : `SELECT 1 FROM events WHERE user_id = ? AND event_type = ?`;

      const params = previousEvent
        ? [userId, eventType, userId, previousEvent]
        : [userId, eventType];

      const result = this.db.get(query, params);

      if (!result) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check time since last action
   */
  async checkTimeSince(userId, condition) {
    const result = this.db.get(`
      SELECT julianday('now') - julianday(MAX(created_at)) as days_since
      FROM events
      WHERE user_id = ? AND event_type = ?
    `, [userId, condition.action]);

    if (!result || result.days_since === null) {
      return false;
    }

    const hours = result.days_since * 24;

    switch (condition.operator) {
      case 'greater_than':
        return hours > condition.value;
      case 'less_than':
        return hours < condition.value;
      case 'equals':
        return Math.abs(hours - condition.value) < 1; // Within 1 hour
      default:
        return false;
    }
  }

  /**
   * Check metric threshold
   */
  async checkMetricThreshold(userId, condition) {
    let value = 0;

    switch (condition.metric) {
      case 'feature_usage_count':
        const usage = this.db.get(`
          SELECT COUNT(DISTINCT event_type) as count
          FROM events
          WHERE user_id = ?
        `, [userId]);
        value = usage?.count || 0;
        break;

      case 'total_sessions':
        const sessions = this.db.get(`
          SELECT COUNT(DISTINCT session_id) as count
          FROM events
          WHERE user_id = ?
        `, [userId]);
        value = sessions?.count || 0;
        break;

      case 'conversion_count':
        const conversions = this.db.get(`
          SELECT COUNT(*) as count
          FROM events
          WHERE user_id = ? AND event_type = 'conversion'
        `, [userId]);
        value = conversions?.count || 0;
        break;

      default:
        return false;
    }

    switch (condition.operator) {
      case 'greater_than':
        return value > condition.value;
      case 'less_than':
        return value < condition.value;
      case 'equals':
        return value === condition.value;
      default:
        return false;
    }
  }

  /**
   * Check segment membership
   */
  async checkSegment(userId, segmentId) {
    const result = this.db.get(`
      SELECT 1 FROM segment_memberships
      WHERE user_id = ? AND segment_id = ?
    `, [userId, segmentId]);

    return !!result;
  }

  /**
   * Check if event occurred
   */
  async checkEventOccurred(userId, eventType, withinHours) {
    const timeCondition = withinHours
      ? `AND created_at >= datetime('now', '-${withinHours} hours')`
      : '';

    const result = this.db.get(`
      SELECT 1 FROM events
      WHERE user_id = ? AND event_type = ?
      ${timeCondition}
    `, [userId, eventType]);

    return !!result;
  }

  /**
   * Check if event did NOT occur
   */
  async checkEventNotOccurred(userId, eventType, withinHours) {
    return !(await this.checkEventOccurred(userId, eventType, withinHours));
  }

  /**
   * Check days since last visit
   */
  async checkDaysSinceLastVisit(userId, operator, value) {
    const result = this.db.get(`
      SELECT julianday('now') - julianday(MAX(created_at)) as days_since
      FROM events
      WHERE user_id = ?
    `, [userId]);

    if (!result || result.days_since === null) {
      return false;
    }

    switch (operator) {
      case 'greater_than':
        return result.days_since > value;
      case 'less_than':
        return result.days_since < value;
      case 'equals':
        return Math.abs(result.days_since - value) < 0.5;
      default:
        return false;
    }
  }

  /**
   * Check account type
   */
  async checkAccountType(userId, expectedType) {
    // Simplified - in reality you'd check a users table
    const conversions = this.db.get(`
      SELECT COUNT(*) as count
      FROM events
      WHERE user_id = ? AND event_type = 'conversion'
    `, [userId]);

    const actualType = (conversions?.count || 0) > 0 ? 'paid' : 'free';
    return actualType === expectedType;
  }

  /**
   * Check churn probability
   */
  async checkChurnProbability(userId, operator, value) {
    // This would integrate with ChurnPredictor
    // For now, simplified check based on recency
    const result = this.db.get(`
      SELECT julianday('now') - julianday(MAX(created_at)) as days_since
      FROM events
      WHERE user_id = ?
    `, [userId]);

    if (!result || result.days_since === null) {
      return false;
    }

    // Rough churn probability based on recency
    let churnProb = 0;
    if (result.days_since > 30) churnProb = 0.9;
    else if (result.days_since > 14) churnProb = 0.7;
    else if (result.days_since > 7) churnProb = 0.4;
    else churnProb = 0.1;

    switch (operator) {
      case 'greater_than':
        return churnProb > value;
      case 'less_than':
        return churnProb < value;
      default:
        return false;
    }
  }

  /**
   * Check if trigger can fire (frequency cap)
   */
  async canFire(triggerId, userId) {
    const trigger = this.db.get(`
      SELECT frequency_cap_hours FROM behavioral_triggers WHERE id = ?
    `, [triggerId]);

    if (!trigger) return false;

    // Check last execution
    const lastExecution = this.db.get(`
      SELECT created_at FROM trigger_executions
      WHERE trigger_id = ? AND user_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `, [triggerId, userId]);

    if (!lastExecution) {
      return true; // Never fired before
    }

    // Check if enough time has passed
    const hoursSince = this.db.get(`
      SELECT (julianday('now') - julianday(?)) * 24 as hours_since
    `, [lastExecution.created_at]);

    return hoursSince.hours_since >= trigger.frequency_cap_hours;
  }

  /**
   * Fire trigger (execute actions)
   */
  async fireTrigger(trigger, userId, event) {
    console.log(`🔔 Firing trigger "${trigger.name}" for user ${userId}`);

    const actions = JSON.parse(trigger.actions);

    for (const action of actions) {
      try {
        await this.executeAction(action, userId, trigger, event);

        // Log execution
        this.db.run(`
          INSERT INTO trigger_executions (
            trigger_id, user_id, action_type, executed_at
          ) VALUES (?, ?, ?, datetime('now'))
        `, [trigger.id, userId, action.type]);
      } catch (error) {
        console.error(`Error executing action ${action.type}:`, error);
      }
    }
  }

  /**
   * Execute a single action
   */
  async executeAction(action, userId, trigger, event) {
    switch (action.type) {
      case 'send_email':
        console.log(`📧 Would send email to user ${userId}: ${action.template}`);
        // Integration with email service would go here
        break;

      case 'send_push':
        console.log(`📱 Would send push to user ${userId}: ${action.message}`);
        // Integration with push service would go here
        break;

      case 'show_modal':
        console.log(`💬 Would show modal to user ${userId}: ${action.modal_type}`);
        // Queue modal for next session
        break;

      case 'apply_discount':
        console.log(`💰 Would apply discount to user ${userId}: ${action.code}`);
        // Create discount code in database
        break;

      case 'assign_to_experiment':
        console.log(`🧪 Would assign user ${userId} to experiment: ${action.experiment_id}`);
        // Assign user to A/B test
        break;

      case 'personal_outreach':
        console.log(`👤 Would trigger personal outreach for user ${userId}`);
        // Create task for sales/support team
        break;

      default:
        console.warn(`Unknown action type: ${action.type}`);
    }
  }
}

module.exports = BehavioralTriggerEngine;
